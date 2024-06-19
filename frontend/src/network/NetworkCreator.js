import React, { useState } from 'react';
import { Button, Form, OverlayTrigger, Tooltip } from 'react-bootstrap';
import CustomModal from 'src/customModal/CustomModal';
import VisNetwork from './VisNetwork';
import { getAuthToken, getLogin } from 'src/services/BackendService';
import MessageToast from 'src/MessageToast/MessageToast';

import PropTypes from 'prop-types';

NetworkCreator.propTypes = {
    setNetworks: PropTypes.func.isRequired,
};

NetworkCreator.defaultProps = {
    setNetworks: () => window.location.reload()
};

export default function NetworkCreator({setNetworks}) {
    const [modalShow, setModalShow] = useState(false);
    const [errorShow, setErrorShow] = useState(false);
    const [errorMessage,setErrorMessage] = useState("")

    const [formData, setFormData] = useState({
        name: "",
      });
    
      const handleFormChange = (e) => {
        const {name,value} = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
      };
    

      const handleModalSave = async () => {
        const requestData = {
            login: getLogin(getAuthToken()),
            name: formData.name
        };
    
        console.log('Request payload:', JSON.stringify(requestData));
    
        try {
            const response = await fetch("http://localhost:8080/create-network", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestData)
            });
    
            if (response.ok) {
                const data = await response.json();  // Assumption: server always returns JSON on success
                console.log("create-network data: ", data);
                setModalShow(false);  // Hides the modal upon successful operation
                setNetworks(prevNetworks => [...prevNetworks,data]);
            } else if (response.status === 409) {
                setModalShow(false);
                setErrorMessage("Network name already in use");
                setErrorShow(true);  // Show the error message properly (no quotes)
            } else {
                // Handle other HTTP errors
                throw new Error('Network response was not ok.');
            }
        } catch (error) {
            console.error('Error:', error);
            setErrorMessage("An unexpected error occurred");  // Display a generic error message to the user
            setErrorShow(true);
        }
    };
    

    const handleModalClose = () => {
        setModalShow(false);
    }

    // Helper function to render tooltips
    const renderTooltip = (props) => (
        <Tooltip id="button-tooltip" {...props}>
            The progress quantifier is the metric you will use to measure how far along your skill has developed. 
        </Tooltip>
    );

    return (
        <div>
            <MessageToast 
                show={errorShow}
                title={"Could not create network"}
                message={errorMessage}
                onClose={() => setErrorShow(false)}
                bg={"danger"}
            ></MessageToast>

            <Button variant="primary" onClick={() => setModalShow(true)}>
                Create Network
            </Button>
            <CustomModal
                show={modalShow}
                handleClose={handleModalClose}
                onSave={handleModalSave}
                title="New Network"
                value={formData.name}
                saveText="Create"
            >
                <Form>
                    <Form.Group controlId="formNetworkName" required>
                        <Form.Label>Name</Form.Label>
                        <Form.Control 
                            required
                            type="text" 
                            placeholder="Enter the name of your network" 
                            name="name"
                            onChange={e => handleFormChange(e)}
                             />
                            
                    </Form.Group>
                    <br></br>
                    <Form.Group controlId="formProgressQuantifier">
                        <Form.Label>Import Network 
                            <OverlayTrigger
                                placement="right"
                                delay={{ show: 250, hide: 400 }}
                                overlay={renderTooltip}
                            >
                                <Button variant="outline-secondary" style={{ padding: '0 5px', marginLeft: '5px' }}>
                                    ?
                                </Button>
                            </OverlayTrigger>
                        </Form.Label>
                        <Form.Control type="file" size="sm" />

                    </Form.Group>
                </Form>
            </CustomModal>
            
        </div>
    );
}
