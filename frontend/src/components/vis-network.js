// VisNetwork.js - the network editor: toolbar on top, graph (or tree) in the middle, and the
// node inspector docked on the right.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Network, DataSet } from 'vis-network/standalone/esm/vis-network';
import { useTheme } from 'next-themes';
import NetworkToolbar from '@/components/network-toolbar';
import NetworkTree from '@/components/network-tree';
import NodeInspector from '@/components/node-inspector';
import PracticeSession from '@/components/practice-session';
import SplitNetworkDialog from '@/components/split-network-dialog';
import NetworkSettingsDialog from '@/components/network-settings-dialog';
import MarketplaceNetworkViewer from '@/components/marketplace-network-viewer.js';
import { Button } from '@/components/ui/button';
import { Plus, Spline, Trash2, Maximize, Undo2, Redo2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNetworkKeyboardEditing } from '@/hooks/use-network-keyboard-editing';
import {
  loadNetworkSettings,
  saveNetworkSettings,
  buildVisOptions,
} from '@/lib/network-settings';
import { ROOT_COLOR, NODE_TYPES, toDisplayLabel } from '@/lib/node-types';

let networkData;
let visNetwork;

// Area of focus is a per-node flag, not its own node type - it's shown directly on the node
// itself (bold label + thicker border) so it's visible on the graph at a glance. Every call
// site that adds/updates a node in the vis DataSet must route through this so the indicator
// (and its removal, if toggled off) stays in sync with the node's actual data instead of only
// refreshing on a full reload.
//
// Deliberately does NOT touch `color` - it stays a plain string everywhere (`node.color ===
// ACTION_COLOR` etc. is how type is checked all over the app, and nodes are read straight back
// out of this same vis DataSet on click, so reshaping it into an object here would silently
// break those comparisons the moment a focus node gets selected).
//
// Labels are drawn on <canvas>, not the DOM, so they don't pick up dark-mode colors from CSS
// at all - isDark has to be threaded in explicitly by every caller.
//
// Border widths are relative to the network's configured base (settings.nodes.borderWidth/
// borderWidthSelected, editable in Network Display Settings) rather than fixed numbers - a
// node-level `borderWidth` here overrides the network-wide default for that node.
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
const PANEL_STORAGE_KEY = 'networkInspectorPanel';

const isEditableTarget = (el) => {
  if (!el) return false;
  const tag = el.tagName;
  return el.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
};

