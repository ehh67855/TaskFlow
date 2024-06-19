import React from 'react';
import { Nav } from 'react-bootstrap';
import { House, Gear, Envelope,Keyboard,Calendar2Check, QuestionSquare, Question, QuestionCircle, BoxArrowInDown, ArrowBarLeft} from 'react-bootstrap-icons'; // Import icons you need

const Sidebar = () => {
    const style = {
        sidebar: {
            height: '100vh',
            width: '50px',
            position: 'relative',
            zIndex: '0',
            top: '0',
            left: '0',
            backgroundColor: '#f8f9fa',
            overflowX: 'hidden',
            display: 'flex',
        },
        link: {
            color: 'black',
            padding: '16px',
            textAlign: 'center',
            textDecoration: 'none',
            fontSize: '25px',
            width: '100%',
            display: 'block'
        },
        tooltipText: {
            width: '120px',
            backgroundColor: 'black',
            color: '#fff',
            textAlign: 'center',
            borderRadius: '6px',
            padding: '5px 0',
            position: 'absolute',
            zIndex: '1',
            left: '105%',
            top: '50%',
            marginTop: '-16px'
        }
    };

    return (
        <div style={style.sidebar}>
            <Nav className="flex-column">
                
                <div style={style.navIcon}>
                    <Nav.Link style={style.link} href="/">
                        <House />
                        <span className="tooltipText" style={style.tooltipText}>Home</span>
                    </Nav.Link>
                </div>
                <div style={style.navIcon}>
                    <Nav.Link style={style.link} href="/contact">
                        <Calendar2Check />
                        <span className="tooltipText" style={style.tooltipText}>Contact</span>
                    </Nav.Link>
                </div>

                <div style={style.navIcon}>
                    <Nav.Link style={style.link} href="/contact">
                        <BoxArrowInDown />
                        <span className="tooltipText" style={style.tooltipText}>Contact</span>
                    </Nav.Link>
                </div>
                <div style={style.navIcon}>
                    <Nav.Link style={style.link} href="/contact">
                        <Keyboard />
                        <span className="tooltipText" style={style.tooltipText}>Contact</span>
                    </Nav.Link>
                </div>
 
                <div style={style.navIcon}>
                    <Nav.Link style={style.link} href="/contact">
                        <QuestionCircle />
                        <span className="tooltipText" style={style.tooltipText}>Contact</span>
                    </Nav.Link>
                </div>
                <div style={style.navIcon}>
                    <Nav.Link style={style.link} href="/settings">
                        <Gear />
                        <span className="tooltipText" style={style.tooltipText}>Settings</span>
                    </Nav.Link>
                </div>
                <div style={style.navIcon}>
                    <Nav.Link style={style.link} href="/settings">
                        <ArrowBarLeft />
                        <span className="tooltipText" style={style.tooltipText}>Settings</span>
                    </Nav.Link>
                </div>


            </Nav>
        </div>
    );
};

export default Sidebar;
