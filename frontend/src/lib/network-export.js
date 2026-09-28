// Shared by the "Export as JSON" action (both the network editor's control panel and the
// dashboard's per-network menu use this) and by NetworkCreator's "Import Network" file picker,
// so the two stay in sync on exactly one schema instead of each guessing the other's shape.
//
// `title` (not `label`) is the exported field for a node's name - `label` is just a truncated-
// for-canvas-display copy of it (see fetchNetwork in the network page), so re-deriving it on
// import would only recreate stale truncation logic here for no benefit; the backend sets
// label = title on create and the app re-truncates for display wherever it renders one anyway.
export const NETWORK_EXPORT_FORMAT = "taskflow-network";
export const NETWORK_EXPORT_VERSION = 1;

// Node objects from either source, this export is built from, already carry every field being
// pulled here (see NetworkPage's fetchNetwork, and the backend's getUserNetworksByLogin/
// mapNetwork) - this just picks out the subset worth re-importing.
export function buildNetworkExport(name, nodes, edges) {
  // Defensive against `null`/`undefined` entries in either array - a known undo/redo bug
  // (buildDeleteAction.undo in use-network-keyboard-editing.js could push a null edge when
  // reconnecting a node hit the cycle/Root-Node guard) could leave one of these arrays holding
  // a hole. Filtering here means a stale corrupted entry can only ever be silently dropped from
  // an export, never turn into a "Node not found" the import side has to reject.
  const cleanNodes = (nodes ?? [])
    .filter(Boolean)
    .map((n) => ({
      id: String(n.id),
      title: n.title,
      color: n.color,
      description: n.description ?? "",
      estimatedAmountOfTime: n.estimatedAmountOfTime ?? null,
      difficulty: n.difficulty ?? 0,
      priority: n.priority ?? 0,
      areaOfFocus: !!n.areaOfFocus,
      quantifierLabel: n.quantifierLabel ?? null,
    }));

  const nodeIds = new Set(cleanNodes.map((n) => n.id));
  const cleanEdges = (edges ?? [])
    .filter(Boolean)
    // from/to show up as either a plain node id or a nested `{ id, ... }` node object
    // depending on where this edge came from - normalized to a plain id either way.
    .map((e) => ({
      from: String(e.from?.id ?? e.from),
      to: String(e.to?.id ?? e.to),
    }))
    // Drop any edge pointing at a node that isn't actually in this export - importing it
    // verbatim is exactly what produces the "Node not found" error on the way back in.
    .filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to));

  return {
    format: NETWORK_EXPORT_FORMAT,
    version: NETWORK_EXPORT_VERSION,
    name,
    nodes: cleanNodes,
    edges: cleanEdges,
  };
}

export function downloadNetworkExport(name, nodes, edges) {
  const data = buildNetworkExport(name, nodes, edges);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(name || "network").replace(/[^\w\- ]+/g, "").trim() || "network"}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Throws a plain Error with a user-presentable message on anything that doesn't look like a
// network this app exported - callers show it directly in a toast.
export function parseNetworkImport(rawText) {
  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }

  if (!data || data.format !== NETWORK_EXPORT_FORMAT) {
    throw new Error("That file isn't a TaskFlow network export.");
  }
  if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
    throw new Error("That file is missing its nodes or edges.");
  }
  if (data.nodes.length === 0) {
    throw new Error("That file doesn't contain any nodes.");
  }

  return data;
}
