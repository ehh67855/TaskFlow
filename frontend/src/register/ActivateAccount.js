import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container,Row,Col,Form,FormGroup,FormLabel,FormControl,Button } from 'react-bootstrap';

function ActivateAccount() {
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleActivation = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:8080/activate-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      if (response.ok) {
        setMessage('Account activated successfully. You can now login.');
        navigate('/login');
      } else {
        const data = await response.json();
        setMessage(data.message || 'Activation failed. Please check the token and try again.');
      }
    } catch (error) {
      setMessage('Error activating account.');
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col xs={12} md={6}>
          <h1 className="text-center mb-4">Account Activation</h1>
          <Form onSubmit={handleActivation}>
            <FormGroup className="mb-3">
              <FormLabel htmlFor="token">Activation Code:</FormLabel>
              <FormControl
                type="text"
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </FormGroup>
            <Button type="submit" variant="primary" className="w-100">Activate Account</Button>
          </Form>
          <p className="text-center mt-3">{message}</p>
        </Col>
      </Row>
    </Container>
  );

}

export default ActivateAccount;
