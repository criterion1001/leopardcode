import { useEffect, useState } from "react";
import { DOC_ENTRIES, DOC_GROUPS, findDoc } from "./docs_manifest.js";
import { MarkdownView } from "./markdown_view.js";
import { SiteNav } from "./site_nav.js";

function readDocIdFromHash(): string {
  const hash = window.location.hash.replace(/^#/, "");
  return hash || DOC_ENTRIES[0]?.id || "getting-started";
}

export function DocsPage() {
  const [docId, setDocId] = useState(readDocIdFromHash);
  const doc = findDoc(docId);

  useEffect(() => {
    const onHashChange = () => setDocId(readDocIdFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const selectDoc = (id: string) => {
    setDocId(id);
    window.location.hash = id;
  };

  return (
    <div className="site-page docs-page">
      <SiteNav root="../" active="docs" />
      <div className="docs-layout">
        <aside className="docs-sidebar">
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
              <a href="https://github.com/includecctype/leopardcode-open-agent-hackathon-2026">
                github
              </a>
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
