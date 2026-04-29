import { Search } from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { api } from "../api";
import { AgentDetail, type AgentDetailTab } from "../components/AgentDetail";
import { AgentRow } from "../components/AgentRow";
import { EmptyState } from "../components/EmptyState";
import { ErrorBanner } from "../components/ErrorBanner";
import type { AgentWorkspace } from "../hooks/useAgentWorkspace";
import type { DashboardData } from "../hooks/useSampleData";
import type { AgentDto, AgentInvokeCompletionDto } from "../types";

export function AgentsPage({
  dashboard,
  onSelectAgent,
  selectedAgentId,
  workspace
}: {
  dashboard: DashboardData;
  onSelectAgent: (agent: AgentDto) => void;
  selectedAgentId?: string;
  workspace: AgentWorkspace;
}) {
  const [agentFilter, setAgentFilter] = useState("");
  const [detailTab, setDetailTab] = useState<AgentDetailTab>("topics");
  const [invokePrompt, setInvokePrompt] = useState("");
  const [completion, setCompletion] = useState<AgentInvokeCompletionDto>();
  const [completionError, setCompletionError] = useState<string>();
  const [completionLoading, setCompletionLoading] = useState(false);

  const filteredAgents = useMemo(() => {
    const query = agentFilter.trim().toLowerCase();
    if (query.length === 0) return dashboard.agents;
    return dashboard.agents.filter((agent) =>
      [agent.displayName, agent.handle, agent.bio, ...agent.interests]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [agentFilter, dashboard.agents]);

  function selectAgent(agent: AgentDto): void {
    setCompletion(undefined);
    setCompletionError(undefined);
    onSelectAgent(agent);
  }

  async function handleInvoke(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!workspace.agent || invokePrompt.trim().length === 0) return;

    setCompletionLoading(true);
    setCompletion(undefined);
    setCompletionError(undefined);
    try {
      const response = await api.complete(workspace.agent.id, invokePrompt.trim());
      setCompletion(response.data);
    } catch (caught) {
      setCompletionError(caught instanceof Error ? caught.message : "Agent invocation failed.");
    } finally {
      setCompletionLoading(false);
    }
  }

  return (
    <div className="agents-layout">
      <aside className="agent-directory">
        <div className="section-title-row">
          <h2>Agents</h2>
          <Search size={18} />
        </div>
        <input
          value={agentFilter}
          onChange={(event) => setAgentFilter(event.target.value)}
          placeholder="Filter agents"
        />
        <div className="agent-list">
          {filteredAgents.length === 0 ? (
            <EmptyState text="No agents match this filter." />
          ) : (
            filteredAgents.map((agent) => (
              <AgentRow
                key={agent.id}
                agent={agent}
                selected={agent.id === selectedAgentId}
                onSelect={selectAgent}
              />
            ))
          )}
        </div>
      </aside>

      <div className="agent-focus">
        {completionError ? <ErrorBanner message={completionError} /> : null}
        <AgentDetail
          activeTab={detailTab}
          completion={completion}
          completionError={completionError}
          completionLoading={completionLoading}
          onSubmit={handleInvoke}
          onTabChange={setDetailTab}
          prompt={invokePrompt}
          onPromptChange={setInvokePrompt}
          workspace={workspace}
        />
      </div>
    </div>
  );
}
