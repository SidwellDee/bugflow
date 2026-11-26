import Icon from "./Icon.jsx";
import React, { useEffect, useState } from "react";
import { getBugPage, pageNumbers } from "./bug-register-data.js";
import "./bug-register.css";

export default function BugRegister({ bugs, data, onOpen, onCreate }) {
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [severity, setSeverity] = useState(""),
    [assignee, setAssignee] = useState(0),
    [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(10);
  const result = getBugPage({
    bugs,
    search,
    status,
    severity,
    assignee,
    page,
    pageSize,
  });
  useEffect(() => {
    if (page !== result.page) setPage(result.page);
  }, [page, result.page]);
  const name = (table, id) =>
    data[table].find((item) => item.id === id)?.name || "Unassigned";
  const filter = (set, value) => {
    set(value);
    setPage(1);
  };
  return (
    <section className="bug-register-panel" aria-label="Bug register">
      <div className="toolbar">
        <input
          className="register-search"
          placeholder="Search title or bug ID"
          aria-label="Search bugs"
          value={search}
          onChange={(event) => filter(setSearch, event.target.value)}
        />
        <select
          aria-label="Status filter"
          value={status}
          onChange={(event) => filter(setStatus, event.target.value)}
        >
          <option value="">All statuses</option>
          {Object.keys(data.states).map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
        <select
          aria-label="Severity filter"
          value={severity}
          onChange={(event) => filter(setSeverity, event.target.value)}
        >
          <option value="">All severities</option>
          {data.severities.map((severity) => (
            <option key={severity}>{severity}</option>
          ))}
        </select>
        <select
          aria-label="Assignee filter"
          value={assignee}
          onChange={(event) =>
            filter(setAssignee, parseInt(event.target.value, 10))
          }
        >
          <option value="">All users</option>
          {data.users.map((user) => (
            <option value={user.id} key={user.id}>
              {user.name}
            </option>
          ))}
        </select>
        <button className="register-create" onClick={onCreate}>
          <Icon name="plus" /> New ticket
        </button>
      </div>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              {[
                "ID / Title",
                "Module",
                "Status",
                "Severity",
                "Priority",
                "Assignee",
              ].map((label) => (
                <th key={label} scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((bug) => (
              <tr key={bug.id} onClick={() => onOpen(bug)}>
                <td>
                  <span className="muted">
                    #{String(bug.id).padStart(3, "0")}
                  </span>
                  <br />
                  <button className="buglink" onClick={() => onOpen(bug)}>
                    {bug.title}
                  </button>
                </td>
                <td>
                  {bug.module_id
                    ? name("modules", bug.module_id)
                    : "Project wide"}
                </td>
                <td>
                  <span className={"badge " + bug.status}>{bug.status}</span>
                </td>
                <td>
                  <span className={"badge " + bug.severity}>
                    {bug.severity}
                  </span>
                </td>
                <td>{bug.priority}</td>
                <td>{name("users", bug.assignee_id)}</td>
              </tr>
            ))}
            {!result.rows.length && (
              <tr>
                <td colSpan={6} className="register-empty">
                  {bugs.length
                    ? "No tickets match your search or filters."
                    : "No tickets in this project yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="register-pagination">
        <div className="pagination-summary" role="status" aria-live="polite">
          {result.total
            ? `Showing ${result.from}–${result.to} of ${result.total} tickets`
            : "0 tickets"}
          {result.total !== bugs.length && (
            <span> · {bugs.length} in project</span>
          )}
        </div>
        <label className="page-size-label">
          Rows per page
          <select
            aria-label="Rows per page"
            value={pageSize}
            onChange={(event) =>
              filter(setPageSize, Number(event.target.value))
            }
          >
            {[10, 25, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <nav
          className="pagination-controls"
          aria-label="Bug register pagination"
        >
          <button
            type="button"
            aria-label="Previous page"
            disabled={result.page === 1}
            onClick={() => setPage(result.page - 1)}
          >
            <Icon name="previous" /> <span>Previous</span>
          </button>
          {pageNumbers(result.page, result.pageCount).map((item) =>
            typeof item === "number" ? (
              <button
                type="button"
                key={item}
                aria-label={`Page ${item}`}
                aria-current={result.page === item ? "page" : undefined}
                className={result.page === item ? "current-page" : ""}
                onClick={() => setPage(item)}
              >
                {item}
              </button>
            ) : (
              <span key={item} className="page-ellipsis" aria-hidden="true">
                …
              </span>
            ),
          )}
          <button
            type="button"
            aria-label="Next page"
            disabled={result.page === result.pageCount}
            onClick={() => setPage(result.page + 1)}
          >
            <span>Next</span> <Icon name="next" />
          </button>
        </nav>
      </div>
    </section>
  );
}
