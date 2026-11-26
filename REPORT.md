# Bug Tracker: Software Bug Tracking System

Development and Implementation Report

Course: CSC 601 — Advanced Software Engineering  
Report date: 26 November 2026  
Student name and student number: To be completed by the student

This report describes the inspected React/Node.js prototype and its source code at the report date. External sources explain the technologies and engineering principles; implementation claims and test results are based on the project artefacts and checks described in Section 11. Numbered in-text citations correspond to Section 16.

## 1. Abstract

Bug Tracker is a web application developed to support the reporting, assignment, monitoring and resolution of software defects throughout development and maintenance. The system associates each bug with a software project and, where applicable, a program module. It captures reproduction evidence, distinguishes defect type, severity and priority, and records changes across seven lifecycle statuses. Authenticated users first see cards for their assigned projects and then enter a project dashboard containing a drag-and-drop ticket board. A paginated register, separate ticket details and history tabs, project membership controls, visual analytics and CSV exports support day-to-day management. The implementation uses React, Node.js, SQLite, Recharts, Font Awesome and Gmail integration through OAuth or SMTP. Docker and Jenkins artefacts support repeatable packaging and deployment. An incremental development approach accommodated changes to navigation, workflow flexibility, authentication, reporting and presentation. Verification on 26 November 2026 produced 52 passing automated tests, one passing production HTTP registration/verification/login test, and a successful production build. The prototype satisfies the principal functional objectives, although live Google configuration, deployment secret handling, scalability, accessibility and operational recovery require further work before broad organisational adoption.

## 2. Introduction and Problem Definition

Software defects arise when actual behaviour differs from required or expected behaviour. They may be discovered during coding, integration, acceptance testing, deployment or ongoing maintenance. Without a shared register, teams can lose reproduction evidence, duplicate investigations, overlook assignments or close issues without retaining the reasoning behind the decision. Informal messages are particularly weak at showing the relationship between a defect, its affected module, its current owner and previous repair attempts.

The problem addressed by this project is the absence of a consistent, project-aware mechanism for reporting and following defects from discovery to closure and reopening. The application must help a tester explain a failure, help a developer investigate and document a fix, and help a manager understand outstanding work. It must preserve earlier changes when an apparently resolved issue fails retesting.

The development objective was to design and implement a demonstrable system covering project and module registration, structured bug reporting, classification, assignment, lifecycle tracking, change history, reporting and dashboard monitoring. Subsequent requirements added user registration, verification, Google sign-in, Gmail sending, project cards, user menus, visual charts, pagination, container deployment and consistent branding. The resulting product is named Bug Tracker; legacy internal database and deployment identifiers remain where changing them could disrupt existing installations.

Success is assessed against observable functions and automated checks rather than assumed business benefits. The report does not claim that the system has reduced repair time or improved team productivity in a controlled study. Those outcomes require deployment with representative users and longitudinal measurement. React's component model supports the division of interactive screens into reusable units [1], while UML provides a common notation for describing system behaviour and structure [2].

## 3. Project Scope and Feasibility Analysis

### 3.1 Project Scope

The implemented scope includes account registration and login, email verification, optional Google authentication, project creation, membership assignment, module creation, structured ticket creation and editing, assignment to eligible members, movement between lifecycle statuses, change-history viewing, project dashboards, filtered and paginated bug registers, charts, CSV export and email notifications. The system also supplies a verified super-user bootstrap command and Docker/Jenkins deployment files.

The principal workflow begins with authentication, followed by assigned-project cards. Selecting a card opens that project's dashboard. Project creation and management are accessed from the cards; module and member administration are kept within the selected project's management dialog. Account and sign-out actions are available through the user context menu.

The delivered prototype excludes attachments, source-control issue synchronisation, scheduled reports, service-level agreements, password recovery, multifactor authentication, full-text search infrastructure and a public integration API. It is a single application and database deployment rather than a distributed multi-tenant platform. It supports project-level access, but a project is not an independently administered organisation or tenant.

### 3.2 Feasibility Analysis

| Dimension | Assessment | Practical implication |
|---|---|---|
| Technical | React, JavaScript, Node.js and embedded SQLite support the required interaction and persistence model. | A separate database server is unnecessary for the prototype. |
| Economic | The core libraries and tools can be used without purchasing application licences. | Hosting, domain, maintenance, email administration and staff time still have costs; no financial saving is quantified. |
| Operational | Project cards, labelled forms, status columns and a tabular register fit the intended workflow. | Training and representative user evaluation remain necessary. |
| Schedule | Features can be introduced as working increments. | Core validation and persistence can be stabilised before reporting and visual refinements. |
| Deployment | Docker packages the application and Jenkins describes deployment steps. | A suitable host, Docker permissions, HTTPS termination and credentials are external prerequisites. |

SQLite provides transactional persistence without a separate service [3]. This reduces installation work, but synchronous database calls and a single writer constrain scaling. Google services are technically feasible, although their operation depends on account policy, network access, consent configuration and exact callback registration [4]. No fixed implementation duration or itemised budget is presented because verified effort and expenditure records are unavailable.

### 3.3 Assumptions and Limitations

Users are assumed to have modern browsers, a reliable connection to the application and permission to access assigned project information. The server requires a compatible Node.js runtime; the project declares Node.js 22.13 or later and its Docker image uses the Node 22 family. The selected release must support the particular built-in SQLite API used by the source.

Google sign-in requires a configured Web application OAuth client. SMTP email requires an eligible Gmail account and Google App Password rather than an ordinary account password. The application assumes one configured workspace sender, one primary application instance and trustworthy server administration. A verified account does not automatically imply membership of every project.

The prototype loads a project-authorised snapshot for browser filtering; pagination limits visible register rows rather than database retrieval. There is no measured throughput target, availability guarantee, completed accessibility audit or independent penetration test. These constraints qualify its readiness for large or sensitive deployments.

## 4. Requirements Engineering

### 4.1 Stakeholder Analysis

