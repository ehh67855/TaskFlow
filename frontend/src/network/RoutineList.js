import React, { useState, useEffect } from 'react';
import { Container, ListGroup, ProgressBar, Button, Form, Modal } from 'react-bootstrap';
import { getAuthToken, getLogin } from 'src/services/BackendService';

const RoutineList = ({ routine, networkId }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTimer, setCurrentTimer] = useState(routine.routineItems[0].amountOfTime);
  const totalRoutineTime = routine.routineItems.reduce((acc, item) => acc + parseInt(item.amountOfTime, 10), 0);
  const [totalTimer, setTotalTimer] = useState(totalRoutineTime);
  const [actualValues, setActualValues] = useState(new Array(routine.routineItems.length).fill(''));
  const [showModal, setShowModal] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let timer;
    if (!isPaused && !showModal) {
      timer = setInterval(() => {
        setCurrentTimer((prev) => (prev > 0 ? prev - 1000 : 0));
        setTotalTimer((prev) => (prev > 0 ? prev - 1000 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentIndex, isPaused, showModal]);

  useEffect(() => {
    if (currentTimer === 0 && currentIndex < routine.routineItems.length - 1) {
      setShowModal(true);
      setModalIndex(currentIndex);
    }
  }, [currentTimer, currentIndex, routine.routineItems]);

  const handleActualValueChange = (index, value) => {
    const updatedValues = [...actualValues];
    updatedValues[index] = value;
    setActualValues(updatedValues);
  };

  const handleModalClose = () => {
    if (actualValues[modalIndex] !== '') {
      setShowModal(false);
      setCurrentIndex((prev) => prev + 1);
      setCurrentTimer(routine.routineItems[currentIndex + 1].amountOfTime);
    } else {
      alert('Please enter the actual value before proceeding.');
    }
  };

  const handleSkip = () => {
    if (routine.routineItems[currentIndex + 1]) {
      setShowModal(false);
      setCurrentIndex((prev) => prev + 1);
      setCurrentTimer(routine.routineItems[currentIndex + 1].amountOfTime);
    } else {
      sendDataToBackend();
    }
  };

  const formatTime = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = ((milliseconds % 60000) / 1000).toFixed(0);
    return `${minutes}m ${seconds}s`;
  };

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  const sendDataToBackend = async () => {
    const routineItems = routine.routineItems.map((item, index) => ({
      id: item.id,
      targetValue: item.targetValue,
      amountOfTime: item.amountOfTime,
      actualValue: actualValues[index]
    }));

    const data = {
      login: getLogin(getAuthToken()), 
      networkId: networkId,
      totalMinutes: (totalRoutineTime / 60000).toString(),
      routineItems: routineItems
    };

    try {
      const response = await fetch('http://localhost:8080/save-routine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        throw new Error('Failed to submit routine');
      }

      alert('Routine completed and data submitted successfully!');
    } catch (error) {
      console.error('Error submitting routine:', error);
      alert('Failed to submit routine data. Please try again.');
    }
  };

  return (
    <Container>
      <h3>Routine Checklist</h3>
      <ListGroup>
        {routine.routineItems.map((item, index) => (
          <ListGroup.Item key={item.id} active={index === currentIndex}>
            <div>
              <strong>Routine Item {index + 1}</strong>
              <p>Target Value: {item.targetValue}</p>
              {index === currentIndex && (
                <Form>
                  <Form.Group controlId={`actualValue-${index}`}>
                    <Form.Label>Actual Value:</Form.Label>
                    <Form.Control
                      type="number"
                      value={actualValues[index]}
                      onChange={(e) => handleActualValueChange(index, e.target.value)}
                      disabled={currentTimer > 0}
                    />
                  </Form.Group>
                </Form>
              )}
              <br />
              {index === currentIndex && (
                <Button variant="secondary" onClick={handleSkip}>
                  Skip
                </Button>
              )}
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
      <div className="mt-4">
        <h5>Total Routine Timer</h5>
        <ProgressBar 
          now={(totalTimer / totalRoutineTime) * 100} 
          label={formatTime(totalTimer)} 
        />
      </div>
      <div className="mt-2">
        <h5>Current Item Timer</h5>
        <ProgressBar 
          now={(currentTimer / routine.routineItems[currentIndex].amountOfTime) * 100} 
          label={formatTime(currentTimer)} 
        />
      </div>
      <Button className="mt-4" onClick={togglePause}>
        {isPaused ? 'Resume' : 'Pause'}
      </Button>
      
      <Modal show={showModal} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Enter Actual Value</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId={`modalActualValue-${modalIndex}`}>
              <Form.Label>Actual Value for Item {modalIndex + 1}:</Form.Label>
              <Form.Control
                type="number"
                value={actualValues[modalIndex]}
                onChange={(e) => handleActualValueChange(modalIndex, e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleModalClose}>
            Submit
          </Button>
          <Button variant="secondary" onClick={handleSkip}>
            Skip
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default RoutineList;