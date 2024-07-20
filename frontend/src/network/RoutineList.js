import React, { useState, useEffect } from 'react';
import { Container, ListGroup, ProgressBar, Button, Form } from 'react-bootstrap';

const RoutineList = ({ routine }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTimer, setCurrentTimer] = useState(0);
  const [totalTimer, setTotalTimer] = useState(0);
  const [actualValues, setActualValues] = useState([]);

  useEffect(() => {
    // Ensure routine and routineItems are properly defined
    if (routine && routine.routineItems && routine.routineItems.length > 0) {
      // Initialize timers and actual values array
      setCurrentTimer(parseInt(routine.routineItems[0].amountOfTime, 10) || 0);
      const totalMinutes = parseInt(routine.totalMinutes, 10);
      setTotalTimer(totalMinutes > 0 ? totalMinutes * 60000 : routine.routineItems.reduce((acc, item) => acc + parseInt(item.amountOfTime, 10), 0));
      setActualValues(new Array(routine.routineItems.length).fill(0));
    }
  }, [routine]);

  useEffect(() => {
    if (!routine || !routine.routineItems || routine.routineItems.length === 0 || currentTimer <= 0) return;

    const timer = setInterval(() => {
      setCurrentTimer(prev => prev - 1000);
      setTotalTimer(prev => prev - 1000);
    }, 1000);

    return () => clearInterval(timer);
  }, [currentTimer, routine]);

  useEffect(() => {
    if (currentTimer === 0 && currentIndex < routine.routineItems.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setCurrentTimer(parseInt(routine.routineItems[currentIndex + 1]?.amountOfTime, 10) || 0);
    }
  }, [currentTimer, currentIndex, routine]);

  const handleActualValueChange = (index, value) => {
    const updatedValues = [...actualValues];
    updatedValues[index] = value;
    setActualValues(updatedValues);
  };

  if (!routine || !routine.routineItems || routine.routineItems.length === 0) {
    return <div>No routine available.</div>;
  }

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
                      onChange={(e) => handleActualValueChange(index, parseInt(e.target.value, 10) || 0)}
                      disabled={currentTimer > 0}
                    />
                  </Form.Group>
                </Form>
              )}
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
      <div className="mt-4">
        <h5>Total Routine Timer</h5>
        <ProgressBar now={(totalTimer / (parseInt(routine.totalMinutes, 10) * 60000 || 1)) * 100} label={`${Math.floor(totalTimer / 60000)}m`} />
      </div>
      <div className="mt-2">
        <h5>Current Item Timer</h5>
        <ProgressBar now={(currentTimer / (parseInt(routine.routineItems[currentIndex]?.amountOfTime, 10) || 1)) * 100} label={`${Math.floor(currentTimer / 60000)}m`} />
      </div>
      {currentIndex === routine.routineItems.length - 1 && currentTimer === 0 && (
        <Button className="mt-4" onClick={() => alert('Routine Completed!')}>
          Complete Routine
        </Button>
      )}
    </Container>
  );
};

export default RoutineList;