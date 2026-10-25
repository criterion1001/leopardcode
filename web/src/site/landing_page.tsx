import { SiteNav } from "./site_nav.js";

const FEATURES = [
  {
    title: "One living plan",
    body: "A persistent task graph that survives across prompts and sessions — your coding work never resets.",
  },
  {
    title: "Incremental re-planning",
    body: "A new prompt reshapes the work that's still ahead. Work already running is never disturbed.",
  },
  {
    title: "Work as a graph",
    body: "First-class depends_on ordering, duplicate removal, and each category's results flowing into its dependents.",
  },
  {
    title: "Dependency-aware parallelism",
    body: "Categories launch the moment their dependencies finish, and a failure cascades blocked to everything downstream.",
  },
  {
    title: "In-flight protection",
    body: "Running work is immutable, so keep sending prompts without ever racing an executor mid-change.",
  },
  {
    title: "Your code stays yours",
    body: "In the CLI, file and shell tools run on your machine — the server only makes model calls and web searches.",
  },
];

const COMPARISON_ROWS: Array<[string, string, string]> = [
  ["Unit of work", "one prompt / one spawned agent", "an entry in a persistent work graph"],
  ["Across prompts", "re-plans from scratch", "incremental re-planning on one living plan"],
  [
    "Work relationships",
    "implicit in the model's prose",
    "first-class: depends_on, dedupe, result flow",
  ],
  ["Parallelism", "decided ad hoc", "dispatched from explicit dependency readiness"],
  ["Changing course", "start the prompt over", "keep going; only pending work changes"],
  ["Where code runs (CLI)", "a vendor server", "on your machine"],
];

export function LandingPage() {
  return (
    <div className="site-page">
      <SiteNav root="" active="main" />

      <header className="site-hero">
        <pre className="site-hero-banner" aria-label="leopardcode">
          {"leopardcode"}
        </pre>
        <p className="site-hero-tagline">One living plan for your coding agents.</p>
        <p className="site-hero-sub">
          A terminal-native, multi-agent coding orchestrator built around a persistent task graph.
          Keep sending prompts — each one incrementally re-plans the work that's still ahead, while
          work already running keeps running.
        </p>
        <div className="site-cta">
          <a className="site-btn" href="./demo/">
            ▶ try the demo
          </a>
          <a className="site-btn site-btn-ghost" href="./docs/">
            read the docs
          </a>
          <a
            className="site-btn site-btn-ghost"
            href="https://github.com/includecctype/leopardcode"
          >
            github
          </a>
        </div>
      </header>

      <section className="site-section">
        <h2>
          <span className="site-prompt">$</span> the problem
        </h2>
        <p>Today's coding agents treat every prompt as a fresh start:</p>
        <ul className="site-list">
          <li>
            <strong>Restarts lose work.</strong> Change your mind mid-run and you're told to restart
            the prompt — throwing away everything already in flight.
          </li>
          <li>
            <strong>Every prompt re-plans from scratch.</strong> Overlapping work gets redone and
            intent from earlier prompts is forgotten.
          </li>
          <li>
            <strong>Parallel work has no structure.</strong> Whether tasks depend on each other
            lives only in the model's prose, and vanishes when the request ends.
          </li>
        </ul>
      </section>

      <section className="site-section">
        <h2>
          <span className="site-prompt">$</span> what leopardcode does
        </h2>
        <div className="site-grid">
          {FEATURES.map((feature) => (
            <article className="site-card" key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section">
        <h2>
          <span className="site-prompt">$</span> see it: one plan, three prompts
        </h2>
        <pre className="site-diagram">{`prompt 1 · "fix the login bug"
        │
        ▼
   ┌───────────────────────┐
   │ login-fix        ▶ running │
   └───────────────────────┘
        │
prompt 2 · "also harden session handling"      (while login-fix runs)
        │
        ▼
   ┌───────────────────────┐   ┌───────────────────────┐
   │ login-fix        ▶ running │   │ session-hardening   pending │  ← added
   └───────────────────────┘   └───────────────────────┘
        │
prompt 3 · "actually, drop the session work"   (while login-fix runs)
        │
        ▼
   ┌───────────────────────┐      session-hardening removed from pending;
   │ login-fix        ▶ running │   login-fix was never interrupted
   └───────────────────────┘`}</pre>
        <p>
          Each prompt is planned immediately and folded into the same running plan. When the plan
          drains, leopardcode reports what finished — as its own message.
        </p>
        <p>
          <a className="site-link" href="./demo/">
            → open the demo and run /sample
          </a>
        </p>
      </section>

      <section className="site-section">
        <h2>
          <span className="site-prompt">$</span> why it's different
        </h2>
        <div className="site-table-wrap">
          <table className="site-table">
            <thead>
              <tr>
                <th />
                <th>typical coding agents</th>
                <th>leopardcode</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map(([label, typical, leopard]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td className="site-dim">{typical}</td>
                  <td>{leopard}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="site-section">
        <h2>
          <span className="site-prompt">$</span> get started
        </h2>
        <p>Run the backend, CLI, and web workspace locally — or jump straight into the demo.</p>
        <div className="site-cta">
          <a className="site-btn" href="./docs/#getting-started">
            installation &amp; getting started
          </a>
          <a className="site-btn site-btn-ghost" href="./demo/">
            ▶ try the demo
          </a>
        </div>
      </section>

      <footer className="site-footer">
        <span>leopardcode — one living plan for your coding agents.</span>
        <span className="site-footer-links">
          <a href="./">main</a>
          <a href="./docs/">docs</a>
          <a href="./demo/">demo</a>
          <a href="https://github.com/includecctype/leopardcode">github</a>
        </span>
      </footer>
    </div>
  );
}
