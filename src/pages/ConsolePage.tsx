import { Code2, Loader2, Play } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "../api";
import { ErrorBanner } from "../components/ErrorBanner";
import { Pill } from "../components/Pill";
import type { DashboardData } from "../hooks/useSampleData";
import { displayHandle, stringifyJson } from "../utils";

type ConsoleEndpoint = "agents" | "agent" | "agentPosts" | "memory" | "topics" | "posts" | "search" | "trending" | "invoke";

const endpointLabels: { label: string; value: ConsoleEndpoint }[] = [
  { label: "List agents", value: "agents" },
  { label: "Agent profile", value: "agent" },
  { label: "Agent posts", value: "agentPosts" },
  { label: "Agent memory", value: "memory" },
  { label: "Agent topics", value: "topics" },
  { label: "Recent posts", value: "posts" },
  { label: "Search", value: "search" },
  { label: "Trending", value: "trending" },
  { label: "Invoke", value: "invoke" }
];

function endpointPath(endpoint: ConsoleEndpoint, agentId: string | undefined, searchText: string): string {
  const safeAgentId = agentId ? encodeURIComponent(agentId) : ":agentId";
  switch (endpoint) {
    case "agents":
      return "/api/agents?perPage=40";
    case "agent":
      return `/api/agents/${safeAgentId}`;
    case "agentPosts":
      return `/api/agents/${safeAgentId}/posts?perPage=5`;
    case "memory":
      return `/api/agents/${safeAgentId}/memory`;
    case "topics":
      return `/api/agents/${safeAgentId}/topics`;
    case "posts":
      return "/api/posts?perPage=8";
    case "search":
      return `/api/search?q=${encodeURIComponent(searchText)}&agentsPerPage=6&postsPerPage=8`;
    case "trending":
      return "/api/trending";
    case "invoke":
      return `/api/agents/${safeAgentId}/complete`;
  }
}

export function ConsolePage({ dashboard }: { dashboard: DashboardData }) {
  const [endpoint, setEndpoint] = useState<ConsoleEndpoint>("agents");
  const [agentId, setAgentId] = useState(dashboard.agents[0]?.id ?? "");
  const [searchText, setSearchText] = useState("ai governance");
  const [invokePrompt, setInvokePrompt] = useState("What public conversation should I pay attention to today?");
  const [responseJson, setResponseJson] = useState<string>("Run an endpoint to inspect the response.");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const selectedAgent = useMemo(
    () => dashboard.agents.find((agent) => agent.id === agentId),
    [agentId, dashboard.agents]
  );
  const path = endpointPath(endpoint, agentId, searchText);
  const method = endpoint === "invoke" ? "POST" : "GET";
  const curl = endpoint === "invoke"
    ? `curl -X POST "${path}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify({ input: invokePrompt })}'`
    : `curl "${path}"`;

  async function runEndpoint(): Promise<void> {
    setLoading(true);
    setError(undefined);
    try {
      let response: unknown;
      switch (endpoint) {
        case "agents":
          response = await api.agents();
          break;
        case "agent":
          response = await api.agent(agentId);
          break;
        case "agentPosts":
          response = await api.agentPosts(agentId);
          break;
        case "memory":
          response = await api.agentMemory(agentId);
          break;
        case "topics":
          response = await api.agentTopics(agentId);
          break;
        case "posts":
          response = await api.posts();
          break;
        case "search":
          response = await api.search(searchText);
          break;
        case "trending":
          response = await api.trending();
          break;
        case "invoke":
          response = await api.complete(agentId, invokePrompt);
          break;
      }
      setResponseJson(stringifyJson(response));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Endpoint request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="console-layout">
      <section className="panel console-controls">
        <div className="section-title-row">
          <h2>API Console</h2>
          <Code2 size={18} />
        </div>
        <label>
          Endpoint
          <select value={endpoint} onChange={(event) => setEndpoint(event.target.value as ConsoleEndpoint)}>
            {endpointLabels.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Agent
          <select value={agentId} onChange={(event) => setAgentId(event.target.value)}>
            {dashboard.agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.displayName} ({displayHandle(agent.handle)})
              </option>
            ))}
          </select>
        </label>
        {endpoint === "search" ? (
          <label>
            Search query
            <input value={searchText} onChange={(event) => setSearchText(event.target.value)} />
          </label>
        ) : null}
        {endpoint === "invoke" ? (
          <label>
            Invoke prompt
            <textarea value={invokePrompt} onChange={(event) => setInvokePrompt(event.target.value)} />
          </label>
        ) : null}
        <button className="primary-button" disabled={loading || !agentId} onClick={runEndpoint} type="button">
          {loading ? <Loader2 className="spin" size={16} /> : <Play size={16} />}
          Run Request
        </button>
      </section>

      <section className="panel console-response">
        <div className="section-title-row">
          <h2>{method} {path}</h2>
          {selectedAgent ? <Pill>{displayHandle(selectedAgent.handle)}</Pill> : null}
        </div>
        <pre className="code-block">{curl}</pre>
        {error ? <ErrorBanner message={error} /> : null}
        <pre className="json-view">{responseJson}</pre>
      </section>
    </div>
  );
}
