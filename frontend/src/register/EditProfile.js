import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, FormGroup, FormLabel, FormControl, InputGroup } from 'react-bootstrap';
import { Eye, EyeSlash } from 'react-bootstrap-icons';

function EditProfileForm() {

    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);


    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };


    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        // Submit form logic here
        console.log('Form submitted:', formData);
    };

    return (
        <div>
            <Container className="mt-5" style={{ paddingBottom: '70px' }}>
                    {/* <MessageToast 
                        show={errorShow}
                        title={"Error logging in"}
                        message={errorMessage}
                        onClose={() => setErrorShow(false)}
                        bg={"danger"}
                    ></MessageToast> */}
                    <Row className="justify-content-center">
                    <Col xs={12} md={6}>
                        <h2 className="text-center mb-4">Edit Profile</h2>
                        <Form onSubmit={handleSubmit}>
                            <FormGroup className="mb-3">
                                <FormLabel>Email</FormLabel>
                                <FormControl
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    value={formData.email}
                                    onChange={e => handleChange(e)}
                                    required
                                />
                            </FormGroup>
                            <FormGroup className="mb-3">
                                <FormLabel>First Name</FormLabel>
                                <FormControl
                                    type="text"
                                    name="firstName"
                                    placeholder="First Name"
                                    value={formData.firstName}
                                    onChange={e => handleChange(e)}
                                    required
                                />
                            </FormGroup>
                            <FormGroup className="mb-3">
                                <FormLabel>Last Name</FormLabel>
                                <FormControl
                                    type="text"
                                    name="lastName"
                                    placeholder="Last Name"
                                    value={formData.lastName}
                                    onChange={e => handleChange(e)}
                                    required
                                />
                            </FormGroup>
                            <FormGroup className="mb-3">
                            <FormLabel>Password</FormLabel>
                            <InputGroup>
                                <FormControl
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <InputGroup.Text onClick={togglePasswordVisibility}>
                                    {showPassword ? <EyeSlash /> : <Eye />}
                                </InputGroup.Text>
                            </InputGroup>
                        </FormGroup>

                        <FormGroup className="mb-3">
                            <FormLabel>Confirm Password</FormLabel>
                            <InputGroup>
                                <FormControl
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm Password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
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
