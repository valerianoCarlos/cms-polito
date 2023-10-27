import { Badge, Card } from "react-bootstrap";
import { HeaderBlock, ImageBlock, ParagraphBlock } from "./PageBlocks";

import dayjs from "dayjs";

function PageView(props) {
  const page = props.page;

  const statusMap = {
    published: {
      label: "Published",
      bg: "success",
    },
    draft: {
      label: "Draft",
      bg: "danger",
    },
    programmed: {
      label: "Programmed",
      bg: "warning",
    },
  };
  const { label, bg } = statusMap[page.status];

  return (
    <Card className="my-4">
      <Card.Header className="app-header">{page.title}</Card.Header>
      <Card.Body>
        <Card.Text>
          {`Written by: ${page.author.name} (@${page.author.username})`}
        </Card.Text>
        <Card.Text>
          {"Created on: " + dayjs(page.creationDate).format("MMMM DD, YYYY")}
        </Card.Text>
        {page.publicationDate !== "" && (
          <Card.Text>
            {"Publication date: " + dayjs(page.publicationDate).format("MMMM DD, YYYY")}
          </Card.Text>
        )}
        <Card.Text>
          Page status:
          <Badge className="ms-2" pill bg={bg}>{label}</Badge>
        </Card.Text>
        <hr />
        {page.blocks.map((block) => {
          switch (block.type) {
            case "header":
              return <HeaderBlock key={block.id} content={block.content} />;
            case "paragraph":
              return <ParagraphBlock key={block.id} content={block.content} />;
            case "image":
              return <ImageBlock key={block.id} imageUrl={block.content} />;
            default:
              return null;
          }
        })}
      </Card.Body>
    </Card>
  );
}

export { PageView };
