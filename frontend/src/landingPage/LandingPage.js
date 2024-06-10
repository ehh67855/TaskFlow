import React from 'react';
import { Button, Container, Row, Col } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import landingPageImage from './LandingPageImage.png'; // Import the image

export default function LandingPage() {
    return (
        <div>
            <div style={{
                top:3,
                backgroundImage: `url(${landingPageImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                color: 'white'
            }}>
                {/* Overlay */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Adjust opacity here
                    zIndex: 1
                }}></div>

                {/* Text content with higher z-index */}
                <Container className="py-5 text-center" style={{position: 'relative', zIndex: 2}}>
                    <h1>Welcome to TaskGrapher!</h1>
                    <p style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}>  {/* Increase text shadow for better readability */}
                        Visualize and manage your tasks with our advanced graph-based interface.
                        See the connections and dependencies between tasks, helping you prioritize and
                        efficiently manage your workload.
                    </p>
                    <Button variant="primary" href="/get-started">Get Started</Button>
                </Container>
            </div>
            <Container className="my-4">
                <Row>
                    <Col md={4} sm={12} className="text-center">
                        <h2>Interactive Graphs</h2>
                        <p>
                            Drag and drop to create and rearrange tasks. Zoom in and out to view details or the big picture.
                        </p>
                    </Col>
                    <Col md={4} sm={12} className="text-center">
                        <h2>Task Prioritization</h2>
                        <p>
                            Understand critical paths and dependencies to prioritize tasks effectively.
                        </p>
                    </Col>
                    <Col md={4} sm={12} className="text-center">
                        <h2>Efficiency Tracking</h2>
                        <p>
                            Monitor your progress and adjust your strategies with real-time feedback from the graph.
                        </p>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
