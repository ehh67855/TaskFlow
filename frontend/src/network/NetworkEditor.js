import React, { useState } from "react";
import { Card, Button } from "react-bootstrap";
import { Dash, DistributeVertical, GraphDownArrow } from "react-bootstrap-icons";
import Draggable from "react-draggable";
import CustomModal from "src/customModal/CustomModal";
import NodeEditor from "./NodeEditor";
import ReactMarkdown from 'react-markdown';
import StarRatings from 'react-star-ratings';
import GenerateListButton from "./GenerateListButton";

export default function NetworkEditor({ selectedNode, addChild, switchType, networkName, networkQuantifier, networkId, areaOfFocusNodes}) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [modalShow, setModalShow] = useState(false);

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleEditNodeShow = () => {
    setModalShow(true);
  }

  const parseISODuration = (duration) => {
    if (!duration) {
      return { hours: 0, minutes: 0, seconds: 0 };
    }

    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = duration.match(regex);

    return {
      hours: parseInt(matches[1] || 0),
      minutes: parseInt(matches[2] || 0),
      seconds: parseInt(matches[3] || 0)
    };
  };

  const renderBody = () => {
    console.log(selectedNode); // Debugging log

    if (!selectedNode) {
      return (
        <div> 
          <p><strong>Network Name:</strong> {networkName}</p>
          {networkQuantifier ?   
          <p><strong>Network Quantifier:</strong> {networkQuantifier}</p>
          :
          <p><strong>Network Quantifier:</strong> Default</p>
          }
          <GenerateListButton networkId={networkId} areaOfFocusNodes={areaOfFocusNodes}></GenerateListButton>
          </div>
        );
    }

    return (
      <div>
        <h3>{selectedNode.title}</h3>
        {selectedNode.areaOfFocus && <h5>(Area of Focus)</h5>}
        <div            
          style={{
                maxHeight: "250px", // Use camelCase for CSS properties
                overflowY: "auto"   // Use camelCase for CSS properties
            }}
          >
        <ReactMarkdown>{selectedNode.description}</ReactMarkdown>    
        </div>
        {selectedNode.color !== "#808080" && (
        <>
          <strong>Estimated Time:</strong> {parseISODuration(selectedNode.estimatedAmountOfTime).minutes} min {parseISODuration(selectedNode.estimatedAmountOfTime).seconds} sec
          <br />
          <strong>Number of times practiced: </strong> {selectedNode.numberOfTimesPracticed}
          <br />
          <strong>Average (quantifier): </strong> {selectedNode.average}
          <br />
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <p style={{ margin: '5px 10px 0px 0px' }}>Priority </p>
            <StarRatings
              rating={selectedNode.priority}
              starRatedColor="grey"
              numberOfStars={5}
              name="rating"
              starDimension="20px"
              starSpacing="2px"
              starHoverColor="gold"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <p style={{ margin: '5px 10px 0px 0px' }}>Difficulty </p>
            <StarRatings
              rating={selectedNode.difficulty}
              starRatedColor="grey"
              numberOfStars={5}
              name="rating"
              starDimension="20px"
              starSpacing="2px"
              starHoverColor="gold"
            />
          </div>
        </>
      )}

        <Card.Footer className="d-flex justify-content-between">
          {selectedNode.color !== "#808080" && <Button variant="primary" size="sm" onClick={handleEditNodeShow}>Edit</Button>}

          {selectedNode.color !== "#808080" && (selectedNode.color === "#FFD166" ?  
            <Button variant="secondary" size="sm" onClick={switchType}>Make Action</Button>
          :
            <Button variant="secondary" size="sm" onClick={switchType}>Make Category</Button>
          )}
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
