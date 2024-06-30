import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';

const SessionTimeout = () => {

    const handleLogin = () => {
        window.location.href = "/login"
    };

    const handleHome = () => {
        window.location.href  = "/";
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
            <Row>
                <Col>
                    <h1 className="text-center">Session Timed Out</h1>
                    <p className="text-center">Your session has expired. Please log in again to continue.</p>
                    <div className="text-center">
                        <Button variant="primary" onClick={handleLogin} className="mx-2">
                            Log In
                        </Button>
                        <Button variant="secondary" onClick={handleHome} className="mx-2">
                            Home
                        </Button>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default SessionTimeout;
