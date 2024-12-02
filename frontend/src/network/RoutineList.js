import React, { useState, useEffect } from 'react';
import { Container, ListGroup, ProgressBar, Button, Form, Modal, Collapse } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getAuthToken, getLogin } from 'src/services/BackendService';

const RoutineList = ({ routine, 
    networkId, 
    setGenererateListShowModal}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTimer, setCurrentTimer] = useState(routine?.routineItems[0]?.amountOfTime || 0);
  const totalRoutineTime = routine?.routineItems?.reduce(
    (acc, item) => acc + parseInt(item.amountOfTime || 0, 10),
    0
  );
  const [totalTimer, setTotalTimer] = useState(totalRoutineTime || 0);
  const [actualValues, setActualValues] = useState(new Array(routine?.routineItems?.length || 0).fill(''));
  const [showModal, setShowModal] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [isRoutineComplete, setIsRoutineComplete] = useState(false);

  useEffect(() => {
    if (!routine || !routine.routineItems || routine.routineItems.length === 0) {
      console.error('Routine or routine items are missing.');
      return;
    }

    let timer;
    if (!isPaused && !showModal && !isRoutineComplete) {
      timer = setInterval(() => {
        setCurrentTimer((prev) => Math.max(prev - 1000, 0));
        setTotalTimer((prev) => Math.max(prev - 1000, 0));
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isPaused, showModal, currentIndex, isRoutineComplete]);

  useEffect(() => {
    if (currentTimer === 0) {
      setShowModal(true);
      setModalIndex(currentIndex);

      if (currentIndex === routine.routineItems.length - 1) {
        return;
      }
    }
  }, [currentTimer, currentIndex, routine.routineItems]);

  const handleActualValueChange = (index, value) => {
    const updatedValues = [...actualValues];
    updatedValues[index] = value;
    setActualValues(updatedValues);
  };

  const handleModalClose = () => {
    setShowModal(false);
    if (currentIndex < routine.routineItems.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setCurrentTimer(routine.routineItems[currentIndex + 1]?.amountOfTime || 0);
    } else {
      setIsRoutineComplete(true);
      sendDataToBackend();
    }
  };


  const handleSkip = () => {
    const remainingTime = currentTimer;
    setTotalTimer((prev) => Math.max(prev - remainingTime, 0));

    if (currentIndex < routine.routineItems.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setCurrentTimer(routine.routineItems[currentIndex + 1]?.amountOfTime || 0);
    } else {
      setModalIndex(currentIndex);
      setShowModal(true); // Show modal for the last item
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
      nodeId: item.nodeId || null,
      amountOfTime: item.amountOfTime,
      targetValue: item.targetValue,
      achievedValue: parseFloat(actualValues[index]) || 0,
    }));

    const data = {
      login: getLogin(getAuthToken()),
      networkId,
      totalMinutes: Math.ceil(totalRoutineTime / 60000),
      routineItems,
    };

    try {
      const response = await fetch('http://localhost:8080/save-routine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });



      if (!response.ok) {
        throw new Error('Failed to submit routine');
      }

      console.log('Routine submitted successfully:', data);
    } catch (error) {
      console.error('Error submitting routine:', error);
      alert('Failed to submit routine data. Please try again.');
    }
  };

  if (!routine || !routine.routineItems || routine.routineItems.length === 0) {
    return <h4>No routine items available.</h4>;
  }

  return (
    <Container>
      <h3>Routine Checklist</h3>
      <ListGroup>
        {routine.routineItems.map((item, index) => (
          <ListGroup.Item key={item.id} active={index === currentIndex}>
            <div>
              <strong>Item {index + 1}</strong>
              <p>{item.itemName}</p>
              {index === currentIndex && (
                <>
                  <Button
                    variant="light"
                    onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
                    aria-controls={`description-collapse-${index}`}
                    aria-expanded={isDescriptionOpen}
                  >
                    {isDescriptionOpen ? 'Hide Description' : 'View Description'}
                  </Button>
                  <Collapse in={isDescriptionOpen}>
                    <div id={`description-collapse-${index}`} className="mt-2">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.nodeDescription}</ReactMarkdown>
                    </div>
                  </Collapse>
                </>
              )}
              {index === currentIndex && (
                <Form>
                  <Form.Group controlId={`actualValue-${index}`}>
                    <Form.Label>BPM Value:</Form.Label>
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
        <ProgressBar now={(totalTimer / totalRoutineTime) * 100} label={formatTime(totalTimer)} />
      </div>
      <div className="mt-2">
        <h5>Current Item Timer</h5>
        <ProgressBar
          now={(currentTimer / (routine.routineItems[currentIndex]?.amountOfTime || 1)) * 100}
          label={formatTime(currentTimer)}
        />
      </div>
      <Button className="mt-4" onClick={togglePause}>
        {isPaused ? 'Resume' : 'Pause'}
      </Button>
      <Modal show={showModal} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Enter BPM Value</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId={`modalActualValue-${modalIndex}`}>
              <Form.Label>BPM Value for {routine.routineItems[modalIndex]?.itemName || `Item ${modalIndex + 1}`}:</Form.Label>
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
        </Modal.Footer>
      </Modal>
      {isRoutineComplete && (
        <Modal show={isRoutineComplete} onHide={() => setIsRoutineComplete(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Routine Completed!</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Congratulations! You have completed the routine.</p>
            <p>Would you like to review your performance or Close?</p>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                window.location.reload()
              }}
            >
              Close
            </Button>
            <Button variant="primary" onClick={() => alert('Review functionality coming soon!')}>
              Review Performance
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Container>
  );
};

export default RoutineList;