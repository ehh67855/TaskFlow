
// VisNetwork.js (Refactored with ShadCN UI)
import React, { useEffect, useRef, useState } from 'react';
import { Network, DataSet } from 'vis-network/standalone/esm/vis-network';
import NetworkEditor from '@/components/network-editor';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';

let networkData;
let visNetwork;

const VisNetwork = ({
  networkId,
  nodes,
  edges,
  addNode,
  deleteNode,
  addEdge,
  deleteEdge,
  editEdge,
  editNode,
  networkName,
  networkQuantifier,
  pushNode,
}) => {
  const networkRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    if (networkRef.current) {
      const nodesDataSet = new DataSet(nodes);
      const edgesDataSet = new DataSet(edges);
      const data = {
        nodes: nodesDataSet,
        edges: edgesDataSet,
      };
      networkData = data;

      const options = {
        autoResize: false,
        clickToUse: false,
        
        // Enhanced node styling
        nodes: {
          shape: 'dot',
          size: 20,
          font: {
            size: 14,
            face: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            color: '#374151',
            strokeWidth: 0,
            strokeColor: '#ffffff',
            align: 'center',
            bold: {
              size: 16,
              face: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
              color: '#1f2937',
            }
          },
          borderWidth: 2,
          borderWidthSelected: 3,
          shadow: {
            enabled: true,
            color: 'rgba(0,0,0,0.1)',
            size: 10,
            x: 5,
            y: 5
          },
          color: {
            border: '#e5e7eb',
            background: '#ffffff',
            highlight: {
              border: '#3b82f6',
              background: '#eff6ff'
            },
            hover: {
              border: '#3b82f6',
              background: '#f8fafc'
            }
          }
        },
        
        // Enhanced edge styling
        edges: {
          width: 2,
          color: {
            color: '#9ca3af',
            highlight: '#3b82f6',
            hover: '#6b7280',
            opacity: 0.8
          },
          smooth: {
            type: 'cubicBezier',
            forceDirection: 'none',
            roundness: 0.5
          },
          arrows: {
            to: {
              enabled: true,
              scaleFactor: 0.8,
              type: 'arrow'
            }
          },
          shadow: {
            enabled: true,
            color: 'rgba(0,0,0,0.1)',
            size: 5,
            x: 2,
            y: 2
          },
          font: {
            size: 12,
            face: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            color: '#6b7280',
            strokeWidth: 0,
            strokeColor: '#ffffff',
            align: 'middle'
          }
        },
        
        // Enhanced layout
        layout: {
          improvedLayout: true,
          hierarchical: {
            enabled: false,
            direction: 'UD',
            sortMethod: 'directed',
            nodeSpacing: 150,
            levelSeparation: 200
          }
        },
        
        // Enhanced physics
        physics: {
          enabled: true,
          solver: 'forceAtlas2Based',
          forceAtlas2Based: {
            gravitationalConstant: -50,
            centralGravity: 0.01,
            springLength: 100,
            springConstant: 0.08,
            damping: 0.4,
            avoidOverlap: 0.5
          },
          stabilization: {
            enabled: true,
            iterations: 1000,
            updateInterval: 100,
            fit: true
          }
        },
        
        manipulation: {
          enabled: true,
          initiallyActive: true,
          addNode: (nodeData, callback) => addNode(nodeData, callback),
          deleteNode: (nodeData, callback) => deleteNode(nodeData, callback, setSelectedNode),
          addEdge: (nodeData, callback) => addEdge(nodeData, callback),
          deleteEdge: (edgeData, callback) => deleteEdge(edgeData, callback),
          editEdge: (edgeData, callback) => editEdge(edgeData, callback),
        },
        interaction: {
          navigationButtons: false
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

      return () => {
        if (network) {
          network.destroy();
        }
      };
    }
  }, [nodes, edges]);

  const switchType = () => {
    if (!selectedNode) return;
    const updatedNode = { ...selectedNode };
    updatedNode.color = updatedNode.color === '#7FC6A4' ? '#FFD166' : '#7FC6A4';
    setSelectedNode(updatedNode);
    networkData.nodes.update(updatedNode);
    editNode(updatedNode);
  };

  const addChild = () => {
    const tempId = uuidv4();
    const newNode = {
      id: tempId,
      label: 'Add Description',
      title: 'Child of ' + selectedNode.label,
      color: '#7FC6A4'
    };

    const newEdge = {
      from: selectedNode.id,
      to: tempId
    };

    fetch('http://localhost:8080/add-child', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        node: {
          id: null,
          networkId,
          label: 'Inactive',
          title: 'Edit node to activate',
          ...newNode
        },
        edge: {
          id: null,
          networkId,
          ...newEdge
        }
      })
    })
      .then(response => response.ok ? response.json() : Promise.reject(response.status))
      .then(data => {
        networkData.nodes.remove(tempId);
        networkData.edges.remove(newEdge.id);

        const backendNode = {
          ...newNode,
          label: 'Inactive',
          title: 'Edit node to activate',
          id: data.to.id
        };
        const backendEdge = {
          from: data.from.id,
          to: data.to.id,
          id: data.id
        };
        networkData.nodes.add(backendNode);
        networkData.edges.add(backendEdge);
        pushNode(backendNode);
      })
      .catch(error => console.error(error));
  };

  const handleEditNodeSave = (updatedNode) => {
    networkData.nodes.update(updatedNode);
    setSelectedNode(updatedNode);
    editNode(updatedNode);
  };

  return (
    <div className="relative w-full h-full">

      <NetworkEditor
        selectedNode={selectedNode}
        switchType={switchType}
        addChild={addChild}
        networkName={networkName}
        networkQuantifier={networkQuantifier}
        networkId={networkId}
        areaOfFocusNodes={nodes.filter(node => node.areaOfFocus)}
        handleEditNodeSave={handleEditNodeSave}
      />
      <div ref={networkRef} className="w-full h-full" />
    </div>
  );
};

export default VisNetwork;