| Stakeholder | Information and responsibilities | System support |
|---|---|---|
| Tester | Describe failures, supply evidence and assess fixes. | Reporting forms, lifecycle changes, history and register filters. |
| Developer | Investigate assigned defects and document repairs. | Assignment, board movement, resolution fields and workload charts. |
| Manager | Coordinate people, monitor project quality and administer team roles. | Project management when assigned, analytics, role administration and sender connection. |
| Project owner | Maintain a project and its membership. | Owner permissions independent of global account role. |
| Super user | Bootstrap administration and retain system-wide project access. | Verified Manager account with membership synchronisation across projects. |
| Application operator | Configure hosting, backups, credentials and delivery. | Environment settings, health endpoint, Docker and Jenkins artefacts. |
| Google services | Authenticate consenting users or deliver authorised mail. | OAuth callback, Gmail API and SMTP transport integration. |

These roles describe intended responsibilities. The implemented ticket policy permits any verified project member to edit and move tickets; it does not reserve testing or closure exclusively for Testers. Project management and global team administration have separate permission checks. This distinction prevents organisational expectations from being mistaken for enforced access rules.

### 4.2 Functional Requirements

| ID | Requirement and acceptance condition |
|---|---|
| FR01 | Register an account with a valid email and password; require verification for project access. |
| FR02 | Authenticate with password or configured Google identity; support session logout. |
| FR03 | Display only projects assigned to the user after login. |
| FR04 | Create projects and project-specific modules; reject duplicate or inconsistent module links. |
| FR05 | Permit owners and assigned Managers to manage project membership and modules. |
| FR06 | Capture title, description, steps, expected result, actual result and environment for a bug. |
| FR07 | Validate type, severity and priority against defined options. |
| FR08 | Assign a bug to an eligible Developer or Manager who belongs to its project. |
| FR09 | Move tickets in either direction between valid statuses using drag-and-drop or a selector. |
| FR10 | Require assignment after reporting, resolution for completion states and a reason when reopening. |
| FR11 | Save actor, timestamp, changed fields and notes with accepted bug changes. |
| FR12 | Separate ticket details from change history using accessible tabs. |
| FR13 | Filter and paginate the bug register while retaining the selected project scope. |
| FR14 | Show current counts, status distribution, severity/priority, module hotspots, workload and daily activity. |
| FR15 | Export authorised project bug summaries as CSV. |
| FR16 | Queue verification and ticket emails, respect ticket-notification preferences and expose delivery status. |
| FR17 | Provide verified super-user creation without committing a shared password. |
| FR18 | Package the application for Docker and provide a conditional Jenkins deployment workflow. |

### 4.3 Non-Functional Requirements

| ID | Quality requirement | Implemented measure and qualification |
|---|---|---|
| NFR01 | Integrity and persistence | SQLite foreign keys, service validation, transactions and persistent deployment volume. |
| NFR02 | Authentication security | Salted password hashing, expiring hashed session records and guarded routes; further hardening is required. |
| NFR03 | Authorisation | Project membership, ownership and Manager checks are performed server-side. |
| NFR04 | Usability | Project cards, labelled actions, history tabs, pagination, readable counts and Font Awesome icons. |
| NFR05 | Accessibility | Native controls, visible labels, focus handling and alternatives to dragging; no conformance claim. |
| NFR06 | Maintainability | Separated UI, account, project, persistence, reporting and mail modules. |
| NFR07 | Portability | JavaScript application and Docker deployment files; platform-specific operation still requires validation. |
| NFR08 | Responsiveness | Responsive layouts and lazy loading of reports; no load-tested performance guarantee. |
| NFR09 | Recoverability | Persist database and encryption key; a tested recovery procedure is still required. |

### 4.4 Requirements Traceability Matrix

| Requirements | Implementation artefacts | Verification evidence |
|---|---|---|
| FR01–FR02 | Accounts.jsx, accounts.js, application.js, security.js | Account tests and production HTTP authentication test. |
| FR03–FR05 | Workspace.jsx, Projects.jsx, projects.js | Project visibility, ownership, membership and rollback tests. |
| FR06–FR08 | Editor.jsx, store.js, projects.js | Required evidence, classification, module and assignee checks. |
| FR09–FR10 | Board.jsx, workflow.js, store.js | Workflow transition and lifecycle tests; browser drag behaviour needs manual acceptance. |
| FR11–FR12 | Editor.jsx, store.js | Atomic history tests; tab interaction is assessed through inspection/manual scenarios. |
| FR13 | BugRegister.jsx, bug-register-data.js | Search, filtering, page boundaries and page-number helper tests. |
| FR14–FR15 | Reports.jsx, report-data.js, application.js | Chart reconciliation, project isolation, UTC event and export authorisation checks. |
| FR16 | gmail.js, application.js, Accounts.jsx | Mock Gmail/SMTP success, failure, encryption and preference tests. |
| FR17 | bootstrap-admin.js, scripts/create-admin.js | Super-user creation, repeat execution and all-project access tests. |
| FR18 | Dockerfile, compose.yaml, Jenkinsfile | Configuration inspection; fresh image/pipeline execution is not claimed in this report. |
| NFR01–NFR03 | Persistence, security and authorisation modules | Constraint, stale-update, session and permission tests. |
| NFR04–NFR09 | UI, styles, deployment and module boundaries | Build and inspection evidence; usability, load and recovery studies remain outstanding. |

### 4.5 Requirements Validation

Validation combined inspection of the assignment, iterative user requests, source review, positive and negative tests, and checks against acceptance scenarios. Changes such as bidirectional ticket movement and project-card navigation were treated as revised requirements rather than incidental cosmetic changes. The traceability matrix connects each requirement to an implementation and distinguishes automated evidence from manual acceptance work.

Requirements were reviewed for consistency. For example, flexible backward movement must coexist with mandatory resolution evidence; project cards must agree with server-side data visibility; and notification settings must not suppress required verification messages. No formal stakeholder interviews, signed acceptance document or independent user study is claimed. The validation therefore demonstrates implementation consistency rather than organisational acceptance.

## 5. System Analysis and Unified Modelling

### 5.1 Use Case Modelling

