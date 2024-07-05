import React, { useState } from 'react';
import { Button, Collapse, Card } from 'react-bootstrap';

function JsonFormatExplainer() {
    const [open, setOpen] = useState(false);

    return (
        <Card className>
            <Card.Header>
                <p>Expected File Format for Importing Your Network</p>
                <Button
                    onClick={() => setOpen(!open)}
                    aria-controls="example-json-collapse-text"
                    aria-expanded={open}
                    variant="info"
                >
                    {open ? 'Hide Details' : 'Show Details'}
                </Button>
            </Card.Header>
            <Collapse in={open}>
                <div id="example-json-collapse-text" className="p-3">
                    <Card.Body>
                        
                        <h5>JSON Structure:</h5>
                        <p>The JSON file must contain two main sections: <strong>nodes</strong> and <strong>edges</strong>. Each node should have at least an <code>id</code> and a <code>label</code>, and each edge should specify <code>from</code> and <code>to</code> properties indicating the node IDs they connect.</p>
                        <Button variant="primary">Sample File</Button>
                        <br></br>
                        <br></br> 
                        <small><a href="https://visjs.github.io/vis-network/docs/network/">Learn More</a></small>
                    </Card.Body>
                </div>
            </Collapse>
        </Card>
    );
}

export default JsonFormatExplainer;
