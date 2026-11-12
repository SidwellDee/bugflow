# BugFlow Software Bug Tracking System

## Development and Implementation Report

Course: CSC 601 Advanced Software Engineering  
Date: 12 November 2026  
Submission author and student number: To be completed by the student

## Abstract

BugFlow is a working local web application for managing software defects from discovery to closure and subsequent reopening. It links each defect to a registered software project and optionally a program module. Developers and testers can record reproducible evidence, classify impact and urgency, assign responsibility, follow a controlled lifecycle and inspect a permanent application-level change history. A project dashboard and CSV export support monitoring and reporting. The implementation uses React, Node.js, SQLite, HTML, CSS and JavaScript. The prototype demonstrates the required business workflow, with email/password registration, verified Google sign-in, authenticated sessions and a Gmail delivery queue. Twenty eight automated tests validate account, workflow and delivery logic. Live Google consent and mail delivery remain dependent on workspace configuration.

## 1 Introduction and problem definition

Software defects can be discovered during development, testing, deployment and maintenance. When teams distribute reports across messages and informal lists, reproduction details may be missing, responsibility may be unclear and apparently completed fixes may not have been tested. Project managers also struggle to distinguish unresolved work from fixes awaiting verification.

The proposed system provides a shared defect register with structured evidence and traceable state changes. Its central design principle is that a bug is a persistent record with a lifecycle, rather than a disposable task. A closed bug can be reopened without losing the earlier investigation or resolution.

The project objective is to implement and demonstrate all functions in the assignment: system and module registration, reporting, classification, assignment, status tracking, change history, project linkage, statistics and a dashboard. The intended users are testers, developers and managers. The delivered scope is a local teaching prototype; institutional submission and a live assessed presentation remain activities for the student.

## 2 Scope and feasibility

The prototype supports multiple projects, project-specific modules and four predefined demonstration team members. Users can create and edit bug reports, assign developers, record resolutions, add change notes and reopen defects. It provides current-state project summaries, severity distributions, developer workload and an all-project CSV export.

The application can run on a single computer with Node.js 22.13 or later and a modern browser. SQLite eliminates the need to configure a separate database server. The React component structure and small Node.js service simplify inspection and makes the source suitable for inspection during a demonstration. This approach is feasible for coursework and small demonstrations; concurrency, large data volumes and production administration would require a different deployment plan.

Excluded features include attachments, project membership permissions, source-control integration, due dates, SLA monitoring and historical trend charts. Account registration, sign-in and Gmail notifications are now implemented. These exclusions do not prevent demonstration of the requested core lifecycle. They limit suitability for real organisational use.

## 3 Requirements analysis

### 3.1 Stakeholders and responsibilities

Testers describe observed failures, provide reproduction evidence, verify fixes and close or reopen reports. Developers investigate assigned work and document resolutions. Managers allocate responsibility and review project quality. The prototype allows all acting members to report bugs and edit report details. The authenticated member is recorded in history; client-supplied actor identifiers are ignored by the HTTP service. All verified members may move existing tickets between any statuses in either direction. Managers additionally control team roles and the workspace Gmail sender.

### 3.2 Functional requirements and traceability

| ID | Requirement | Implemented component | Verification |
|---|---|---|---|
| FR1 | Register software projects | Projects and modules page; projects API | Demonstration steps 2 and 3 |
| FR2 | Register modules under a project | Modules form; foreign key and project validation | Cross-project module test |
| FR3 | Report and document bugs | Structured report dialog | Required-field test and walkthrough |
| FR4 | Categorise type, severity and priority | Controlled selectors and server validation | Classification test |
| FR5 | Assign appropriate team members | Assignee selector; developer or manager validation | Lifecycle test |
| FR6 | Enforce lifecycle transitions | Server transition map; restricted status options | Full lifecycle and invalid-transition tests |
| FR7 | Record change history | History table and bug detail timeline | Lifecycle history count test |
| FR8 | Link bugs to systems and modules | Project foreign key; optional module foreign key | Cross-project module test |
| FR9 | Generate statistics and reports | Reports view; CSV endpoint | Demonstration step 9 |
| FR10 | Show project dashboard | Cards and lifecycle and severity bars | Fresh-data count check |

