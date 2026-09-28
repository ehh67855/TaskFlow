"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Network, DataSet } from 'vis-network/standalone/esm/vis-network';
import { useTheme } from 'next-themes';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent } from '@/components/ui/card';

const CATEGORY_COLOR = '#FFD166';
const ROOT_COLOR = '#808080';
const INFO_COLOR = '#6FA8DC';

const typeLabel = (color) => {
  if (color === ROOT_COLOR) return 'Root';
  if (color === CATEGORY_COLOR) return 'Category';
  if (color === INFO_COLOR) return 'Info';
  return 'Action';
};

// Same per-node styling convention as the real graph editor (vis-network.js) - bold label +
// thicker border for area-of-focus nodes, dark-mode-aware label color since it's drawn on
// <canvas> and doesn't pick up CSS.
const styleNode = (node, isDark) => ({
  ...node,
  borderWidth: node.areaOfFocus ? 4 : 2,
  font: {
    bold: Boolean(node.areaOfFocus),
    color: isDark
      ? (node.areaOfFocus ? '#fbbf24' : '#ffffff')
      : (node.areaOfFocus ? '#92400e' : '#374151')
  }
});

// A browsing-only view of someone else's network: pan/zoom/click work like the real graph,
// but there's no manipulation toolbar and nothing here is persisted - clicking a node just
// shows its details in the side panel, matching what "click through before adding it" needs
// without dragging in the full (ownership-scoped) editing machinery from vis-network.js.
const MarketplaceNetworkViewer = ({ nodes, edges }) => {
  const containerRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';

  useEffect(() => {
    if (!containerRef.current || !nodes || !edges) return undefined;

    // Accepts edges either nested (straight from the marketplace API, {from: {id}, to: {id}})
    // or already flat (the real network editor's own page-level state, {from: id, to: id}) -
    // this component is used from both places, and normalizing here means neither caller has
    // to reshape its data just to reuse this viewer.
    const flatEdges = edges.map(edge => ({
      id: edge.id,
      from: typeof edge.from === 'object' ? edge.from.id : edge.from,
      to: typeof edge.to === 'object' ? edge.to.id : edge.to
    }));
    const data = {
      nodes: new DataSet(nodes.map(n => styleNode(n, isDarkMode))),
      edges: new DataSet(flatEdges)
    };

    const network = new Network(containerRef.current, data, {
      autoResize: true,
      height: '520px',
      nodes: {
        shape: 'dot',
        size: 18,
        font: { size: 14, face: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }
      },
      edges: {
        width: 2,
        arrows: { to: { enabled: true, scaleFactor: 0.7 } },
        color: { color: '#9ca3af', highlight: '#3b82f6', hover: '#6b7280' },
        smooth: { type: 'cubicBezier', forceDirection: 'none', roundness: 0.5 }
      },
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: { gravitationalConstant: -50, centralGravity: 0.01, springLength: 100, springConstant: 0.08 },
        stabilization: { enabled: true, iterations: 300 }
      },
      manipulation: { enabled: false },
      interaction: { navigationButtons: false }
    });

    network.on('selectNode', (params) => {
      setSelectedNode(data.nodes.get(params.nodes[0]));
    });
    network.on('deselectNode', () => setSelectedNode(null));

    return () => network.destroy();
  }, [nodes, edges, isDarkMode]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 border border-border rounded-lg overflow-hidden" style={{ height: '520px' }} ref={containerRef} />

      <Card className="lg:col-span-1">
        <CardContent className="p-4 space-y-2">
          {!selectedNode ? (
            <p className="text-sm text-muted-foreground">Click a node to see its details.</p>
          ) : (
            <>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {typeLabel(selectedNode.color)}
              </span>
              <h3 className="text-lg font-semibold">{selectedNode.title}</h3>
              {selectedNode.description ? (
                <div className="text-sm">
                  <ReactMarkdown>{selectedNode.description}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No description.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketplaceNetworkViewer;