The system boundary is Bug Tracker. Human actors are Project member, Tester, Developer, Manager, Project owner and Super user. Google identity and Gmail are external service actors. Tester and Developer specialise the common member role; a Super user has Manager capabilities and broader project access. Ownership adds project-management capability without necessarily changing the user's global role.

Core use cases are register, verify email, sign in, manage account preferences, select an assigned project, report a bug, edit or assign a bug, change status, inspect history, view analytics, export summaries, create projects, manage membership/modules, administer team roles and configure the sender. Google authentication is an optional alternative within sign-in. Notifications are asynchronous consequences of qualifying operations rather than an action users must complete before saving a ticket.

The editable use case diagram is supplied as diagrams/BugFlow_Use_Case_Diagram.drawio. Existing activity, class, object and component diagrams are also supplied in that directory. The filenames preserve the earlier project identifier. UML notation supports complementary behavioural and structural views [2]; these diagrams are design documentation, not executable permission specifications.

### 5.2 Activity Modelling

The main activity begins when a user submits credentials. The system validates the session and verification status, loads authorised project cards and waits for a project selection. Within the chosen project, the user reports a defect or opens an existing ticket. Validation branches either return a meaningful error or allow a transactional save, history creation and snapshot refresh. Notification processing follows separately.

Figure 1. Ticket-update activity, expressed as a readable flow.

```text
Start -> Select authorised project -> Open ticket / choose destination
  -> Collect details and required evidence -> Submit update
  -> Authenticate and verify membership
  -> Validate fields, assignee, module, status and version
       invalid -> Show error -> Correct input -> Resubmit
       valid   -> Begin transaction -> Save bug + history -> Commit
  -> Refresh project view -> Queue/deliver eligible notifications -> End
```

The board requests missing assignment, resolution or reopening evidence before submission. A failed save leaves the persisted status unchanged. The activity model includes correction loops because error handling is part of normal interaction, not an exceptional omission.

### 5.3 Sequence Modelling

Figure 2. Sequence for a status change; the transaction covers the bug and its history.

```text
Member       Board/Editor       HTTP application     Projects/Store       SQLite
  | choose destination |                |                   |                |
  |------------------->|                |                   |                |
  | provide evidence   | POST /api/bugs  |                   |                |
  |------------------->|--------------->| check session      |                |
  |                    |                | check membership ->|                |
  |                    |                | save + version ---->| BEGIN IMMEDIATE|
  |                    |                |                   |--------------->|
  |                    |                |                   | UPDATE / INSERT|
  |                    |                |                   | history, COMMIT|
  |                    |                |<------------------|<---------------|
  |                    |<---------------| successful response|                |
  | refreshed snapshot | GET /api/data   |                   |                |
  |<-------------------|--------------->| authorised snapshot|                |
```

An alternative fragment applies when validation fails: the application returns an error and no accepted bug/history change is committed. After a successful save, eligible recipients are considered and mail is queued. This mail work is not part of the same database transaction as the bug update, so the diagram does not imply guaranteed transactional delivery.

The authentication sequence is browser request, account lookup or Google redirect, credential/token verification, session creation and session-cookie response. OAuth state ties a callback to the initiating browser, while nonce and PKCE values protect the identity/code flow. The redirect and code-exchange requests use the same configured callback [4].

### 5.4 Class Modelling

The conceptual model contains User, Account, Project, ProjectMembership, Module, Bug, HistoryEntry, Session, VerificationToken, OAuthFlow, GmailConnection and MailMessage. Project has many Modules and Bugs; User and Project have a many-to-many relationship through ProjectMembership. Bug has a reporter, optional assignee, optional Module and many HistoryEntries. Account extends a User with login details. Administrative designation is represented separately.

Responsibilities are divided among account management, project authorisation, persistence, workflow validation and delivery. Bug holds defect state; HistoryEntry records a change; the project service checks scope; the account service manages identity; the mail service queues and transmits messages. The implementation primarily uses JavaScript functions and returned service objects. Thus, the class diagram represents domain structure and responsibilities rather than asserting that every element is an ES class.

### 5.5 Defect Lifecycle Model

The recommended progression is Reported → Assigned → In Progress → Resolved → Tested → Closed, with Reopened available when further work is necessary. The actual configured graph permits movement from any status to any other distinct valid status, including backward moves. This implements the explicit requirement for flexible board movement; the recommended progression is guidance rather than an enforced sequence.

| State | Meaning | Enforced evidence |
|---|---|---|
| Reported | Defect recorded for triage. | Required report fields and a valid project. |
| Assigned | Responsibility allocated. | Eligible project assignee. |
| In Progress | Investigation or repair underway. | Eligible project assignee. |
| Resolved | Repair has been documented. | Assignee and resolution text. |
| Tested | Verification has been recorded by moving the ticket. | Assignee and resolution text; no separate signed test evidence. |
| Closed | Work is treated as complete. | Assignee and resolution text. |
| Reopened | Further investigation is required. | Assignee and explanatory note on entry. |

New tickets must start as Reported. Reopening preserves prior resolution text and history. The system does not prove that a test actually ran or that a fix is correct merely because a state was selected. Teams requiring separation of duties should add role-restricted transitions and explicit test evidence.

## 6. Architecture Design

### 6.1 Architectural Overview

Bug Tracker uses a layered modular monolith. A React browser client communicates with a same-origin Node.js application through JSON endpoints. Node serves the production frontend, applies authentication and business rules, and accesses SQLite. Google identity, Gmail API and Gmail SMTP are external integrations.

```text
Browser: accounts, projects, board, editor, register, reports
                         | HTTP / JSON
Node application: routing, identity, permissions, workflow, mail
                         | parameterised SQL
SQLite: projects, defects, accounts, membership, history, outbox
                         | external HTTPS / TLS SMTP
Google identity and Gmail
```

The layers are logical boundaries within one deployable application. There are no independently deployed microservices, separate message broker or dedicated analytics server.

### 6.2 Presentation Layer

Workspace.jsx coordinates project selection and page state. Accounts.jsx presents registration, login, verification and account/team settings. Projects.jsx contains project cards and project management dialogs. Board.jsx provides lifecycle columns and drag interaction; Editor.jsx separates details and history. BugRegister.jsx supports searching, filtering and pagination. Reports.jsx renders visual analytics and is loaded lazily.

