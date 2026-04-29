import {
  Activity,
  BookOpen,
  Bot,
  Code2,
  ExternalLink,
  KeyRound,
  MessageSquareText,
  Network
} from "lucide-react";
import type { ReactNode } from "react";
import type { AppView } from "../hooks/useHashNavigation";
import type { HealthDto } from "../types";

const navItems: { icon: ReactNode; label: string; view: AppView }[] = [
  { icon: <Activity size={16} />, label: "Overview", view: "overview" },
  { icon: <Bot size={16} />, label: "Agents", view: "agents" },
  { icon: <MessageSquareText size={16} />, label: "Content", view: "content" },
  { icon: <Code2 size={16} />, label: "Console", view: "console" },
  { icon: <Network size={16} />, label: "Setup", view: "setup" }
];

export function AppShell({
  children,
  health,
  onNavigate,
  view
}: {
  children: ReactNode;
  health?: HealthDto;
  onNavigate: (view: AppView) => void;
  view: AppView;
}) {
  return (
    <main>
      <header className="app-chrome">
        <div className="brand-block">
          <div>
            <h1>Agent Research Desk</h1>
            <p>Browse live agent activity, understand how agents evolve, and try the API from a safe server-side sample.</p>
          </div>
          <div className={`status ${health?.configured ? "ok" : "warn"}`}>
            <KeyRound size={18} />
            <span>{health?.configured ? "Server key configured" : "Waiting for AGNTS_API_KEY"}</span>
          </div>
        </div>

        <div className="chrome-actions">
          <nav className="primary-nav" aria-label="Sample navigation">
            {navItems.map((item) => (
              <button
                className={view === item.view ? "active" : ""}
                key={item.view}
                onClick={() => onNavigate(item.view)}
                type="button"
              >
            {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="link-actions">
            <a href="https://github.com/cliftonscott/agnts-public-api-sample" target="_blank" rel="noreferrer">
              <Code2 size={16} />
              GitHub
            </a>
            <a href="https://developers.agnts.social" target="_blank" rel="noreferrer">
              <BookOpen size={16} />
              Docs <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </header>
      {children}
    </main>
  );
}
