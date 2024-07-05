import React, { useEffect, useState } from 'react';
import { Container, Form, Button, Modal } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import StarRatings from 'react-star-ratings';

const NodeEditor = ({ show, handleClose, selectedNode, networkId }) => {
  const sampleMarkdown = "# Title\n## Enter your description\n```\n1. List Item 1\n2. List Item 2\n```";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState(sampleMarkdown);
  const [isEditing, setIsEditing] = useState(true);
  const [priorityRating, setPriorityRating] = useState(1);
  const [difficultyRating, setDifficultyRating] = useState(1);
  const [estimatedMinutes, setEstimatedMinutes] = useState(0);
  const [estimatedSeconds, setEstimatedSeconds] = useState(0);
  const [isAreaOfFocus, setIsAreaOfFocus] = useState("");

  const parseISODuration = (duration) => {

    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = duration.match(regex);

    return {
      hours: parseInt(matches[1] || 0),
      minutes: parseInt(matches[2] || 0),
      seconds: parseInt(matches[3] || 0)
    };
  };

  useEffect(() => {
    if (selectedNode) {
      setTitle(selectedNode.title || "");
      setDescription(selectedNode.description || sampleMarkdown);
      setPriorityRating(selectedNode.priority || 1);
      setDifficultyRating(selectedNode.difficulty || 1);
      setIsAreaOfFocus(selectedNode.areaOfFocus);

      const durationString = selectedNode.estimatedTime;
      if (durationString) {
        const duration = parseISODuration(durationString);
        setEstimatedMinutes(duration.minutes);
        setEstimatedSeconds(duration.seconds);
      } else {
        setEstimatedMinutes("");
        setEstimatedSeconds("");
      }

    } else {
      setTitle("");
      setDescription(sampleMarkdown);
      setPriorityRating(1);
      setDifficultyRating(1);
      setIsAreaOfFocus(false);
      setEstimatedMinutes("");
      setEstimatedSeconds("");
    }
  }, [selectedNode]);

  const handleTitleChange = (e) => setTitle(e.target.value);
  const handleDescriptionChange = ({ html, text }) => setDescription(text);
  const handleEstimatedMinutesChange = (e) => setEstimatedMinutes(e.target.value);
  const handleEstimatedSecondsChange = (e) => setEstimatedSeconds(e.target.value);
  const handleEditToggle = () => setIsEditing(!isEditing);
  const checkHandler = () => {
    setIsAreaOfFocus(!isAreaOfFocus)
  }

  const handleSubmit = (e) => {
    const totalEstimatedTime = (parseInt(estimatedMinutes) * 60) + parseInt(estimatedSeconds);
    fetch(`http://localhost:8080/update-node`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: selectedNode.id,
        title: title,
        priority: priorityRating,
        difficulty: difficultyRating,
        estimatedTime: totalEstimatedTime,
        isAreaOfFocus: isAreaOfFocus,
        description: description,
        networkId: networkId
      }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error(response.status);
      })
      .then((data) => {
        console.log('update data', data);
      })
      .catch((error) => {
        console.log(error);
      });



    onClose();
  };

  const onClose = () => {
    handleClose(); // Close the modal after submit
    setIsEditing(true);
  }

  return (
    <Modal show={show} onHide={onClose} size="lg">
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
            <hr />
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
            <hr />
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
            <br />
            <Form.Group className="mb-3" controlId="formBasicCheckbox">
              <Form.Check
                type="checkbox"
                label="Area of Focus"
                checked={isAreaOfFocus}
                onChange={checkHandler}
                />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formcheckTIme" type="time">
             
            </Form.Group>
            <hr />
            <Form.Group controlId="formDescription">
              <Form.Label>Description </Form.Label>
              <br />
              <small>(Markdown Editor)</small>
              <MdEditor
                value={description}
                style={{ height: '200px' }}
                renderHTML={(text) => <ReactMarkdown>{text}</ReactMarkdown>}
                onChange={handleDescriptionChange}
              />
            </Form.Group>
            <br />
            <Button variant="primary" type="submit">
              Save
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
