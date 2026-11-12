import React, { useEffect, useState } from "react";
import Board from "./Board.jsx";
import { AccountGate, Team } from "./Accounts.jsx";
import { createRoot } from "react-dom/client";
import "./style.css";
async function api(path, body) {
  const r = await fetch(
    "/api/" + path,
    body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {},
  );
  const d = await r.json();
  if (!r.ok) throw Error(d.error);
  return d;
}
const Badge = ({ v }) => <span className={"badge " + v}>{v}</span>;
function App({ user, logout, onProfile }) {
  const actor = user.id;
  const [data, D] = useState(null),
    [page, P] = useState("Dashboard"),
    [project, Q] = useState(""),
    [edit, E] = useState(null),
    [search, S] = useState(""),
    [status, T] = useState(""),
    [severity, V] = useState(""),
    [error, X] = useState("");
  const load = async () => D(await api("data"));
  useEffect(() => {
    load().catch((e) => X(e.message));
  }, []);
  if (!data) return <main>{error || "Loading BugFlow…"}</main>;
  const name = (t, id) =>
      data[t].find((x) => x.id === id)?.name || "Unassigned",
    bugs = data.bugs.filter(
      (b) => !project || b.project_id === Number(project),
    ),
    out = (b) => !["Resolved", "Tested", "Closed"].includes(b.status),
    counts = [
      ["Reported total", bugs.length],
      [
        "Resolved / tested",
        bugs.filter((b) => ["Resolved", "Tested"].includes(b.status)).length,
      ],
      ["Outstanding", bugs.filter(out).length],
      ["Reopened now", bugs.filter((b) => b.status === "Reopened").length],
      ["Closed", bugs.filter((b) => b.status === "Closed").length],
    ];
  const cards = (
    <div className="cards">
      {counts.map(([n, v], i) => (
        <div className="card" key={n}>
          <div className="metric-label">
            <span className={"metric-dot metric-" + i} />
            {n}
          </div>
          <b>{v}</b>
          <span className="metric-caption">
            {i === 0
              ? "Across selected projects"
              : i === 1
                ? "Ready for verification"
                : i === 2
                  ? "Work still to complete"
                  : i === 3
                    ? "Returned for another look"
                    : "Verified and completed"}
          </span>
        </div>
      ))}
    </div>
  );
  const chart = (key, values) =>
    values.map((v) => {
      const n = bugs.filter((b) => b[key] === v).length;
      return (
        <div key={v}>
          {v}
          <span style={{ float: "right" }}>{n}</span>
          <div className="bar">
            <i
              style={{
                width: (bugs.length ? (n / bugs.length) * 100 : 0) + "%",
              }}
            />
          </div>
        </div>
      );
    });
  const table = (list) => (
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
            ].map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((b) => (
            <tr key={b.id}>
              <td>
                <span className="muted">
                  BUG-{String(b.id).padStart(3, "0")}
                </span>
                <br />
                <button className="buglink" onClick={() => E(b)}>
                  {b.title}
                </button>
              </td>
              <td>
                {b.module_id ? name("modules", b.module_id) : "Project wide"}
              </td>
              <td>
                <Badge v={b.status} />
              </td>
              <td>
                <Badge v={b.severity} />
              </td>
              <td>{b.priority}</td>
              <td>{name("users", b.assignee_id)}</td>
            </tr>
          ))}
          {!list.length && (
            <tr>
              <td colSpan={6}>No matching bugs.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
  const report = () =>
    E({
      project_id: Number(project) || data.projects[0]?.id,
      status: "Reported",
      type: "Functional",
      severity: "Medium",
      priority: "P2",
    });
  return (
    <>
      <header className="app-header">
        <a className="brand" href="/" aria-label="BugFlow home">
          <span className="brand-mark">b</span>
          <strong>
            bugflow<span>.</span>
          </strong>
        </a>
        <div className="header-context">
          Workspace <span>/</span> Project quality
        </div>
        <div className="member-control">
          <span className="avatar">
            {data.users
              .find((u) => u.id === actor)
              ?.name.split(" ")
              .map((n) => n[0])
              .join("")}
          </span>
          <div className="signed-in-user">
            <strong>{user.name}</strong>
            <span>{user.role}</span>
          </div>
          <button className="secondary" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>
      <main>
        <div className="page-heading">
          <div>
            <span className="eyebrow">YOUR WORKSPACE, IN FOCUS</span>
            <h1>
              {page === "Dashboard"
                ? "Project overview"
                : page === "Bug register"
                  ? "Bug register"
                  : page === "Reports"
                    ? "Project insights"
                    : page === "Team & Gmail"
                      ? "Team & Gmail"
                      : "Projects & modules"}
            </h1>
            <p>
              {page === "Dashboard"
                ? "A clear view of every issue, from first report to final fix."
                : page === "Bug register"
                  ? "Find the details. Keep every issue moving."
                  : page === "Reports"
                    ? "Understand progress and see where your team needs support."
                    : page === "Team & Gmail"
                      ? "Your account, team and email connections."
                      : "Keep your software systems and their modules organised."}
            </p>
          </div>
          <div className="project-control">
            <label htmlFor="project-filter">Project</label>
            <select
              id="project-filter"
              value={project}
              onChange={(e) => Q(e.target.value)}
            >
              <option value="">All projects</option>
              {data.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="navigation-row">
          <nav aria-label="Workspace pages">
            {[
              "Dashboard",
              "Bug register",
              "Projects & modules",
              "Reports",
              "Team & Gmail",
            ].map((p, i) => (
              <button
                key={p}
                className={page === p ? "active" : ""}
                aria-current={page === p ? "page" : undefined}
                onClick={() => P(p)}
              >
                <span className="nav-symbol" aria-hidden="true">
                  {["▦", "☷", "▱", "◷", "♙"][i]}
                </span>
                {p}
              </button>
            ))}
          </nav>
          <span className="demo-label">
            <span />
            Team workspace
          </span>
        </div>
        {page === "Dashboard" && (
          <>
            {cards}
            <div className="toolbar board-toolbar">
              <div>
                <h2>
                  Issue board <span className="total-pill">{bugs.length}</span>
                </h2>
                <p>Keep work moving, one ticket at a time.</p>
              </div>
              <button onClick={report}>
                <span aria-hidden="true">＋</span> New ticket
              </button>
            </div>
            <Board
              bugs={bugs}
              data={data}
              actor={actor}
              onOpen={E}
              onMove={async (ticket) => {
                await api("bugs", ticket);
                await load();
              }}
            />
          </>
        )}
        {page === "Bug register" && (
          <section>
            <div className="toolbar">
              <input
                aria-label="Search bugs"
                placeholder="Search title or bug ID"
                style={{ width: 240 }}
                value={search}
                onChange={(e) => S(e.target.value)}
              />
              <select
                aria-label="Status filter"
                value={status}
                onChange={(e) => T(e.target.value)}
              >
                <option value="">All statuses</option>
                {Object.keys(data.states).map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
              <select
                aria-label="Severity filter"
                value={severity}
                onChange={(e) => V(e.target.value)}
              >
                <option value="">All severities</option>
                {data.severities.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
              <button onClick={report}>+ Report bug</button>
            </div>
            {table(
              bugs.filter(
                (b) =>
                  (!status || b.status === status) &&
                  (!severity || b.severity === severity) &&
                  `${b.id} ${b.title}`
                    .toLowerCase()
                    .includes(search.toLowerCase()),
              ),
            )}
          </section>
        )}
        {page === "Projects & modules" && (
          <>
            <div className="grid">
              <Register kind="projects" data={data} load={load} />
              <Register kind="modules" data={data} load={load} />
            </div>
            <section>
              <h2>Registered systems</h2>
              {data.projects.map((p) => (
                <div key={p.id}>
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                  <p>
                    {data.modules
                      .filter((m) => m.project_id === p.id)
                      .map((m) => (
                        <React.Fragment key={m.id}>
                          <Badge v={m.name} />{" "}
                        </React.Fragment>
                      ))}
                  </p>
                </div>
              ))}
            </section>
          </>
        )}
        {page === "Reports" && (
          <>
            {cards}
            <section>
              <h2>Project summary</h2>
              <p>
                {
                  bugs.filter((b) =>
                    data.history.some(
                      (h) =>
                        h.bug_id === b.id &&
                        JSON.parse(h.changes).status?.to === "Reopened",
                    ),
                  ).length
                }{" "}
                bugs have a recorded reopened event, including demonstration
                snapshots.
              </p>
              <a className="button" href="/api/export" download>
                Export all projects CSV
              </a>
              <p className="muted">
                Export includes every project regardless of filter. Timestamps
                are UTC.
              </p>
              {chart("status", Object.keys(data.states))}
            </section>
            <section>
              <h2>Developer workload</h2>
              {data.users
                .filter((u) => u.role !== "Tester")
                .map((u) => (
                  <p key={u.id}>
                    {u.name} —{" "}
                    {
                      bugs.filter((b) => b.assignee_id === u.id && out(b))
                        .length
                    }{" "}
                    outstanding
                  </p>
                ))}
            </section>
          </>
        )}
        {page === "Team & Gmail" && <Team user={user} onProfile={onProfile} />}
      </main>
      <footer className="app-footer">
        <span>BugFlow · A little clarity for every fix.</span>
        <span>Signed in securely · Changes are saved locally</span>
      </footer>
      {edit && (
        <Editor
          key={edit.id || "new"}
          bug={edit}
          data={data}
          actor={actor}
          close={() => E(null)}
          saved={async () => {
            await load();
            E(null);
          }}
        />
      )}
    </>
  );
}
function Register({ kind, data, load }) {
  const [error, X] = useState("");
  return (
    <section>
      <h2>
        Register {kind === "projects" ? "software project" : "program module"}
      </h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const f = e.currentTarget,
            d = Object.fromEntries(new FormData(f));
          if (d.project_id) d.project_id = Number(d.project_id);
          try {
            await api(kind, d);
            f.reset();
            X("");
            await load();
          } catch (e) {
            X(e.message);
          }
        }}
      >
        {kind === "modules" && (
          <label>
            Project
            <select name="project_id">
              {data.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Name
          <input name="name" required maxLength={100} />
        </label>
        {kind === "projects" && (
          <label>
            Description
            <textarea name="description" required maxLength={5000} />
          </label>
        )}
        <button>Register {kind === "projects" ? "project" : "module"}</button>
        <p className="error" role="alert">
          {error}
        </p>
      </form>
    </section>
  );
}
function Editor({ bug, data, actor, close, saved }) {
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
createRoot(document.getElementById("root")).render(
  <AccountGate>
    {(user, logout, onProfile) => (
      <App user={user} logout={logout} onProfile={onProfile} />
    )}
  </AccountGate>,
);
