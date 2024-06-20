import React, { useState } from 'react';
import { Button, Collapse, Card } from 'react-bootstrap';

function JsonFormatExplainer() {
    const [open, setOpen] = useState(false);

    const exampleJson = JSON.stringify({
        nodes: [
            { id: 1, label: 'Node 1' },
            { id: 2, label: 'Node 2' }
        ],
        edges: [
            { from: 1, to: 2 }
        ]
    }, null, 2);

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
                        <h5>Example JSON:</h5>
                        <pre>{exampleJson}</pre>
                        <p>Make sure your JSON file adheres to this structure to ensure successful import into the visualization network.</p>
                        <small><a href="https://visjs.github.io/vis-network/docs/network/">Learn More</a></small>
                    </Card.Body>
                </div>
            </Collapse>
        </Card>
    );
}

export default JsonFormatExplainer;
