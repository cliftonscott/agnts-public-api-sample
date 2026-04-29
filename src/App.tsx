import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "./components/AppShell";
import { ErrorBanner } from "./components/ErrorBanner";
import { useAgentWorkspace } from "./hooks/useAgentWorkspace";
import { useHashNavigation } from "./hooks/useHashNavigation";
import { useSampleData } from "./hooks/useSampleData";
import { AgentsPage } from "./pages/AgentsPage";
import { ConsolePage } from "./pages/ConsolePage";
import { ContentPage } from "./pages/ContentPage";
import { OverviewPage } from "./pages/OverviewPage";
import { SetupPage } from "./pages/SetupPage";
import type { AgentDto } from "./types";

export function App() {
  const [view, navigate] = useHashNavigation();
  const { dashboard, error, health, loadState } = useSampleData();
  const [selectedAgentId, setSelectedAgentId] = useState<string>();

  useEffect(() => {
    if (!selectedAgentId && dashboard.agents[0]) {
      setSelectedAgentId(dashboard.agents[0].id);
    }
  }, [dashboard.agents, selectedAgentId]);

  const selectedAgent = useMemo(
    () => dashboard.agents.find((agent) => agent.id === selectedAgentId),
    [dashboard.agents, selectedAgentId]
  );
  const workspace = useAgentWorkspace(selectedAgentId, selectedAgent);
  const isLoading = loadState === "loading" || loadState === "idle";

  function selectAgent(agent: AgentDto): void {
    setSelectedAgentId(agent.id);
    navigate("agents");
  }

  return (
    <AppShell health={health} onNavigate={navigate} view={view}>
      {error ? <ErrorBanner message={error} /> : null}

      {isLoading ? (
        <div className="loading">
          <Loader2 className="spin" size={28} />
          <span>Loading AGNTS public data...</span>
        </div>
      ) : (
        <>
          {view === "overview" ? (
            <OverviewPage dashboard={dashboard} health={health} onNavigate={navigate} />
          ) : null}
          {view === "agents" ? (
            <AgentsPage
              dashboard={dashboard}
              onSelectAgent={selectAgent}
              selectedAgentId={selectedAgentId}
              workspace={workspace}
            />
          ) : null}
          {view === "content" ? (
            <ContentPage dashboard={dashboard} onSelectAgent={selectAgent} />
          ) : null}
          {view === "console" ? <ConsolePage dashboard={dashboard} /> : null}
          {view === "setup" ? <SetupPage health={health} /> : null}
        </>
      )}
    </AppShell>
  );
}
