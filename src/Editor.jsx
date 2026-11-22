import React,{useEffect,useState} from 'react';
import {api} from './api.js';
export default function Editor({ bug, data, actor, close, saved }) {
  const [f, F] = useState({ ...bug, note: "" }),
    [error, X] = useState(""),
    [saving, B] = useState(false),
    [tab, setTab] = useState("details");
  const history = data.history.filter((h) => h.bug_id === bug.id);
  const change = (k, v) =>
    F((x) => ({
      ...x,
      [k]: v,
      ...(k === "project_id" ? { module_id: null } : {}),
    }));
  useEffect(() => {
    const key = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [close]);
  const field = (k, title, area = false) => (
    <label>
      {title}
      {area ? (
        <textarea
          name={k}
          required
          maxLength={5000}
          value={f[k] || ""}
          onChange={(e) => change(k, e.target.value)}
        />
      ) : (
        <input
          name={k}
          required
          maxLength={200}
          value={f[k] || ""}
          onChange={(e) => change(k, e.target.value)}
        />
      )}
    </label>
  );
  const select = (k, title, items) => (
    <label>
      {title}
      <select
        value={f[k] ?? ""}
        onChange={(e) =>
          change(
            k,
            ["project_id", "module_id", "assignee_id"].includes(k)
              ? Number(e.target.value) || null
              : e.target.value,
          )
        }
      >
        {items.map((x) => (
          <option key={x.id ?? x} value={x.id ?? x}>
            {x.name ?? x}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <div className="modalback">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
      >
        <div className="toolbar">
          <h2 id="editor-title" style={{ flex: 1 }}>
            {bug.id
              ? "BUG-" + bug.id + " · Details and lifecycle"
              : "Report a bug"}
          </h2>
          <button type="button" className="secondary" onClick={close}>
            Close
          </button>
        </div>
        <div
          className="editor-tabs"
          role="tablist"
          aria-label="Ticket information"
          onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
              return;
            event.preventDefault();
            const next =
              event.key === "Home"
                ? "details"
                : event.key === "End"
                  ? "history"
                  : tab === "details"
                    ? "history"
                    : "details";
            setTab(next);
            event.currentTarget.querySelector(`#ticket-tab-${next}`).focus();
          }}
        >
          <button
            type="button"
            role="tab"
            id="ticket-tab-details"
            aria-controls="ticket-panel-details"
            aria-selected={tab === "details"}
            tabIndex={tab === "details" ? 0 : -1}
            onClick={() => setTab("details")}
          >
            Details
          </button>
          <button
            type="button"
            role="tab"
            id="ticket-tab-history"
            aria-controls="ticket-panel-history"
            aria-selected={tab === "history"}
            tabIndex={tab === "history" ? 0 : -1}
            onClick={() => setTab("history")}
          >
            Change history <span className="total-pill">{history.length}</span>
          </button>
        </div>
        <div
          id="ticket-panel-details"
          role="tabpanel"
          aria-labelledby="ticket-tab-details"
          hidden={tab !== "details"}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              B(true);
              try {
                await api("bugs", { ...f, actor_id: actor });
                await saved();
              } catch (e) {
                X(e.message);
              } finally {
                B(false);
              }
            }}
          >
            {field("title", "Bug title")}
            <div className="grid">
              {select("project_id", "Software project", data.projects)}
              {select("module_id", "Program module", [
                { id: "", name: "Project wide" },
                ...data.modules.filter(
                  (m) => m.project_id === Number(f.project_id),
                ),
              ])}
            </div>
            {field("description", "Description", true)}
            <div className="grid">
              {field("steps", "Steps to reproduce", true)}
              {field("expected", "Expected result", true)}
              {field("actual", "Actual result", true)}
              {field("environment", "Environment and version", true)}
              {select("type", "Bug type", data.types)}
              {select("severity", "Severity", data.severities)}
              {select("priority", "Priority", data.priorities)}
              {select("assignee_id", "Assignee", [
                { id: "", name: "Unassigned" },
                ...data.users.filter((u) => u.role !== "Tester"),
              ])}
              {select(
                "status",
                "Status",
                bug.id
                  ? [bug.status, ...data.states[bug.status]]
                  : ["Reported"],
              )}
            </div>
            <label>
              Resolution
              <textarea
                value={f.resolution || ""}
                onChange={(e) => change("resolution", e.target.value)}
              />
            </label>
            <label>
              Change note or reopening reason
              <textarea
                value={f.note}
                onChange={(e) => change("note", e.target.value)}
              />
            </label>
            <p role="alert" className="error">
              {error}
            </p>
            <button disabled={saving}>{saving ? "Saving…" : "Save bug"}</button>
          </form>
        </div>
        <div
          id="ticket-panel-history"
          role="tabpanel"
          aria-labelledby="ticket-tab-history"
          hidden={tab !== "history"}
          tabIndex={0}
        >
          {history.length ? (
            <>
              <p className="history-intro">
                Saved updates, newest first. Unsaved edits appear here after
                saving.
              </p>
              {history.map((h) => (
                <div className="history" key={h.id}>
                  <b>{h.actor}</b> ·{" "}
                  <time dateTime={h.timestamp}>{h.timestamp}</time>
                  <pre>
                    {Object.entries(JSON.parse(h.changes))
                      .map(
                        ([k, v]) => `${k}: ${v.from ?? "—"} → ${v.to ?? "—"}`,
                      )
                      .join("\n")}
                  </pre>
                  {h.note && <p>{h.note}</p>}
                </div>
              ))}
            </>
          ) : (
            <div className="history-empty">
              <h3>No changes yet</h3>
              <p>
                {bug.id
                  ? "Updates to this ticket will appear here."
                  : "Save this ticket to start its change history."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