### 3.3 Nonfunctional requirements

Persistence requires reports and history to survive service restarts. Integrity requires valid project relationships, fixed classification values and atomic report/history writes. Usability requires visible labels, concise forms and clear errors. Maintainability requires a small codebase with identifiable presentation, service and storage responsibilities. Local safety requires binding the server to the loopback address. Accessibility is supported through native controls, text labels and status text, although no formal accessibility audit has been completed.

Performance targets have not been benchmarked. The implementation retrieves the entire register and history for client-side filtering, which is suitable only for small datasets. Claims about production throughput or availability would require load testing and deployment evidence.

## 4 Development approach

Development followed an incremental approach. The business requirements were first translated into entities and a transition model. Persistence and server validation were implemented before the user interface. The dashboard, report register, project forms and reporting functions were then added. Automated tests exercised positive and negative workflow cases against isolated temporary databases.

This sequence supports early verification of the most consequential rules: a bug must not silently skip verification, module links must remain consistent and changes must retain evidence. The earlier Python version exposed a database handle cleanup issue on Windows before migration. The JavaScript implementation uses a synchronous SQLite connection with explicit transactions and closes test database connections after each test. The complete sixteen-test suite subsequently passed.

The methodology is an implementation approach for this prototype, not evidence of a user study or a multi-person development project. No interviews, production trials or user acceptance sessions are claimed.

## 5 System architecture

The browser presentation layer is implemented in React components in `src/main.jsx`, with styles in `src/style.css`. Vite compiles the application. React renders the dashboard, forms, tables and history and communicates with the application using JSON requests. It does not access database files directly.

The application layer in `server.js` uses the Node.js HTTP server to route requests. The `store.js` module provides database access and business rules. It validates input, checks status values and required evidence, calculates field differences and coordinates database writes. The storage layer is SQLite, accessed through parameterised SQL and explicit connection management.

```text
Browser interface
  Dashboard | Bug register | Projects and modules | Reports
                  |
             HTTP and JSON
                  |
Node.js service on 127.0.0.1:8000
  Validation | Lifecycle rules | History creation | CSV export
                  |
SQLite database
  Users | Projects | Modules | Bugs | History
```

The separation is logical rather than a large framework-based architecture. This keeps installation simple while preserving clear responsibility boundaries. The server serves only its application page and explicit API routes, so it does not expose arbitrary source files or the database through a general static-file handler.

### 5.1 Interface contract

| Method and route | Purpose | Result |
|---|---|---|
| GET / | Load application interface | HTML |
| GET /api/data | Read reference data, bugs and history | JSON snapshot |
| POST /api/projects | Register project | New ID or validation error |
| POST /api/modules | Register module | New ID or validation error |
| POST /api/bugs | Create or update bug | Bug ID or validation error |
| GET /api/export | Export all bug summaries | CSV |

POST operations return status 201 on success, including updates in this simple API. Invalid business input returns status 400. Unknown routes return 404. A production API should use a more detailed error taxonomy and separate create and update semantics.

## 6 Data design

### 6.1 Entity relationships

```text
PROJECT 1 -------- many MODULE
PROJECT 1 -------- many BUG
MODULE  1 -------- many BUG       module is optional on BUG
USER    1 -------- many BUG       reporter
USER    1 -------- many BUG       assignee, optional initially
BUG     1 -------- many HISTORY
USER    1 -------- many HISTORY   acting member
```

Project and module names are stored in reference tables rather than repeated in each bug. User references distinguish reporting from assignment. History is stored separately so repeated changes do not overwrite earlier events. A project-wide defect can omit its module, while every defect must still have a project.

### 6.2 Data dictionary

