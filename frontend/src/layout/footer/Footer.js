import React, { useState } from 'react';
import { Container, Row, Col, Nav, Navbar, Form, Button, Dropdown } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaTwitter, FaFacebook, FaInstagram, FaLinkedin } from 'react-icons/fa';

export default function Footer() {


    return (
        <Navbar fixed="bottom" bg="dark" variant="dark" className="justify-content-center">
            <Container>
                <Row className="align-items-center">
                    <Col className="text-center">
                        <Nav>
                            <Nav.Link href="https://twitter.com" target="_blank" className="mx-2"><FaTwitter size="1.5em" /></Nav.Link>
                            <Nav.Link href="https://facebook.com" target="_blank" className="mx-2"><FaFacebook size="1.5em" /></Nav.Link>
                            <Nav.Link href="https://instagram.com" target="_blank" className="mx-2"><FaInstagram size="1.5em" /></Nav.Link>
                            <Nav.Link href="https://linkedin.com" target="_blank" className="mx-2"><FaLinkedin size="1.5em" /></Nav.Link>
                            <Nav.Link href="#contact" className="mx-2">Contact Us</Nav.Link>
                        </Nav>
                    </Col>
                </Row>
            </Container>
        </Navbar>
    );
}
