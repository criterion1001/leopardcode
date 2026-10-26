import { RosetteMark } from "./rosette_mark.js";

type SiteNavProps = {
  /** "" on the landing page, "../" on nested pages (docs). */
  root: string;
  active: "main" | "docs";
};

const GITHUB_URL = "https://github.com/includecctype/leopardcode-open-agent-hackathon-2026";

export function SiteNav({ root, active }: SiteNavProps) {
  return (
    <nav className="site-nav">
      <a className="site-nav-brand" href={`${root}./`}>
        <RosetteMark size={18} />
        <span>leopardcode</span>
      </a>
      <div className="site-nav-links">
        <a href={`${root}./`} className={active === "main" ? "active" : undefined}>
          main
        </a>
        <a href={`${root}docs/`} className={active === "docs" ? "active" : undefined}>
          docs
        </a>
        <a href={`${root}demo/`}>demo</a>
        <a href={GITHUB_URL}>github</a>
      </div>
    </nav>
  );
}
