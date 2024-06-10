import { Button, Navbar, Nav, Image, Dropdown, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from '../../Logo.png';
import { useState } from 'react';
import { isAuthenticated, setAuthHeader } from 'src/services/BackendService';
import SubmitFeedbackButton from './SubmitFeedbackButton';

export default function Header() {


    return (
        <Navbar bg="dark" variant="dark" expand="md" className="p-3">
            <Navbar.Brand href="/">
                <Image src={logo} height="40" />
                TaskFlow
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="ml-auto d-flex align-items-center justify-content-end w-100">  // Ensure elements align to the right
                    {isAuthenticated() ? (
                        <>
                            <Button variant="outline-success" className="mx-2 my-1" onClick={() => {
                                var r = confirm("Are you sure you want to logout?");
                                if (r) {
                                    setAuthHeader(null);
                                    window.location.reload();
                                }
        }
                            }>Logout</Button>
                            <Button variant="outline-primary" className="mx-2 my-1" href="/edit-profile">Edit Profile</Button>
                        </>
                    ) : (
                        <>
                            <Button style={{float:"right"}} variant="outline-success" className="mx-2 my-1" href="/login">Login</Button>
                            <Button variant="outline-primary" className="mx-2 my-1" href="/register">Sign Up</Button>
                        </>
                    )}
                    <SubmitFeedbackButton></SubmitFeedbackButton>
                </Nav>
            </Navbar.Collapse>
        </Navbar>
    );
}
