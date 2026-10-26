import executionModelUrl from "../../../docs/media/figures/execution-model.svg?url";
import planTimelineUrl from "../../../docs/media/figures/plan-timeline.svg?url";
import { RosetteMark } from "./rosette_mark.js";
import { SiteNav } from "./site_nav.js";

const FEATURES = [
  {
    title: "Real-time task morphing",
    body: "A new prompt reshapes pending work in place — add, remove, rename, dedupe, rewire — while running work continues.",
  },
  {
    title: "One living plan",
    body: "A persistent graph per session: the substrate every morph edits.",
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

const USER_WORKFLOWS = [
  {
    title: "Change the spec mid-run",
    body: "Send the change; pending categories are rewritten in place. Running work keeps going.",
  },
  {
    title: "Add work you just discovered",
    body: "A migration, tests, docs, or rate limiting enters pending work and runs when its dependencies finish.",
  },
  {
    title: "Drop or rename pending work",
    body: "Stop spend before a task starts, or rescope it as your understanding improves.",
  },
  {
    title: "Repeat a request without duplicate work",
    body: "Overlapping task lines fold into the existing category; you do not pay for the same pending task twice.",
  },
];

const COMPARISON_ROWS: Array<[string, string, string]> = [
  ["Live morph while running", "no — restart the prompt", "yes — pending work only"],
  ["Across prompts", "re-plans from scratch", "morphs pending work live"],
  [
    "Work relationships",
    "implicit in the model's prose",
    "first-class: depends_on, dedupe, result flow",
  ],
  ["Parallelism", "decided ad hoc", "dispatched from explicit dependency readiness"],
  ["Where code runs (CLI)", "a vendor server", "on your machine"],
];

export function LandingPage() {
  return (
    <div className="site-page">
      <SiteNav root="" active="main" />

      <header className="site-hero">
        <div className="site-hero-mark">
          <RosetteMark size={44} />
        </div>
        <pre className="site-hero-banner" aria-label="leopardcode">
          {"leopardcode"}
        </pre>
        <p className="site-hero-tagline">Real-time task morphing for your coding agents.</p>
        <p className="site-hero-sub">
          Morph the plan while it runs. Keep prompting; only pending work changes, and running work
          keeps going. One persistent plan, edited in place — not a pile of forgotten prompts.
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
            href="https://github.com/includecctype/leopardcode-open-agent-hackathon-2026"
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
          <span className="site-prompt">$</span> because it morphs, you can
        </h2>
        <div className="site-grid">
          {USER_WORKFLOWS.map((workflow) => (
            <article className="site-card" key={workflow.title}>
              <h3>{workflow.title}</h3>
              <p>{workflow.body}</p>
            </article>
          ))}
        </div>
        <p>
          Work already running stays untouched. You can drop or rename pending work; you cannot
          cancel a running category.
        </p>
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
          <span className="site-prompt">$</span> how it works
        </h2>
        <figure className="site-figure">
          <img
            src={executionModelUrl}
            alt="A prompt goes to the main agent, which plans categories and starts a detached background pass; ready categories run in parallel and their results return as a new message"
          />
          <figcaption>
            One main agent plans; each ready category runs a fresh sub-agent in parallel; results
            come back as a new message.
          </figcaption>
        </figure>
      </section>

      <section className="site-section">
        <h2>
          <span className="site-prompt">$</span> see it: five live morphs
        </h2>
        <figure className="site-figure">
          <img
            src={planTimelineUrl}
            alt="Five live morphs on one running CLI todo plan: add color output, add undo, rename persistence, dedupe tests, drop color output while commands keep running"
          />
          <figcaption>
            A seed prompt starts the CLI todo plan. Five follow-ups add independent work, add a
            dependency, rename a pending category, dedupe a repeated test request, and drop a
            pending task. The running card keeps going; when the plan drains, leopardcode reports
            what finished.
          </figcaption>
        </figure>
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
        <span>leopardcode — real-time task morphing for coding agents.</span>
        <span className="site-footer-links">
          <a href="./">main</a>
          <a href="./docs/">docs</a>
          <a href="./demo/">demo</a>
          <a href="https://github.com/includecctype/leopardcode-open-agent-hackathon-2026">
            github
          </a>
        </span>
      </footer>
    </div>
  );
}
