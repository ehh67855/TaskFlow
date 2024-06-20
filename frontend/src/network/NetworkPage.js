import { useParams } from "react-router-dom";
import VisNetwork from "./VisNetwork";
import { useEffect, useState } from "react";
import MessageToast from "src/MessageToast/MessageToast";
import NetworkEditor from "./NetworkEditor";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Sidebar from "./SideBar";

export default function NetworkPage () {
    const { id } = useParams();

    const [loading, setLoading] = useState(true);

    const [errorShow,setErrorShow] = useState(false);
    const [errorMessage,setErrorMessage] = useState("")

    const [nodes,setNodes] = useState([]);
    const [edges,setEdge] = useState([]);

      
    useEffect(() => {
        console.log('Nodes:', nodes);
        console.log('Edges:', edges);
    }, [nodes, edges]); // Ensures that updates to nodes or edges re-run this effect
    

    useEffect(() => {
        fetch(`http://localhost:8080/get-network/${id}`, {
            method: "GET"
        }).then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // Make sure to return the promise from response.json()
        }).then(data => {
            setNodes(data.nodes);
            console.log(data); // Now 'data' will be the actual JSON response
        }).catch(error => {
            console.log(error); // Error handling remains the same
        }).finally(() => {
            setLoading(false); // Correctly use finally with a function that sets loading to false
        });
    },[])

    const addNode = (nodeData,callback) => {

        fetch(`http://localhost:8080/create-node`, {
            method: "POST",
            headers: {
                "Content-Type":"application/json"
            },
            body: JSON.stringify(nodeData)
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
        console.log("delete node data", nodeData)
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
                    ></VisNetwork>
                </Col>
                <Col>
                    <NetworkEditor></NetworkEditor>
                </Col>
            </Row>
        </Container>

        );
}