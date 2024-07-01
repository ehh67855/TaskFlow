import React, { useState } from 'react';
import { Form, Row, Col, Dropdown, DropdownButton } from 'react-bootstrap';

const Timepicker = ({ onTimeChange }) => {
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const handleMinuteChange = (minute) => {
    setMinutes(minute);
    onTimeChange({ minutes: minute, seconds });
  };

  const handleSecondChange = (second) => {
    setSeconds(second);
    onTimeChange({ minutes, seconds: second });
  };

  const generateOptions = (max) => {
    return Array.from({ length: max }, (_, i) => i);
  };

  return (
    <Form>
      <Row>
        <Col>
          <DropdownButton
            id="minutes-dropdown"
            title={`Minutes: ${minutes}`}
            onSelect={handleMinuteChange}
          >
            {generateOptions(60).map((minute) => (
              <Dropdown.Item key={minute} eventKey={minute}>
                {minute}
              </Dropdown.Item>
            ))}
          </DropdownButton>
        </Col>
        <Col>
          <DropdownButton
            id="seconds-dropdown"
            title={`Seconds: ${seconds}`}
            onSelect={handleSecondChange}
          >
            {generateOptions(60).map((second) => (
              <Dropdown.Item key={second} eventKey={second}>
                {second}
              </Dropdown.Item>
            ))}
          </DropdownButton>
        </Col>
      </Row>
    </Form>
  );
};

export default Timepicker;
