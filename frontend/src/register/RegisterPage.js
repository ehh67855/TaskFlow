import React, { useState } from 'react';
import { Button, Form, Container, Row, Col, FormGroup, FormLabel, FormControl, ProgressBar } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BsEye, BsEyeSlash } from 'react-icons/bs';
import MessageToast from 'src/MessageToast/MessageToast';
import './RegisterPage.css'; 

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordFeedback, setPasswordFeedback] = useState('');
    const [passwordValidity, setPasswordValidity] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false); // State to toggle password visibility

    const [errorMessage, setErrorMessage] = useState("");
    const [errorShow, setErrorShow] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === "password") {
            evaluatePassword(value);
        }
        setFormData(prevState => ({
            ...prevState,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const evaluatePassword = (password) => {
        const feedback = [];
        let strength = 0;

        if (password.length >= 8 && password.length <= 20) {
            strength += 25;
            feedback.push("Good length");
        } else {
            feedback.push("Password must be 8-20 characters long");
        }

        if (/[A-Z]/.test(password)) {
            strength += 25;
            feedback.push("Includes uppercase");
        } else {
            feedback.push("Needs an uppercase letter");
        }

        if (/[a-z]/.test(password)) {
            strength += 25;
            feedback.push("Includes lowercase");
        } else {
            feedback.push("Needs a lowercase letter");
        }

        if (/[0-9]/.test(password)) {
            strength += 15;
            feedback.push("Includes number");
        } else {
            feedback.push("Needs a number");
        }

        if (/[()$@$$!%*#?&]/.test(password)) {
            strength += 10;
            feedback.push("Includes special character");
        } else {
            feedback.push("Needs a special character");
        }

        setPasswordStrength(strength);
        setPasswordFeedback(feedback.join(', '));

        if (strength < 60) {
            setPasswordValidity("Password is too weak: " + feedback.join(', '));
        } else {
            setPasswordValidity("");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match.");
            return;
        }
        if (passwordValidity) {
            setErrorShow(true);
            setErrorMessage(passwordValidity);
            return;
        }
        onRegister(formData);
    };

    const onRegister = (formData) => {
        console.log(formData);
        fetch("http://localhost:8080/register", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                firstName: formData.firstName,
                lastName: formData.lastName,
                login: formData.email,
                password: formData.password
            })
        }).then(response => {
            if (response.status === 201) {
                return response.json();
            } else if (response.status === 400) {
                setErrorMessage("Email is already in use");
                setErrorShow(true);
                return null;
            } else {
                console.log(response);
                return null;
            }
        }).then(data => {
            if (data !== null) {
                window.location.href = "/signup-confirmation";
            }
        });
    };

    const togglePasswordVisiblity = () => {
        setPasswordVisible(!passwordVisible);
    };

    return (
        <div style={{ paddingBottom: '100px' }}>
            <MessageToast
                show={errorShow}
                title={"Error logging in"}
                message={errorMessage}
                onClose={() => setErrorShow(false)}
                bg={"danger"}
            ></MessageToast>
            <Container>
                <Row className="justify-content-center">
                    <Col xs={12} md={6}>
                        <h2 className="mt-5">Let's get started</h2>
                        <small>Register below to get started in minutes. It's easy!</small>
                        <br /> <br />
                        <Form onSubmit={handleSubmit}>
                            <FormGroup className="mb-3">
                                <FormLabel>First Name</FormLabel>
                                <FormControl type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
                            </FormGroup>
                            <FormGroup className="mb-3">
                                <FormLabel>Last Name</FormLabel>
                                <FormControl type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
                            </FormGroup>
                            <FormGroup className="mb-3">
                                <FormLabel>Email</FormLabel>
                                <FormControl type="email" name="email" value={formData.email} onChange={handleChange} required />
                            </FormGroup>
                            <FormGroup className="mb-3 position-relative">
                                <FormLabel>Password</FormLabel>
                                <div className="password-field">
                                    <FormControl
                                        type={passwordVisible ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                    <Button variant="outline-secondary" onClick={togglePasswordVisiblity} className="password-toggle-button">
                                        {passwordVisible ? <BsEyeSlash /> : <BsEye />}
                                    </Button>
                                </div>
                                <ProgressBar now={passwordStrength} variant={passwordStrength > 50 ? 'success' : 'warning'} />
                                <small className="form-text text-muted">Password Feedback: {passwordFeedback}</small>
                            </FormGroup>

                            <FormGroup className="mb-3">
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl type={passwordVisible ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
                            </FormGroup>
                            <Button variant="primary" type="submit">Submit</Button>
                        </Form>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
