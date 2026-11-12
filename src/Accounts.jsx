import React, { useEffect, useState } from "react";
async function api(path, body) {
  const response = await fetch(
    "/api/" + path,
    body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {},
  );
  const result = await response.json();
  if (!response.ok) throw Error(result.error);
  return result;
}
function Brand() {
  return (
    <a className="brand" href="/">
      <span className="brand-mark">b</span>
      <strong>
        bugflow<span>.</span>
      </strong>
    </a>
  );
}

export function AccountGate({ children }) {
  const [session, setSession] = useState(null),
    [loading, setLoading] = useState(true),
    [mode, setMode] = useState("login"),
    [error, setError] = useState(
      new URLSearchParams(location.search).get("auth_error") || "",
    ),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const refresh = async () => {
    try {
      setSession(await api("auth/me"));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    refresh();
    if (location.search) history.replaceState(null, "", location.pathname);
  }, []);
  const logout = async () => {
    await api("auth/logout", {});
    setSession({ ...session, user: null });
    setMessage("");
  };
  if (loading)
    return (
      <div className="auth-shell">
        <p>Opening your workspace…</p>
      </div>
    );
  if (session?.user?.verified)
    return children(session.user, logout, (user) =>
      setSession({ ...session, user }),
    );
  if (session?.user)
    return (
      <div className="auth-shell">
        <div className="auth-card verification-card">
          <Brand />
          <span className="eyebrow">ONE MORE STEP</span>
          <h1>Verify your email</h1>
          <p>
            Your account is registered as <strong>{session.user.email}</strong>.
            Open the verification link in your inbox to enter the workspace.
          </p>
          <div className="toolbar">
            <button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  setMessage((await api("auth/resend", {})).message);
                  setError("");
                } catch (e) {
                  setError(e.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Resend verification
            </button>
            <button className="secondary" onClick={refresh}>
              I’ve verified my email
            </button>
          </div>
          {message && (
            <p role="status" className="board-message">
              {message}
            </p>
          )}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {session.user.role === "Manager" && (
            <>
              <h2>Set up workspace email</h2>
              <p>
                You’re the first registered user and workspace manager. Connect
                a Gmail sender to deliver queued verification emails. Connecting
                the same Google email also verifies this account.
              </p>
              <GmailSettings user={session.user} />
            </>
          )}
          <button className="secondary" onClick={logout}>
            Back to sign in
          </button>
        </div>
      </div>
    );
  return (
    <div className="auth-shell">
      <div className="auth-story">
        <Brand />
        <span className="eyebrow">LESS FRICTION. MORE PROGRESS.</span>
        <h1>
          A better place
          <br />
          for every fix.
        </h1>
        <p>
          Bring your team, tickets and progress together in one clear workspace.
        </p>
        <div className="auth-story-note">
          <span>01</span> Report with context.
          <br />
          <span>02</span> Move work forward.
          <br />
          <span>03</span> Keep the full history.
        </div>
      </div>
      <div className="auth-card">
        <span className="eyebrow">YOUR TEAM STARTS HERE</span>
        <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p>
          {mode === "login"
            ? "Sign in to your BugFlow workspace."
            : "Join your team and keep every issue moving."}
        </p>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const values = Object.fromEntries(
              new FormData(event.currentTarget),
            );
            if (mode === "register" && values.password !== values.confirm) {
              setError("Passwords do not match");
              return;
            }
            setBusy(true);
            setError("");
            try {
              const result = await api(
                "auth/" + (mode === "login" ? "login" : "register"),
                values,
              );
              setSession({ ...session, user: result.user });
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {mode === "register" && (
            <label>
              Full name
              <input name="name" autoComplete="name" required maxLength={100} />
            </label>
          )}
          <label>
            Email address
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
              minLength={mode === "register" ? 12 : 1}
              maxLength={128}
            />
            {mode === "register" && <small>Use at least 12 characters.</small>}
          </label>
          {mode === "register" && (
            <>
              <label>
                Confirm password
                <input
                  type="password"
                  name="confirm"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={128}
                />
              </label>
              <label>
                Your role
                <select name="role">
                  <option>Tester</option>
                  <option>Developer</option>
                </select>
              </label>
              <p className="auth-hint">
                The first account becomes workspace manager. Additional accounts
                join with the selected role.
              </p>
            </>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="auth-submit" disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>
        <div className="auth-divider">
          <span>or</span>
        </div>
        {session?.googleConfigured ? (
          <a className="button google-button" href="/api/auth/google">
            <span aria-hidden="true">G</span> Continue with Google
          </a>
        ) : (
          <>
            <button className="google-button auth-submit" disabled>
              Continue with Google
            </button>
            <p className="auth-hint">
              Google sign-in is waiting for workspace configuration.
            </p>
          </>
        )}
        <p className="auth-switch">
          {mode === "login" ? "New to BugFlow?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

export function GmailSettings({ user }) {
  const [state, setState] = useState(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const load = () =>
    api("mail/status")
      .then(setState)
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  async function action(name) {
    setBusy(true);
    setError("");
    try {
      const result = await api("mail/" + name, {});
      if (result.url) {
        location.assign(result.url);
        return;
      }
      setMessage(
        result.message ||
          "Gmail disconnected. Queued email will wait until a sender is connected.",
      );
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="gmail-settings">
      <div className="settings-heading">
        <div>
          <h3>Gmail connection</h3>
          <p>
            {state?.connected
              ? `Sending as ${state.sender}`
              : "Send verification links and ticket updates through Gmail."}
          </p>
        </div>
        <span className={"badge " + (state?.connected ? "Tested" : "Medium")}>
          {state?.connected ? "Connected" : "Not connected"}
        </span>
      </div>
      {state && !state.configured && (
        <p className="auth-hint">
          Google app credentials are not configured. Follow GOOGLE_SETUP.md on
          the server, then restart the application.
        </p>
      )}
      {user.role === "Manager" && (
        <div className="toolbar">
          <button
            disabled={busy || !state?.configured}
            onClick={() => action("connect")}
          >
            {state?.connected ? "Reconnect Gmail" : "Connect Gmail"}
          </button>
          {state?.connected && (
            <>
              <button
                className="secondary"
                disabled={busy || !user.verified}
                onClick={() => action("test")}
              >
                Send me a test email
              </button>
              <button
                className="secondary"
                disabled={busy}
                onClick={() => action("disconnect")}
              >
                Disconnect
              </button>
            </>
          )}
        </div>
      )}
      {state?.queue?.length > 0 && (
        <p className="auth-hint">
          Delivery queue:{" "}
          {state.queue.map((q) => `${q.count} ${q.status}`).join(" · ")}
        </p>
      )}
      {(error || state?.lastError) && (
        <p className="error" role="alert">
          {error || state.lastError}
        </p>
      )}
      {message && (
        <p role="status" className="board-message">
          {message}
        </p>
      )}
      <button className="secondary" disabled={busy} onClick={load}>
        Refresh connection status
      </button>
    </div>
  );
}

export function Team({ user, onProfile }) {
  const [team, setTeam] = useState(null),
    [error, setError] = useState("");
  const load = () =>
    api("team")
      .then(setTeam)
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  return (
    <>
      <div className="grid">
        <section>
          <h2>My account</h2>
          <p>
            <strong>{user.name}</strong>
            <br />
            {user.email}
          </p>
          <div className="toolbar">
            <span className="badge Tested">Email verified</span>
            <span className="badge">{user.role}</span>
            {!!user.google_connected && (
              <span className="badge">Google sign-in</span>
            )}
          </div>
          <label className="preference-row">
            <input
              type="checkbox"
              checked={!!user.notifications}
              onChange={async (event) => {
                try {
                  const result = await api("team/preferences", {
                    notifications: event.target.checked,
                  });
                  onProfile(result.user);
                } catch (e) {
                  setError(e.message);
                }
              }}
            />
            Email me when my reported or assigned tickets change status or
            assignment.
          </label>
          <p className="auth-hint">
            Messages are sent by the workspace’s connected Gmail account.
          </p>
        </section>
        <section>
          <GmailSettings user={user} />
        </section>
      </div>
      <section>
        <div className="toolbar">
          <h2 style={{ flex: 1 }}>Team directory</h2>
          <span className="muted">{team?.users.length || 0} team members</span>
        </div>
        <p>
          New members register from the sign-in screen. Sample members remain
          available for ticket assignments.
        </p>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                {user.role === "Manager" && <th>Email</th>}
                <th>Role</th>
                <th>Account</th>
              </tr>
            </thead>
            <tbody>
              {team?.users.map((member) => (
                <tr key={member.id}>
                  <td>{member.name}</td>
                  {user.role === "Manager" && <td>{member.email || "—"}</td>}
                  <td>
                    {user.role === "Manager" &&
                    member.email &&
                    member.id !== user.id ? (
                      <select
                        aria-label={`Role for ${member.name}`}
                        value={member.role}
                        onChange={async (e) => {
                          try {
                            await api("team/role", {
                              id: member.id,
                              role: e.target.value,
                            });
                            await load();
                          } catch (e) {
                            setError(e.message);
                          }
                        }}
                      >
                        {["Tester", "Developer", "Manager"].map((role) => (
                          <option key={role}>{role}</option>
                        ))}
                      </select>
                    ) : (
                      member.role
                    )}
                  </td>
                  <td>
                    <span className="badge">
                      {member.verified == null
                        ? "Sample member"
                        : member.verified
                          ? "Verified"
                          : "Awaiting verification"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
