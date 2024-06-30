import { Card, Button } from "react-bootstrap";
import Draggable from "react-draggable";

export default function NetworkEditor({ selectedNode, addChild, switchType }) {
  const renderBody = () => {
    console.log(selectedNode); // Debugging log

    if (!selectedNode) {
      return <h1>No Node selected</h1>;
    }

    return (
      <div>
        <h5>Node Details</h5>
        <p><strong>Title:</strong> {selectedNode.label}</p>
        <p><strong>Description:</strong> {selectedNode.title}</p>
        <Card.Footer className="d-flex justify-content-between">
          <Button variant="primary" size="sm">Edit</Button>
          {selectedNode.color == "#FFD166" ?  
          <Button variant="secondary" size="sm" onClick={switchType}>Make Action</Button>
          :
          <Button variant="secondary" size="sm" onClick={switchType}>Make Category</Button>
          }
          <Button variant="success" size="sm" onClick={addChild}>Add Child</Button>

        </Card.Footer>
      </div>
    );
  };


  return (
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
        <Card.Body>
          <Card.Title>Control Panel</Card.Title>
          <hr />
          {renderBody()}
        </Card.Body>

      </Card>
    </Draggable>
  );
}
