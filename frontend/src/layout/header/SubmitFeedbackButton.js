import { useState } from "react";
import { Dropdown, Form, Button } from "react-bootstrap";
import MessageToast from "src/MessageToast/MessageToast";
import { getLogin, isAuthenticated } from "src/services/BackendService";

export default function SubmitFeedbackButton() {
    const [feedback, setFeedback] = useState('');
    const [submitted,setSubmitted] = useState(false);

    const [errorTitle,setErrorTitle] = useState('');
    const [errorShow,setErrorShow] = useState(false);
    const [errorMessage,setErrorMessage] = useState('');
    const [errorBg,setErrorBg] = useState('');

    const handleFeedbackChange = (event) => {
        setFeedback(event.target.value);
    };

    const resetSubmited = (event) => {
        event.preventDefault();
        setSubmitted(false);
    }

    const submitFeedback = (event) => {
        event.preventDefault();
        fetch(`http://localhost:8080/feedback`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                feedback:feedback
            })
        }).then(response => {
            setSubmitted(true);
            if (response.status === 201) {
                return response.json();
            } else {
                setErrorTitle("")
                console.log(response);
                return null;
            }
        }).then(data => {
            if (data !== null) {
                
            }
        });

        setFeedback('');  
    };
    
    return (
    <Dropdown className="mx-2 my-1">
        <MessageToast
            show={errorShow}
            title={errorTitle}
            message={errorMessage}
            onClose={() => setErrorShow(false)}
            bg={errorBg}
        ></MessageToast>       

      <Dropdown.Toggle variant="success" id="dropdown-basic">
                Submit Feedback
            </Dropdown.Toggle>

            <Dropdown.Menu>
                {submitted ? 
                <div className="px-3 py-2">
                    <p className="text-center"> <strong>Thank you!</strong> <br></br> Your feedback has been submitted</p>
                    <Button variant="secondary" onClick={resetSubmited}>Submit again</Button>
                </div>
                :
                <Form onSubmit={submitFeedback} className="px-3 py-2">
                    <Form.Group>
                        <Form.Label>Feedback</Form.Label>
                        <Form.Control as="textarea" rows={3} value={feedback} onChange={handleFeedbackChange} required />
                    </Form.Group>
                    <br></br>
                    <Button variant="success" type="submit">Submit</Button>
                </Form>}
            </Dropdown.Menu>
        </Dropdown>    
    );
}