import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { Link } from "react-router-dom";

import validator from "validator";

function LoginForm(props) {
  // Form fields
  const [email, setEmail] = useState("u1@p.it");
  const [password, setPassword] = useState("pwd");

  // Form errors
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  /**
   * This function is used to validate the form credentials
   */
  const validateCredentials = () => {
    const errors = { email: "", password: "" };

    // Check email
    if (validator.isEmpty(email)) {
      errors.email = "Please provide an email";
    } else if (!validator.isEmail(email)) {
      errors.email = "Please provide a valid email (e.g. user@test.com)";
    }
    // Check password
    if (validator.isEmpty(password)) {
      errors.password = "Please provide a password";
    }
    return errors;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // Validate the form
    const errors = validateCredentials();
    if (errors.email !== "" || errors.password !== "") {
      setEmailError(errors.email);
      setPasswordError(errors.password);
    } else {
      // Submit the form
      const credentials = { username: email, password };
      props.login(credentials);
    }
  };

  return (
    <Form noValidate onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label className="bold-text">Email</Form.Label>
        <Form.Control
          type="email"
          value={email}
          isInvalid={!!emailError}
          autoFocus
          onChange={(event) => {
            setEmail(event.target.value);
            setEmailError("");
          }}
        />
        <Form.Control.Feedback type="invalid">
          {emailError}
        </Form.Control.Feedback>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label className="bold-text">Password</Form.Label>
        <Form.Control
          type="password"
          value={password}
          isInvalid={!!passwordError}
          onChange={(event) => {
            setPassword(event.target.value);
            setPasswordError("");
          }}
        />
        <Form.Control.Feedback type="invalid">
          {passwordError}
        </Form.Control.Feedback>
      </Form.Group>
      <Button className="my-2" type="submit">
        Login
      </Button>
    </Form>
  );
}

function LoginButton() {
  return (
    <Button variant="warning" as={Link} to="/login">
      <i className="bi bi-person-circle me-2" />
      Login
    </Button>
  );
}

function LogoutButton(props) {
  return (
    <Button variant="danger" onClick={props.logout}>
      <i className="bi bi-box-arrow-left me-2" />
      Logout
    </Button>
  );
}

export { LoginForm, LoginButton, LogoutButton };
