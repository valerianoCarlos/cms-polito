import { Card, Image } from "react-bootstrap";

function HeaderBlock(props) {
  return (
    <Card className="mb-2">
      <Card.Body>
        <Card.Title>{props.content}</Card.Title>
      </Card.Body>
    </Card>
  );
}

function ParagraphBlock(props) {
  return (
    <Card className="mb-2">
      <Card.Body>
        <Card.Text>{props.content}</Card.Text>
      </Card.Body>
    </Card>
  );
}

function ImageBlock(props) {
  const SERVER_URL = "http://localhost:3001/static/";
  return (
    <Card className="mb-2">
      <Card.Body>
        <Image
          src={SERVER_URL + props.imageUrl}
          alt={props.imageUrl}
          className="my-image"
          fluid
        />
      </Card.Body>
    </Card>
  );
}

export { HeaderBlock, ParagraphBlock, ImageBlock };
