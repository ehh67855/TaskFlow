import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';  // Assuming you are using react-router for navigation

function SignupConfirmation() {
  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col xs={12} md={6}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Registration Successful!</Card.Title>
              <Card.Text>
                Thank you for signing up. <strong> A confirmation email has been sent to your email address. </strong> 
                Please follow the instructions in the email to activate your account.
              </Card.Text>
              <Link to="/login" className="btn btn-primary">Log In</Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default SignupConfirmation;
