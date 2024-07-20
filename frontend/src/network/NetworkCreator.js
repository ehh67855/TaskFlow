import React, { useState } from 'react';
import { Button, Form, OverlayTrigger, Tooltip } from 'react-bootstrap';
import CustomModal from 'src/customModal/CustomModal';
import VisNetwork from './VisNetwork';
import { getAuthToken, getLogin } from 'src/services/BackendService';
import MessageToast from 'src/MessageToast/MessageToast';
import PropTypes from 'prop-types';
import JsonFormatExplainer from './JsonFormatExplainer';


export default function NetworkCreator({ setNetworks = () => window.location.reload() }) {
    const [modalShow, setModalShow] = useState(false);
    const [errorShow, setErrorShow] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        quantifier: "",
    });
    const [uploadedFile, setUploadedFile] = useState(null);
    const [importedData, setImportedData] = useState({ nodes: [], edges: [] });

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = JSON.parse(e.target.result);
                setImportedData(data);
            };
            reader.readAsText(file);
        }
    };

    const handleModalSave = async () => {
        if (!formData.name.trim()) {
            setErrorMessage("Network name is required");
            setErrorShow(true);
            setModalShow(false);
            return;
        }

        setModalShow(false);
        
        const requestData = {
            login: getLogin(getAuthToken()),
            name: formData.name,
            quantifier: formData.quantifier,
            nodes: importedData.nodes,
            edges: importedData.edges
        };

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
                setNetworks(prevNetworks => [...prevNetworks, data]);
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
            A Custom Quantifier is a specific metric you choose to track and improve your progress.
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
                            value={formData.name}
                            onChange={e => handleFormChange(e)}
                        />
                    </Form.Group>
                    <br></br>
                    <Form.Group controlId="formCustomQuantifier" required>
                        <Form.Label>Custom Quantifier <small>(Recommended)</small>
                        <OverlayTrigger
                                placement="right"
                                delay={{ show: 250, hide: 400 }}
                                overlay={renderTooltip}
                            >
                                <Button variant="outline-secondary" style={{ padding: '0 5px', marginLeft: '5px' }}>
                                    ?
                                </Button>
                                
                            </OverlayTrigger> <br></br>
                        </Form.Label>
                        <Form.Control 
                            required
                            type="text" 
                            placeholder="i.e Beats Per Minute, Repetitions, etc..." 
                            name="quantifier"
                            value={formData.quantifier}
                            onChange={e => handleFormChange(e)}
                        />
                    </Form.Group>
                    <br></br>
                    <Form.Group controlId="formProgressQuantifier">
                        <Form.Label>Import Network </Form.Label>
                        <Form.Control type="file" size="sm" onChange={handleFileChange} />
                    </Form.Group>
                    <br></br>
                    <JsonFormatExplainer></JsonFormatExplainer>

                </Form>
            </CustomModal>
        </div>
    );
}
