import { useParams } from "react-router-dom";
import VisNetwork from "./VisNetwork";
import { useEffect, useState } from "react";
import MessageToast from "src/MessageToast/MessageToast";
import NetworkEditor from "./NetworkEditor";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Sidebar from "./SideBar";
import { network } from "vis-network";
import { getAuthToken } from "src/services/BackendService";

export default function NetworkPage () {
    const { id } = useParams();

    const [loading, setLoading] = useState(true);

    const [errorShow,setErrorShow] = useState(false);
    const [errorMessage,setErrorMessage] = useState("")

    const [nodes,setNodes] = useState([]);
    const [edges,setEdges] = useState([]);

    useEffect(() => {
        console.log("Network Rerender");
        console.log('Nodes:', nodes);
        console.log('Edges:', edges);
    }, [nodes, edges]); // Ensures that updates to nodes or edges re-run this effect
    

    useEffect(() => {
        if(!getAuthToken()) {
            window.location.href= "/login";
        } 
        fetch(`http://localhost:8080/get-network/${id}`, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        }).then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // Make sure to return the promise from response.json()
        }).then(data => {
            setNodes(data.nodes);
            setEdges(data.edges.map(edge => ({
                id: edge.id,
                to: edge.to.id,
                from: edge.from.id
            }))); // Ensure edges are set as well
        }).catch(error => {
            console.log("get-network error", error); // Error handling remains the same
        }).finally(() => {
            setLoading(false); // Correctly use finally with a function that sets loading to false
        });
    }, [id]); // Ensure this effect runs when 'id' changes
    

    const addNode = (nodeData,callback) => {

        fetch(`http://localhost:8080/create-node`, {
            method: "POST",
            headers: {
                "Content-Type":"application/json"
            },
            body: JSON.stringify({
                ...nodeData,
                networkId: id
            })
        }).then(response => {
            if (response.ok) {
                return response.json()
            }
        }).then(data => {
            setNodes(prevNodes => [...prevNodes, data]);  // Ensure you are returning the new state
        }).catch(error => {
            console.log(error)
        }).finally(() => {
            callback(nodeData);
        })
    }

    const deleteNode = (nodeData,callback) => {
        fetch(`http://localhost:8080/delete-node`, {
            method: "POST",
            headers: {
                "Content-Type":"application/json"
            },
            body: JSON.stringify({
                id:nodeData.nodes[0]
            })
        }).then(response => {
            if (response.ok) {
                return response.json()
            }
        }).then(data => {
            setNodes(prevNodes => prevNodes.filter(node => node.id !== nodeData.id));
            console.log(data)
        }).catch(error => {
            console.log(error)
        }).finally(() => {
            callback(nodeData);
        })
    }

    const addEdge = (edgeData,callback) => {
        fetch(`http://localhost:8080/create-edge`, {
            method: "POST",
            headers: {
                "Content-Type":"application/json"
            },
            body: JSON.stringify({
                ...edgeData,
                networkId:id
            })
        }).then(response => {
            if (response.ok) {
                return response.json()
            }
        }).then(data => {
            let newEdge = {
                id:data.id,
                to:data.to.id,
                from:data.from.id
            }
            setEdges(prevEdges => [...prevEdges, newEdge]);  // Ensure you are returning the new state
            console.log("Edge data", data)
        }).catch(error => {
            console.log(error)
        }).finally(() => {
            callback(edgeData);
        })
    }

    const deleteEdge = (edgeData,callback) => {
        fetch(`http://localhost:8080/delete-edge`, {
            method: "POST",
            headers: {
                "Content-Type":"application/json"
            },
            body: JSON.stringify({
                id:edgeData.edges[0]
            })
        }).then(response => {
            if (response.ok) {
                return response.json()
            }
        }).then(data => {
            setEdges(prevNodes => prevNodes.filter(edge => edge.id !== edgeData.id));
            console.log("Edge data", data)
        }).catch(error => {
            console.log(error)
        }).finally(() => {
            callback(edgeData);
        })
    }

    const editEdge = (edgeData,callback) => {
        fetch(`http://localhost:8080/edit-edge`, {
            method: "POST",
            headers: {
                "Content-Type":"application/json"
            },
            body: JSON.stringify({
                ...edgeData,
                networkId:id
            })
        }).then(response => {
            if (response.ok) {
                return response.json()
            }
        }).then(data => {
            console.log("edit data", data)
            //setEdges
        }).catch(error => {
            console.log(error)
        }).finally(() => {
            callback(edgeData);
        })
    }

    if (loading) {
        return <h1>Loading...</h1>
    }

    return (
        <Container fluid>
            <MessageToast 
                show={errorShow}
                title={"Error logging in"}
                message={errorMessage}
                onClose={() => setErrorShow(false)}
                bg={"danger"}
            ></MessageToast>
            <Row>
                <Col xs={1}>
                    <Sidebar />
                </Col>
                <Col xs={8}>
                    <VisNetwork 
                    nodes={nodes} 
                    edges={edges}
                    addNode={addNode}
                    deleteNode={deleteNode}
                    addEdge={addEdge}
                    deleteEdge={deleteEdge}
                    editEdge={editEdge}
                    ></VisNetwork>
                </Col>
                <Col>
                    <NetworkEditor></NetworkEditor>
                </Col>
            </Row>
        </Container>

        );
}