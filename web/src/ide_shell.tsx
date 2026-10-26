import { useState } from "react";
import { FileExplorer } from "./file_explorer/file_explorer.js";
import { FileViewer } from "./file_viewer/file_viewer.js";
import { useSessionFolder } from "./storage/storage_store.js";
import { App } from "./terminal/app.js";
import { InkXterm } from "./terminal/xterm_host.js";
import { TaskGraphView } from "./task_graph/task_graph_view.js";
import "@xterm/xterm/css/xterm.css";
import "./styles/ide_shell.css";
import type { ITerminalOptions } from "@xterm/xterm";

const TERMINAL_OPTIONS: ITerminalOptions = {
  fontSize: 13,
  theme: {
    background: "#0F0D0A",
    foreground: "#F0E6D4",
    cursor: "#E3A32F",
    cursorAccent: "#0F0D0A",
    selectionBackground: "#3A2A13",
    black: "#0F0D0A",
    red: "#FF6B4A",
    green: "#9DBF6B",
    yellow: "#F2C14E",
    blue: "#7AA6B8",
    magenta: "#C98BB0",
    cyan: "#79B8A8",
    white: "#F0E6D4",
    brightBlack: "#A28A67",
    brightRed: "#FF8A72",
    brightGreen: "#B9D28A",
    brightYellow: "#FFD97A",
    brightBlue: "#9DC4D6",
    brightMagenta: "#DDA8C6",
    brightCyan: "#9FD3C4",
    brightWhite: "#FFF7EA",
  },
};

export function IdeShell() {
  const folder = useSessionFolder();
  const [selected_path, setSelectedPath] = useState<string | null>(null);

  return (
    <div className="ide-shell">
      <header className="ide-header">
        <span className="ide-brand">LEOPARDCODE</span>
        <span className="ide-session" title={folder ?? undefined}>
          {folder ?? "connecting…"}
        </span>
      </header>
      <main className="ide-body">
        <section className="ide-pane ide-explorer" aria-label="File explorer">
          <FileExplorer selected_path={selected_path} on_select={setSelectedPath} />
        </section>
        <section className="ide-pane ide-viewer" aria-label="File viewer">
          <FileViewer path={selected_path} />
        </section>
        <section className="ide-pane ide-terminal" aria-label="Terminal">
          <div className="ide-terminal-pane">
            <InkXterm focus termOptions={TERMINAL_OPTIONS}>
              <App />
            </InkXterm>
          </div>
          <TaskGraphView />
        </section>
      </main>
    </div>
  );
}