| Entity | Key attributes | Constraints and purpose |
|---|---|---|
| users | id, name, role | Primary key; predefined demonstration roles |
| projects | id, name, description | Unique project name; required description |
| modules | id, project_id, name | Project foreign key; unique name per project |
| bugs | id, project_id, module_id, title | Required project; optional module; title limited to 200 characters |
| bugs evidence | description, steps, expected, actual, environment | Required nonempty text; up to 5000 characters per field |
| bugs classification | type, severity, priority, status | Controlled by service validation |
| bugs responsibility | reporter_id, assignee_id | User foreign keys; assignee required after reporting |
| bugs tracking | resolution, created_at, updated_at, version | Resolution evidence; UTC timestamps; stale-edit detection |
| history | id, bug_id, actor_id, timestamp, changes, note | Foreign keys; JSON old/new field differences and optional explanation |

Foreign key checking is enabled on every connection. The service additionally confirms that a selected module belongs to the selected project. Classification and transition constraints are enforced in application code rather than database CHECK constraints, so direct database editing can bypass those business rules. The schema includes an index on project and status for future filtered queries, although the current API returns the complete dataset.

### 6.3 Transactions and concurrent edits

A report update and its history event are committed in the same connection transaction. Failure rolls the transaction back. Each saved update increments a version number. The client submits the version it originally loaded, and the server rejects a stale version. An immediate transaction serialises the read-check-write sequence, preventing two accepted edits from using the same version. Synchronous SQLite operations serialise database work on the Node.js event loop, favouring simplicity over throughput.

## 7 Lifecycle and business rules

The suggested flow is Reported → Assigned → In Progress → Resolved → Tested → Closed. Existing tickets can move directly between any two valid statuses, including backward moves. Reopened is also available from any other status. The system retains the previous resolution text when reopening so that earlier repair evidence remains visible; a developer should replace or supplement that text during the next repair cycle.

| Current state | Allowed destination | Acting member |
|---|---|---|
| Any existing ticket status | Any of the other six statuses, forward or backward | Any valid demo team member |

New reports always begin as Reported. Any later state requires a valid assignee. Resolved, Tested and Closed require resolution text. A transition into Reopened requires an explanatory change note. Retaining the same status allows ordinary report edits and notes without a lifecycle transition. The server rejects an update with neither field changes nor a note.

Severity describes impact: Critical, High, Medium or Low. Priority describes scheduling urgency: P1 through P4, where P1 is the most urgent. Type describes the defect category: Functional, UI, Performance, Security, Compatibility or Data. Keeping these dimensions separate allows a low-impact issue to be urgent for a release without misrepresenting its technical severity.

## 8 User interface and implementation

The dashboard presents total reports, resolved or tested bugs, outstanding bugs, currently reopened bugs and closed bugs. The dashboard displays tickets on a horizontally scrollable board with one column per lifecycle status. Cards show the ticket identifier, title, project, module, severity, priority and assignee. Dragging highlights all other status columns; dropping saves through the existing validated API and records history. A Move to menu provides a keyboard and touch alternative. Moves requiring assignment, resolution or a reopening reason open a focused form before saving. Errors leave the saved ticket status unchanged. A project selector scopes the board, register and report calculations. Selecting a ticket title opens its evidence and history.

The bug register supports title or numeric ID search, status filtering and severity filtering. Selecting a row opens the editable detail dialog. The dialog includes project, module, reproduction evidence, classification, assignee, state, resolution and a change note. The current status and every other status appear in the state selector. The server independently validates the request, so interface restrictions are not the sole enforcement mechanism.

Projects and modules have separate registration forms. Module choices in the report dialog update with the selected project, reducing accidental cross-project linkage. Registration uniqueness errors are displayed without discarding the entire page.

React escapes stored text when rendering it; the application does not inject report text as raw HTML. SQL arguments are parameterised. The CSV exporter prefixes formula-like text with an apostrophe to reduce spreadsheet formula interpretation. The export contains identifiers, project, module, title, state, severity, priority, assignee and timestamps; it does not export full history or all reproduction evidence.

The application records history for every accepted report creation or update, including actor, UTC timestamp, changed fields with old/new values and notes. It offers no history editing or deletion API. This is application-level traceability, not tamper-proof auditing: someone with database access can alter stored records.

## 9 Reports and measurement definitions

Total reported is the number of existing bug records in the chosen scope, regardless of present status. Resolved or tested is the sum of records currently in Resolved or Tested. Closed is counted separately. Outstanding is the sum of Reported, Assigned, In Progress and Reopened. These three present-state groups partition the total.

