
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
        edges: {
          smooth: {
            type: 'dynamic',
          },
          arrows: {
            to: true
          }
        },
        layout: {
          improvedLayout: true,
        },
        physics: {
          enabled: true,
          solver: 'barnesHut',
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