const VisNetwork = ({
  networkId,
  nodes,
  edges,
  deleteNode,
  addEdge,
  deleteEdge,
  editEdge,
  networkName,
  pushNode,
  pushEdge,
  updateNodeInState,
  published,
  onTogglePublish,
  visibleToFriends,
  onToggleVisibleToFriends,
  onExport,
  initialView,
}) => {
  const networkRef = useRef(null);
  const canvasAreaRef = useRef(null);
  const inspectorRef = useRef(null);
  const { toast } = useToast();
  // What a node's label was showing before a hover swapped it out for the full (untruncated)
  // title - keyed by node id, so blurNode can put back exactly what was there.
  const hoverOriginalLabels = useRef(new Map());
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [view, setView] = useState(initialView === 'preview' ? 'preview' : 'graph');
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelWide, setPanelWide] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [focusTitleSignal, setFocusTitleSignal] = useState(0);
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';

  // Node/edge/physics/layout/interaction display settings, editable via the Settings dialog and
  // persisted per-network in localStorage. Loaded lazily so the very first render - and the
  // graph-init effect that runs off of it - already has whatever was previously saved.
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

  // Node creation happens in the inspector panel. Nothing exists anywhere - not the vis
  // DataSet, not React state, not the backend - until its form is submitted. createParentId
  // is the node to link the new one to as a child, or null for a top-level node.
  const [isCreating, setIsCreating] = useState(false);
  const [createParentId, setCreateParentId] = useState(null);
  const openCreateNode = (parentId) => {
    setCreateParentId(parentId ?? null);
    setIsCreating(true);
    setPanelOpen(true);
  };
  const closeCreateNode = () => setIsCreating(false);

  // The graph-init effect below deliberately only runs once per network, so the callbacks it
  // wires up would otherwise close over whatever function references existed at that moment -
  // page.js redefines deleteNode every render (closing over its current `nodes`), and
  // openCreateNode/setSelected* are fine either way, but routing through a ref keeps every
  // handler current without rebuilding the whole vis-network instance (and losing pan/zoom).
  const deleteNodeRef = useRef(deleteNode);
  const openCreateNodeRef = useRef(openCreateNode);
  useEffect(() => {
    deleteNodeRef.current = deleteNode;
    openCreateNodeRef.current = openCreateNode;
  });

  // Restore the last view/panel layout the user had. Reading localStorage in the initial
  // useState would run during server rendering too and cause a hydration mismatch.
  useEffect(() => {
    if (initialView !== 'preview') {
      const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (saved === 'graph' || saved === 'tree') setView(saved);
    }
    const panel = localStorage.getItem(PANEL_STORAGE_KEY);
    if (panel === 'closed') setPanelOpen(false);
    if (panel === 'wide') setPanelWide(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only a real click persists a new choice (an effect keyed on `view` would also fire on
  // mount, before the restore above applies, and overwrite it). Preview is never remembered -
  // it's a quick look, not a place to work.
  const selectView = (next) => {
    setView(next);
    if (next !== 'preview') localStorage.setItem(VIEW_MODE_STORAGE_KEY, next);
  };

  const setPanel = (open, wide = panelWide) => {
    setPanelOpen(open);
    setPanelWide(wide);
    localStorage.setItem(PANEL_STORAGE_KEY, !open ? 'closed' : wide ? 'wide' : 'normal');
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
        // Display options come from the (user-editable, per-network persisted) settings - see
        // network-settings.js. Only `manipulation` below is hardcoded here, since it's wiring.
        ...buildVisOptions(settings, isDarkMode),

        manipulation: {
          // vis-network's own toolbar is replaced by the canvas tools rendered below - its
          // modes (addEdgeMode, deleteSelected) are still driven programmatically through
          // these same callbacks.
          enabled: false,
          addNode: (nodeData, callback) => {
            callback(null);
            openCreateNodeRef.current(null);
          },
          // Each of these also feeds the undo/redo stack - the snapshot needed to undo has to
          // be captured *before* the request goes out, since by the time the success callback
          // fires that data is already gone from local state.
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
              setConnecting(false);
              if (result) recordEdgeCreate(result);
            });
          },
          deleteEdge: (edgeData, callback) => {
            const before = getEdgeSnapshot(edgeData.edges[0]);
            deleteEdge(edgeData, (result) => {
              callback(result);
              setSelectedEdgeId(null);
              if (before) recordEdgeDelete(before);
            });
          },
          editEdge: (edgeData, callback) => {
            const before = getEdgeSnapshot(edgeData.id);
            editEdge(edgeData, (result) => {
              callback(result);
              // A rejected edit (e.g. the backend blocking a cycle) calls back with null and
              // never changes anything server-side - recording it anyway would leave a
              // phantom entry on the undo stack.
              if (before && result) recordEdgeEdit(edgeData.id, { from: before.from, to: before.to }, { from: edgeData.from, to: edgeData.to });
            });
          },
        },
      };

      const network = new Network(networkRef.current, data, options);
      visNetwork = network;

      network.on('selectNode', (params) => {
        setSelectedNode(data.nodes.get(params.nodes[0]));
        setSelectedEdgeId(null);
        setIsCreating(false);
      });

      network.on('deselectNode', () => {
        setSelectedNode(null);
      });

      network.on('click', (params) => {
        setSelectedEdgeId(params.nodes.length === 0 && params.edges.length > 0 ? params.edges[0] : null);
        if (params.nodes.length === 0 && params.edges.length === 0) setIsCreating(false);
      });

      // Double-click a node to jump straight into editing it; double-click empty space to
      // add a new node there.
      network.on('doubleClick', (params) => {
        if (params.nodes.length > 0) {
          const node = data.nodes.get(params.nodes[0]);
          setSelectedNode(node);
          setPanelOpen(true);
          if (node.color !== ROOT_COLOR) setFocusTitleSignal(s => s + 1);
        } else if (params.edges.length === 0) {
          openCreateNodeRef.current(null);
        }
      });

      // Node labels are truncated to keep the graph readable at a glance - hovering swaps in
      // the full title for as long as the cursor stays there, instead of vis-network's own
      // hover popup (suppressed globally in globals.css).
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
    // Deliberately NOT [nodes, edges]: every add/edit/delete also updates that React state (so
    // Tree View and the inspector stay accurate), but the graph itself is kept current via
    // direct DataSet calls instead - rebuilding the whole vis-network instance on every change
    // would blow away pan/zoom and restart the physics layout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkId]);

  // autoResize is off in the vis options, so opening/closing/widening the inspector would
  // otherwise leave the canvas at its old size (stretched, or with dead space).
  useEffect(() => {
    if (!canvasAreaRef.current) return undefined;
    const observer = new ResizeObserver(() => {
      visNetwork?.setSize('100%', '100%');
      visNetwork?.redraw();
    });
    observer.observe(canvasAreaRef.current);
    return () => observer.disconnect();
  }, []);

  // Every node carries its own per-node border width and font color (set via styleNode),
  // which override the global options - so a theme or border width change has to restyle
  // each node individually.
  useEffect(() => {
    if (!networkData) return;
    networkData.nodes.update(networkData.nodes.get().map(n => styleNode(n, isDarkMode)));
  }, [isDarkMode, styleNode]);

  // Everything else in Settings applies live via setOptions - buildVisOptions never includes
  // a `manipulation` key, so it can't clobber the callbacks wired up at init.
  useEffect(() => {
    visNetwork?.setOptions(buildVisOptions(settings, isDarkMode));
  }, [settings, isDarkMode]);

  // Adds a just-created node (and its parent edge, if any) to the graph's DataSet and to
  // React state, then selects it - shared by the inspector's create flow and the keyboard's
  // paste/undo-redo, so the graph and Tree View can never show a node that isn't really there.
  const applyCreatedNode = (node, edge) => {
    const displayNode = { ...node, label: toDisplayLabel(node.label) };
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
    deleteSelectedNode,
    undo,
    redo,
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
    // Focus inside the inspector (even on a plain button, like the type picker) means the
    // user is working there - Delete/arrows must not act on the graph behind it.
    isShortcutsBlocked: () =>
      settingsOpen || practiceOpen || splitOpen || view === 'preview' ||
      Boolean(inspectorRef.current?.contains(document.activeElement)),
  });

  const handleNodeCreated = (node, edge) => {
    const parentId = createParentId;
    applyCreatedNode(node, edge);
    closeCreateNode();
    recordCreate(node, parentId);
    visNetwork?.focus(node.id, { scale: visNetwork.getScale(), animation: true });
  };

  const handleEditNodeSave = (updatedNode) => {
    const before = selectedNode;
    const displayNode = { ...updatedNode, label: toDisplayLabel(updatedNode.title) };
    hoverOriginalLabels.current.delete(displayNode.id);
    networkData.nodes.update(styleNode(displayNode, isDarkMode));
    setSelectedNode(displayNode);
    updateNodeInState(displayNode);
    if (before) {
      recordEdit(displayNode.id, before, displayNode);
    }
  };

  // Selecting from anywhere other than the canvas itself (tree, search, inspector links,
  // breadcrumbs) keeps the graph's own selection in sync and brings the node into view.
  const selectNode = (node) => {
    setIsCreating(false);
    setSelectedEdgeId(null);
    setSelectedNode(node);
    if (node) {
      visNetwork?.selectNodes([node.id]);
      if (view === 'graph') visNetwork?.focus(node.id, { scale: Math.max(visNetwork.getScale(), 0.8), animation: true });
    } else {
      visNetwork?.unselectAll();
    }
  };

  const handlePickFromSearch = (node) => {
    selectNode(node);
    setPanelOpen(true);
  };

  const handleTreeDoubleClick = (node) => {
    selectNode(node);
    setPanelOpen(true);
    if (node.color !== ROOT_COLOR) setFocusTitleSignal(s => s + 1);
  };

  const addNode = () => openCreateNode(selectedNode?.id ?? null);

  const deleteSelection = () => {
    if (selectedNode) {
      if (selectedNode.color === ROOT_COLOR) {
        toast({ title: "The root node can't be deleted", variant: 'destructive' });
        return;
      }
      deleteSelectedNode();
      toast({ title: 'Node deleted', description: 'Press ⌘Z / Ctrl+Z to undo.' });
    } else if (selectedEdgeId != null) {
      visNetwork?.deleteSelected();
    }
  };

  const toggleConnect = () => {
    if (connecting) {
      visNetwork?.disableEditMode();
      setConnecting(false);
    } else {
      visNetwork?.addEdgeMode();
      setConnecting(true);
    }
  };

  // Shortcuts owned by the editor itself (the hook covers copy/paste/undo/delete/arrows).
  useEffect(() => {
    const onKey = (e) => {
      if (isEditableTarget(document.activeElement) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (settingsOpen || practiceOpen || splitOpen || view === 'preview') return;
      if (inspectorRef.current?.contains(document.activeElement)) return;
      if (e.key === 'Escape' && connecting) {
        visNetwork?.disableEditMode();
        setConnecting(false);
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        addNode();
      } else if (e.key === 'Enter' && selectedNode && selectedNode.color !== ROOT_COLOR) {
        e.preventDefault();
        setPanelOpen(true);
        setFocusTitleSignal(s => s + 1);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !selectedNode && selectedEdgeId != null) {
        e.preventDefault();
        visNetwork?.deleteSelected();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const areaOfFocusNodes = nodes.filter(node => node.areaOfFocus && node.color !== ROOT_COLOR);
  const isEmpty = nodes.filter(n => n.color !== ROOT_COLOR).length === 0;
  const showPanel = panelOpen && view !== 'preview';

  return (
    <div className="flex h-full w-full flex-col">
      <NetworkToolbar
        networkName={networkName}
        nodes={nodes}
        view={view}
        onViewChange={selectView}
        onPickNode={handlePickFromSearch}
        onAddNode={addNode}
        onStartPractice={() => setPracticeOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        panelOpen={panelOpen}
        onTogglePanel={() => setPanel(!panelOpen)}
        published={published}
        onTogglePublish={onTogglePublish}
        visibleToFriends={visibleToFriends}
        onToggleVisibleToFriends={onToggleVisibleToFriends}
        onExport={onExport}
      />

      <div className="flex min-h-0 flex-1">
        <div ref={canvasAreaRef} className="relative min-w-0 flex-1">
          {view === 'tree' && (
            <div className="absolute inset-0 z-10">
              <NetworkTree
                nodes={nodes}
                edges={edges}
                selectedNode={selectedNode}
                onSelectNode={selectNode}
                onNodeDoubleClick={handleTreeDoubleClick}
              />
            </div>
          )}

          {view === 'preview' && (
            <div className="absolute inset-0 z-10 overflow-y-auto bg-background p-4">
              <p className="mb-4 text-sm text-muted-foreground">This is what other members see when you share or publish this network.</p>
              <MarketplaceNetworkViewer nodes={nodes} edges={edges} />
            </div>
          )}

          {/* Kept mounted (just hidden) rather than unmounted in the other views, so vis-network
              doesn't reinitialize/re-run its layout physics every time you switch back. */}
          <div ref={networkRef} className={`h-full w-full ${view !== 'graph' ? 'invisible pointer-events-none' : ''}`} />

          {view === 'graph' && (
            <>
              {isEmpty && !isCreating && (
                <div className="pointer-events-none absolute inset-x-0 top-1/3 flex justify-center">
                  <div className="rounded-lg border bg-card/90 px-5 py-4 text-center shadow-sm">
                    <p className="font-medium">Start building your network</p>
                    <p className="mt-1 text-sm text-muted-foreground">Double-click anywhere or press <kbd className="kbd">N</kbd> to add your first node.</p>
                  </div>
                </div>
              )}

              {connecting && (
                <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-primary px-4 py-1.5 text-sm text-primary-foreground shadow">
                  Drag from one node to another to connect them · <button className="underline" onClick={toggleConnect}>Cancel</button>
                </div>
              )}

              <div className="absolute bottom-3 left-3 hidden gap-3 rounded-md border bg-card/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm sm:flex">
                {NODE_TYPES.map(t => (
                  <span key={t.color} className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${t.dotClass}`} /> {t.label}
                  </span>
                ))}
                <span className="font-semibold text-amber-700 dark:text-amber-400">Bold = focus</span>
              </div>

              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border bg-card p-1 shadow-md">
                <Button variant="ghost" size="sm" onClick={addNode} title="Add node (N)">
                  <Plus /> {selectedNode ? 'Add child' : 'Add node'}
                </Button>
                <Button variant={connecting ? 'secondary' : 'ghost'} size="sm" onClick={toggleConnect} title="Connect two nodes">
                  <Spline /> Connect
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deleteSelection}
                  disabled={!selectedNode && selectedEdgeId == null}
                  title={selectedEdgeId != null && !selectedNode ? 'Delete connection (Del)' : 'Delete node (Del)'}
                >
                  <Trash2 /> {selectedEdgeId != null && !selectedNode ? 'Delete link' : 'Delete'}
                </Button>
                <span className="mx-1 h-5 w-px bg-border" />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} title="Undo (⌘Z)"><Undo2 /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} title="Redo (⌘⇧Z)"><Redo2 /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => visNetwork?.fit({ animation: true })} title="Fit to screen"><Maximize /></Button>
              </div>
            </>
          )}
        </div>

        {showPanel && (
          <aside
            ref={inspectorRef}
            className={`shrink-0 border-l bg-background transition-[width] duration-200 ${panelWide ? 'w-[min(640px,55vw)]' : 'w-[380px]'} max-w-[90vw]`}
          >
            <NodeInspector
              networkId={networkId}
              networkName={networkName}
              nodes={nodes}
              edges={edges}
              selectedNode={selectedNode}
              isCreating={isCreating}
              createParentId={createParentId}
              onCancelCreate={closeCreateNode}
              onNodeCreated={handleNodeCreated}
              onSave={handleEditNodeSave}
              onSelectNode={selectNode}
              onAddChild={() => openCreateNode(selectedNode?.id ?? null)}
              onDelete={deleteSelection}
              onSplit={() => setSplitOpen(true)}
              onStartPractice={() => setPracticeOpen(true)}
              focusTitleSignal={focusTitleSignal}
              wide={panelWide}
              onToggleWide={() => setPanel(true, !panelWide)}
              onClose={() => setPanel(false)}
            />
          </aside>
        )}
      </div>

      <PracticeSession
        open={practiceOpen}
        onOpenChange={setPracticeOpen}
        networkId={networkId}
        areaOfFocusNodes={areaOfFocusNodes}
      />

      <SplitNetworkDialog
        open={splitOpen}
        onOpenChange={setSplitOpen}
        node={selectedNode}
        onSplit={(newNetwork) => { window.location.href = `/network/${newNetwork.id}`; }}
      />

      <NetworkSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onChange={handleSettingsChange}
        onReset={handleSettingsChange}
      />
    </div>
  );
};

export default VisNetwork;
