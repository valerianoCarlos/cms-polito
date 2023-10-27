import { useContext } from "react";
import { Badge, Button, Stack, Table } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";

import UserContext from "../contexts/UserContext";

function PageTable(props) {
  const pages = props.pages;
  const headers = ["Title", "Author", "Creation Date", "Publication Date", "Status"];

  return (
    <div className="my-table">
      <Table striped responsive="lg">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index}>{header}</th>
            ))}
            {props.activeTab === 2 && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {pages.map((page) => (
            <PageRow
              key={page.id}
              page={page}
              activeTab={props.activeTab}
              deletePage={props.activeTab === 2 ? props.deletePage : null}
            />
          ))}
        </tbody>
      </Table>
    </div>
  );
}

function PageRow(props) {
  const page = props.page;
  const user = useContext(UserContext);
  const location = useLocation();
  const navigate = useNavigate();

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
    <tr>
      <td>
        <i className="bi bi-file-earmark-text me-2" />
        <Link to={"/pages/" + page.id} state={{ nextpage: location.pathname }}>
          {page.title}
        </Link>
      </td>
      <td>{page.author.name}</td>
      <td>{page.creationDate}</td>
      <td>{page.publicationDate}</td>
      <td>
        <Badge pill bg={bg}>
          {label}
        </Badge>
      </td>
      {props.activeTab === 2 && (
        <td>
          <Stack direction="horizontal" gap={2} className="ms-1">
            <Button
              variant="secondary"
              size="sm"
              disabled={user?.role !== "admin" && user?.username !== page.author.username}
              onClick={() => navigate(`/edit/${page.id}`)}
            >
              <i className="bi bi-pencil-square" />
            </Button>
            <div className="vr" />
            <Button
              variant="danger"
              size="sm"
              disabled={user?.role !== "admin" && user?.username !== page.author.username}
              onClick={() => props.deletePage(page.id)}
            >
              <i className="bi bi-trash" />
            </Button>
          </Stack>
        </td>
      )}
    </tr>
  );
}

export { PageTable, PageRow };
