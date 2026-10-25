"use client";
import { BACKEND_API_URL } from "@/config/site";

import { useCallback, useEffect, useRef } from "react";
import { toDisplayLabel } from "@/lib/node-types";

const ROOT_COLOR = "#808080";

const parseISODuration = (duration) => {
  if (!duration) return { minutes: 0, seconds: 0 };
  const matches = duration.match(/PT(?:\d+H)?(?:(\d+)M)?(?:(\d+)S)?/);
  return {
    minutes: parseInt((matches && matches[1]) || 0, 10),
    seconds: parseInt((matches && matches[2]) || 0, 10),
  };
};

// The field snapshot SaveNodeRequest expects - label is always set to the title explicitly
// (rather than left blank) because the backend only defaults label from title on create, not
// on edit, and this same shape is reused for edits, recreations and paste.
const nodeToPayload = (node) => {
  const { minutes, seconds } = parseISODuration(node.estimatedAmountOfTime);
  const hasTime = Boolean(node.estimatedAmountOfTime);
  return {
    title: node.title,
    label: node.title,
    color: node.color,
    priority: node.priority > 0 ? String(node.priority) : null,
    difficulty: node.difficulty > 0 ? String(node.difficulty) : null,
    estimatedMinutes: hasTime ? String(minutes) : null,
    estimatedSeconds: hasTime ? String(seconds) : null,
    isAreaOfFocus: node.areaOfFocus ? "true" : "false",
    description: node.description || "",
    quantifierLabel: node.quantifierLabel || "",
  };
};

const isEditableTarget = (el) => {
  if (!el) return false;
  const tag = el.tagName;
  return el.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
};

/**
 * Keyboard-driven editing for the network graph:
 *  - Arrow keys navigate the selection along edges (up to a parent, down to a child, left/right
 *    between siblings).
 *  - Cmd/Ctrl+C / X / V copy, cut and paste a single node (paste attaches as a child of whatever
 *    is currently selected, or top-level if nothing is selected).
 *  - Delete/Backspace removes the selected node.
 *  - Cmd/Ctrl+Z undoes, Cmd/Ctrl+Shift+Z redoes.
 *
 * Covers node create/delete/edit (whether triggered by a keyboard shortcut, the node dialog,
 * or the manipulation toolbar's own "Delete selected"), edge create/delete/edit via the
 * toolbar, and Make Category/Action - anything that mutates the graph funnels through one of
 * the record- or prepare-prefixed functions this hook returns, so it all shares one undo/redo
 * stack.
 *
 * "Session-only" undo/redo still means every step re-runs a real backend call - there's no
 * local-only edit mode in this app, so undoing is just doing the inverse operation for real.
 * It only means the history stack itself lives in memory and is lost on refresh, like most
 * editors. Because a deleted node's id can never come back from the database, undoing a
 * delete (or redoing a create) recreates the node with a brand-new id - `relinkId` below keeps
 * every other pending step that still refers to the old id pointed at the new one, so a chain
 * of undo/redo on the same node keeps working no matter how many times its id has changed.
 */
