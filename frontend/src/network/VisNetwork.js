import React, { useEffect, useRef, useState } from 'react';
import { Network, DataSet } from 'vis-network/standalone/esm/vis-network';
import { Card, Button } from 'react-bootstrap';
import NodeEditor from './NodeEditor';
import NetworkEditor from './NetworkEditor';
import { v4 as uuidv4 } from 'uuid';


var networkData;
var visNetwork;

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
  networkQuantifier
}) => {
  const networkRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [modalShow, setModalShow] = useState(null);

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
          arrows: {
            to:true
          }
        },
        layout: {
          improvedLayout: true,
          randomSeed: undefined
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
          }
        },
        interaction: {
          keyboard: true,
          navigationButtons: true,
        },
      };

      // Initialize network
      const network = new Network(networkRef.current, data, options);
      visNetwork = network;

      network.on("selectNode", function (params) {
        setSelectedNode(data.nodes.get(params.nodes[0]));
      });

      network.on("deselectNode", function () {
        setSelectedNode(null);
      });

      network.on("selectEdge", function (params) {
        console.log(params)
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


const addChild = () => {
  
    // Generate a temporary ID
    let tempId = uuidv4();
    
    // Create a new node
    let newNode = {
        id: tempId,
        label: "Add Description",
        title: "Child of " + selectedNode.label,
        color: "#7FC6A4"
    };

    // Create an edge connecting the selected node to the new node
    let newEdge = {
        from: selectedNode.id,
        to: tempId
    };

    // Send the new node and edge to the server
    fetch("http://localhost:8080/add-child", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            node: {
              id: null,
              networkId: networkId,
              ...newNode
            },
            edge: {
              id: null,
              networkId: networkId,
              ...newEdge
            }
        })
    }).then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error(response.status);
    }).then(data => {
        console.log(data);
        
        // Remove the temporary node and edge
        networkData.nodes.remove(tempId);
        networkData.edges.remove(newEdge.id);

        // Add the node and edge with the new ID from the backend
        let backendNode = {
            ...newNode,
            id: data.to.id
        };
        let backendEdge = {
            from: data.from.id,
            to: data.to.id,
            id:data.id
        };
        networkData.nodes.add(backendNode);
        networkData.edges.add(backendEdge);
    }).catch(error => {
        console.log(error);
    });

    // Optional: Focus on the new node in the network
    // visNetwork.focus(tempId, {
    //     scale: 1.2,
    //     animation: {
    //         duration: 300,
    //         easingFunction: "easeInOutQuad"
    //     }
    // });
};

const handleModalClose = () => {
  setModalShow(false)
}


  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        ref={networkRef}
        style={{ width: '100%', height: '100%' }}
      />
      {/* <NodeEditor networkId={networkId} show={modalShow} handleClose={handleModalClose} selectedNode={selectedNode}/> */}
      <NetworkEditor 
      selectedNode={selectedNode} 
      switchType={switchType} 
      addChild={addChild}
      networkName={networkName}
      networkId={networkId}
      areaOfFocusNodes={nodes.filter(node => node.areaOfFocus)}
      ></NetworkEditor>

    </div>
  );
};

export default VisNetwork;
