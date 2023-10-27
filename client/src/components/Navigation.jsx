import { useContext, useState } from "react";
import { Navbar, Container, Stack, Nav, Form, Button } from "react-bootstrap";
import { Link, NavLink } from "react-router-dom";
import { LoginButton, LogoutButton } from "./Auth";

import UserContext from "../contexts/UserContext";
import ErrorContext from "../contexts/ErrorContext";
import API from "../API";

import validator from "validator";

function Navigation(props) {
  const user = useContext(UserContext);
  const { handleErrors } = useContext(ErrorContext);

  // Flag to show or hide the edit app name form
  const [showForm, setShowForm] = useState(false);

  /**
   * This function calls the API to get the app name
   */
  const fetchAppName = () => {
    API.getAppName()
      .then((appName) => props.setAppName(appName))
      .catch((err) => handleErrors(err));
  };

  return (
    <Navbar className="navbar" variant="dark" bg="primary" fixed="top">
      <Container>
        {showForm ? (
          <NavForm
            appName={props.appName}
            setAppName={props.setAppName}
            setShowForm={setShowForm}
          />
        ) : (
          <>
            <Navbar.Brand
              className="app-header"
              as={Link}
              to="/"
              onClick={() => {
                props.setActiveTab(1);
                props.setDirty(true);
                fetchAppName();
              }}
            >
              {props.appName}
            </Navbar.Brand>
            <>
              {user?.role === "admin" && (
                <i
                  className="bi bi-pencil-square app-header text-white clickable"
                  onClick={() => setShowForm(true)}
                />
              )}
            </>
          </>
        )}
        <Navbar.Toggle />
        <Navbar.Collapse className="justify-content-end">
          {!user ? (
            <LoginButton />
          ) : (
            <Stack direction="horizontal" gap={3}>
              <Navbar.Text className="fs-6 text-white">
                {user.role === "admin"
                  ? `Signed in as admin: @${user.username}`
                  : `Signed in as user: @${user.username}`}
              </Navbar.Text>
              <LogoutButton
                logout={() => {
                  setShowForm(false);
                  props.logout();
                }}
              />
            </Stack>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

function NavTabs(props) {
  const tabs = [
    { label: "Front Office", id: "front-office", path: "/", value: 1 },
    { label: "Back Office", id: "back-office", path: "/back-office", value: 2 },
  ];

  return (
    <Nav variant="tabs" className="mb-3">
      {tabs.map((tab) => (
        <NavLink
          key={tab.id}
          className="nav-link"
          to={tab.path}
          onClick={() => {
            props.setActiveTab(tab.value);
            props.setDirty(true);
          }}
        >
          {tab.label}
        </NavLink>
      ))}
    </Nav>
  );
}

function NavForm(props) {
  const { handleErrors } = useContext(ErrorContext);

  // Local app name set in the form
  const [appName, setAppName] = useState(props.appName);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validator.isEmpty(appName.trim())) {
      API.updateAppName(appName.trim())
        .then((appName) => {
          props.setAppName(appName);
          props.setShowForm(false);
        })
        .catch((err) => handleErrors(err));
    }
  };

  return (
    <Form className="d-flex" onSubmit={handleSubmit}>
      <Form.Control
        autoFocus
        required
        type="text"
        className="me-2"
        size="sm"
        value={appName}
        onChange={(event) => setAppName(event.target.value)}
      />
      <Stack direction="horizontal" gap={2}>
        <Button variant="light" size="sm" type="submit">
          <i className="bi bi-check-lg" />
        </Button>
        <Button
          variant="dark"
          size="sm"
          onClick={() => props.setShowForm(false)}
        >
          <i className="bi bi-x-lg" />
        </Button>
      </Stack>
    </Form>
  );
}

export { Navigation, NavTabs };
