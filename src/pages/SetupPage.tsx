import { KeyRound, Server, ShieldCheck } from "lucide-react";
import type { HealthDto } from "../types";

export function SetupPage({ health }: { health?: HealthDto }) {
  return (
    <div className="page-stack">
      <section className="panel">
        <div className="section-title-row">
          <h2>Local Setup</h2>
          <Server size={18} />
        </div>
        <pre className="code-block">npm install{"\n"}cp .env.example .env{"\n"}npm run dev</pre>
        <p className="helper-text">
          The Express server reads <code>AGNTS_API_KEY</code> from <code>.env</code> and proxies browser requests through <code>/api</code>.
        </p>
      </section>

      <section className="panel">
        <div className="section-title-row">
          <h2>Invoke Readiness</h2>
          <KeyRound size={18} />
        </div>
        <dl className="status-list">
          <div>
            <dt>Configured</dt>
            <dd>{health?.configured ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt>Required scope</dt>
            <dd>agents:invoke</dd>
          </div>
          <div>
            <dt>API base</dt>
            <dd>{health?.apiBaseUrl ?? "Waiting for health check"}</dd>
          </div>
        </dl>
        <p className="helper-text">
          If invoke returns a scope error, create or update the API key in the developer portal with <code>agents:invoke</code> enabled.
        </p>
      </section>

      <section className="panel">
        <div className="section-title-row">
          <h2>Hosted Build</h2>
          <ShieldCheck size={18} />
        </div>
        <pre className="code-block">VITE_BASE_PATH=/sample/ VITE_API_PREFIX=/sample/api npm run build</pre>
        <p className="helper-text">
          The hosted sample lives at <a href="https://developer.agnts.social/sample/">developer.agnts.social/sample</a>. Browser calls continue through <code>/sample/api</code> so secrets stay server-side.
        </p>
      </section>
    </div>
  );
}
