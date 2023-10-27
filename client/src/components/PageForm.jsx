import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Card, Col, Dropdown, DropdownButton, FloatingLabel, Form, Row, Stack } from "react-bootstrap";
import { ImageBlock } from "./PageBlocks";
import { ImagePicker } from "./ImagePicker";

import UserContext from "../contexts/UserContext";

import dayjs from "dayjs";
import validator from "validator";

function PageForm(props) {
  const page = props.page || null;
  
  const navigate = useNavigate();
  const user = useContext(UserContext);

  // Form fields
  const [title, setTitle] = useState(page ? page.title : "");
  const [author, setAuthor] = useState(page ? page.author : { name: user.name, username: user.username });
  const [publicationDate, setPublicationDate] = useState(page ? dayjs(page.publicationDate).format("YYYY-MM-DD") : "");
  const [blocks, setBlocks] = useState(page ? page.blocks : []);

  // Form errors
  const [titleError, setTitleError] = useState("");
  const [dateError, setDateError] = useState("");
  const [blocksError, setBlocksError] = useState("");

  // Utility states
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imageBlockToEdit, setImageBlockToEdit] = useState(null);

  /**
   * This function creates a new empty header block
   */
  const addHeaderBlock = () => {
    const newBlock = {
      type: "header",
      content: "",
      position: blocks.length + 1,
    };
    setBlocks((blocks) => [...blocks, newBlock]);
    setBlocksError("");
  };

  /**
   * This function creates a new empty paragraph block
   */
  const addParagraphBlock = () => {
    const newBlock = {
      type: "paragraph",
      content: "",
      position: blocks.length + 1,
    };
    setBlocks((blocks) => [...blocks, newBlock]);
    setBlocksError("");
  };

  /**
   * This function creates a new image block given the selected image
   */
  const addImageBlock = (imageUrl) => {
    const newBlock = {
      type: "image",
      content: imageUrl,
      position: blocks.length + 1,
    };
    setBlocks((blocks) => [...blocks, newBlock]);
    setBlocksError("");
  };

  /**
   * This function edits the content of a block given its position
   */
  const editBlock = (pos, newContent) => {
    setBlocks((prevBlocks) =>
      prevBlocks.map((block) =>
        block.position === pos ? { ...block, content: newContent } : block
      )
    );
    setBlocksError("");
  };

  /**
   * This function deletes any block given its position
   */
  const removeBlock = (pos) => {
    setBlocks((prevBlocks) => {
      const updatedBlocks = prevBlocks.filter((b) => b.position !== pos);
      const finalBlocks = updatedBlocks.map((b) => {
        if (b.position > pos) {
          return { ...b, position: b.position - 1 };
        }
        return b;
      });
      return finalBlocks;
    });
    setBlocksError("");
  };

  /**
   * This function changes the position of a block by switching it
   * with the block above itself
   */
  const handleMoveUpBlock = (pos) => {
    if (pos > 1) {
      const index = pos - 1;
      const newBlocks = [...blocks];
      [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
      newBlocks[index].position += 1;
      newBlocks[index - 1].position -= 1;
      setBlocks(newBlocks);
    }
  };

  /**
   * This function changes the position of a block by switching it
   * with the block below itself
   */
  const handleMoveDownBlock = (pos) => {
    if (pos < blocks.length) {
      const index = pos - 1;
      const newBlocks = [...blocks];
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      newBlocks[index].position -= 1;
      newBlocks[index + 1].position += 1;
      setBlocks(newBlocks);
    }
  };

  const validateForm = () => {
    const errors = { title: "", date: "", blocks: "" };

    // Check title 
    if (validator.isEmpty(title)) {
      errors.title = "Please provide a title for the page";
    }
    // Check publication date
    if (page && publicationDate !== "" && dayjs(publicationDate).isBefore(dayjs(page.creationDate))) {
      errors.date = "Publication date must be after the creation date";
    } else if (!page && publicationDate !== "" && dayjs(publicationDate).isBefore(dayjs())) {
      errors.date = "Publication date must be after the creation date (today)";
    }
    // Check blocks
    if (blocks.length < 2) {
      errors.blocks = "You must add at least two blocks";
    } else if (!blocks.some((b) => b.type === "header")) {
      errors.blocks = "You must add at least a header block";
    } else if (!blocks.some((b) => b.type === "paragraph" || b.type === "image")) {
      errors.blocks = "You must add at least a paragraph block or an image block";
    } else if (blocks.some((b) => b.type !== "image" && b.content === "")) {
      errors.blocks = "Text blocks cannot be empty";
    }
    return errors;
  };

  /**
   * This function checks for errors and submits the
   * page form with all its blocks
   */
  const handleSubmit = (event) => {
    event.preventDefault();

    // Validate form
    const errors = validateForm();
    if (errors.title !== "" || errors.blocks !== "" || errors.date !== "") {
      setTitleError(errors.title);
      setDateError(errors.date);
      setBlocksError(errors.blocks);
      return;
    }

    // Submit form
    const page = {
      title: title.trim(),
      authorUsername: author.username,
      publicationDate: publicationDate,
      blocks: blocks,
    };
    if (props.page) {
      // Edit page
      page.id = props.page.id;
      page.creationDate = props.page.creationDate;
      props.editPage(page);
    } else {
      // Create page
      props.createPage(page);
    }
    navigate("/back-office");
  };

  return (
    <>
      <ImagePicker
        images={props.images}
        show={showImagePicker}
        blockToEdit={imageBlockToEdit}
        addImageBlock={addImageBlock}
        editBlock={editBlock}
        onHide={() => {
          setShowImagePicker(false);
          setImageBlockToEdit(null);
        }}
      />
      <Card className="my-4">
        <Card.Header className="app-header">
          {page ? "Edit Page" : "New Page"}
        </Card.Header>
        <Card.Body>
          <Form noValidate onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="bold-text">Author</Form.Label>
              {props.users ? (
                <Form.Select
                  disabled={user.role !== "admin"}
                  value={author.username}
                  onChange={(event) => {
                    const selectedUser = props.users.find((user) => user.username === event.target.value);
                    setAuthor({ name: selectedUser.name, username: selectedUser.username });
                  }}
                >
                  {props.users.map((user, idx) => (
                    <option key={idx} value={user.username}>
                      {user.name + " (@" + user.username + ")"}
                    </option>
                  ))}
                </Form.Select>
              ) : (
                <Form.Control
                  disabled
                  type="text"
                  value={author.name + " (@" + author.username + ")"}
                />
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="bold-text">Title</Form.Label>
              <Form.Control
                type="text"
                value={title}
                isInvalid={!!titleError}
                autoFocus
                onChange={(event) => {
                  setTitle(event.target.value);
                  setTitleError("");
                }}
              />
              <Form.Control.Feedback type="invalid">
                {titleError}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="bold-text">
                Publication Date <span className="light-text">(optional)</span>
              </Form.Label>
              <Form.Control
                type="date"
                value={publicationDate}
                isInvalid={!!dateError}
                onChange={(event) => {
                  setPublicationDate(event.target.value);
                  setDateError("");
                }}
              />
              <Form.Control.Feedback type="invalid">
                {dateError}
              </Form.Control.Feedback>
            </Form.Group>

            {page && (
              <Form.Group className="mb-4">
                <Form.Label className="bold-text">Creation Date</Form.Label>
                <Form.Control
                  type="date"
                  disabled
                  value={dayjs(page.creationDate).format("YYYY-MM-DD")}
                />
              </Form.Group>
            )}

            <hr />

            <Row className="my-4">
              <Col>
                <DropdownButton
                  title="Add Block "
                  variant="success"
                  id="vertical-dropdown-blocks"
                >
                  <Dropdown.Item onClick={addHeaderBlock}>Header</Dropdown.Item>
                  <Dropdown.Item onClick={addParagraphBlock}>
                    Paragraph
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setShowImagePicker(true)}>
                    Image
                  </Dropdown.Item>
                </DropdownButton>
              </Col>
              <Col className="d-flex justify-content-end">
                <Button type="submit">
                  {page ? "Save Page" : "Create Page"}
                </Button>
              </Col>
            </Row>

            {blocks.map((block) => {
              switch (block.type) {
                case "header":
                  return (
                    <Row key={block.position} className="align-items-center">
                      <Col>
                        <FloatingLabel label="Header" className="mb-3">
                          <Form.Control
                            as="textarea"
                            value={block.content}
                            onChange={(event) => editBlock(block.position, event.target.value)}
                          />
                        </FloatingLabel>
                      </Col>
                      <Col xs="auto">
                        <Stack direction="horizontal" gap={2} className="mb-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleMoveUpBlock(block.position)}
                          >
                            <i className="bi bi-arrow-up-circle" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleMoveDownBlock(block.position)}
                          >
                            <i className="bi bi-arrow-down-circle" />
                          </Button>
                          <div className="vr" />
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => removeBlock(block.position)}
                          >
                            <i className="bi bi-trash" />
                          </Button>
                        </Stack>
                      </Col>
                    </Row>
                  );
                case "paragraph":
                  return (
                    <Row key={block.position} className="align-items-center">
                      <Col>
                        <FloatingLabel
                          key={block.id}
                          label="Paragraph"
                          className="mb-3"
                        >
                          <Form.Control
                            as="textarea"
                            value={block.content}
                            style={{ height: "100px" }}
                            onChange={(event) => editBlock(block.position, event.target.value)}
                          />
                        </FloatingLabel>
                      </Col>
                      <Col xs="auto">
                        <Stack direction="horizontal" gap={2} className="mb-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleMoveUpBlock(block.position)}
                          >
                            <i className="bi bi-arrow-up-circle" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleMoveDownBlock(block.position)}
                          >
                            <i className="bi bi-arrow-down-circle" />
                          </Button>
                          <div className="vr" />
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => removeBlock(block.position)}
                          >
                            <i className="bi bi-trash" />
                          </Button>
                        </Stack>
                      </Col>
                    </Row>
                  );
                case "image":
                  return (
                    <Row key={block.position} className="align-items-center">
                      <Col>
                        <ImageBlock imageUrl={block.content} />
                      </Col>
                      <Col xs="auto">
                        <Stack direction="horizontal" gap={2} className="mb-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setShowImagePicker(true);
                              setImageBlockToEdit(block);
                            }}
                          >
                            <i className="bi bi-pencil-square" />
                          </Button>
                          <div className="vr" />
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleMoveUpBlock(block.position)}
                          >
                            <i className="bi bi-arrow-up-circle" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleMoveDownBlock(block.position)}
                          >
                            <i className="bi bi-arrow-down-circle" />
                          </Button>
                          <div className="vr" />
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => removeBlock(block.position)}
                          >
                            <i className="bi bi-trash" />
                          </Button>
                        </Stack>
                      </Col>
                    </Row>
                  );
                default:
                  return null;
              }
            })}
          </Form>
        </Card.Body>
      </Card>
      {blocksError !== "" && (
        <Alert dismissible variant="danger" onClose={() => setBlocksError("")}>
          {blocksError}
        </Alert>
      )}
    </>
  );
}

export { PageForm };
