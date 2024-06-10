import React, { useEffect, useState } from 'react';
import { Button, Card, Container, Row, Col, Alert } from 'react-bootstrap';
import { getAuthToken, getLogin } from "src/services/BackendService";
import NetworkCreator from 'src/network/NetworkCreator';

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [networks, setNetworks] = useState([]);

    const fetchUserData = async () => {
        try {
            const login = getLogin(getAuthToken());
            const response = await fetch(`http://localhost:8080/getUserNetworksByLogin/${login}`, {
                method: "GET"
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setNetworks(data);
        } catch (error) {
            console.error("Failed to fetch user networks:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    const deleteNetwork = async (networkId) => {
        try {
            await fetch(`http://localhost:8080/deleteNetwork/${networkId}`, {
                method: "DELETE"
            });
            setNetworks(networks.filter(network => network.id !== networkId));
        } catch (error) {
            console.error("Failed to delete network:", error);
        }
    };

    if (loading) {
        return <h1>Loading...</h1>;
    }

    if (networks.length === 0) {
        return (
            <Container>
                <h1>Dashboard</h1>
                <Alert variant="info">You haven't created any networks yet. Create your first one now!</Alert>
                <NetworkCreator></NetworkCreator>
            </Container>
        );
    }

    return (
        <Container>
            <h1>Dashboard</h1>
            <NetworkCreator></NetworkCreator>
            <Row xs={1} md={2} lg={3} className="g-4">
                {networks.map(network => (
                    <Col key={network.id}>
                        <Card>
                            <Card.Body>
                                <Card.Title>Network {network.id}</Card.Title>
                                <Card.Text>
                                    Data: {network.networkData}
                                </Card.Text>
                                <Button variant="danger" onClick={() => deleteNetwork(network.id)}>
                                    Delete
                                </Button>
                                <Button variant="primary" style={{ marginLeft: '10px' }} href={`/network/${network.id}`}>
                                    Go to Network
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Container>
    );
}