React state controls selected projects, active pages, dialogs and pending actions. Components communicate through properties and callbacks, consistent with React's documented component model [1]. Font Awesome provides the shared icon vocabulary [5]. BrandContent.jsx keeps the icon and two-colour Bug Tracker wordmark consistent on account and workspace screens. Labels remain present, and decorative icons are hidden from assistive technologies.

### 6.3 Application Layer

server.js configures origin, database and integrations, serves assets and exposes the health route. application.js handles HTTP requests, session checks, origin validation, rate limiting, Google callbacks, exports and notification triggers. accounts.js manages accounts and sessions; projects.js manages membership and scoped access; store.js validates and persists bugs/history; workflow.js defines status transitions; gmail.js handles the sender and outbox.

The principal routes include GET /api/auth/me, POST /api/auth/register, POST /api/auth/login, POST /api/auth/logout, GET /api/auth/google, GET /api/auth/google/callback, GET /api/data, POST /api/projects, POST /api/modules, POST /api/bugs and GET /api/export. Additional membership, team and mail routes support administration. The interface is an internal application API and has not been versioned as a public developer platform.

### 6.4 Data Layer

The application uses parameterised statements through Node's built-in SQLite support. Tables separate project reference data, account identity, membership, defect state, history and queued communications. Foreign-key enforcement is enabled. Current snapshot retrieval favours implementation simplicity over query efficiency. The selected synchronous API means database work occupies the application event loop; long queries can affect responsiveness.

### 6.5 Security Architecture

Passwords of 12–128 characters are hashed using scrypt with a random salt; plaintext passwords are not stored. Constant-time comparison is used when checking derived keys. OWASP recommends adaptive password hashing and appropriate work factors [6]. The prototype uses Node's scrypt defaults rather than a documented, benchmarked work-factor policy, so this report does not claim full alignment with OWASP's recommended configuration.

Session values and verification tokens are random, while database records store their SHA-256 digests. Sessions expire after seven days; verification links expire after 24 hours and are single-use. Cookies use HttpOnly and SameSite=Lax, with Secure enabled when APP_ORIGIN uses HTTPS. These controls address important session risks described by OWASP [7], but do not constitute a comprehensive session-security assessment.

POST requests must carry the configured origin and JSON content type; request bodies are limited to approximately 100,000 bytes. Authentication endpoints have in-memory rate limits. OAuth uses state, nonce and PKCE, with server-side ID-token verification. Project membership and owner/Manager checks protect project operations. Client-provided acting-member identity is replaced by the authenticated user for saved changes.

Refresh tokens and outbox message bodies are encrypted with AES-256-GCM. This does not encrypt the whole database: recipients, subjects, report evidence and other fields remain readable to an authorised database operator. React's normal text rendering, parameterised SQL and CSV formula-prefix handling reduce common injection risks. No immutable audit storage, multifactor authentication or independent security certification is provided.

### 6.6 Architectural Decisions and Trade-offs

| Decision | Benefit | Cost or trade-off |
|---|---|---|
| React client | Reusable interactive components. | Browser state and refresh behaviour require coordination. |
| One Node service | Simple installation and same-origin requests. | Application and database work share one process. |
| SQLite | Low administration effort and local persistence. | Unsuitable for unconstrained multi-instance write scaling. |
| Client-side report aggregation | Transparent shared calculations and responsive filtering on small datasets. | Entire authorised snapshots can become expensive. |
| Flexible lifecycle | Supports correction, reopening and backward movement. | Does not enforce a strict approval sequence. |
| Persistent email queue | Ticket work need not wait for external delivery. | No atomic bug/outbox transaction or exactly-once delivery guarantee. |
| Dual mail transports | SMTP supports email/password-style configuration; OAuth remains available. | Operators must understand that Google login and mail are separate configurations. |

## 7. Database and Data Design

### 7.1 Entity Relationship Design

Each Project has zero or more Modules and Bugs. Every Bug belongs to exactly one Project and may reference one Module within that Project. A User may report many Bugs and receive many assignments. Each Bug has many HistoryEntries, each linked to the acting User. ProjectMembership resolves the User–Project many-to-many relationship and records Owner or Member.

User and Account have a one-to-zero-or-one relationship because demonstration assignment users can exist without login credentials. Account identity connects to Sessions and VerificationTokens. A SystemAdministrator record designates a User for system-wide administrative access. OAuthFlow holds temporary authentication/connection state. GmailConnection stores the single OAuth sender, while MailOutbox stores pending or completed delivery records.

### 7.2 Data Dictionary

| Table | Important attributes | Purpose and constraints |
|---|---|---|
| users | id INTEGER PK; name TEXT; role TEXT | Team identity; service permits Manager, Developer and Tester roles. |
| accounts | user_id INTEGER PK/FK; email TEXT UNIQUE; password_hash TEXT nullable; google_sub TEXT UNIQUE nullable; verified/notifications INTEGER; created_at TEXT | Login identity and preferences; email uniqueness is case-insensitive. |
| projects | id INTEGER PK; name TEXT UNIQUE; description TEXT | Registered software systems/projects. |
| modules | id INTEGER PK; project_id INTEGER FK; name TEXT | Module name unique within a project. |
| project_members | project_id/user_id INTEGER composite PK and FKs; role TEXT | Membership with database CHECK restricting Owner/Member. |
| bugs | id INTEGER PK; project_id/module_id FKs; title; description; steps; expected; actual; environment | Structured report evidence; module nullable. |
| bugs: classification | type; severity; priority; status, all TEXT | Controlled by service validation, not dedicated lookup tables. |
| bugs: responsibility | reporter_id INTEGER FK; assignee_id INTEGER FK nullable | Reporter and eligible assigned member. |
| bugs: tracking | resolution TEXT; created_at/updated_at TEXT; version INTEGER | UTC timestamps and optimistic concurrency version. |
| history | id PK; bug_id/actor_id FKs; timestamp TEXT; changes TEXT; note TEXT | JSON field differences, explanation and actor. |
| sessions | hash TEXT PK; user_id FK; expires INTEGER | Hashed session identifier and epoch-millisecond expiry. |
| verification_tokens | hash TEXT PK; user_id FK; expires INTEGER | Time-limited account-verification tokens. |
| oauth_flows | hash TEXT PK; purpose TEXT; user_id INTEGER nullable; verifier/nonce TEXT; expires INTEGER | Temporary OAuth state; user_id has no declared FK in this table. |
| system_administrators | user_id INTEGER PK/FK | System-wide administrator designation. |
| gmail_connection | id INTEGER PK CHECK(id=1); email TEXT; refresh_token TEXT | Single OAuth sender; refresh token encrypted. |
| mail_outbox | id PK; recipient/subject/body/status TEXT; attempts/next_attempt INTEGER; created_at/sent_at TEXT | Encrypted body and delivery state; no bug FK. |

