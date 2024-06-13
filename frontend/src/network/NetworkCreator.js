import React, { useState } from 'react';
import { Button, Form, OverlayTrigger, Tooltip } from 'react-bootstrap';
import CustomModal from 'src/customModal/CustomModal';
import VisNetwork from './VisNetwork';
import { getAuthToken, getLogin } from 'src/services/BackendService';

export default function NetworkCreator() {
    const [modalShow, setModalShow] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        quantifier: "",
      });
    
      const handleFormChange = (e) => {
        const {name,value} = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
      };
    

    const handleModalSave = async () => {
        console.log(JSON.stringify({
            login:getLogin(getAuthToken()),
            name:formData.name,
            quantifier:formData.quantifier
        }))
        
        await fetch("http://localhost:8080/create-network", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                login: getLogin(getAuthToken()),
                name: formData.name,
                quantifier: formData.quantifier
            })
        })
        .then(response => response.json())  // Assuming the server sends back a JSON response
        .then(data => {
            console.log(data);  // Process your data here
        })
        .catch(error => {
            console.error('Error:', error);
        });
        
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
                    <Form.Group controlId="formNetworkName">
                        <Form.Label>Name</Form.Label>
                        <Form.Control 
                            type="text" 
                            placeholder="Enter the name of your network" 
                            name="name"
                            onChange={e => handleFormChange(e)} />
                    </Form.Group>
                    <br></br>
                    <Form.Group controlId="formProgressQuantifier">
                        <Form.Label>Progress Quantifier 
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
                        <br></br><small>Minutes practiced by default</small>
                        <Form.Control 
                            type="text" 
                            placeholder="BPM, Calories Burned, etc." 
                            name="quantifier"
                            value={formData.quantifier}
                            onChange={e => handleFormChange(e)}/>
                    </Form.Group>
                </Form>
            </CustomModal>
            
        </div>
    );
}
