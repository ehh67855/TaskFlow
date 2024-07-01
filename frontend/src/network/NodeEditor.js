import React, { useEffect, useState } from 'react';
import { Container, Form, Button, Modal } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import StarRatings from 'react-star-ratings';

const NodeEditor = ({ show, handleClose, selectedNode, networkId}) => {
  const [title, setTitle] = useState(selectedNode ? selectedNode.title : "");
  const sampleMarkdown = "# Title\n## Enter your description\n```\n1. List Item 1\n2. List Item 2\n```";
  const [description, setDescription] = useState(selectedNode && selectedNode.description ? selectedNode.description : sampleMarkdown);
  const [isEditing, setIsEditing] = useState(true);
  const [priorityRating, setPriorityRating] = useState(1);
  const [difficultyRating, setDifficultyRating] = useState(1);
  const [estimatedMinutes, setEstimatedMinutes] = useState(selectedNode ? Math.floor(selectedNode.estimatedTime / 60) : "");
  const [estimatedSeconds, setEstimatedSeconds] = useState(selectedNode ? selectedNode.estimatedTime % 60 : "");

  const handleTitleChange = (e) => setTitle(e.target.value);
  const handleDescriptionChange = ({ html, text }) => setDescription(text);
  const handleEstimatedMinutesChange = (e) => setEstimatedMinutes(e.target.value);
  const handleEstimatedSecondsChange = (e) => setEstimatedSeconds(e.target.value);

  const handleEditToggle = () => setIsEditing(!isEditing);

  const handleSubmit = (e) => {
    e.preventDefault();
    const totalEstimatedTime = (parseInt(estimatedMinutes) * 60) + parseInt(estimatedSeconds);
    // Submit the data to the backend
    fetch(`http://localhost:8080/update-node`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id:selectedNode.id,
        title:title,
        priority:priorityRating,
        difficulty:difficultyRating,
        estimatedTime:totalEstimatedTime,
        networkId:networkId
      }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error(response.status)
      })
      .then((data) => {
        console.log('update data', data);
        // setEdges
      })
      .catch((error) => {
        console.log(error);
      });


    handleClose(); // Close the modal after submit
  };

  useEffect(() => console.log(selectedNode), [selectedNode])

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Edit Node</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isEditing ? (
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="formTitle">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter title"
                value={title}
                onChange={handleTitleChange}
              />
            </Form.Group>
            <hr></hr>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
              <p style={{ margin: '5px 10px 0px 0px' }}>Priority </p>
              <StarRatings
                rating={priorityRating}
                starRatedColor="gold"
                changeRating={setPriorityRating}
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
                rating={difficultyRating}
                starRatedColor="gold"
                changeRating={setDifficultyRating}
                numberOfStars={5}
                name="rating"
                starDimension="20px"
                starSpacing="2px"
                starHoverColor="gold"
              />
            </div>
            <hr></hr>

            <Form.Group controlId="formEstimatedTime">
              <Form.Label>Estimated Time</Form.Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Form.Control
                    type="number"
                    placeholder="M"
                    value={estimatedMinutes}
                    onChange={handleEstimatedMinutesChange}
                    min="0"
                    style={{ width: '60px', marginRight: '5px' }}
                  />
                  <span>:</span>
                  <Form.Control
                    type="number"
                    placeholder="S"
                    value={estimatedSeconds}
                    onChange={handleEstimatedSecondsChange}
                    min="0"
                    max="59"
                    style={{ width: '60px', marginLeft: '5px' }}
                  />
                </div>
              </div>
            </Form.Group>
            <br></br>
            <Form.Group className="mb-3" controlId="formBasicCheckbox">
              <Form.Check type="checkbox" label="Area of Focus" />
            </Form.Group>

            <hr></hr>

            <Form.Group controlId="formDescription">
              <Form.Label>Description </Form.Label> <br></br>
              <small>(Markdown Editor)</small>
              <MdEditor
                value={description}
                style={{ height: '200px' }}
                renderHTML={(text) => <ReactMarkdown>{text}</ReactMarkdown>}
                onChange={handleDescriptionChange}
              />
            </Form.Group>
            <br></br>
            <Button variant="primary" type="submit">
              Submit
            </Button>
            <Button variant="secondary" onClick={handleEditToggle} style={{ marginLeft: '10px' }}>
              View
            </Button>

          </Form>
        ) : (
          <div>
            <h3>{title}</h3>
            <ReactMarkdown>{description}</ReactMarkdown>
            <Button variant="secondary" onClick={handleEditToggle}>
              Edit
            </Button>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default NodeEditor;
