import { useEffect, useState } from "react";
import { DOC_ENTRIES, DOC_GROUPS, findDoc } from "./docs_manifest.js";
import { MarkdownView } from "./markdown_view.js";
import { GITHUB_URL } from "./repo_identity.js";
import { SiteNav } from "./site_nav.js";

function readDocIdFromHash(): string {
  const hash = window.location.hash.replace(/^#/, "");
  return hash || DOC_ENTRIES[0]?.id || "getting-started";
}

export function DocsPage() {
  const [docId, setDocId] = useState(readDocIdFromHash);
  const [menu_open, setMenuOpen] = useState(false);
  const doc = findDoc(docId);

  useEffect(() => {
    const onHashChange = () => setDocId(readDocIdFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!menu_open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const previous_overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous_overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [menu_open]);

  const selectDoc = (id: string) => {
    setDocId(id);
    window.location.hash = id;
    setMenuOpen(false);
  };

  return (
    <div className="site-page docs-page">
      <SiteNav root="../" active="docs" />
      <div className="docs-mobile-bar">
        <button
          type="button"
          className="docs-menu-button"
          aria-expanded={menu_open}
          aria-controls="docs-sidebar"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true">☰</span> sections
        </button>
        <span className="docs-mobile-title">{doc.title}</span>
      </div>
      {menu_open ? (
        <button
          type="button"
          className="docs-backdrop"
          aria-label="Close sections"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <div className="docs-layout">
        <aside
          id="docs-sidebar"
          className={`docs-sidebar${menu_open ? " open" : ""}`}
          aria-label="Documentation sections"
        >
          <div className="docs-sidebar-head">
            <span>sections</span>
            <button
              type="button"
              className="docs-close-button"
              aria-label="Close sections"
              onClick={() => setMenuOpen(false)}
            >
              ×
            </button>
          </div>
          {DOC_GROUPS.map((group) => (
            <div className="docs-sidebar-group" key={group.id}>
              <div className="docs-sidebar-label">{group.label}</div>
              {DOC_ENTRIES.filter((entry) => entry.group === group.id).map((entry) => (
                <button
                  type="button"
                  key={entry.id}
                  className={`docs-sidebar-link${entry.id === doc.id ? " active" : ""}`}
                  onClick={() => selectDoc(entry.id)}
                >
                  {entry.title}
                </button>
              ))}
            </div>
          ))}
        </aside>
        <main className="docs-content">
          <MarkdownView markdown={doc.markdown} />
          <footer className="site-footer docs-footer">
            <span>leopardcode docs</span>
            <span className="site-footer-links">
              <a href="../">main</a>
              <a href="../demo/">demo</a>
              <a href={GITHUB_URL}>github</a>
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