Required evidence text is trimmed and bounded by the service: title is limited to 200 characters and core evidence fields to 5,000 characters each. Boolean-like account fields are stored as integers. Epoch expiry values and ISO UTC timestamps serve different purposes and should not be interchanged. The dictionary reflects the implemented schema; not every logical relationship has an explicit foreign key.

### 7.3 Data Integrity Controls

SQLite foreign keys require valid referenced entities when enabled [8]. Unique constraints prevent duplicate project names, duplicate module names within a project, duplicate emails and duplicate memberships. The application also checks that a module belongs to the selected project, an assignee belongs to that project and the assignee has a Developer or Manager role.

Classification values, lifecycle evidence and field lengths are checked by the service. Direct database editing can bypass rules that are not database CHECK constraints. A version field rejects stale edits. Membership changes cannot remove an owner, the acting manager, an administrator or a member whose assignments would be stranded. History is append-only through the available application operations, but a database administrator could alter it.

### 7.4 Transaction Management

Bug creation/update and its history event share a BEGIN IMMEDIATE transaction. On success the service commits; on failure it rolls back. The same pattern protects account creation, verification, project creation with memberships and membership updates. SQLite's transactional model supports all-or-nothing persistence within these boundaries [3].

For an edit, the server reads the current record, compares its version with the submitted version, applies the update, increments the version and inserts history. This prevents silent overwriting of an accepted intervening edit. Email enqueueing occurs after the bug transaction, so a failure between commit and enqueue can leave a saved change without its notification. A future transactional-outbox design should close this gap. Transactional bug/history integrity must therefore be distinguished from delivery reliability.

## 8. System Development Methodology

### 8.1 Development Approach

The project followed an incremental and iterative approach informed by agile principles of frequent working delivery and responding to changing requirements [9]. It did not implement a documented Scrum process: no formal sprint schedule, team velocity, product-owner ceremonies or retrospective records are asserted.

The assignment supplied the initial feature baseline. Subsequent user feedback changed the interface, workflow flexibility, identity features, project access model, reporting and deployment packaging. Each change was incorporated into a working prototype and checked at an appropriate level. This approach suited evolving coursework requirements while keeping the essential persistence model stable.

### 8.2 Implementation Strategy

Implementation separated the consequential rules from presentation. Schema design, evidence validation, status rules and history recording formed the core. Account and project services added identity and authorisation. React components then presented those operations without treating browser controls as the sole security boundary.

Pure data helpers were used for report aggregation and pagination, making calculations independently testable. Temporary databases and mocked Google/SMTP responses reduced dependence on external accounts during automated checks. Production builds verified that the frontend could be packaged, while a separate HTTP test verified the authentication path through an actual server.

### 8.3 Incremental Development Process

| Increment | Main outcome |
|---|---|
| Core domain | Projects, modules, bugs, classification, lifecycle and history. |
| Interactive workflow | Board cards, drag-and-drop, backward moves and evidence prompts. |
| Identity and communication | Registration, verification, sessions, Google integration and Gmail delivery. |
| Project organisation | Assigned-project cards, owners, scoped data and card-based management. |
| Administration | Verified super-user bootstrap and team/membership safeguards. |
| Monitoring | Recharts visuals, CSV, register pagination and footer layout. |
| Packaging and presentation | Docker/Jenkins artefacts, UML files, branding and Font Awesome icons. |

The increments describe observable feature evolution rather than a reconstructed schedule. Regression testing after changes reduced the risk that later account, reporting or UI work would invalidate earlier lifecycle rules.

## 9. System Implementation

### 9.1 Technology Stack

| Technology | Implemented role |
|---|---|
| React 19 family | Component-based browser interface. |
| JavaScript, JSX, HTML and CSS | Application logic, markup and responsive styling. |
| Node.js 22-compatible runtime | HTTP service, cryptography, tests and built-in SQLite access. |
| SQLite | Persistent relational application data. |
| Vite 6 family | Development middleware and production frontend bundling [10]. |
| Recharts 3 family | React/SVG-based analytics components [11]. |
| Font Awesome free React packages | Shared solid and Google-brand icons [5]. |
| google-auth-library | Server-side validation of Google identity tokens. |
| Nodemailer | Gmail SMTP delivery [12]. |
| Docker and Compose | Image build and persistent single-service deployment. |
| Jenkins Pipeline | Checkout, Docker build and optional deployment automation. |

Package.json declares dependency ranges; package-lock.json records resolved dependencies for reproducible npm installation. No Python application runtime is required.

### 9.2 Authentication and Authorisation

Registration validates the name, address, chosen role and password, then creates account data. The first actual registration becomes a Manager; later self-registration is restricted to Tester or Developer. Verification controls access to project data. Google-authenticated accounts use a validated subject identifier and verified email; existing password accounts are not silently linked solely because an email matches.

After login, the application shows authorised project cards. Owner or assigned Manager permissions allow project membership and module management. Global Manager permissions control team roles and Gmail connection actions. Super users retain the Manager role and are synchronised into current and future projects. An ordinary Manager is not automatically a super user.

The npm run create-admin command can create a verified administrator with a generated password. It does not overwrite an existing administrator during repeat execution. Generated credentials must be handled privately; no password is included in this report. A password-change/reset workflow remains a future requirement.

### 9.3 Bug Management Module

