// VisNetwork.js
import React, { useEffect, useRef } from 'react';
import { Network, DataSet } from 'vis-network/standalone/esm/vis-network';
import { Card, Button } from 'react-bootstrap';
import NodeEditor from './NodeEditor';

const VisNetwork = ({
  nodes,
  edges,
  addNode,
  deleteNode,
  addEdge,
  deleteEdge,
  editEdge,
}) => {
  const networkRef = useRef(null);

  useEffect(() => {
    if (networkRef.current) {
      // Define the data for the network
      const nodesDataSet = new DataSet(nodes);
      const edgesDataSet = new DataSet(edges);
      const data = {
        nodes: nodesDataSet,
        edges: edgesDataSet,
      };

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

      // Clean up function to destroy network on component unmount
      return () => {
        if (network) {
          network.destroy();
        }
      };
    }
  }, [nodes, edges]); // Rerun effect if nodes or edges change

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        ref={networkRef}
        style={{ width: '100%', height: '90%' }}
      />
      <Card style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        width: '300px',
        zIndex: 10,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <Card.Body>
          <Card.Title>Control Panel</Card.Title>
          <Button variant="primary" onClick={() => alert('Button clicked!')}>
            Button 1
          </Button>
          <Button variant="secondary" onClick={() => alert('Button 2 clicked!')} style={{ marginLeft: '10px' }}>
            Button 2
          </Button>
          <NodeEditor></NodeEditor>
        </Card.Body>
      </Card>
    </div>
  );
};

export default VisNetwork;
