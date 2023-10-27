import { useContext, useEffect, useState } from "react";
import { Container, Button, Card, Col, Row, Spinner } from "react-bootstrap";
import { Outlet, Link, useParams, useLocation } from "react-router-dom";

import { LoginForm } from "./Auth";
import { PageView } from "./PageView";
import { PageTable } from "./PageList";
import { PageForm } from "./PageForm";
import { NavTabs, Navigation } from "./Navigation";

import ErrorContext from "../contexts/ErrorContext";
import UserContext from "../contexts/UserContext";
import API from "../API";

function DefaultLayout(props) {
  const user = useContext(UserContext);
  return (
    <>
      <Navigation
        appName={props.appName}
        setAppName={props.setAppName}
        setActiveTab={props.setActiveTab}
        setDirty={props.setDirty}
        logout={props.logout}
      />
      <Container fluid className="below-nav vh-100">
        {user && (
          <NavTabs
            setActiveTab={props.setActiveTab}
            setDirty={props.setDirty}
          />
        )}
        {props.loading ? <LoadingLayout /> : <Outlet />}
      </Container>
    </>
  );
}

function FrontOfficeLayout(props) {
  return <PageTable pages={props.pages} activeTab={props.activeTab} />;
}

function BackOfficeLayout(props) {
  const location = useLocation();
  const { handleErrors } = useContext(ErrorContext);

  /**
   * This function calls the API to delete a page
   */
  const deletePage = (pageId) => {
    API.deletePage(pageId)
      .then(() => {
        props.setDirty(true);
        props.setMessage("Page deleted successfully");
      })
      .catch((err) => handleErrors(err));
  };

  return (
    <>
      <PageTable
        pages={props.pages}
        activeTab={props.activeTab}
        deletePage={deletePage}
      />
      <Link
        className="btn btn-primary btn-lg fixed-right-bottom"
        to="/add"
        state={{ nextpage: location.pathname }}
      >
        <i className="bi bi-file-earmark-plus" />
      </Link>
    </>
  );
}

function PageLayout(props) {
  const mode = props.mode;

  const location = useLocation();
  const user = useContext(UserContext);
  const { handleErrors } = useContext(ErrorContext);
  const { pageId } = useParams();

  // Back button destionation
  const nextpage = location.state?.nextpage || (user ? "/back-office" : "/");

  // Page to be displayed, if needed
  const [page, setPage] = useState(null);

  // List of users names
  const [users, setUsers] = useState(null);

  // List of image names
  const [images, setImages] = useState(null);

  // This useEffect is executed when a page action is requested
  useEffect(() => {
    if (mode === "edit" || mode === "add") {
      if (user.role === "admin") {
        // Get all users names to edit the page author
        API.getUsers()
          .then((users) => setUsers(users))
          .catch((err) => handleErrors(err));
      }
      API.getImages()
        .then((images) => setImages(images))
        .catch((err) => handleErrors(err));
    }
    if (pageId && (mode === "view" || mode === "edit")) {
      // Check that the requested page is in the page list
      API.getPage(pageId)
        .then((page) => setPage(page))
        .catch((err) => handleErrors(err));
    }
  }, [pageId, mode, user]);

  /**
   * This function calls the API to create a new page
   */
  const createPage = (page) => {
    API.createPage(page)
      .then(() => {
        props.setDirty(true);
        props.setMessage("Page created successfully");
      })
      .catch((err) => handleErrors(err));
  };

  /**
   * This function calls the API to edit an existing page
   */
  const editPage = (page) => {
    API.updatePage(page)
      .then(() => {
        props.setDirty(true);
        props.setMessage("Page updated successfully");
      })
      .catch((err) => handleErrors(err));
  };

  return (
    <Row className="justify-content-evenly">
      <Col md={2}>
        <Button as={Link} to={nextpage} onClick={() => props.setDirty(true)}>
          <i className="bi bi-arrow-left me-2" />Back
        </Button>
      </Col>
      <Col>
        {page && mode === "view" && <PageView page={page} />}
        {page && mode === "edit" && <PageForm page={page} users={users} images={images} editPage={editPage} />}
        {mode === "add" && <PageForm users={users} images={images} createPage={createPage} />}
      </Col>
      <Col md={2} />
    </Row>
  );
}

function LoginLayout(props) {
  return (
    <Row className="justify-content-evenly">
      <Col md={3}>
        <Button as={Link} to="/">
          <i className="bi bi-arrow-left me-2" />
          Back
        </Button>
      </Col>
      <Col>
        <Card className="mt-4">
          <Card.Header className="app-header">Login</Card.Header>
          <Card.Body>
            <LoginForm login={props.login} />
          </Card.Body>
        </Card>
      </Col>
      <Col md={3} />
    </Row>
  );
}

function LoadingLayout() {
  return (
    <Container
      fluid
      className="d-flex flex-column align-items-center justify-content-center"
      style={{ minHeight: "calc(100vh - 80px)" }}
    >
      <Row>
        <Col className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </Col>
      </Row>
    </Container>
  );
}

function NotFoundLayout() {
  return (
    <Container fluid>
      <Row className="vh-100 justify-content-center align-items-center">
        <Col>
          <h1 className="text-center">
            This is not the route you are looking for!
          </h1>
          <div className="text-center mt-4">
            <Link to="/">
              <Button variant="primary" size="lg">
                Go Back
              </Button>
            </Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export {
  DefaultLayout,
  FrontOfficeLayout,
  BackOfficeLayout,
  PageLayout,
  LoginLayout,
  LoadingLayout,
  NotFoundLayout,
};
