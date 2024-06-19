import React, { useEffect, useState } from 'react';
import { Form, Button, Container, Row, Col, FormGroup, FormLabel, FormControl, InputGroup, ProgressBar } from 'react-bootstrap';
import { Eye, EyeSlash } from 'react-bootstrap-icons';
import { getAuthToken, getLogin } from 'src/services/BackendService';
import MessageToast from 'src/MessageToast/MessageToast';

function EditProfileForm() {
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [errorShow, setErrorShow] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordFeedback, setPasswordFeedback] = useState('');
    const [passwordValidity, setPasswordValidity] = useState('');
    const [formData, setFormData] = useState({
        login: getLogin(getAuthToken()),
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: ''
    });

    useEffect(() => {
        setLoading(true);
        fetch(`http://localhost:8080/get-user/${getLogin(getAuthToken())}`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            }
        }).then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error("Get User,", "User not found");
            }
        }).then(data => {
            setFormData(prevFormData => ({
                ...prevFormData,
                firstName: data.firstName,
                lastName: data.lastName
            }));
        }).catch(error => {
            console.error("User fetch error", error);
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "password") {
            evaluatePassword(value);
        }
        setFormData({
            ...formData,
            [name]: value
        });
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

        if (passwordValidity) {
            setErrorShow(true);
            setErrorMessage(passwordValidity);
            return;
        }

        if ((formData.password && !formData.confirmPassword) || (!formData.password && formData.confirmPassword)) {
            setErrorShow(true);
            setErrorMessage("Both password and confirm password fields must be filled out.");
            return;
        }

        fetch("http://localhost:8080/edit-profile", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        }).then(response => {
            if (response.ok) {
                return response.json();
            } else if (response.status === 409) {
                setErrorMessage("New password cannot match old password. Please try again.");
                setErrorShow(true);
                throw new Error("New password cannot match old password. Please try again.");
            } else if (response.status === 403) {
                setErrorMessage("Incorrect current password. Please try again.");
                setErrorShow(true);
                throw new Error("Incorrect current password. Please try again.");
            } else {
                throw new Error("Response was not ok");
            }
        }).then(data => {
            console.log("Edited User", data);
            window.location.href = "/edit-profile-confirmation";
        }).catch(error => {
            console.log("Error updating profile", error);
        });
    };

    if (loading) {
        return <h1>Loading...</h1>
    }

    return (
        <div>
            <Container className="mt-5" style={{ paddingBottom: '70px' }}>
                <MessageToast
                    show={errorShow}
                    title={"Could not update"}
                    message={errorMessage}
                    onClose={() => setErrorShow(false)}
                    bg={"danger"}
                />
                <Row className="justify-content-center">
                    <Col xs={12} md={6}>
                        <h2 className="text-center mb-4">Edit Profile</h2>
                        <Form onSubmit={handleSubmit}>
                            <FormGroup className="mb-3">
                                <FormLabel>First Name</FormLabel>
                                <FormControl
                                    type="text"
                                    name="firstName"
                                    placeholder="First Name"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                />
                            </FormGroup>
                            <FormGroup className="mb-3">
                                <FormLabel>Last Name</FormLabel>
                                <FormControl
                                    type="text"
                                    name="lastName"
                                    placeholder="Last Name"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                />
                            </FormGroup>
                            <FormGroup className="mb-3">
                                <FormLabel>New Password</FormLabel>
                                <InputGroup>
                                    <FormControl
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                    <InputGroup.Text onClick={togglePasswordVisibility}>
                                        {showPassword ? <EyeSlash /> : <Eye />}
                                    </InputGroup.Text>
                                </InputGroup>
                                <ProgressBar now={passwordStrength} variant={passwordStrength > 50 ? 'success' : 'warning'} />
                                <small className="form-text text-muted">Password Feedback: {passwordFeedback}</small>
                            </FormGroup>

                            <FormGroup className="mb-3">
                                <FormLabel>Current Password</FormLabel>
                                <InputGroup>
                                    <FormControl
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm Password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                    <InputGroup.Text onClick={toggleConfirmPasswordVisibility}>
                                        {showConfirmPassword ? <EyeSlash /> : <Eye />}
                                    </InputGroup.Text>
                                </InputGroup>
                            </FormGroup>

                            <Button variant="success" type="submit" className="w-100">Save</Button>
                        </Form>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default EditProfileForm;
