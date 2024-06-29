import React, { useEffect, useRef, useState } from 'react';
import { Network, DataSet } from 'vis-network/standalone/esm/vis-network';
import { Card, Button } from 'react-bootstrap';
import NodeEditor from './NodeEditor';
import NetworkEditor from './NetworkEditor';

var networkData;

const VisNetwork = ({
  nodes,
  edges,
  addNode,
  deleteNode,
  addEdge,
  deleteEdge,
  editEdge,
  editNode,
}) => {
  const networkRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    if (networkRef.current) {
      // Define the data for the network
      const nodesDataSet = new DataSet(nodes);
      const edgesDataSet = new DataSet(edges);
      const data = {
        nodes: nodesDataSet,
        edges: edgesDataSet,
      };
      networkData = data;

      // Create network options
      const options = {
        autoResize: false,
        clickToUse: false,
        edges: {
          smooth: {
            type: 'dynamic',
          },
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
          addNode: function (nodeData, callback) {
            addNode(nodeData, callback);
          },
          deleteNode: function (nodeData, callback) {
            deleteNode(nodeData, callback);
          },
          addEdge: function (nodeData, callback) {
            addEdge(nodeData, callback);
          },
          deleteEdge: function (edgeData, callback) {
            deleteEdge(edgeData, callback);
          },
          editEdge: function (edgeData, callback) {
            editEdge(edgeData, callback);
          },
        },
        interaction: {
          keyboard: true,
          navigationButtons: true,
        },
      };

      // Initialize network
      const network = new Network(networkRef.current, data, options);

      network.on("selectNode", function (params) {
        setSelectedNode(data.nodes.get(params.nodes[0]));
      });

      network.on("deselectNode", function () {
        setSelectedNode(null);
      });

      // Clean up function to destroy network on component unmount
      return () => {
        if (network) {
          network.destroy();
        }
      };
    }
  }, [nodes, edges]); // Rerun effect if nodes or edges change

  const switchType = () => {
    if (!selectedNode) return;

    let updatedNode = { ...selectedNode };
    if (updatedNode.color === "#7FC6A4") {
      updatedNode.color = "#FFD166";
    } else if (updatedNode.color === "#FFD166") {
      updatedNode.color = "#7FC6A4";
    }

    setSelectedNode(updatedNode);

    networkData.nodes.update(updatedNode);
    editNode(updatedNode);
  };


  const addChild = (selectedNode) => {

  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        ref={networkRef}
        style={{ width: '100%', height: '90%' }}
      />
      <NetworkEditor selectedNode={selectedNode} switchType={switchType} addChild={addChild}></NetworkEditor>
    </div>
  );
};

export default VisNetwork;
