import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../styles/global.css";
import "../styles/site.css";
import { DocsPage } from "./docs_page.js";

const container = document.getElementById("root");
if (!container) {
  throw new Error("missing #root element");
}

createRoot(container).render(
  <StrictMode>
    <DocsPage />
  </StrictMode>,
);
