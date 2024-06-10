import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Row, Col, Form, FormGroup, FormLabel, FormControl, Button } from 'react-bootstrap';


function PasswordReset() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword,setConfirmPassword] = useState('');

  let token = new URLSearchParams(useLocation().search).get("token");

   const handleSubmit = async (e) => {
    console.log(token);

    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return null;
    }
    
    try {
      await fetch(`http://localhost:8080/reset-password/${token}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              login: email, 
              password: newPassword
            })
          })
          .then(response => {
            if (response.status === 200) {
                return response.json();
            } else if (response.status === 403) {
                alert ("Invalid token or token is not valid for given user. Request a reset password email to receive a valid token");
            } else if (response.status === 404) {
                alert("Email not found");
          } else {
                console.log(response.status);
                alert("Something went wrong");
                return null;
            }
        }).then(data => {
            if (data) {
              alert("Password successfully updated");
            }
        })
        .catch(error => {
            console.error("Error occurred during registration:", error);
        })
    } catch (error) {
      console.error(error);
    }

  }

  return (
      <div>
          <Container className="mt-5" style={{ paddingBottom: '70px' }}>
              <Row className="justify-content-center">
                  <Col xs={12} md={6}>
                      <h2 className="text-center mb-4">Reset Password</h2>
                      <Form onSubmit={handleSubmit}>
                          <FormGroup className="mb-3">
                              <FormLabel>Email</FormLabel>
                              <FormControl
                                  type="email"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  required
                              />
                          </FormGroup>
                          <FormGroup className="mb-3">
                              <FormLabel>New Password</FormLabel>
                              <FormControl
                                  type="password"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  required
                              />
                          </FormGroup>
                          <FormGroup className="mb-3">
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl
                                  type="password"
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  required
                              />
                          </FormGroup>
                          <Button variant="success" type="submit" className="w-100">Reset Password</Button>
                      </Form>
                      <div className="mt-3">
                          <Button variant="primary" size="sm" className="w-100 mb-2" href="forgot-password">Request reset password email</Button>
                          <Button variant="primary" size="sm" className="w-100" href="/login">Back to login</Button>
                      </div>
                  </Col>
              </Row>
          </Container>
      </div>
  );

}

export default PasswordReset;
