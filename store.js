import { DatabaseSync } from "node:sqlite";
import { states, canMove } from "./workflow.js";
export { states } from "./workflow.js";

export const types = [
    "Functional",
    "UI",
    "Performance",
    "Security",
    "Compatibility",
    "Data",
  ],
  severities = ["Critical", "High", "Medium", "Low"],
  priorities = ["P1", "P2", "P3", "P4"];

export function createStore(path = "bugflow.db") {
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,name TEXT NOT NULL,role TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS projects(id INTEGER PRIMARY KEY,name TEXT NOT NULL UNIQUE,description TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS modules(id INTEGER PRIMARY KEY,project_id INTEGER NOT NULL REFERENCES projects(id),name TEXT NOT NULL,UNIQUE(project_id,name));
 CREATE TABLE IF NOT EXISTS bugs(id INTEGER PRIMARY KEY,project_id INTEGER NOT NULL REFERENCES projects(id),module_id INTEGER REFERENCES modules(id),title TEXT NOT NULL,description TEXT NOT NULL,steps TEXT NOT NULL,expected TEXT NOT NULL,actual TEXT NOT NULL,environment TEXT NOT NULL,type TEXT NOT NULL,severity TEXT NOT NULL,priority TEXT NOT NULL,status TEXT NOT NULL,reporter_id INTEGER NOT NULL REFERENCES users(id),assignee_id INTEGER REFERENCES users(id),resolution TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL,updated_at TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1);
 CREATE TABLE IF NOT EXISTS history(id INTEGER PRIMARY KEY,bug_id INTEGER NOT NULL REFERENCES bugs(id),actor_id INTEGER NOT NULL REFERENCES users(id),timestamp TEXT NOT NULL,changes TEXT NOT NULL,note TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS bug_project_status ON bugs(project_id,status);`);

  const all = (s, ...p) => db.prepare(s).all(...p),
    get = (s, ...p) => db.prepare(s).get(...p),
    run = (s, ...p) => db.prepare(s).run(...p);

  function transaction(fn) {
    db.exec("BEGIN IMMEDIATE");
    try {
      const r = fn();
      db.exec("COMMIT");
      return r;
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  }

  function text(d, k, max = 5000) {
    if (typeof d[k] !== "string" || !d[k].trim() || d[k].length > max)
      throw Error(`${k} is required and must be at most ${max} characters`);
    return d[k].trim();
  }

  function save(d) {
    return transaction(() => {
      const actor = get("SELECT * FROM users WHERE id=?", d.actor_id ?? null);
      if (!actor) throw Error("Select a valid acting member");
      const old = d.id ? get("SELECT * FROM bugs WHERE id=?", d.id) : null;
      if (d.id && !old) throw Error("Bug not found");
      const fields = {};
      for (const k of [
        "title",
        "description",
        "steps",
        "expected",
        "actual",
        "environment",
      ])
        fields[k] = text(d, k, k === "title" ? 200 : 5000);
      for (const [k, values] of [
        ["type", types],
        ["severity", severities],
        ["priority", priorities],
      ]) {
        if (!values.includes(d[k])) throw Error("Invalid " + k);
        fields[k] = d[k];
      }
      Object.assign(fields, {
        project_id: d.project_id,
        module_id: d.module_id || null,
        assignee_id: d.assignee_id || null,
        resolution: typeof d.resolution === "string" ? d.resolution.trim() : "",
        status: d.status || "Reported",
      });
      if (!get("SELECT id FROM projects WHERE id=?", fields.project_id ?? null))
        throw Error("Invalid project");
      if (
        fields.module_id &&
        !get(
          "SELECT id FROM modules WHERE id=? AND project_id=?",
          fields.module_id,
          fields.project_id,
        )
      )
        throw Error("Module must belong to selected project");
      if (
        fields.assignee_id &&
        !get(
          "SELECT id FROM users WHERE id=? AND role IN ('Developer','Manager')",
          fields.assignee_id,
        )
      )
        throw Error("Choose a developer or manager");
      const status = fields.status;
      if (!Object.hasOwn(states, status)) throw Error("Invalid status");
      if (!old && status !== "Reported")
        throw Error("New bugs start as Reported");
      if (old) {
        if (d.version !== old.version)
          throw Error("This bug changed. Refresh before saving.");
        if (status !== old.status && !canMove(old.status, status))
          throw Error("Invalid lifecycle transition");
      }
      if (status !== "Reported" && !fields.assignee_id)
        throw Error("Assignee required after reporting");
      if (
        ["Resolved", "Tested", "Closed"].includes(status) &&
        !fields.resolution
      )
        throw Error("Record the resolution first");
      const note = typeof d.note === "string" ? d.note.trim() : "";
      if (status === "Reopened" && old?.status !== "Reopened" && !note)
        throw Error("Explain why the bug is reopened");
      const changes = Object.fromEntries(
        Object.entries(fields)
          .filter(([k, v]) => !old || old[k] !== v)
          .map(([k, v]) => [k, { from: old?.[k] ?? null, to: v }]),
      );
      const t = new Date().toISOString();
      let id;
      if (old) {
        if (!Object.keys(changes).length && !note)
          throw Error("No changes to save");
        run(
          `UPDATE bugs SET ${Object.keys(fields)
            .map((k) => k + "=?")
            .join(",")},updated_at=?,version=version+1 WHERE id=?`,
          ...Object.values(fields),
          t,
          old.id,
        );
        id = old.id;
      } else {
        Object.assign(fields, {
          reporter_id: actor.id,
          created_at: t,
          updated_at: t,
        });
        id = Number(
          run(
            `INSERT INTO bugs(${Object.keys(fields).join(",")}) VALUES(${Object.keys(
              fields,
            )
              .map(() => "?")
              .join(",")})`,
            ...Object.values(fields),
          ).lastInsertRowid,
        );
      }
      run(
        "INSERT INTO history(bug_id,actor_id,timestamp,changes,note) VALUES(?,?,?,?,?)",
        id,
        actor.id,
        t,
        JSON.stringify(changes),
        note,
      );
      return { id };
    });
  }
  if (!get("SELECT id FROM users LIMIT 1"))
    transaction(() => {
      for (const u of [
        [1, "Alex Morgan", "Manager"],
        [2, "Sam Dube", "Developer"],
        [3, "Lebo Nkosi", "Tester"],
        [4, "Priya Shah", "Developer"],
      ])
        run("INSERT INTO users VALUES(?,?,?)", ...u);
      run(
        "INSERT INTO projects VALUES(1,'Campus Portal','Student registration and academic services')",
      );
      for (const m of [
        [1, 1, "Authentication"],
        [2, 1, "Registration"],
        [3, 1, "Results"],
      ])
        run("INSERT INTO modules VALUES(?,?,?)", ...m);
      const samples = [
        ["Login fails after password reset", "Reported", "High", "P1", 1],
        ["Duplicate course registration", "In Progress", "Critical", "P1", 2],
        ["Results table overlaps on mobile", "Resolved", "Medium", "P2", 3],
        ["Session timeout warning missing", "Reopened", "Medium", "P2", 1],
        ["Incorrect credit total", "Closed", "High", "P2", 2],
        ["Slow results export", "Assigned", "Low", "P3", 3],
      ];
      for (const [title, status, severity, priority, module_id] of samples) {
        const t = new Date().toISOString();
        const id = Number(
          run(
            "INSERT INTO bugs(project_id,module_id,title,description,steps,expected,actual,environment,type,severity,priority,status,reporter_id,assignee_id,resolution,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            1,
            module_id,
            title,
            "Demonstration bug",
            "Repeat the affected operation",
            "Operation succeeds",
            title,
            "Demo environment",
            "Functional",
            severity,
            priority,
            status,
            3,
            status === "Reported" ? null : 2,
            ["Resolved", "Closed"].includes(status)
              ? "Sample fix recorded"
              : "",
            t,
            t,
          ).lastInsertRowid,
        );
        run(
          "INSERT INTO history(bug_id,actor_id,timestamp,changes,note) VALUES(?,?,?,?,?)",
          id,
          1,
          t,
          JSON.stringify({ status: { from: null, to: status } }),
          "Seeded demonstration snapshot; not a real incident.",
        );
      }
    });
  return {
    db,
    save,
    data: () => ({
      ...Object.fromEntries(
        ["users", "projects", "modules", "bugs"].map((t) => [
          t,
          all("SELECT * FROM " + t),
        ]),
      ),
      history: all(
        "SELECT h.*,u.name actor FROM history h JOIN users u ON u.id=h.actor_id ORDER BY h.id DESC",
      ),
      states,
      types,
      severities,
      priorities,
    }),
    project: (d) => ({
      id: Number(
        run(
          "INSERT INTO projects(name,description) VALUES(?,?)",
          text(d, "name", 100),
          text(d, "description"),
        ).lastInsertRowid,
      ),
    }),
    module: (d) => ({
      id: Number(
        run(
          "INSERT INTO modules(project_id,name) VALUES(?,?)",
          d.project_id,
          text(d, "name", 100),
        ).lastInsertRowid,
      ),
    }),
    export: () =>
      all(
        "SELECT b.id,p.name project,m.name module,b.title,b.status,b.severity,b.priority,u.name assignee,b.created_at,b.updated_at FROM bugs b JOIN projects p ON p.id=b.project_id LEFT JOIN modules m ON m.id=b.module_id LEFT JOIN users u ON u.id=b.assignee_id",
      ),
  };
}
