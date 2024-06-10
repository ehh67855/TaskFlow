import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';

function MessageToast({ show, title, message, onClose, bg}) {

  return (
    <ToastContainer position="top-center" className="p-3 fixed-top">
      <Toast onClose={onClose} show={show} delay={3000} autohide bg={bg}>
        <Toast.Header>
          <strong className="me-auto">{title}</strong>
          <small>Just now</small>
        </Toast.Header>
        <Toast.Body>{message}</Toast.Body>
      </Toast>
    </ToastContainer>
  );
}

export default MessageToast;
