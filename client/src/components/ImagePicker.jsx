import { useState } from "react";
import { Button, Col, Container, Modal, Row, Card } from "react-bootstrap";

function ImagePicker(props) {
  const SERVER_URL = "http://localhost:3001/static/";

  const images = props.images || [];
  const blockToEdit = props.blockToEdit || null;

  // Name of the image currently selected
  const [selectedImage, setSelectedImage] = useState(blockToEdit && blockToEdit.content);

  const handleSelect = () => {
    if (blockToEdit && selectedImage !== blockToEdit.content) {
      // Edit block only if new image is different from old image
      props.editBlock(blockToEdit.position, selectedImage);
    } else if (!blockToEdit && selectedImage) {
      // Add new image block
      props.addImageBlock(selectedImage);
    }
    // Hide modal
    props.onHide();
  };

  const handleShow = () => {
    setSelectedImage(blockToEdit && blockToEdit.content);
  };

  return (
    <Modal
      show={props.show}
      onShow={handleShow}
      onHide={props.onHide}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          Pick an image
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Container>
          <Row>
            {images.map((imageUrl) => (
              <Col key={imageUrl} xs={6} sm={4} md={3} lg={2} xl={2}>
                <Card
                  className={`clickable ${selectedImage === imageUrl ? "custom-border" : ""}`}
                  border={selectedImage === imageUrl ? "primary" : undefined}
                  onClick={() => setSelectedImage(imageUrl)}
                >
                  <Card.Img src={SERVER_URL + imageUrl} />
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <Button disabled={!selectedImage} onClick={handleSelect}>
          Select
        </Button>
        <Button variant="danger" onClick={props.onHide}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export { ImagePicker };
