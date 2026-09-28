
// VisNetwork.js (Refactored with ShadCN UI)
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Network, DataSet } from 'vis-network/standalone/esm/vis-network';
import { useTheme } from 'next-themes';
import NetworkEditor from '@/components/network-editor';
import NetworkTree from '@/components/network-tree';
import NodeEditor from '@/components/node-editor';
import NetworkSettingsDialog from '@/components/network-settings-dialog';
import { Button } from '@/components/ui/button';
import { Share2, ListTree, Settings } from 'lucide-react';
import { useNetworkKeyboardEditing } from '@/hooks/use-network-keyboard-editing';
import {
  loadNetworkSettings,
  saveNetworkSettings,
  buildVisOptions,
} from '@/lib/network-settings';

let networkData;
let visNetwork;

// The single per-network anchor node created automatically on network creation. It isn't one
// of the regular node types (NodeEditor's Type picker only offers Action/Category/Info), so it
// must never be opened in the editor - NetworkEditor's Control Panel already hides its own
// Edit button for this reason, and double-click needs the same guard or it bypasses that
// entirely.
const ROOT_COLOR = '#808080';
const ACTION_COLOR = '#7FC6A4';
const CATEGORY_COLOR = '#FFD166';
const INFO_COLOR = '#6FA8DC';
// Action -> Category -> Info -> Action - what the Control Panel's "Make ..." button cycles
// through each click.
const NEXT_TYPE = {
  [ACTION_COLOR]: CATEGORY_COLOR,
  [CATEGORY_COLOR]: INFO_COLOR,
  [INFO_COLOR]: ACTION_COLOR,
};

// Area of focus is a per-node flag, not its own node type - rather than a separate label in
// the control panel, it's shown directly on the node itself (bold label + thicker border) so
// it's visible on the graph at a glance. Every call site that adds/updates a node in the vis
// DataSet must route through this so the indicator (and its removal, if toggled off) stays
// in sync with the node's actual data instead of only refreshing on a full reload.
//
// Deliberately does NOT touch `color` - it stays a plain string everywhere (`selectedNode.color
// === '#7FC6A4'` etc. is how Action/Category type is checked all over the app, and nodes are
// read straight back out of this same vis DataSet on click, so reshaping it into an object
// here would silently break those comparisons the moment a focus node gets selected).
//
// Labels are drawn on <canvas>, not the DOM, so they don't pick up dark-mode colors from CSS
// at all - isDark has to be threaded in explicitly by every caller.
//
// Border widths are relative to the network's configured base (settings.nodes.borderWidth/
// borderWidthSelected, editable in Network Display Settings) rather than fixed numbers - a
// node-level `borderWidth` here overrides the network-wide default for that node, so if this
// stayed hardcoded, the settings panel's border width sliders would have no visible effect.
const makeStyleNode = (settings) => (node, isDark) => {
  if (node.areaOfFocus) {
    return {
      ...node,
      borderWidth: settings.nodes.borderWidth + 2,
      borderWidthSelected: settings.nodes.borderWidthSelected + 2,
      font: { bold: true, color: isDark ? '#fbbf24' : '#92400e' }
    };
  }
  return {
    ...node,
    borderWidth: settings.nodes.borderWidth,
    borderWidthSelected: settings.nodes.borderWidthSelected,
    font: { bold: false, color: isDark ? '#ffffff' : '#374151' }
  };
};

const VIEW_MODE_STORAGE_KEY = 'networkViewMode';