Currently reopened counts records whose present state is Reopened. The report also counts distinct bugs with any recorded history event whose new status is Reopened. This second measure can include bugs that have since progressed to another state and includes explicitly labelled demonstration snapshots. It is not a count of reopening transitions or a failure rate.

Developer workload is the number of outstanding records assigned to each developer or manager within the selected scope. Unassigned reports appear in the overall outstanding total but not in an individual's workload. The CSV endpoint always exports every project, and the interface explicitly labels this scope. The prototype does not calculate resolution lead time, reporting-period totals or historical trends.

For a fresh seeded database the expected figures are six total reports, one resolved or tested, four outstanding, one currently reopened and one closed. The demo records deliberately cover different states. Their initial history entries are labelled snapshots rather than fabricated full development histories.

## 10 Testing and results

Automated tests run through the Node.js built-in test runner against a new temporary SQLite database for each test. They call the same business logic used by the API, keeping the principal workflow checks independent of browser presentation. All sixteen tests passed on 12 November 2026 after explicit connection closure was added.

| Test | Expected behaviour | Result |
|---|---|---|
| Full lifecycle and history | Report through closure, reopen and reassign; eight history events | Passed |
| Invalid status | Unknown status rejected | Passed |
| Cross-project module | Module belonging to another project rejected | Passed |
| Acting member validation | Unknown acting member rejected | Passed |
| Stale edit | Incorrect version rejected | Passed |
| Resolution requirement | Resolution without documented fix rejected | Passed |
| Required title | Blank title rejected | Passed |
| Classification | Unknown severity rejected | Passed |
| Project and module registration | Registration succeeds and duplicate project rejected | Passed |
| Reopening reason and transaction | Missing reason rejected; closed state remains unchanged | Passed |

These tests demonstrate workflow and persistence-layer integrity, not complete system assurance. The previous Python service was started at its local address. The React production build and JavaScript test results are recorded separately below. Browser inspection through the available remote browser failed because it could not connect to the computer's loopback service. Consequently no successful visual browser walkthrough, screenshot evidence or automated end-to-end UI test is claimed. The supplied demonstration script specifies the remaining visual acceptance steps for execution in a browser on the same computer.

The current JavaScript suite completed sixteen tests successfully. Each fixture uses an isolated in-memory SQLite database and closes its connection after the test. The React production build also completed successfully using Vite.

## 11 Deployment and operation

Keep all delivered source files together. Start with `npm install` followed by `npm run dev`, then open `http://127.0.0.1:3000` on the same computer. Install the dependencies with npm first. For a production build, run `npm run build` and then `npm start`. Node.js 22.13 or later is required for the built-in SQLite API. Node.js 22 may label this API experimental.

The first launch creates `bugflow.db` and demonstration data. Later launches preserve existing records. The BUGFLOW_DB environment variable selects a different database path for a separate demonstration. Stop the application before copying the database for a backup. Test changes use temporary databases and do not alter the running demonstration database.

Authenticated sessions and request-origin protection are implemented. For a real deployment, add invitation-based onboarding, project membership, ownership checks, production HTTP hosting with HTTPS, schema migrations, automated backups, central logging and recovery tests. Pagination and server-side filtering are needed before large registers are practical. Those improvements require implementation and verification before any claim of production readiness.

## 12 Evaluation and limitations

All requested functional areas have concrete prototype components. The workflow distinguishes development completion from independent verification and keeps reopened reports linked to their earlier evidence. The relational model supports project-level and module-level analysis without duplicating project details. The audit trail records changes rather than only the latest state.

Registration and sign-in now establish a server-side identity using verified accounts and session cookies. Open registration still admits users to a single shared workspace, so project-level restrictions and invitation controls remain necessary. The Node.js HTTP server and whole-register API are intended for local demonstration. There is no attachment upload, formal usability evaluation or proven scale target. Google sign-in, authenticated team management and Gmail notification delivery are implemented, but no live Google consent or email delivery run has been performed. The report should therefore be assessed as a demonstrable prototype with tested business logic, not a deployed enterprise service.

