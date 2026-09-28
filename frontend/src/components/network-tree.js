"use client";

import React, { useMemo, useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CATEGORY_COLOR = '#FFD166';
const ROOT_COLOR = '#808080';
const INFO_COLOR = '#6FA8DC';

const dotClass = (color) => {
  if (color === CATEGORY_COLOR) return 'bg-amber-400';
  if (color === ROOT_COLOR) return 'bg-gray-400';
  if (color === INFO_COLOR) return 'bg-sky-400';
  return 'bg-emerald-400';
};

// A more linear, click-through way to browse the same nodes/edges as the graph - the graph
// is the real data model, but it stops being easy to scan once a network gets big, so this
// renders it as a collapsible tree instead: nodes with no incoming edge are the top-level
// entries, and each node's outgoing edges become its children. A node is only ever shown
// once (first branch that reaches it "claims" it), which also naturally guards against
// infinite recursion if the underlying graph has a cycle.
export default function NetworkTree({ nodes, edges, selectedNode, onSelectNode, onNodeDoubleClick }) {
  const nodesById = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  // Structural ownership (which node "owns" which child) is computed once here, independent
  // of expand/collapse state. It used to be inferred during rendering by tracking which ids
  // had been visited, but a collapsed node's children are never recursed into at render time -
  // so they never got marked as "claimed" and were incorrectly treated as orphans and
  // re-rendered a second time as fake top-level entries the moment their parent was collapsed.
  const { effectiveChildren, topLevel } = useMemo(() => {
    const rawChildren = new Map();
    const hasParent = new Set();
    nodes.forEach(n => rawChildren.set(n.id, []));
    edges.forEach(e => {
      if (rawChildren.has(e.from)) rawChildren.get(e.from).push(e.to);
      hasParent.add(e.to);
    });

    const claimed = new Set();
    const effective = new Map();
    const visit = (id) => {
      if (claimed.has(id)) return;
      claimed.add(id);
      const kids = (rawChildren.get(id) || []).filter(cid => nodesById.has(cid) && !claimed.has(cid));
      effective.set(id, kids);
      kids.forEach(visit);
    };

    const roots = nodes.filter(n => !hasParent.has(n.id));
    roots.forEach(r => visit(r.id));
    // Anything not reachable from a no-incoming-edge node (e.g. an isolated cycle) still gets
    // surfaced at the top level rather than silently vanishing.
    const leftovers = nodes.filter(n => !claimed.has(n.id));
    leftovers.forEach(n => visit(n.id));

    return { effectiveChildren: effective, topLevel: [...roots, ...leftovers] };
  }, [nodes, edges, nodesById]);

  const [expandedIds, setExpandedIds] = useState(() => new Set(topLevel.map(n => n.id)));

  const toggleExpanded = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedIds(new Set(nodes.map(n => n.id)));
  const collapseAll = () => setExpandedIds(new Set());

  const renderNode = (node, depth) => {
    const childIds = effectiveChildren.get(node.id) || [];
    const isExpanded = expandedIds.has(node.id);
    const isSelected = selectedNode?.id === node.id;
    const displayText = node.title || node.label || "Untitled";

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-1.5 py-1 pr-2 rounded cursor-pointer hover:bg-muted ${isSelected ? 'bg-muted ring-1 ring-primary' : ''} ${node.areaOfFocus ? 'font-bold' : ''}`}
          style={{ paddingLeft: `${depth * 20 + 4}px` }}
          onClick={() => onSelectNode(node)}
          onDoubleClick={() => onNodeDoubleClick(node)}
        >
          {childIds.length > 0 ? (
            <button
              type="button"
              className="shrink-0 text-muted-foreground"
              onClick={(e) => { e.stopPropagation(); toggleExpanded(node.id); }}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <span className="w-[14px] shrink-0" />
          )}
          <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${dotClass(node.color)}`} />
          <span className="truncate text-sm">{displayText}</span>
        </div>
        {childIds.length > 0 && isExpanded && (
          <div>
            {childIds.map(id => renderNode(nodesById.get(id), depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col bg-background">
      <div className="flex justify-start gap-2 p-2 border-b shrink-0">
        <Button variant="ghost" size="sm" onClick={expandAll}>Expand All</Button>
        <Button variant="ghost" size="sm" onClick={collapseAll}>Collapse All</Button>
      </div>
      <div className="flex-1 overflow-auto p-2">
        {nodes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No nodes yet.</p>
        ) : (
          topLevel.map(n => renderNode(n, 0))
        )}
      </div>
    </div>
  );
}