const VisNetwork = ({
  networkId,
  nodes,
  edges,
  deleteNode,
  addEdge,
  deleteEdge,
  editEdge,
  editNode,
  networkName,
  pushNode,
  pushEdge,
  updateNodeInState,
  published,
  onTogglePublish,
  visibleToFriends,
  onToggleVisibleToFriends,
  onExport,
}) => {
  const networkRef = useRef(null);
  // What a node's label was showing before a hover swapped it out for the full (untruncated)
  // title - keyed by node id, so blurNode can put back exactly what was there, whatever it
  // happened to be (the usual truncated title, but some legacy nodes carry a hand-set label
  // unrelated to their title at all - see fetchNetwork's "Inactive" placeholder handling).
  const hoverOriginalLabels = useRef(new Map());
  const [selectedNode, setSelectedNode] = useState(null);
  const [viewMode, setViewMode] = useState('graph');
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';

  // Node/edge/physics/layout/interaction display settings, editable via the Settings dialog and
  // persisted per-network in localStorage (same pattern as VIEW_MODE_STORAGE_KEY below). Loaded
  // lazily so the very first render - and the graph-init effect that runs off of it - already
  // has whatever was previously saved for this network, instead of flashing default options.
  const [settings, setSettings] = useState(() => loadNetworkSettings(networkId));
  const [settingsOpen, setSettingsOpen] = useState(false);
  useEffect(() => {
    setSettings(loadNetworkSettings(networkId));
  }, [networkId]);
  const styleNode = useMemo(() => makeStyleNode(settings), [settings]);
  const handleSettingsChange = (next) => {
    setSettings(next);
    saveNetworkSettings(networkId, next);
  };
  // Lifted up (rather than owned by NetworkEditor) so double-clicking a node in either Graph
  // or Tree View can open the same edit dialog the Control Panel's own Edit button uses.
  const [modalShow, setModalShow] = useState(false);
  const closeEditModal = () => setModalShow(false);
  // Node creation shares the same NodeEditor component but is a wholly separate dialog from
  // the one above - it opens with no selectedNode, and (unlike editing) nothing exists
  // anywhere - not the vis DataSet, not React state, not the backend - until it's submitted.
  // createParentId is the node to link the new one to as a child, or null when creating a
  // top-level node from the canvas's own "Add Node" tool.
  const [createNodeShow, setCreateNodeShow] = useState(false);
  const [createParentId, setCreateParentId] = useState(null);
  const openCreateNode = (parentId) => {
    setCreateParentId(parentId ?? null);
    setCreateNodeShow(true);
  };
  const closeCreateNode = () => setCreateNodeShow(false);

  // The graph-init effect below deliberately only runs once per network (see its own comment),
  // so the `manipulation.deleteNode` callback it wires up closes over whatever `deleteNode`
  // function reference existed at that one moment - and page.js redefines that function on
  // every render, closing over its own current `nodes` state each time. Without this ref, any
  // node added after mount (e.g. anything created through this session) would look "not found"
  // to a delete attempt, because the frozen closure's `nodes` array never grew past its
  // original snapshot. Routing through a ref that's kept current every render fixes that
  // without having to rebuild the whole vis-network instance (and lose pan/zoom/physics) just
  // because a callback prop changed.
  const deleteNodeRef = useRef(deleteNode);
  useEffect(() => {
    deleteNodeRef.current = deleteNode;
  });

  // Restore the last view the user had open. Reading localStorage in the initial useState
  // would run during server rendering too (where it doesn't exist) and cause a hydration
  // mismatch, so it's read here instead, right after mount.
  useEffect(() => {
    const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (saved === 'graph' || saved === 'tree') {
      setViewMode(saved);
    }
  }, []);

  // Deliberately NOT a useEffect keyed on viewMode: that effect fires on mount too (with the
  // still-default 'graph', before the restore effect's setViewMode above has actually applied),
  // and would overwrite the just-restored preference back to 'graph' on every single load. Only
  // a real click should persist a new choice.
  const selectViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  };

  useEffect(() => {
    if (networkRef.current) {
      const nodesDataSet = new DataSet(nodes.map(n => styleNode(n, isDarkMode)));
      const edgesDataSet = new DataSet(edges);
      const data = {
        nodes: nodesDataSet,
        edges: edgesDataSet,
      };
      networkData = data;

      const options = {
        // Node/edge/physics/layout/interaction options all come from the (user-editable, per-
        // network persisted) settings state - see network-settings.js. Only `manipulation`
        // below is hardcoded here, since it's wiring (callbacks), not a display preference.
        ...buildVisOptions(settings, isDarkMode),

        manipulation: {
          enabled: true,
          initiallyActive: true,
          // Cancel vis-network's own placeholder-node flow entirely and open our editor
          // instead - a node backed by nothing but this DataSet entry would desync from the
          // backend, and (per how creation works now) shouldn't exist until the form backing
          // it is actually submitted.
          addNode: (nodeData, callback) => {
            callback(null);
            openCreateNode(null);
          },
          // Each of these also feeds the undo/redo stack - the snapshot needed to undo (the
          // node's full field set, or an edge's previous from/to) has to be captured *before*
          // the request goes out, since by the time the success callback fires that data is
          // already gone from local state.
          deleteNode: (nodeData, callback) => {
            const nodeId = nodeData.nodes[0];
            const pendingAction = prepareNodeDelete(nodeId);
            deleteNodeRef.current(
              nodeData,
              (result) => {
                callback(result);
                if (result !== null) commitUndo(pendingAction);
              },
              setSelectedNode
            );
          },
          addEdge: (edgeData, callback) => {
            addEdge(edgeData, (result) => {
              callback(result);
              if (result) recordEdgeCreate(result);
            });
          },
          deleteEdge: (edgeData, callback) => {
            const before = getEdgeSnapshot(edgeData.edges[0]);
            deleteEdge(edgeData, (result) => {
              callback(result);
              if (before) recordEdgeDelete(before);
            });
          },
          editEdge: (edgeData, callback) => {
            const before = getEdgeSnapshot(edgeData.id);
            editEdge(edgeData, (result) => {
              callback(result);
              // A rejected edit (e.g. the backend blocking a cycle or an edge into the Root
              // Node) calls back with null and never actually changes anything server-side -
              // recording it anyway would leave a phantom entry on the undo stack for an edit
              // that never happened.
              if (before && result) recordEdgeEdit(edgeData.id, { from: before.from, to: before.to }, { from: edgeData.from, to: edgeData.to });
            });
          },
        },
      };

      const network = new Network(networkRef.current, data, options);
      visNetwork = network;

      // Add custom CSS for better integration
      const canvas = networkRef.current.querySelector('canvas');
      if (canvas) {
        canvas.style.borderRadius = '8px';
      }

      network.on('selectNode', (params) => {
        setSelectedNode(data.nodes.get(params.nodes[0]));
      });

      network.on('deselectNode', () => {
        setSelectedNode(null);
      });

      network.on('doubleClick', (params) => {
        if (params.nodes.length > 0) {
          const node = data.nodes.get(params.nodes[0]);
          setSelectedNode(node);
          if (node.color !== ROOT_COLOR) {
            setModalShow(true);
          }
        }
      });

      // Node labels are truncated to keep the graph readable at a glance - hovering swaps in
      // the full title for as long as the cursor stays there, instead of vis-network's own
      // hover popup (suppressed globally in globals.css - see the comment there for why it's
      // done that way rather than by dropping `title` from the node data).
      network.on('hoverNode', (params) => {
        const node = data.nodes.get(params.node);
        if (!node) return;
        if (!hoverOriginalLabels.current.has(params.node)) {
          hoverOriginalLabels.current.set(params.node, node.label);
        }
        data.nodes.update({ id: params.node, label: node.title });
      });

      network.on('blurNode', (params) => {
        if (!hoverOriginalLabels.current.has(params.node)) return;
        const originalLabel = hoverOriginalLabels.current.get(params.node);
        hoverOriginalLabels.current.delete(params.node);
        if (data.nodes.get(params.node)) {
          data.nodes.update({ id: params.node, label: originalLabel });
        }
      });

      return () => {
        if (network) {
          network.destroy();
        }
      };
    }
    // Deliberately NOT [nodes, edges]: every add/edit/delete now also updates that React state
    // (so Tree View, which renders straight from it, stays accurate), but the graph itself is
    // kept current via direct DataSet calls below instead - rebuilding the whole vis-network
    // instance on every such change would blow away pan/zoom and restart the physics layout.
    // This should only ever run again if a genuinely different network is loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkId]);

  // Every node already carries its own per-node border width and font color (set via styleNode
  // above), which override the global nodes.borderWidth/font options - so toggling the theme,
  // or changing the node border width in Settings, has to walk the DataSet and restyle each
  // node individually, not just update the network's default options.
  useEffect(() => {
    if (!networkData) return;
    networkData.nodes.update(networkData.nodes.get().map(n => styleNode(n, isDarkMode)));
  }, [isDarkMode, styleNode]);

  // Everything else in Settings (edges, physics, layout, interaction, and the node-level
  // defaults that aren't overridden per-node above) applies live via setOptions - this
  // deliberately reuses the same builder the graph-init effect uses, and buildVisOptions never
  // includes a `manipulation` key, so it can't clobber the callbacks wired up at init.
  useEffect(() => {
    visNetwork?.setOptions(buildVisOptions(settings, isDarkMode));
  }, [settings, isDarkMode]);

  const switchType = () => {
    if (!selectedNode) return;
    const before = selectedNode;
    const updatedNode = { ...selectedNode };
    updatedNode.color = NEXT_TYPE[updatedNode.color] || ACTION_COLOR;
    setSelectedNode(updatedNode);
    networkData.nodes.update(styleNode(updatedNode, isDarkMode));
    updateNodeInState(updatedNode);
    editNode(updatedNode);
    recordEdit(updatedNode.id, before, updatedNode);
  };

  const addChild = () => {
    if (!selectedNode) return;
    openCreateNode(selectedNode.id);
  };

  // Adds a just-created node (and its parent edge, if any) to the graph's DataSet and to
  // React state, then selects it - the one place this happens, shared by the dialog-based
  // create flow and the keyboard's paste/undo-redo, so the graph and Tree View can never show
  // a node that isn't really there.
  const applyCreatedNode = (node, edge) => {
    const displayNode = {
      ...node,
      label: node.label && node.label.length > 15 ? node.label.substring(0, 15) + '...' : node.label
    };
    networkData.nodes.add(styleNode(displayNode, isDarkMode));
    pushNode(displayNode);

    if (edge) {
      const flatEdge = { id: edge.id, from: edge.from.id, to: edge.to.id };
      networkData.edges.add(flatEdge);
      pushEdge(flatEdge);
    }

    visNetwork?.selectNodes([displayNode.id]);
    setSelectedNode(displayNode);
    return displayNode;
  };

  const {
    recordCreate,
    recordEdit,
    prepareNodeDelete,
    commitUndo,
    recordEdgeCreate,
    recordEdgeDelete,
    recordEdgeEdit,
    getEdgeSnapshot,
  } = useNetworkKeyboardEditing({
    networkId,
    nodes,
    edges,
    selectedNode,
    setSelectedNode,
    isDarkMode,
    pushNode,
    pushEdge,
    updateNodeInState,
    deleteNodeProp: deleteNode,
    addEdgeProp: addEdge,
    deleteEdgeProp: deleteEdge,
    editEdgeProp: editEdge,
    styleNode,
    applyCreatedNode,
    getNetworkData: () => networkData,
    getVisNetwork: () => visNetwork,
    isShortcutsBlocked: () => modalShow || createNodeShow,
  });

  // Only reached once SaveNodeRequest has actually succeeded on the backend.
  const handleNodeCreated = (node, edge) => {
    applyCreatedNode(node, edge);
    closeCreateNode();
    recordCreate(node, createParentId);
  };

  const handleEditNodeSave = (updatedNode) => {
    const before = selectedNode;
    networkData.nodes.update(styleNode(updatedNode, isDarkMode));
    setSelectedNode(updatedNode);
    updateNodeInState(updatedNode);
    if (before) {
      recordEdit(updatedNode.id, before, updatedNode);
    }
  };

  // Keeps the graph's own selection in sync so switching back to Graph View after picking a
  // node in Tree View shows the same node highlighted, instead of looking deselected.
  const handleSelectFromTree = (node) => {
    setSelectedNode(node);
    visNetwork?.selectNodes(node ? [node.id] : []);
  };

  const handleTreeDoubleClick = (node) => {
    handleSelectFromTree(node);
    if (node.color !== ROOT_COLOR) {
      setModalShow(true);
    }
  };

  return (
    <div className="relative w-full h-full">

      <NetworkEditor
        selectedNode={selectedNode}
        switchType={switchType}
        addChild={addChild}
        networkName={networkName}
        networkId={networkId}
        areaOfFocusNodes={nodes.filter(node => node.areaOfFocus)}
        handleEditNodeSave={handleEditNodeSave}
        modalShow={modalShow}
        minimizeForModal={modalShow || createNodeShow}
        onEditShow={() => setModalShow(true)}
        onEditClose={closeEditModal}
        published={published}
        onTogglePublish={onTogglePublish}
        visibleToFriends={visibleToFriends}
        onToggleVisibleToFriends={onToggleVisibleToFriends}
        onExport={onExport}
      />

      <NodeEditor
        networkId={networkId}
        show={createNodeShow}
        handleClose={closeCreateNode}
        selectedNode={null}
        parentNodeId={createParentId}
        onNodeCreated={handleNodeCreated}
      />

      {/* absolute (not fixed) so it's positioned within this component's own container, which
          already starts to the right of the app sidebar - `fixed` anchors to the viewport
          instead and was landing on top of the sidebar's contents. */}
      <div className="absolute top-8 left-2 z-[9999] flex rounded-md border border-border bg-card shadow-lg overflow-hidden">
        <Button
          variant={viewMode === 'graph' ? 'default' : 'ghost'}
          size="sm"
          className="rounded-none flex items-center gap-1.5"
          onClick={() => selectViewMode('graph')}
        >
          <Share2 size={16} />
          Graph
        </Button>
        <Button
          variant={viewMode === 'tree' ? 'default' : 'ghost'}
          size="sm"
          className="rounded-none flex items-center gap-1.5"
          onClick={() => selectViewMode('tree')}
        >
          <ListTree size={16} />
          Tree
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-none flex items-center gap-1.5"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings size={16} />
          Settings
        </Button>
      </div>

      <NetworkSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onChange={handleSettingsChange}
        onReset={handleSettingsChange}
      />

      {viewMode === 'tree' && (
        <div className="absolute inset-0 pt-16">
          <NetworkTree
            nodes={nodes}
            edges={edges}
            selectedNode={selectedNode}
            onSelectNode={handleSelectFromTree}
            onNodeDoubleClick={handleTreeDoubleClick}
          />
        </div>
      )}

      {/* Kept mounted (just hidden) rather than unmounted when Tree View is active, so vis-network
          doesn't reinitialize/re-run its layout physics every time you switch back to Graph View. */}
      <div ref={networkRef} className={`w-full h-full ${viewMode === 'tree' ? 'invisible pointer-events-none' : ''}`} />
    </div>
  );
};

export default VisNetwork;