The ticket form stores reproducible evidence, classifications, project/module linkage, assignee and resolution. Details and history occupy separate tabs with keyboard navigation. The server derives the actor from the session, compares versions and records accepted changes.

The board has seven status columns. Users can drag a ticket to any other valid column or use its Move to selector. The latter provides a keyboard/touch alternative. Missing evidence opens a focused form before the save. After success, a fresh snapshot updates the board and counts; failures are reported without claiming a persisted move. The register adds title/ID search, status, severity and assignee filters, and page sizes of 10, 25 or 50.

### 9.4 Project and Module Management

Project creation includes a name, description and initial members. The creator becomes Owner. Management is linked to project cards rather than a separate primary application page. Owners and assigned Managers can create modules and update membership. The API validates access even if a user crafts a request outside the interface.

Selecting a project scopes the board, register and reports. A bug may be project-wide or associated with a module. Module creation and bug validation enforce the same project context. Project and module deletion, archival and a complete project-editing workflow are outside the demonstrated scope.

### 9.5 Dashboard and Reporting Components

The dashboard combines summary cards and the lifecycle board. Cards show reported total, currently resolved/tested, outstanding, currently reopened and closed. Project reports provide five distinct visual views. A download action exports the selected project's authorised bug summaries.

The report component is lazy-loaded to avoid placing the chart module in the initial route bundle. The footer uses a full-height flex layout to remain at the bottom of short pages. It is not a fixed overlay that obscures long content. Font Awesome replaces ad hoc symbols across navigation and common actions, while the logo uses a white Bug badge and primary-colour Tracker text.

### 9.6 Notification Services

The application supports a Gmail OAuth sender and SMTP transport. Configured SMTP takes precedence. Nodemailer connects to Gmail using TLS on port 465; the operator supplies the sender address and App Password. Google's guidance describes App Passwords as a separate account mechanism subject to eligibility and two-step verification requirements [13]. These credentials do not replace the OAuth client needed for Google login.

Registration generates a verification message. Ticket creation and relevant updates notify verified, opted-in reporters and assignees, with duplicate recipients removed. Verification messages are not suppressed by the ticket-notification preference. Ticket messages contain a summary and workspace link rather than the entire reproduction record.

The outbox persists encrypted bodies, attempts and delivery state. Eligible messages are processed in batches, and qualifying failed attempts are retried after approximately one minute, with records marked failed after five attempts. Missing or invalid authorisation can leave messages pending until configuration is corrected. Delivery status means the transport accepted a send, not proof that a person read the message. A crash after external acceptance but before local status update can cause a duplicate on retry.

### 9.7 Team and Membership Management

Account roles and project roles are separate. A Developer may own a project; a Manager still requires project assignment to manage it. Team-role changes are Manager-only, cannot change the acting Manager's own role through that action, cannot demote a system administrator, and cannot change an assigned developer to Tester without first reassigning relevant tickets.

Membership safeguards preserve ownership and administrative access and prevent stranded assignments. Removing membership affects subsequent project-card visibility and data access. Notification preference changes affect the current account. The user context menu groups My projects, My account & team and Sign out beneath the user's identity, reducing header clutter.

## 10. Reporting and Analytics

The report data helper derives all charts from the same project-scoped snapshot. This is important because plausible charts with inconsistent denominators can mislead project decisions. Recharts supplies composable React chart components and SVG rendering [11]; the calculations remain application code rather than library-supplied business definitions.

| Visual | Calculation | Management interpretation |
|---|---|---|
| Lifecycle donut | Current ticket count for each status. | Shows the present distribution of work. |
| Severity/priority stacked bars | Tickets grouped by severity and stacked by P1–P4. | Separates impact from scheduling urgency. |
| Daily activity area chart | Created tickets and observed transitions into Resolved/Reopened over 30 or 90 UTC days. | Shows event activity rather than historical backlog. |
| Module hotspot bars | Outstanding versus completed-state tickets per module, including Project wide. | Identifies concentrations of recorded unresolved work. |
| Assignee workload bars | Outstanding, resolved/tested and closed tickets per assignee, including Unassigned. | Supports allocation discussion without claiming productivity measurement. |

Let T be all tickets in the selected project, V tickets currently Resolved or Tested, C tickets currently Closed, and O tickets in Reported, Assigned, In Progress or Reopened. The dashboard reconciliation is T = V + C + O. Reopened-now is a subset of O and must not be added again to the total. Reported total means all existing reports, not only the Reported column.

Daily activity uses UTC calendar buckets. Each qualifying history event is counted once by event ID; creation/import snapshots with no prior status are excluded from repair/reopening transition counts. A ticket can therefore contribute multiple observed reopening events on different occasions. Changing the 30/90-day range affects activity only; current-state charts remain current snapshots.

CSV exports are membership-scoped and optionally project-scoped. They contain summary fields, not every evidence field or full audit history. Formula-like values are prefixed to reduce spreadsheet execution risks. The system does not calculate a validated defect density, mean time to repair, SLA attainment or escape rate. Such measures would require additional denominators, timestamps and agreed definitions. Module counts are counts of reported defects, not proof of comparative code quality.

## 11. Testing and Quality Assurance

### 11.1 Test Strategy

Verification combines isolated service/data tests, simulated HTTP application tests, mocked external integrations, a real production HTTP authentication test, source inspection and a production build. The Node.js test runner executes the automated suites [14]. Tests use temporary or in-memory SQLite data so that they do not modify the user's working defect register.

Positive cases check valid operations. Negative cases check invalid roles, unknown entities, stale versions, missing evidence, unauthorised project access, expired/reused tokens and delivery failures. Pure report/pagination helpers provide deterministic boundary checks. No code-coverage percentage is reported because coverage was not measured.

### 11.2 Functional Testing

Workflow tests exercise report creation, assignment, progress, resolution, testing, closure and reopening. They confirm valid classifications and required evidence, reject invalid status values and verify the associated history. Dedicated workflow cases cover movement in both directions. Pagination tests check filtering before slicing, page bounds, result ranges and compact page-number generation. Reporting tests reconcile totals and check empty-project behaviour.

