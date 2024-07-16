import React, { useState, useEffect } from 'react';
import { Container, ListGroup, ProgressBar, Button, Form } from 'react-bootstrap';

const RoutineList = ({ routine }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTimer, setCurrentTimer] = useState(routine.routineItems[0].amountOfTime);
  const [totalTimer, setTotalTimer] = useState(routine.totalMinutes);
  const [actualValues, setActualValues] = useState(new Array(routine.routineItems.length).fill(0));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimer((prev) => (prev > 0 ? prev - 1000 : 0));
      setTotalTimer((prev) => (prev > 0 ? prev - 1000 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex]);

  useEffect(()=>console.log(routine),[routine])

  useEffect(() => {
    if (currentTimer === 0 && currentIndex < routine.routineItems.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setCurrentTimer(routine.routineItems[currentIndex + 1].amountOfTime);
    }
  }, [currentTimer, currentIndex, routine.routineItems]);

  const handleActualValueChange = (index, value) => {
    const updatedValues = [...actualValues];
    updatedValues[index] = value;
    setActualValues(updatedValues);
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
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
      <div className="mt-4">
        <h5>Total Routine Timer</h5>
        <ProgressBar now={(totalTimer / routine.totalMinutes) * 100} label={`${Math.floor(totalTimer / 60000)}m`} />
      </div>
      <div className="mt-2">
        <h5>Current Item Timer</h5>
        <ProgressBar now={(currentTimer / routine.routineItems[currentIndex].amountOfTime) * 100} label={`${Math.floor(currentTimer / 60000)}m`} />
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
