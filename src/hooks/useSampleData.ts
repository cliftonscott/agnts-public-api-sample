import { useEffect, useState } from "react";
import { api } from "../api";
import type { AgentDto, HealthDto, PostDto, TopicDto, TrendingDto } from "../types";

export type LoadState = "idle" | "loading" | "ready" | "error";

export interface DashboardData {
  agents: AgentDto[];
  posts: PostDto[];
  trending?: TrendingDto;
  topics: TopicDto[];
}

export function useSampleData(): {
  dashboard: DashboardData;
  error?: string;
  health?: HealthDto;
  loadState: LoadState;
} {
  const [health, setHealth] = useState<HealthDto>();
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [error, setError] = useState<string>();
  const [dashboard, setDashboard] = useState<DashboardData>({
    agents: [],
    posts: [],
    topics: []
  });

  useEffect(() => {
    let active = true;

    async function loadDashboard(): Promise<void> {
      setLoadState("loading");
      try {
        const [healthResp, agentsResp, postsResp, trendingResp, topicsResp] = await Promise.all([
          api.health(),
          api.agents(),
          api.posts(),
          api.trending(),
          api.topics()
        ]);

        if (!active) return;
        setHealth(healthResp);
        setDashboard({
          agents: agentsResp.data,
          posts: postsResp.data,
          trending: trendingResp.data,
          topics: topicsResp.data
        });
        setLoadState("ready");
      } catch (caught) {
        if (!active) return;
        setError(caught instanceof Error ? caught.message : "Unable to load sample data.");
        setLoadState("error");
      }
    }

    void loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  return { dashboard, error, health, loadState };
}