Browser acceptance scenarios remain important: drag a ticket left and right, use the Move to selector, switch history/details tabs with a keyboard, select a project card, open account actions and inspect the layout on a narrow screen. The existing automated suite does not execute browser drag events or prove visual alignment. This report records those as manual acceptance requirements, not newly passed browser tests.

### 11.3 Integration Testing

Application-level tests combine accounts, permission checks, project services, persistence and notification triggers. Gmail API and SMTP responses are mocked to check encrypted storage, payload handling, failures and notification preferences without sending real mail. Project tests verify scoped snapshots, exports, owner capabilities, safe membership changes and rejected cross-project operations.

The separate production HTTP test starts a real application server with a disposable database, registers an account, verifies it using test-controlled data and logs in with the password. It checks the deployed-style HTTP route rather than calling the account function directly. It does not exercise real Google consent, public reverse-proxy configuration or an actual recipient inbox.

### 11.4 Security Testing

Existing tests cover password/session behaviour, expiry and reuse of verification tokens, OAuth state binding, account-linking rules, unauthorised role/sender operations, project isolation, assignee membership, administrator protections and encrypted mail handling. These are targeted regression checks rather than a complete penetration test.

Inspection also identified credentials embedded in the current Jenkins environment configuration. This is a deployment weakness: values should be removed from source configuration, rotated if exposed and supplied through the Jenkins credential store [15]. The report intentionally reproduces no credentials. Further security work should review password work factors, proxy-aware rate limiting, data minimisation, content-security policy, account recovery, dependency monitoring and administrative logging.

### 11.5 Test Results

The following checks were executed on 26 November 2026 against the inspected current project.

| Check | Observed result | Evidence boundary |
|---|---|---|
| npm test | 52 tests passed; 0 failed. | Domain, account, application, project, administrator, workflow, report, pagination and mail regression suite. |
| npm run test:http | 1 test passed; 0 failed. | Production HTTP registration, verification and password login with disposable data. |
| npm run build | Passed using Vite 6.4.6. | Frontend compilation and asset generation. |
| Build warning | Reports JavaScript chunk approximately 506 kB before gzip. | Non-fatal size warning; further splitting can be considered. |
| Live Google/SMTP acceptance | Not executed for this report. | Requires the operator's configured accounts, consent and network access. |
| Docker/Jenkins deployment | Inspected; not rerun for this report. | Local test/build success does not prove a pipeline deployment. |
| Accessibility, load and recovery testing | Not completed. | No certification, throughput or recovery target is claimed. |

The results support confidence in the tested rules and authentication path. They do not prove that all defects are absent or that external services and every browser interaction are correct. The runtime also emits an experimental SQLite warning in the test environment; operators should evaluate the pinned Node release and API stability before upgrades.

## 12. Deployment and Operational Considerations

Local development uses npm installation followed by npm run dev and the configured application origin, normally http://127.0.0.1:3000. Production assets are built with npm run build and served through npm start. APP_ORIGIN must match the public scheme, host and port and must not have a trailing slash. HOST controls listening interfaces; it is distinct from the public origin.

The Dockerfile separates dependency installation, testing, frontend build and runtime stages. The runtime copies built assets and application modules, runs as the non-root node user, persists /data and exposes a health check. Multi-stage builds separate build-time work from the final image [16]. The current package manifest places Vite among ordinary dependencies, so omitting development dependencies alone does not produce the smallest possible runtime.

The inspected Compose file runs one application service, maps published port 8083 to container port 3000 and retains the database and generated mail key in a named volume. HTTPS is expected to be provided by hosting infrastructure or a reverse proxy; the Node server itself uses HTTP. The configured hosted origin is https://bugflow.devworxsd.com. Backup and restore must preserve the database and the matching encryption key. Deleting the volume destroys persisted data; changing the key can make existing encrypted mail information unreadable.

Google requires the callback URI to match an authorised redirect for the same OAuth client [4]. The local callback is http://127.0.0.1:3000/api/auth/google/callback; the hosted callback is https://bugflow.devworxsd.com/api/auth/google/callback when that public origin is used. Scheme, hostname, port, path and trailing-slash differences matter. Google login requires client ID/secret even if SMTP is used for mail. A previously observed redirect mismatch is therefore an environment/configuration issue that cannot be declared resolved merely by compiling the application.

Jenkins Pipeline expresses automated delivery stages in a Jenkinsfile [17]. The current project checks out source, checks Docker, builds the runtime image and conditionally deploys when DEPLOY is selected. The Docker build incorporates npm test through stage dependencies, but the Jenkinsfile has no separate production HTTP smoke-test stage, no confirmed public health verification and no automated rollback. Its success message describes broader checks than its explicit stages provide. It should be revised to report actual outcomes, use managed credentials, validate service health and keep rollback images.

Operators should monitor service health, failed deliveries, disk usage and backup completion. A healthy /healthz response confirms the process can query SQLite; it does not demonstrate Google availability, successful email delivery, correct permissions or restore readiness. Single-instance operation is the supported deployment model for this prototype. Multi-instance deployment requires redesigned database and worker coordination.

## 13. Evaluation and Discussion

The prototype addresses the assignment's central problem by connecting each defect to project context, responsible people, lifecycle status and historical evidence. The combination of board and register serves different tasks: the board supports flow discussion, while the register supports structured search and comparison. Project cards reduce context confusion after login and align navigation with the server's membership model.

The separation of severity and priority is useful because impact and scheduling urgency are different decisions. Preserved history supports review of reversals and reopening rather than overwriting prior explanations. Version checks address a concrete collaborative risk: one user's save silently replacing another's accepted change. Report reconciliation tests strengthen the trustworthiness of the charts without claiming that presentation alone makes the underlying data complete.

Flexible movement is both a strength and a governance trade-off. It corrects the earlier restriction on backward moves and supports real maintenance work, but allows users to bypass the recommended progression. Required assignment, resolution and reopening notes retain minimum evidence. Organisations needing formal verification should introduce explicit transition permissions and test-result records.