## 13 Conclusion

BugFlow implements a complete core defect-management cycle with persistent projects, modules, structured bug evidence, classification, assignment, controlled status progression, change history and project reporting. Sixteen passing automated tests substantiate its central lifecycle and integrity rules. The included demonstration guide provides a repeatable scenario covering registration, reporting, repair, verification, closure and reopening. Production adoption would require stronger project-level access control, invitation-based onboarding and operational hardening.

## Appendix A Demonstration and acceptance

Use DEMONSTRATION.md for the ten-step presentation. Acceptance requires successful registration of a new project and module; creation of a module-linked report; assignment to a developer; progression through every normal lifecycle stage; reopening with a reason; visible history; updated summary counts; CSV download; and survival of a restart. Execute these steps on the same computer as the server. Capture screenshots or a screen recording for the institution if required.

## Appendix B Implementation evidence

The authoritative implementation sources are server.js for HTTP routes; store.js for schema, transactions and business rules; src/main.jsx for React presentation and report calculations; and tests/store.test.js for automated assertions. README.md provides installation instructions. Google OAuth, OpenID Connect and Gmail implementation references are listed in GOOGLE_SETUP.md. No external empirical evaluation findings are claimed. Technical evaluation should be performed against the supplied source and reproducible tests.


## Appendix C React implementation update

The prototype has been migrated to React and Node.js. React components own interface state and rendering, including the project filter, dashboard, registration forms and bug editor. A same-origin Node.js service provides the JSON API and SQLite persistence. The existing SQLite schema is retained so prior demonstration records remain readable. No Python interpreter is required. Vite provides development transforms and the production asset build. Sixteen JavaScript tests pass, including project and module registration and separate required-field and classification cases. Use npm test to reproduce the suite. The earlier Python resource cleanup discussion is retained as development history rather than a description of the current runtime.



## Bidirectional board verification

All 16 tests pass. The movement regression tests cover all 42 ordered pairs of distinct statuses for each of the four demo members, asserting persisted state, version changes, actor attribution and history. Additional checks verify the shared board and editor destination list and backward movement to an unassigned Reported state. Both board edges scroll horizontally while dragging. Assignment, resolution and reopening evidence requirements remain enforced. This supersedes the earlier restricted transition model.



## User registration and Gmail implementation

Account registration stores a validated email, name and selected Tester or Developer role. The first real account becomes Manager; seeded sample members remain assignment records with no login credentials. Passwords use salted scrypt hashes. Sessions and 24-hour single-use verification tokens are stored as hashes. Session cookies are HttpOnly and SameSite Lax, with Secure enabled when APP_ORIGIN uses HTTPS. Protected APIs reject unauthenticated or unverified requests and derive the acting user from the session. JSON writes enforce the configured request origin. Login and registration endpoints have local in-memory rate limiting.

Google sign-in uses authorization-code flow, PKCE, browser-bound single-use state and nonce validation. Google identity tokens are validated using the official google-auth-library. Existing password accounts are not silently linked by matching email. Only a manager may connect the workspace Gmail sender. Identity sign-in scopes are separate from gmail.send consent. The sender refresh token and queued email bodies use AES-256-GCM encryption, with a server secret or local development key. Google credentials are read only on the server.

Team and Gmail provides a directory, manager role controls, account notification preferences and connection and delivery status. Verification messages and opted-in ticket messages are queued persistently. Ticket notification recipients are deduplicated and restricted to verified current assignees and reporters. The worker refreshes OAuth access and submits MIME messages through Gmail messages.send. Send failures retry; missing configuration leaves messages pending. Account linking, password reset, invitations and project-level membership are not implemented.

The complete automated suite contains 28 passing tests. New checks cover password storage, duplicate registration, role restrictions, token expiry and reuse, session identity, protected APIs, cross-origin rejection, Google state and nonce, first-manager Gmail bootstrap, encrypted queue persistence, MIME encoding, retry handling and notification preferences. Google token verification and HTTP responses are mocked. No real email has been sent and no live Google callback success is claimed. The React production build passes. Follow GOOGLE_SETUP.md for the required credentials and live acceptance demonstration.