export function useNetworkKeyboardEditing({
  networkId,
  nodes,
  edges,
  selectedNode,
  setSelectedNode,
  isDarkMode,
  pushNode,
  pushEdge,
  updateNodeInState,
  deleteNodeProp,
  addEdgeProp,
  deleteEdgeProp,
  editEdgeProp,
  styleNode,
  applyCreatedNode,
  getNetworkData,
  getVisNetwork,
  isShortcutsBlocked,
}) {
  // Always current, regardless of which render generation a stored closure was created in -
  // every handler below reads from `ref.current` rather than closing over the props directly.
  const ref = useRef(null);
  ref.current = {
    networkId,
    nodes,
    edges,
    selectedNode,
    setSelectedNode,
    isDarkMode,
    pushNode,
    pushEdge,
    updateNodeInState,
    deleteNodeProp,
    addEdgeProp,
    deleteEdgeProp,
    editEdgeProp,
    styleNode,
    applyCreatedNode,
    getNetworkData,
    getVisNetwork,
    isShortcutsBlocked,
  };

  const clipboardRef = useRef(null);
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);

  const createNodeOnBackend = useCallback(async (payload, parentNodeId) => {
    const res = await fetch(`${BACKEND_API_URL}/save-node`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: null,
        parentNodeId: parentNodeId || null,
        networkId: ref.current.networkId,
        ...payload,
      }),
    });
    if (!res.ok) throw new Error(`Create failed: ${res.status}`);
    return res.json();
  }, []);

  const saveNodeOnBackend = useCallback(async (nodeId, payload) => {
    const res = await fetch(`${BACKEND_API_URL}/save-node`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: String(nodeId), networkId: ref.current.networkId, ...payload }),
    });
    if (!res.ok) throw new Error(`Save failed: ${res.status}`);
    return res.json();
  }, []);

  // Routed through the same addEdge/deleteEdge/editEdge functions the manipulation toolbar
  // itself uses (rather than hitting the backend directly) so the duplicate-edge check and
  // page.js's own edgesCache stay correct - a raw fetch here would create the edge fine but
  // leave that cache thinking it doesn't exist, letting a real duplicate slip through later.
  const createEdgeOnBackend = useCallback(
    (fromId, toId) =>
      new Promise((resolve) => {
        ref.current.addEdgeProp({ from: fromId, to: toId }, resolve);
      }),
    []
  );

  const deleteEdgeOnBackend = useCallback(
    (edgeId) =>
      new Promise((resolve) => {
        ref.current.deleteEdgeProp({ edges: [edgeId] }, resolve);
      }),
    []
  );

  const editEdgeOnBackend = useCallback(
    (edgeId, fromId, toId) =>
      new Promise((resolve) => {
        ref.current.editEdgeProp({ id: edgeId, from: fromId, to: toId }, resolve);
      }),
    []
  );

  const getEdgeSnapshot = useCallback((edgeId) => ref.current.edges.find((e) => e.id === edgeId) || null, []);

  const deleteNodeOnBackend = useCallback(
    (nodeId) =>
      new Promise((resolve) => {
        ref.current.deleteNodeProp({ nodes: [nodeId] }, resolve, ref.current.setSelectedNode);
      }),
    []
  );

  const removeFromDataSet = useCallback((nodeId) => {
    const networkData = ref.current.getNetworkData();
    if (!networkData) return;
    networkData.nodes.remove(nodeId);
    const connected = networkData.edges
      .get()
      .filter((e) => e.from === nodeId || e.to === nodeId)
      .map((e) => e.id);
    if (connected.length) networkData.edges.remove(connected);
  }, []);

  // Every pending undo/redo entry that still points at `oldId` gets moved onto `newId` -
  // needed whenever a delete-then-recreate cycle gives an entity a fresh database id, so any
  // *other* queued step for that same node or edge (an earlier edit, say) keeps targeting an
  // entity that actually still exists instead of a ghost id. Scoped by entityType because
  // nodes and edges are separate id sequences on the backend - without that, a node and an
  // edge that happen to land on the same numeric id could get relinked into each other.
  const relinkId = useCallback((entityType, oldId, newId) => {
    if (oldId === newId) return;
    for (const action of [...undoStackRef.current, ...redoStackRef.current]) {
      if (action.entityType === entityType && action.idRef && action.idRef.current === oldId) {
        action.idRef.current = newId;
      }
    }
  }, []);

  const buildCreateAction = useCallback(
    (nodeId, parentNodeId, payload) => {
      const idRef = { current: nodeId };
      return {
        idRef,
        entityType: "node",
        async undo() {
          await deleteNodeOnBackend(idRef.current);
          removeFromDataSet(idRef.current);
          ref.current.setSelectedNode(null);
        },
        async redo() {
          const oldId = idRef.current;
          const { node, edge } = await createNodeOnBackend(payload, parentNodeId);
          idRef.current = node.id;
          relinkId("node", oldId, node.id);
          ref.current.applyCreatedNode(node, edge);
        },
      };
    },
    [createNodeOnBackend, deleteNodeOnBackend, relinkId, removeFromDataSet]
  );

  const buildDeleteAction = useCallback(
    (nodeId) => {
      const { nodes: currentNodes, edges: currentEdges } = ref.current;
      const nodeSnapshot = currentNodes.find((n) => n.id === nodeId);
      if (!nodeSnapshot) return null;
      const parentLinks = currentEdges.filter((e) => e.to === nodeId).map((e) => e.from);
      const childLinks = currentEdges.filter((e) => e.from === nodeId).map((e) => e.to);
      const payload = nodeToPayload(nodeSnapshot);
      const idRef = { current: nodeId };

      return {
        idRef,
        entityType: "node",
        async undo() {
          const oldId = idRef.current;
          const { node: recreated } = await createNodeOnBackend(payload, null);
          idRef.current = recreated.id;
          relinkId("node", oldId, recreated.id);
          ref.current.applyCreatedNode(recreated, null);

          const stillExists = (id) => ref.current.nodes.some((n) => n.id === id);
          // Unlike the other build*Action helpers below, a rejected reconnect here (e.g. the
          // regraph now forms a cycle, or would point into the Root Node - see
          // NetworkService.validateEdgeEndpoints) isn't fatal to the whole undo: the node
          // itself was already recreated, and skipping just this one link (createEdgeOnBackend
          // resolves null rather than throwing) still lets the rest reconnect. Pushing that
          // null straight into state would otherwise leave a dangling edge reference - the
          // exact shape of bug that broke exporting/re-importing a network.
          for (const parentId of parentLinks) {
            if (!stillExists(parentId)) continue;
            const flatEdge = await createEdgeOnBackend(parentId, idRef.current);
            if (!flatEdge) continue;
            ref.current.getNetworkData()?.edges.add(flatEdge);
            ref.current.pushEdge(flatEdge);
          }
          for (const childId of childLinks) {
            if (!stillExists(childId)) continue;
            const flatEdge = await createEdgeOnBackend(idRef.current, childId);
            if (!flatEdge) continue;
            ref.current.getNetworkData()?.edges.add(flatEdge);
            ref.current.pushEdge(flatEdge);
          }
        },
        async redo() {
          await deleteNodeOnBackend(idRef.current);
          removeFromDataSet(idRef.current);
          ref.current.setSelectedNode(null);
        },
      };
    },
    [createEdgeOnBackend, createNodeOnBackend, deleteNodeOnBackend, relinkId, removeFromDataSet]
  );

  const buildEditAction = useCallback(
    (nodeId, beforePayload, afterPayload) => {
      const idRef = { current: nodeId };
      const apply = async (payload) => {
        const { node } = await saveNodeOnBackend(idRef.current, payload);
        const displayNode = {
          ...node,
          label: toDisplayLabel(node.label),
        };
        ref.current.getNetworkData()?.nodes.update(ref.current.styleNode(displayNode, ref.current.isDarkMode));
        ref.current.updateNodeInState(displayNode);
        ref.current.setSelectedNode((current) => (current && current.id === displayNode.id ? displayNode : current));
      };
      return {
        idRef,
        entityType: "node",
        async undo() {
          await apply(beforePayload);
        },
        async redo() {
          await apply(afterPayload);
        },
      };
    },
    [saveNodeOnBackend]
  );

  const buildEdgeCreateAction = useCallback(
    (edgeId, fromId, toId) => {
      const idRef = { current: edgeId };
      return {
        idRef,
        entityType: "edge",
        async undo() {
          await deleteEdgeOnBackend(idRef.current);
          ref.current.getNetworkData()?.edges.remove(idRef.current);
        },
        async redo() {
          const oldId = idRef.current;
          const flatEdge = await createEdgeOnBackend(fromId, toId);
          if (!flatEdge) throw new Error("Edge redo failed");
          idRef.current = flatEdge.id;
          relinkId("edge", oldId, flatEdge.id);
          ref.current.getNetworkData()?.edges.add(flatEdge);
        },
      };
    },
    [createEdgeOnBackend, deleteEdgeOnBackend, relinkId]
  );

  const buildEdgeDeleteAction = useCallback(
    (edgeId, fromId, toId) => {
      const idRef = { current: edgeId };
      return {
        idRef,
        entityType: "edge",
        async undo() {
          const oldId = idRef.current;
          const flatEdge = await createEdgeOnBackend(fromId, toId);
          if (!flatEdge) throw new Error("Edge undo failed");
          idRef.current = flatEdge.id;
          relinkId("edge", oldId, flatEdge.id);
          ref.current.getNetworkData()?.edges.add(flatEdge);
        },
        async redo() {
          await deleteEdgeOnBackend(idRef.current);
          ref.current.getNetworkData()?.edges.remove(idRef.current);
        },
      };
    },
    [createEdgeOnBackend, deleteEdgeOnBackend, relinkId]
  );

  const buildEdgeEditAction = useCallback(
    (edgeId, beforeFromTo, afterFromTo) => {
      const idRef = { current: edgeId };
      const apply = async ({ from, to }) => {
        const flatEdge = await editEdgeOnBackend(idRef.current, from, to);
        if (!flatEdge) throw new Error("Edge edit apply failed");
        ref.current.getNetworkData()?.edges.update(flatEdge);
      };
      return {
        idRef,
        entityType: "edge",
        async undo() {
          await apply(beforeFromTo);
        },
        async redo() {
          await apply(afterFromTo);
        },
      };
    },
    [editEdgeOnBackend]
  );

  const pushUndo = useCallback((action) => {
    if (!action) return;
    undoStackRef.current.push(action);
    redoStackRef.current = [];
  }, []);

  const runUndo = useCallback(async () => {
    const action = undoStackRef.current.pop();
    if (!action) return;
    try {
      await action.undo();
      redoStackRef.current.push(action);
    } catch (e) {
      console.error("Undo failed", e);
      undoStackRef.current.push(action);
    }
  }, []);

  const runRedo = useCallback(async () => {
    const action = redoStackRef.current.pop();
    if (!action) return;
    try {
      await action.redo();
      undoStackRef.current.push(action);
    } catch (e) {
      console.error("Redo failed", e);
      redoStackRef.current.push(action);
    }
  }, []);

  const recordCreate = useCallback(
    (node, parentNodeId) => {
      pushUndo(buildCreateAction(node.id, parentNodeId, nodeToPayload(node)));
    },
    [buildCreateAction, pushUndo]
  );

  const recordEdit = useCallback(
    (nodeId, beforeNode, afterNode) => {
      pushUndo(buildEditAction(nodeId, nodeToPayload(beforeNode), nodeToPayload(afterNode)));
    },
    [buildEditAction, pushUndo]
  );

  // For the manipulation toolbar's "Delete selected" (nodes): the snapshot needs to be taken
  // *before* the delete request goes out (nodeToPayload needs the still-live node), so this is
  // split into prepare-now / commit-after-success rather than a single record call.
  const prepareNodeDelete = useCallback((nodeId) => buildDeleteAction(nodeId), [buildDeleteAction]);
  const commitUndo = useCallback((action) => pushUndo(action), [pushUndo]);

  const recordEdgeCreate = useCallback(
    (edge) => {
      pushUndo(buildEdgeCreateAction(edge.id, edge.from, edge.to));
    },
    [buildEdgeCreateAction, pushUndo]
  );

  const recordEdgeDelete = useCallback(
    (edge) => {
      pushUndo(buildEdgeDeleteAction(edge.id, edge.from, edge.to));
    },
    [buildEdgeDeleteAction, pushUndo]
  );

  const recordEdgeEdit = useCallback(
    (edgeId, beforeFromTo, afterFromTo) => {
      pushUndo(buildEdgeEditAction(edgeId, beforeFromTo, afterFromTo));
    },
    [buildEdgeEditAction, pushUndo]
  );

  const copySelectedNode = useCallback(() => {
    const { selectedNode: current } = ref.current;
    if (!current || current.color === ROOT_COLOR) return;
    clipboardRef.current = nodeToPayload(current);
  }, []);

  const deleteSelectedNode = useCallback(() => {
    const { selectedNode: current } = ref.current;
    if (!current) return;
    const nodeId = current.id;
    const pendingAction = buildDeleteAction(nodeId);
    if (!pendingAction) return;
    ref.current.deleteNodeProp(
      { nodes: [nodeId] },
      (result) => {
        // null means the delete was rejected (e.g. the root node guard) - deleteNodeProp
        // already surfaced a toast for that, so there's nothing to undo-track here.
        if (result === null) return;
        removeFromDataSet(nodeId);
        pushUndo(pendingAction);
      },
      ref.current.setSelectedNode
    );
  }, [buildDeleteAction, pushUndo, removeFromDataSet]);

  const cutSelectedNode = useCallback(() => {
    const { selectedNode: current } = ref.current;
    if (!current || current.color === ROOT_COLOR) return;
    clipboardRef.current = nodeToPayload(current);
    deleteSelectedNode();
  }, [deleteSelectedNode]);

  const pasteFromClipboard = useCallback(async () => {
    if (!clipboardRef.current) return;
    const { selectedNode: current } = ref.current;
    const parentNodeId = current ? current.id : null;
    try {
      const { node, edge } = await createNodeOnBackend(clipboardRef.current, parentNodeId);
      ref.current.applyCreatedNode(node, edge);
      pushUndo(buildCreateAction(node.id, parentNodeId, clipboardRef.current));
    } catch (e) {
      console.error("Paste failed", e);
    }
  }, [buildCreateAction, createNodeOnBackend, pushUndo]);

  const navigateArrow = useCallback((key) => {
    const { nodes: currentNodes, edges: currentEdges, selectedNode: current, setSelectedNode: setSelected, getVisNetwork: getVis } = ref.current;

    const parentsOf = (id) => currentEdges.filter((e) => e.to === id).map((e) => e.from);
    const childrenOf = (id) => currentEdges.filter((e) => e.from === id).map((e) => e.to);
    const topLevel = () => {
      const withParent = new Set(currentEdges.map((e) => e.to));
      return currentNodes.filter((n) => !withParent.has(n.id)).map((n) => n.id);
    };
    const selectById = (id) => {
      const node = currentNodes.find((n) => n.id === id);
      if (!node) return;
      setSelected(node);
      const visNetwork = getVis();
      visNetwork?.selectNodes([id]);
      visNetwork?.focus(id, { animation: true });
    };

    if (!current) {
      const start = topLevel()[0] ?? currentNodes[0]?.id;
      if (start !== undefined) selectById(start);
      return;
    }

    const currentId = current.id;
    if (key === "ArrowDown") {
      const kids = childrenOf(currentId);
      if (kids.length) selectById(kids[0]);
    } else if (key === "ArrowUp") {
      const parents = parentsOf(currentId);
      if (parents.length) selectById(parents[0]);
    } else if (key === "ArrowLeft" || key === "ArrowRight") {
      const parents = parentsOf(currentId);
      const pool = parents.length ? childrenOf(parents[0]) : topLevel();
      const idx = pool.indexOf(currentId);
      if (idx === -1 || pool.length < 2) return;
      const nextIdx = key === "ArrowRight" ? (idx + 1) % pool.length : (idx - 1 + pool.length) % pool.length;
      selectById(pool[nextIdx]);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isEditableTarget(document.activeElement) || ref.current.isShortcutsBlocked()) return;

      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) runRedo();
        else runUndo();
        return;
      }
      if (mod && e.key.toLowerCase() === "c") {
        e.preventDefault();
        copySelectedNode();
        return;
      }
      if (mod && e.key.toLowerCase() === "x") {
        e.preventDefault();
        cutSelectedNode();
        return;
      }
      if (mod && e.key.toLowerCase() === "v") {
        e.preventDefault();
        pasteFromClipboard();
        return;
      }
      if (!mod && (e.key === "Delete" || e.key === "Backspace") && ref.current.selectedNode) {
        e.preventDefault();
        deleteSelectedNode();
        return;
      }
      if (!mod && e.key.startsWith("Arrow")) {
        e.preventDefault();
        navigateArrow(e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [copySelectedNode, cutSelectedNode, deleteSelectedNode, navigateArrow, pasteFromClipboard, runRedo, runUndo]);

  return {
    recordCreate,
    recordEdit,
    prepareNodeDelete,
    commitUndo,
    recordEdgeCreate,
    recordEdgeDelete,
    recordEdgeEdit,
    getEdgeSnapshot,
    deleteSelectedNode,
    undo: runUndo,
    redo: runRedo,
  };
}
