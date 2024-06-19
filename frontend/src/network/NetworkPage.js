import { useParams } from "react-router-dom";
import VisNetwork from "./VisNetwork";
import { useEffect, useState } from "react";
import MessageToast from "src/MessageToast/MessageToast";
import NetworkEditor from "./NetworkEditor";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

export default function NetworkPage () {
    const { id } = useParams();

    const [loading, setLoading] = useState(true);

    const [errorShow,setErrorShow] = useState(false);
    const [errorMessage,setErrorMessage] = useState("")




    useEffect(() => {
        fetch(`http://localhost:8080/get-network/${id}`, {
            method: "GET"
        }).then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // Make sure to return the promise from response.json()
        }).then(data => {
            console.log(data); // Now 'data' will be the actual JSON response
        }).catch(error => {
            console.log(error); // Error handling remains the same
        }).finally(() => {
            setLoading(false); // Correctly use finally with a function that sets loading to false
        });
    },[])
    
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
                <Col xs={8}>
                    <VisNetwork></VisNetwork>
                </Col>
                <Col>
                    <NetworkEditor></NetworkEditor>
                </Col>
            </Row>
        </Container>

        );
}