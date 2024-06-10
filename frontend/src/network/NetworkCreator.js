import React, { useState } from 'react';
import { Button, Form, OverlayTrigger, Tooltip } from 'react-bootstrap';
import CustomModal from 'src/customModal/CustomModal';
import VisNetwork from './VisNetwork';

export default function NetworkCreator() {
    const [modalShow, setModalShow] = useState(false);

    const handleModalClose = () => setModalShow(false);
    const handleModalSave = () => {
        console.log("Save the changes");
        handleModalClose();
    };

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
                title="Network Creator"
                saveText="Create"
            >
                <Form>
                    <Form.Group controlId="formNetworkName">
                        <Form.Label>Name</Form.Label>
                        <Form.Control type="text" placeholder="Enter the name of your network" />
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
                        <Form.Control type="text" placeholder="BPM, Pages Read, Git Commits, Calories Burned, etc." />
                    </Form.Group>
                </Form>
            </CustomModal>
            
        </div>
    );
}
