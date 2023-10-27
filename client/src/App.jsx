import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";

import { useEffect, useState } from "react";
import { Container, ToastContainer, Toast } from "react-bootstrap";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { BackOfficeLayout, DefaultLayout, FrontOfficeLayout, LoginLayout, NotFoundLayout, PageLayout } from "./components/AppLayout";
import ErrorContext from "./contexts/ErrorContext";
import UserContext from "./contexts/UserContext";
import API from "./API";

function App() {
  return (
    <BrowserRouter>
      <Main />
    </BrowserRouter>
  );
}

function Main() {
  const navigate = useNavigate();

  // This state contains the list of pages
  const [pages, setPages] = useState([]);

  // This state contains the currently logged in user, if any
  const [user, setUser] = useState(undefined);

  // This state is used to signal errors from the server
  const [error, setError] = useState("");

  // This state is used to signal the success of a create/update/delete operation
  const [message, setMessage] = useState("");

  // Flag used to reload data
  const [dirty, setDirty] = useState(false);

  // This state contains the current active tab (1: front office, 2: back-office)
  const [activeTab, setActiveTab] = useState(1);

  // This state contains the currently set app name to be shown in the navigation bar
  const [appName, setAppName] = useState("");

  // This state flags the initial loading of the app
  const [loading, setLoading] = useState(true);

  // This useEffect is called only the first time the component is mounted.
  useEffect(() => {
    // Load the app name
    API.getAppName()
      .then((appName) => setAppName(appName))
      .catch((err) => handleErrors(err));

    // Load the list of published pages
    API.getPublishedPages()
      .then((pages) => {
        setPages(pages);
        setDirty(false);
        setLoading(false);
      })
      .catch((err) => handleErrors(err));

    // Check if the user was already logged in
    API.getUserInfo()
      .then((user) => setUser(user))
      .catch((err) => {
        //handleErrors(err); // Don't handle as usually is the 'Not unauthenticated' error
        setUser(undefined);
      });
  }, []);

  // This useEffect is executed when data needs to be reloaded
  useEffect(() => {
    if (dirty) {
      fetchPages();
    }
  }, [dirty]);

  /**
   * This function fetches the pages from the server
   *  according to the current active tab
   */
  const fetchPages = () => {
    if (activeTab === 1) {
      API.getPublishedPages()
        .then((pages) => {
          setPages(pages);
          setDirty(false);
        })
        .catch((err) => handleErrors(err));
    } else if (user && activeTab === 2) {
      API.getPages()
        .then((pages) => {
          setPages(pages);
          setDirty(false);
        })
        .catch((err) => handleErrors(err));
    }
  };

  /**
   * This function handles the login process.
   * It requires a username and a password inside a "credentials" object.
   */
  const handleLogin = (credentials) => {
    API.logIn(credentials)
      .then((user) => {
        setUser(user);
        setActiveTab(2); // The active tab should be back-office
        setDirty(true); // Reload the correct data for that tab
        setMessage("Welcome back, " + user.name);
      })
      .catch((err) => handleErrors(err));
  };

  /**
   * This function handles the logout process.
   */
  const handleLogout = () => {
    API.logOut()
      .then(() => {
        setUser(undefined);
        setActiveTab(1); // The active tab should be front-office
        setDirty(true);
        navigate("/");
      })
      .catch((err) => handleErrors(err));
  };

  /**
   * This function handles the last that may come after an API call.
   */
  const handleErrors = (err) => {
    let errMsg = JSON.stringify(err);
    if (err.errors) {
      if (err.errors[0]) {
        if (err.errors[0].msg) {
          errMsg = err.errors[0].msg;
        }
      }
    } else if (err.error) {
      errMsg = err.error;
    }
    setError(errMsg);
  };

  return (
    <ErrorContext.Provider value={{ handleErrors }}>
      <UserContext.Provider value={user}>
        <Container fluid>
          <Routes>
            <Route path="/" element={<DefaultLayout appName={appName} loading={loading} setAppName={setAppName} logout={handleLogout} setActiveTab={setActiveTab} setDirty={setDirty} />}>
              <Route index element={<FrontOfficeLayout pages={pages} activeTab={activeTab}/>} />
              <Route path="back-office" element={user && activeTab === 2 ? <BackOfficeLayout pages={pages} activeTab={activeTab} setDirty={setDirty} setMessage={setMessage}/> : <Navigate replace to="/" />} />
              <Route path="pages/:pageId" element={<PageLayout mode="view" setDirty={setDirty}/>} />
              <Route path="edit/:pageId" element={user ? <PageLayout mode="edit" setDirty={setDirty} setMessage={setMessage}/> : <Navigate replace to="/" />} />
              <Route path="add" element={user ? <PageLayout mode="add" setDirty={setDirty} setMessage={setMessage}/> : <Navigate replace to="/" />} />
              <Route path="login" element={!user ? <LoginLayout login={handleLogin} /> : <Navigate replace to="/back-office" />}/>
            </Route>
            <Route path="*" element={<NotFoundLayout />} />
          </Routes>
          <ErrorsAlert error={error} clear={() => setError("")} />
          <MessageAlert message={message} clear={() => setMessage("")} />
        </Container>
      </UserContext.Provider>
    </ErrorContext.Provider>
  );
}

function ErrorsAlert(props) {
  return (
    <ToastContainer className="p-3" position="bottom-center">
      <Toast
        bg="danger"
        show={props.error !== ""}
        animation={false}
        onClose={props.clear}
      >
        <Toast.Header>
          <i className="bi bi-exclamation-circle me-2 app-header" />
          <strong className="me-auto app-header">Error</strong>
        </Toast.Header>
        <Toast.Body className="text-white">{props.error}</Toast.Body>
      </Toast>
    </ToastContainer>
  );
}

function MessageAlert(props) {
  return (
    <ToastContainer className="p-3" position="bottom-center">
      <Toast
        bg="success"
        show={props.message !== ""}
        animation={false}
        onClose={props.clear}
        delay={3000}
        autohide
      >
        <Toast.Header>
          <i className="bi bi-info-circle me-2 app-header" />
          <strong className="me-auto app-header">Notification</strong>
        </Toast.Header>
        <Toast.Body className="text-white">{props.message}</Toast.Body>
      </Toast>
    </ToastContainer>
  );
}

export default App;
