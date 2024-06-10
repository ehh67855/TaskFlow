import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

function CustomModal({ show, handleClose, title, children, onSave, saveText}) {
    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {children}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
                <Button variant="primary" onClick={onSave}>
                    {saveText}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default CustomModal;
