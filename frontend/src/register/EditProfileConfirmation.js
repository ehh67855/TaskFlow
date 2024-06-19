import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';  // Assuming you are using react-router for navigation

function EditProfileConfirmation() {
  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col xs={12} md={6}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Update Successful!</Card.Title>
              <Card.Text>
                Your information has been updated.
              </Card.Text>
              <Link to="/" className="btn btn-primary">Back to Networks</Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default EditProfileConfirmation;
