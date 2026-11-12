import React, { useState } from "react";
import { canMove } from "../workflow.js";

export default function Board({ bugs, data, actor, onOpen, onMove }) {
  const [dragged, setDragged] = useState(null);
  const [over, setOver] = useState(null);
  const [pending, setPending] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const allowed = (bug, status) => canMove(bug.status, status);
  const name = (table, id) => data[table].find((item) => item.id === id)?.name;

  async function persist(bug, status, details = {}) {
    setSaving(true);
    setError("");
    try {
      await onMove({ ...bug, ...details, status, actor_id: actor });
      setPending(null);
      setMessage(`BUG-${bug.id} moved to ${status}.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function move(bug, status) {
    setDragged(null);
    setOver(null);
    setError("");
    setMessage("");
    if (saving || bug.status === status) return;
    if (!allowed(bug, status)) {
      setError(
        `Cannot move from ${bug.status} to ${status}. Refresh the board and try again.`,
      );
      return;
    }
    if (
      (status !== "Reported" && !bug.assignee_id) ||
      (["Resolved", "Tested", "Closed"].includes(status) && !bug.resolution) ||
      status === "Reopened"
    ) {
      setPending({ bug, status });
    } else {
      persist(bug, status, { note: "Moved on the project board." });
    }
  }

  const draggedBug = bugs.find((bug) => bug.id === dragged);
  return (
    <section className="board-panel" aria-labelledby="board-title">
      <h2 id="board-title" className="sr-only">
        Ticket board
      </h2>
      <div className="board-guidance">
        <span aria-hidden="true">⠿</span> Drag left or right to any status{" "}
        <span className="guidance-divider">·</span> Use “Move to” for keyboard
        or touch{" "}
        <span className="board-scroll-hint">
          Hold near either edge to scroll ↔
        </span>
      </div>
      <p role="status" aria-live="polite" className="board-message">
        {saving ? "Saving ticket…" : message}
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div
        className="ticket-board"
        aria-busy={saving}
        onDragOver={(event) => {
          if (!dragged || saving) return;
          const board = event.currentTarget;
          const bounds = board.getBoundingClientRect();
          if (event.clientX < bounds.left + 65) board.scrollLeft -= 24;
          else if (event.clientX > bounds.right - 65) board.scrollLeft += 24;
        }}
      >
        {Object.keys(data.states).map((status) => {
          const tickets = bugs.filter((bug) => bug.status === status);
          const canDrop = draggedBug && allowed(draggedBug, status);
          return (
            <div
              key={status}
              data-status={status}
              className={`board-column ${canDrop ? "drop-allowed" : ""} ${over === status ? "drop-over" : ""}`}
              onDragOver={(event) => {
                if (draggedBug && !saving) {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = canDrop ? "move" : "none";
                  setOver(status);
                }
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget))
                  setOver(null);
              }}
              onDrop={(event) => {
                event.preventDefault();
                const id = Number(
                  event.dataTransfer.getData("application/x-bugflow-ticket"),
                );
                const bug = bugs.find((item) => item.id === id);
                if (bug) move(bug, status);
              }}
            >
              <h3>
                <span className="column-name">
                  <span className="status-dot" />
                  {status}
                </span>
                <span className="column-count">{tickets.length}</span>
              </h3>
              <div className="column-tickets">
                {tickets.map((bug) => (
                  <article
                    key={bug.id}
                    className={`ticket-card ${dragged === bug.id ? "dragging" : ""}`}
                    draggable={!saving && !pending}
                    onDragStart={(event) => {
                      event.dataTransfer.setData(
                        "application/x-bugflow-ticket",
                        String(bug.id),
                      );
                      event.dataTransfer.effectAllowed = "move";
                      setDragged(bug.id);
                    }}
                    onDragEnd={() => {
                      setDragged(null);
                      setOver(null);
                    }}
                  >
                    <div className="ticket-top">
                      <span>BUG-{String(bug.id).padStart(3, "0")}</span>
                      <span className={"priority priority-" + bug.priority}>
                        {bug.priority}
                      </span>
                    </div>
                    <button
                      className="ticket-title"
                      onClick={() => onOpen(bug)}
                    >
                      {bug.title}
                    </button>
                    <p className="ticket-project">
                      {name("projects", bug.project_id)} <span>/</span>{" "}
                      {name("modules", bug.module_id) || "Project wide"}
                    </p>
                    <div className="ticket-meta">
                      <span className={`badge ${bug.severity}`}>
                        {bug.severity}
                      </span>
                      <span
                        className="ticket-assignee"
                        title={name("users", bug.assignee_id) || "Unassigned"}
                      >
                        <span className="mini-avatar">
                          {name("users", bug.assignee_id)
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("") || "–"}
                        </span>
                        {name("users", bug.assignee_id)?.split(" ")[0] ||
                          "Unassigned"}
                      </span>
                    </div>
                    <label className="ticket-move">
                      Move to
                      <select
                        aria-label={`Move BUG-${bug.id} to status`}
                        value=""
                        disabled={saving || !!pending}
                        onChange={(event) => move(bug, event.target.value)}
                      >
                        <option value="">Choose status…</option>
                        {data.states[bug.status]
                          .filter((status) => allowed(bug, status))
                          .map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                      </select>
                    </label>
                  </article>
                ))}
                {!tickets.length && (
                  <div className="empty-column">
                    <span aria-hidden="true">⊞</span>
                    <p>Room for progress</p>
                    <small>Tickets will appear here</small>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {pending && (
        <div className="modalback">
          <div
            className="modal move-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="move-title"
          >
            <h2 id="move-title">
              Move BUG-{pending.bug.id} to {pending.status}
            </h2>
            <p>{pending.bug.title}</p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const values = Object.fromEntries(
                  new FormData(event.currentTarget),
                );
                persist(pending.bug, pending.status, {
                  ...values,
                  assignee_id:
                    Number(values.assignee_id) || pending.bug.assignee_id,
                  note: values.note || "Moved on the project board.",
                });
              }}
            >
              {pending.status !== "Reported" && !pending.bug.assignee_id && (
                <label>
                  Assign to
                  <select name="assignee_id" required defaultValue="" autoFocus>
                    <option value="" disabled>
                      Choose a team member
                    </option>
                    {data.users
                      .filter((user) => user.role !== "Tester")
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              {["Resolved", "Tested", "Closed"].includes(pending.status) &&
                !pending.bug.resolution && (
                  <label>
                    Resolution
                    <textarea
                      name="resolution"
                      required
                      autoFocus={!!pending.bug.assignee_id}
                    />
                  </label>
                )}
              <label>
                {pending.status === "Reopened"
                  ? "Reason for reopening"
                  : "Change note"}
                <textarea
                  name="note"
                  required={pending.status === "Reopened"}
                  autoFocus={pending.status === "Reopened"}
                />
              </label>
              {error && (
                <p role="alert" className="error">
                  {error}
                </p>
              )}
              <div className="toolbar">
                <button disabled={saving}>
                  {saving ? "Saving…" : "Move ticket"}
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={saving}
                  onClick={() => {
                    setPending(null);
                    setError("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
