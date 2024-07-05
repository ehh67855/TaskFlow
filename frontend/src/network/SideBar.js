import React from 'react';
import { Nav } from 'react-bootstrap';
import { House, Gear, Envelope, Keyboard, Calendar2Check, QuestionCircle, BoxArrowInDown, ArrowBarLeft } from 'react-bootstrap-icons'; // Import icons you need
import './Sidebar.css'; // Import the CSS file

const Sidebar = ({downloadGraph}) => {
    return (
        <div className="sidebar">
            <Nav className="flex-column">
                <div className="navIcon">
                    <Nav.Link className="link" href="/">
                        <House />
                        <span className="tooltipText">Home</span>
                    </Nav.Link>
                </div>
                <div className="navIcon">
                    <Nav.Link className="link" href="/contact">
                        <Calendar2Check />
                        <span className="tooltipText">Contact</span>
                    </Nav.Link>
                </div>
                <div className="navIcon">
                    <Nav.Link className="link" onClick={downloadGraph}>
                        <BoxArrowInDown />
                        <span className="tooltipText">Download</span>
                    </Nav.Link>
                </div>
                <div className="navIcon">
                    <Nav.Link className="link" href="/contact">
                        <Keyboard />
                        <span className="tooltipText">Keyboard</span>
                    </Nav.Link>
                </div>
                <div className="navIcon">
                    <Nav.Link className="link" href="/contact">
                        <QuestionCircle />
                        <span className="tooltipText">Help</span>
                    </Nav.Link>
                </div>
                <div className="navIcon">
                    <Nav.Link className="link" href="/settings">
                        <Gear />
                        <span className="tooltipText">Settings</span>
                    </Nav.Link>
                </div>
                <div className="navIcon">
                    <Nav.Link className="link" href="/settings">
                        <ArrowBarLeft />
                        <span className="tooltipText">Logout</span>
                    </Nav.Link>
                </div>
            </Nav>
        </div>
    );
};

export default Sidebar;
