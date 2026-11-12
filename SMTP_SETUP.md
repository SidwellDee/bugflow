# Gmail email and App Password

BugFlow can send verification links and ticket updates using Gmail SMTP. You do not need a Google OAuth client for password-based BugFlow registration and email delivery. Continue with Google still requires the separate OAuth configuration in GOOGLE_SETUP.md.

1. Enable 2-Step Verification for the Gmail sender account.
2. Create an App Password for BugFlow through your [Google account](https://myaccount.google.com/apppasswords). Use this password, not your normal Gmail login password. Some managed or protected accounts do not offer App Passwords; see [Google's instructions](https://support.google.com/accounts/answer/185833?hl=en).
3. Copy `.env.example` to `.env` if you have not already created the private file. Enter these values on the server:

```dotenv
PORT=3000
APP_ORIGIN=http://127.0.0.1:3000
GMAIL_EMAIL=your-sender@gmail.com
GMAIL_APP_PASSWORD=your-google-app-password
```

Keep `.env` private. Do not put the password in React source, Git, Dockerfile or Jenkinsfile. Do not paste it in chat. Docker Compose already loads the runtime environment file; Jenkins uses the private bugflow-env Secret file credential.

4. Stop the previous server and run `npm run dev`. Open http://127.0.0.1:3000. If using Docker, run `docker compose up -d --build --force-recreate` after updating its environment file. Development mode now watches imported server modules for changes, preventing the frontend from using newly added features while an old server continues running. Restart manually after environment changes.
5. Register your BugFlow account using your own chosen application password (at least 12 characters). This is separate from the sender's Google App Password.
6. Open the verification email delivered to your registered address. Follow its link, then sign in. Already registered? Sign in and choose Resend verification. No need to register the same address again.

SMTP delivery uses smtp.gmail.com port 465 with TLS. SMTP takes precedence if both SMTP and OAuth sender settings exist. Server credentials are never returned to the browser. The existing encrypted outbox, retry handling and notification preferences remain in use. Configuration status indicates credentials are present, not that Google has accepted them. Inspect delivery errors in Team & Gmail. If delivery fails, check the App Password and outbound network access to port 465.

## If account creation says Not found

The current application defines POST /api/auth/register and POST /api/auth/login. A server without those endpoints is an old build or a standalone frontend preview. Restart the full Node.js application or rebuild its container. The sign-in screen now checks that the account API is available before showing the form and provides a specific recovery message instead of a generic Not found error. Existing user data is preserved.