The selected architecture is proportionate to a coursework prototype and small team demonstration. It avoids operating several services and exposes identifiable modules for assessment. Its simplicity also limits concurrency, background-processing guarantees and server-side query efficiency. The current tests provide stronger evidence for business rules than for usability or production reliability. Claims about fewer lost bugs, faster resolution or user satisfaction remain hypotheses for future evaluation.

Security is partially implemented rather than complete. Identity, membership, hashing and encrypted mail storage are meaningful controls, but direct credentials in deployment configuration, limited recovery functionality and unmeasured password work factors prevent a production-readiness claim. Recognising these boundaries makes the evaluation more credible than treating successful tests as universal assurance.

## 14. Limitations and Future Enhancements

| Priority | Limitation | Proposed enhancement |
|---|---|---|
| Immediate | Credentials embedded in Jenkins configuration. | Rotate affected values, remove them from source/history as appropriate and bind managed secrets. |
| High | Google callback and account policy depend on environment. | Complete hosted consent/sign-in and SMTP acceptance checks with documented configuration. |
| High | No account password reset/change or multifactor authentication. | Add secure recovery, password change and stronger administrative authentication. |
| High | Bug and notification enqueue are separate commits. | Insert outbox records atomically with domain changes; design duplicate-safe delivery. |
| High | Backups and recovery have not been demonstrated. | Define recovery objectives and test restoration of database plus encryption key. |
| Medium | Synchronous SQLite and full snapshot retrieval. | Add server-side filtering/pagination, query limits and indexes; evaluate a server database if demand warrants it. |
| Medium | No browser automation or formal accessibility assessment. | Test drag/select alternatives, keyboard flow, contrast, responsive layouts and assistive technology. |
| Medium | Open registration and broad within-project ticket editing. | Add invitations, configurable transition permissions and explicit verification evidence. |
| Medium | Deployment pipeline lacks smoke/rollback checks. | Add HTTP acceptance, health waiting, truthful stage reporting and rollback verification. |
| Medium | Audit history is editable by database operators. | Add restricted administrative access, retention policy and external/tamper-evident audit storage where justified. |
| Later | Missing attachments, comments, search and source-control integration. | Add sanitised attachments, discussion threads and controlled integrations. |
| Later | Limited time-based quality measures. | Capture suitable timestamps and denominators before adding lead-time, SLA or defect-density reports. |

Any enhancement should preserve traceability, project boundaries and regression coverage. Additional metrics should be introduced with clear definitions and validation rather than as decorative dashboard figures.

## 15. Conclusion

Bug Tracker provides an implemented defect-management workflow covering project/module registration, structured reporting, classification, assignment, flexible lifecycle tracking, change history and project-focused monitoring. React supplies the interactive interface; Node.js applies identity and business rules; SQLite persists domain and operational records. Project cards, a bidirectional board, paginated register, history tabs, Recharts analytics, Gmail integration and deployment artefacts extend the prototype beyond a basic issue list.

The current verification results—52 passing automated tests, one passing production HTTP authentication test and a successful production build—support the functionality within the stated test boundaries. The principal remaining work concerns deployment secret handling, live Google acceptance, recovery, browser/accessibility testing and scaling. The project therefore demonstrates the requested software engineering concepts and a working prototype, while clearly separating delivered capability from production hardening and future evaluation.

## 16. References

[1] React, “Quick Start,” React documentation, n.d. Available: https://react.dev/learn. Accessed: 26 November 2026.

[2] Object Management Group, “Unified Modeling Language, Version 2.5.1,” December 2017. Available: https://www.omg.org/spec/UML/2.5.1/. Accessed: 26 November 2026.

[3] SQLite, “SQLite Is Transactional,” n.d. Available: https://sqlite.org/transactional.html. Accessed: 26 November 2026.

[4] Google, “Using OAuth 2.0 for Web Server Applications,” Google for Developers, n.d. Available: https://developers.google.com/identity/protocols/oauth2/web-server. Accessed: 26 November 2026.

[5] Font Awesome, “Set Up with React,” Font Awesome documentation, n.d. Available: https://docs.fontawesome.com/web/use-with/react/. Accessed: 26 November 2026.

[6] OWASP Foundation, “Password Storage Cheat Sheet,” OWASP Cheat Sheet Series, n.d. Available: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html. Accessed: 26 November 2026.

[7] OWASP Foundation, “Session Management Cheat Sheet,” OWASP Cheat Sheet Series, n.d. Available: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html. Accessed: 26 November 2026.

[8] SQLite, “SQLite Foreign Key Support,” n.d. Available: https://sqlite.org/foreignkeys.html. Accessed: 26 November 2026.

[9] Manifesto for Agile Software Development, “Principles behind the Agile Manifesto,” 2001. Available: https://agilemanifesto.org/principles.html. Accessed: 26 November 2026.

[10] Vite, “Getting Started,” Vite documentation, n.d. Available: https://vite.dev/guide/. Accessed: 26 November 2026. The project uses Vite 6; current documentation may describe newer releases.

[11] Recharts, “Recharts,” official documentation, n.d. Available: https://recharts.github.io/en-US/. Accessed: 26 November 2026.

[12] Nodemailer, “SMTP Transport,” Nodemailer documentation, n.d. Available: https://nodemailer.com/smtp. Accessed: 26 November 2026.

[13] Google, “Sign in with app passwords,” Google Account Help, n.d. Available: https://support.google.com/accounts/answer/185833. Accessed: 26 November 2026.

[14] Node.js, “Test Runner,” Node.js documentation, n.d. Available: https://nodejs.org/api/test.html. Accessed: 26 November 2026. The project runtime and dependency declarations determine applicable API versions.

[15] Jenkins, “Using Credentials,” Jenkins User Handbook, n.d. Available: https://www.jenkins.io/doc/book/using/using-credentials/. Accessed: 26 November 2026.

[16] Docker, “Multi-stage Builds,” Docker documentation, n.d. Available: https://docs.docker.com/build/building/multi-stage/. Accessed: 26 November 2026.

[17] Jenkins, “Pipeline,” Jenkins User Handbook, n.d. Available: https://www.jenkins.io/doc/book/pipeline/. Accessed: 26 November 2026.
