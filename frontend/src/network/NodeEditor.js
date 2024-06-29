// App.js
import React, { useState } from 'react';
import { Container, Form, Button } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const NodeEditor = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isEditing, setIsEditing] = useState(true);

  const handleTitleChange = (e) => setTitle(e.target.value);
  const handleDescriptionChange = ({ html, text }) => setDescription(text);

  const handleEditToggle = () => setIsEditing(!isEditing);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Submit the data to the backend
    console.log({ title, description });
  };

  return (
    <Container>
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
          <Form.Group controlId="formDescription">
            <Form.Label>Description</Form.Label>
            <MdEditor
              value={description}
              style={{ height: '200px' }}
              renderHTML={(text) => <ReactMarkdown>{text}</ReactMarkdown>}
              onChange={handleDescriptionChange}
            />
          </Form.Group>
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
    </Container>
  );
};

export default NodeEditor;
