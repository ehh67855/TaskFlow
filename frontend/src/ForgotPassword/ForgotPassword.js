import React, { useState } from 'react';
import './ForgotPassword.css'; // Make sure to create and link a corresponding CSS file for styling
import MessageToast from 'src/MessageToast/MessageToast';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [errorTitle,setErrorTitle] = useState('');
  const [errorShow,setErrorShow] = useState(false);
  const [errorMessage,setErrorMessage] = useState('');
  const [errorBg,setErrorBg] = useState('');
  
  const [loading, setLoading] = useState(false); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await fetch("http://localhost:8080/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              login: email, 
            })
          })
          .then(response => {
            if (response.status === 200) {
                return response.json();
            } else if (response.status === 208) {
              setErrorTitle('Error');
              setErrorMessage('An email has already been sent');
              setErrorBg('danger');
              setErrorShow(true);
            } else if (response.status === 404) {
              setErrorTitle('Error');
              setErrorMessage('Could not find email');
              setErrorBg('danger');
              setErrorShow(true);
            } else {
                console.log(response.status);
                alert("Something went wrong");
                return null;
            }
        }).then(data => {
            if (data) {
              setErrorTitle('Success');
              setErrorMessage('An email has been sent to your inbox');
              setErrorBg('success');
              setErrorShow(true);
            }
        })
        .catch(error => {
            console.error("Error occurred during registration:", error);
        })
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  return (
    <div className="forgot-password-container">
        <MessageToast
          show={errorShow}
          title={errorTitle}
          message={errorMessage}
          onClose={() => setErrorShow(false)}
          bg={errorBg}
      ></MessageToast>
      <form className="forgot-password-form" onSubmit={handleSubmit}>
        <h2>Forgot Password</h2>
        <p>Enter your email and we'll send you a link to reset your password</p>
          <>
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="actions">
              <button type="submit" disabled={loading}>
                Submit
              </button>
              <button className="btn" href="/login" style={{marginTop:`5px`}}>
                Back to Login
              </button>
            </div>
          </>
      </form>
   
    </div>
  );
}

export default ForgotPassword;
