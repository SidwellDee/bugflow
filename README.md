# Bug Tracker

A React and Node.js bug tracking prototype for CSC 601 Advanced Software Engineering.

## Run

Install Node.js 22.13 or later, including npm. Python is not required.

1. Open a terminal in this folder.
2. Run `npm install`, then `npm run dev`.
3. Open http://127.0.0.1:3000 in your browser.
4. Stop with Ctrl+C. Data remains in `bugflow.db`.

The first launch creates the SQLite database and six clearly labelled demonstration records. Subsequent launches retain your changes. To use a separate database, set the `BUGFLOW_DB` environment variable before starting. Back up the database while the server is stopped.

## Deliverables

- `REPORT.md`: comprehensive development and implementation report.
- `DEMONSTRATION.md`: assessed walkthrough with expected results.
- `server.js`: Node.js HTTP service and Vite development integration.
- `store.js`: validation, workflow and SQLite persistence using Node's built-in SQLite API.
- `src/main.jsx`: React components, forms, dashboard and reports.
- `src/style.css`: responsive interface styles.
- `tests/store.test.js`: workflow and integrity tests. Run `npm test`.
- `Start.ps1`: optional Windows launch helper.

User accounts now replace the demo identity selector. Register with email and password or continue with Google. Email verification is required before accessing the workspace. The first registered account becomes Manager. Configure Google sign-in and a Gmail sender using [GOOGLE_SETUP.md](GOOGLE_SETUP.md) before attempting a full registration demonstration. Without credentials, account registration works but verification emails remain pending and Google sign-in stays disabled.

This is a single-computer teaching prototype with open registration into a shared workspace. Do not expose it publicly or store confidential production issues without adding invitation and project-level access controls.

## Production build

Run `npm run build`, then `npm start`. The same Node.js server serves the compiled React assets and API. Port 3000 is the default; set `PORT` and `APP_ORIGIN` consistently to choose another port. Node.js 22 may print an experimental SQLite warning. The existing database from the earlier prototype remains compatible. Account, session, verification and mail tables are added automatically. Back up the database and `.local/mail.key` securely if that local encryption key is in use.

Run `node build-report.js` to regenerate the printable report after editing REPORT.md.

## Docker and Jenkins

See [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) for the production Dockerfile, Compose commands and Jenkins setup. Copy `.env.example` to `.env`, configure Google, then run `docker compose up -d --build --wait`. The Jenkinsfile expects a trusted Linux agent labelled `docker` and a Secret file credential named `bugflow-env`. Its DEPLOY option is off by default. The image stores its database and generated mail encryption key in a persistent volume.

## Ticket board
The dashboard groups tickets by status. Drag a card to a highlighted destination or use its Move to menu. Every verified team member can move existing tickets to any other status in either direction. Hold a dragged ticket near either board edge to scroll. Required assignment, resolution and reopening details are collected before the move is saved. Scroll the board horizontally to reach all seven statuses.

## Accounts and Gmail

For Gmail sending with an email address and Google App Password, use [SMTP_SETUP.md](SMTP_SETUP.md). Set GMAIL_EMAIL and GMAIL_APP_PASSWORD in the private server environment file; Google OAuth credentials are optional for sending in this mode. Restart the server after configuration changes. The application checks account API availability before showing registration, and development mode watches backend imports to prevent stale-server mismatches.

- `accounts.js`: password accounts, Google identities, sessions and verification tokens.
- `application.js`: authenticated API, OAuth callbacks, team roles and notification triggers.
- `gmail.js`: Gmail API delivery and persistent encrypted email queue.
- `security.js`: password hashing and encrypted secret storage.
- `src/Accounts.jsx`: sign-in, registration, verification and Team & Gmail screens.
- `.env.example`: configuration template; copy to private `.env`.

Run `npm test` for all 28 automated checks. Google responses are mocked in tests. Real Google consent and live email delivery require the configuration and acceptance walkthrough in GOOGLE_SETUP.md.

The current suite has 30 tests, including SMTP delivery and failure handling with a mocked transport. After `npm run build`, run `npm run test:http` for a real HTTP registration → verification → login check with a disposable database and no real email sending. That test requires local socket access.


## Assigned project workspace

After sign-in, Your projects shows only assigned project cards. Select a card to open that project's dashboard, ticket board, register and reports. My projects returns to the cards. There is no all-project dashboard selector.

Create a project from the Create a project card and choose its members. The creator becomes project owner and is assigned automatically. Use Manage project on a card to add modules or change assignments; members without management rights can view the project's modules and team. Module and project creation are no longer global navigation pages. Ticket assignees must belong to the project. Reassign a member's tickets before removing them.

Click the avatar or user name to open My projects, My account & team, and Sign out. Escape and outside clicks close the menu; arrow keys navigate its actions.

The first upgrade adds a project_members table and infers existing assignments from managers, ticket reporters and assignees. Later new accounts start with no projects until assigned or until they create a project. Changes affect project data returned by the API, including exports, not just the cards. The current suite has 39 passing tests; the production build and real HTTP registration/login check also pass. Dockerfile includes the new project service.

## Verified system administrator

Run `npm run create-admin` to create the default verified system administrator at admin@bugflow.local. A random password is generated and printed only when creating the account; only its salted hash is stored. The command is idempotent and preserves existing administrator credentials. This privileged account uses the Manager role and is automatically assigned to existing and future projects. Its role and project access cannot be removed through ordinary management forms. Notifications are initially off because the default address is a local login identifier rather than a real mailbox.

Optional server-side variables BUGFLOW_ADMIN_EMAIL, BUGFLOW_ADMIN_NAME and BUGFLOW_ADMIN_PASSWORD customise initial creation. The command refuses to replace an ordinary registered account with the same email. Do not commit real credentials. Inside a running Docker deployment, use `docker compose exec app npm run create-admin`; accounts belong to that container's persistent database, separate from a local installation unless the same data was migrated.
