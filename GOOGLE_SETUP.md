# Google sign in and Gmail setup

BugFlow now supports password registration, verified email, Google sign-in and Gmail notifications. These features use your own Google Cloud OAuth application. No Google credentials are bundled, and no real email has been sent during automated testing.

For email/password-based Gmail SMTP sending instead, follow SMTP_SETUP.md. Google OAuth setup below is only needed for Google sign-in or the OAuth Gmail sender option. SMTP takes priority when GMAIL_EMAIL and GMAIL_APP_PASSWORD are set on the server.

## Configure the Google application

1. Create or select a project in the [Google Cloud console](https://console.cloud.google.com/).
2. Enable the Gmail API for that project.
3. Configure Google Auth Platform branding, audience and data access. For a coursework demonstration, use a testing audience and add the Google accounts you will use as test users. Public release may need Google review because `gmail.send` is a sensitive scope; see [Google's scope classifications](https://developers.google.com/workspace/gmail/api/auth/scopes) and [verification guidance](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification).
4. Add the scopes `openid`, `email`, `profile` and `https://www.googleapis.com/auth/gmail.send`. Ordinary sign-in requests only identity scopes; Gmail send access is requested separately when a manager connects a sender. BugFlow does not request inbox-reading permission.
5. Create an OAuth client of type Web application. Register this exact authorised redirect URI:

   `http://127.0.0.1:3000/api/auth/google/callback`

   If you choose another host or port, change both this URI and APP_ORIGIN. The callback must match the registered URI; see [Google's server application instructions](https://developers.google.com/identity/protocols/oauth2/web-server).
6. Copy `.env.example` to `.env`. Enter your own client ID and client secret in `.env`. Keep that file private; it is ignored by Git. Do not put credentials in React files or send them in this chat.

```text
PORT=3000
APP_ORIGIN=http://127.0.0.1:3000
GOOGLE_CLIENT_ID=your-web-application-client-id
GOOGLE_CLIENT_SECRET=your-web-application-client-secret
```

7. Run `npm install` if needed, then restart with `npm run dev`. Open `http://127.0.0.1:3000` using that exact host. Using localhost instead of 127.0.0.1 without changing APP_ORIGIN will fail the request-origin check.

## Register the first manager

The first real registered account becomes Manager. Existing sample users are retained as assignment records; they do not have sign-in credentials and do not occupy the first-account position. Initialise the workspace yourself before giving anyone else access.

The simplest bootstrap is Continue with Google using a Google account that has been added as a test user. This creates a verified account. Then open Team & Gmail, select Connect Gmail and approve sending from the intended sender mailbox. You can use the same Google account or a dedicated workspace sender.

Alternatively, register with a name, email and password of at least 12 characters. The first manager may connect Gmail from the verification screen. Connecting the same Google email verifies this manager account. If a different sender is connected, use the verification email delivered to the registered address instead.

Additional password users must verify the link sent to their email before accessing project data. Links expire after 24 hours and are single-use. A resend invalidates the previous link. Additional Google users join as verified Testers; the manager can change their role in the team directory.

Google sign-in does not automatically take over an existing password account with the same email. Sign in with its password instead. Account linking and password-reset flows are outside this module's current scope.

## Gmail delivery

Only a manager can connect, reconnect or disconnect the workspace sender. Google opens its own consent screen; BugFlow never asks for your Gmail password. The connection requests offline access so the server can refresh tokens for delivery, following [Google's OAuth flow](https://developers.google.com/identity/protocols/oauth2/web-server).

BugFlow encodes plain-text MIME messages as base64url and calls Gmail's messages.send endpoint as described in [Google's sending guide](https://developers.google.com/workspace/gmail/api/guides/sending). It sends:

- Registration verification links.
- Ticket creation, assignment and status-change messages to verified, opted-in reporters and current assignees. Duplicate recipients are removed.
- A test email to the signed-in manager when explicitly requested.

Ticket emails include title, status, updating member and workspace URL, not full reproduction notes. All members can disable ticket notifications in My account. Verification emails are still sent. In Team & Gmail, inspect connected status, sender and delivery queue. Emails remain pending while Gmail is not connected. Once connected, queued messages are delivered automatically. Failed send attempts retry after at least a minute, up to five send attempts. Authorization failures retain pending messages until configuration is corrected. Gmail delivery can be delayed, so the ticket save does not wait for delivery.

Refresh tokens and queued message bodies are encrypted with AES-256-GCM. Set TOKEN_ENCRYPTION_KEY to a base64-encoded random 32-byte key in your deployment secret store. For local use, an encryption key is generated in `.local/mail.key` when the variable is absent. Back up the key securely along with the database; losing it makes stored refresh tokens and queued email bodies unreadable. Windows file protection must be enforced using your account's filesystem permissions. Disconnect removes the locally stored refresh token; to revoke Google's consent as well, remove the application from your Google account's connections.

## Acceptance walkthrough

1. Configure the client and restart. Confirm Google sign-in is enabled.
2. Register the first manager using Google. Connect Gmail and send yourself a test email.
3. In another browser session, register a Developer using a second test address. Verify its email. Sign in with its password, sign out and sign back in.
4. As manager, inspect the team directory and change a registered member's role. Your own role cannot be changed from that screen. Reassign a developer's existing tickets before changing that member to Tester.
5. Assign a ticket to the registered developer, then move it in either direction on the board. Confirm the update email and change history.
6. Turn off that user's ticket notifications and repeat. Confirm no new ticket email is queued for them.
7. Disconnect Gmail and register another test user. Confirm verification is shown as pending instead of claiming delivery. Reconnect and verify delivery.
8. Test a reused or expired verification link, cancelled Google consent and an incorrect password. Confirm clear errors.

## Deployment limits

The application still binds to loopback and is intended for a trusted local classroom demonstration. Registered and verified users share one workspace; registration is open and is not an invitation or project-membership system. Add invite-only onboarding and project-level authorization before exposing private project data to an external audience. Use HTTPS for a hosted deployment, protect encryption and client secrets, configure Google consent and privacy requirements, and test backup/recovery. Automated tests mock Google token verification and Gmail HTTP responses; they do not prove a live Google consent or delivery run.
