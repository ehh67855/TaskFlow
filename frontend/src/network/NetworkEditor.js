import React, { useState } from "react";
import { Card, Button } from "react-bootstrap";
import { Dash, DistributeVertical, GraphDownArrow } from "react-bootstrap-icons";
import Draggable from "react-draggable";
import CustomModal from "src/customModal/CustomModal";
import NodeEditor from "./NodeEditor";

export default function NetworkEditor({ selectedNode, addChild, switchType, networkName, networkQuantifier, networkId}) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [modalShow, setModalShow] = useState(false);

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleEditNodeShow = () => {
    setModalShow(true);
  }

  const renderBody = () => {
    console.log(selectedNode); // Debugging log

    if (!selectedNode) {
      return (
        <div> 
          <p><strong>Network Name:</strong> {networkName}</p>
          {networkQuantifier ?   
          <p><strong>Network Name:</strong> {networkName}</p>
          :
          <p><strong>Network Quantifier:</strong> Default</p>
          }
          <Button>Generate List</Button>
        </div>
        );
    }

    return (
      <div>
        <h5>Node Details</h5>
        <p><strong>Title:</strong> {selectedNode.label}</p>
        <p><strong>Description:</strong> {selectedNode.title}</p>
        <Card.Footer className="d-flex justify-content-between">
          <Button variant="primary" size="sm" onClick={handleEditNodeShow}>Edit</Button>
          {selectedNode.color === "#FFD166" ?  
            <Button variant="secondary" size="sm" onClick={switchType}>Make Action</Button>
          :
            <Button variant="secondary" size="sm" onClick={switchType}>Make Category</Button>
          }
          <Button variant="success" size="sm" onClick={addChild}>Add Child</Button>
        </Card.Footer>
      </div>
    );
  };

  const handleModalClose = () => setModalShow(false);

  return (
    <>
    <NodeEditor networkId={networkId} show={modalShow} handleClose={handleModalClose} selectedNode={selectedNode}/>

    <Draggable>

      <Card style={{
        position: 'absolute',
        top: '30px',
        right: '10px',
        width: '300px',
        zIndex: 10,
        backgroundColor: 'lightgrey',
        border: '1px solid #ccc',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
      }}>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <Card.Title style={{ margin: 0 }}>Control Panel</Card.Title>
          <Button variant="link" size="sm" onClick={handleMinimize} style={{ textDecoration: 'none' }}>
            {isMinimized ? <Dash style={{ fontSize: '24px' }}/> : <DistributeVertical style={{ fontSize: '20px' }}/>}
          </Button>
        </Card.Header>
        {!isMinimized && (
          <Card.Body>
            {renderBody()}
          </Card.Body>
        )}
      </Card>
    </Draggable>
    </>
  );
}
