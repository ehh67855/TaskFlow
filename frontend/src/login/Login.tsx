import { useState } from "react";
import { Button, Form, Container, Row, Col, FormGroup, FormLabel, FormControl, FormCheck } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { setAuthHeader } from "../services/BackendService";
import MessageToast from "src/MessageToast/MessageToast";

export function Login() {
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [errorShow, setErrorShow] = useState(false);

    const onLogin = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        fetch("http://localhost:8080/login", {
            method: "POST",
            headers: {"content-type": "application/json"},
            body: JSON.stringify({login: login, password: password})
        }).then(response => {
            if (response.status == 200) {
                return response.json();

            } else if (response.status == 404) {
                setErrorMessage("Email not found");
                setErrorShow(true);
                return null;
            } else if (response.status == 400) {
                setErrorMessage("Invalid password");
                setErrorShow(true);
                return null;
            } else if (response.status == 403) {
                setErrorMessage("User Account not active. Check your inbox to active your account");
                setErrorShow(true);
                return null;
            }else {
                console.log(response);
                return null;
            }
        }).then(data => {
            if (data !== null) {
                setAuthHeader(data["token"]);
                window.location.href="/";
            } else {
                setAuthHeader(null);
            }
        });
    }

    return (
        <div>
            <Container className="mt-5" style={{ paddingBottom: '70px' }}>
                    <MessageToast 
                        show={errorShow}
                        title={"Error logging in"}
                        message={errorMessage}
                        onClose={() => setErrorShow(false)}
                        bg={"danger"}
                    ></MessageToast>
                    <Row className="justify-content-center">
                    <Col xs={12} md={6}>
                        <h2 className="text-center mb-4">Login</h2>
                        <Form onSubmit={onLogin}>
                            <FormGroup className="mb-3">
                                <FormLabel>Email</FormLabel>
                                <FormControl
                                    type="email"
                                    name="email"
                                    value={login}
                                    onChange={e => setLogin(e.target.value)}
                                    required
                                />
                            </FormGroup>
                            <FormGroup className="mb-3">
                                <FormLabel>Password</FormLabel>
                                <FormControl
                                    type="password"
                                    name="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                            </FormGroup>
                            <FormGroup className="mb-3">
                                <FormCheck
                                    type="checkbox"
                                    label="Remember me"
                                    name="rememberMe"
                                    checked={rememberMe}
                                    onChange={e => setRememberMe(e.target.checked)}
                                />
                            </FormGroup>
                            <Button variant="success" type="submit" className="w-100">Login</Button>
                        </Form>
                            <hr></hr>
                            <Button variant="primary" size="sm" className="w-100" href="/register" style={{ marginTop: '5px' }}>Create an account</Button>
                            <Button variant="primary" size="sm" className="w-100" href="/forgot-password" style={{ marginTop: '5px' }}>Forgot Password?</Button>
                    </Col>
                </Row>
            </Container>
        </div>
    );

}

export default Login;