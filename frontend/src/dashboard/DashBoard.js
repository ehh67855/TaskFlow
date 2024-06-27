import React, { useEffect, useState } from 'react';
import { Button, Card, Container, Row, Col, Alert } from 'react-bootstrap';
import { getAuthToken, getLogin } from "src/services/BackendService";
import NetworkCreator from 'src/network/NetworkCreator';
import 'src/dashboard/DashBoardStyle.css'

import { GoTrash } from "react-icons/go";
import { GoPencil } from "react-icons/go";
import { GoTriangleDown } from "react-icons/go";
import { GoTriangleRight } from "react-icons/go";
import MiniNetwork from './MiniNetwork';



export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [networks, setNetworks] = useState([{}]);

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

    useEffect( () => {
        console.log(networks)
    },[networks])

    const deleteNetwork = async (id) => {
        if (confirm("Are you sure you want to delete this network? All of it contents will be lost.")) {
            try {
                await fetch(`http://localhost:8080/delete-network/${id}`, {
                    method: "POST",
                    headers: {"content-type": "application/json"}

                });
                setNetworks(networks.filter(network => network.id !== id));
            } catch (error) {
                console.error("Failed to delete network:", error);
            }
        }
    };

    if (loading) {
        return <h1>Loading...</h1>;
    }

    if (networks.length === 0) {
        return (
            <Container>
                <h1>Dashboard</h1>
                <Alert variant="info">You currently have no networks. Create one now!</Alert>
                <NetworkCreator></NetworkCreator>
            </Container>
        );
    }

    return (
        <Container>
            <h1>Dashboard</h1>
            <NetworkCreator setNetworks={setNetworks} />
            <br></br>
            <Row xs={1} md={2} lg={3} className="g-4">
                {networks.map((network, index) => (
                    <Col key= {index}>
                        <Card className='custom-card'>
                            <Card.Body>
                                <Card.Title style={{textAlign:"center"}}>{network.name}</Card.Title>
                                <MiniNetwork nodes={network.nodes} edges={network.edges} /> {/* Render mini network */}

                                <Card.Text>
                                    
                                </Card.Text>
                                <div>
                                <Button variant="danger" onClick={()=>deleteNetwork(network.id)}>
                                    <GoTrash onClick={() => deleteNetwork(network.id)}>
                                    </GoTrash>
                                </Button>
                                <Button variant="primary" style={{ marginLeft: '10px' }} href={`/network/${network.id}`}>
                                    <GoPencil variant="primary"></GoPencil>
                                </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Container>
    );
}
