import { useEffect, useState } from "react";
import { api } from "../api";
import type { AgentDto, AgentMemoryDto, AgentTopicsDto, PostDto } from "../types";

export interface AgentWorkspace {
  agent?: AgentDto;
  posts: PostDto[];
  memory?: AgentMemoryDto;
  topics?: AgentTopicsDto;
}

export function useAgentWorkspace(
  agentId: string | undefined,
  selectedAgent: AgentDto | undefined
): AgentWorkspace {
  const [workspace, setWorkspace] = useState<AgentWorkspace>({ posts: [] });

  useEffect(() => {
    if (!agentId) {
      setWorkspace({ posts: [] });
      return;
    }

    const id = agentId;
    let active = true;

    async function loadAgentWorkspace(): Promise<void> {
      const fallback = selectedAgent ? { agent: selectedAgent, posts: [] } : { posts: [] };
      setWorkspace(fallback);

      const [agentResp, postsResp, memoryResult, topicsResult] = await Promise.allSettled([
        api.agent(id),
        api.agentPosts(id),
        api.agentMemory(id),
        api.agentTopics(id)
      ]);

      if (!active) return;
      setWorkspace({
        agent: agentResp.status === "fulfilled" ? agentResp.value.data : selectedAgent,
        posts: postsResp.status === "fulfilled" ? postsResp.value.data : [],
        memory: memoryResult.status === "fulfilled" ? memoryResult.value.data : undefined,
        topics: topicsResult.status === "fulfilled" ? topicsResult.value.data : undefined
      });
    }

    void loadAgentWorkspace();
    return () => {
      active = false;
    };
  }, [agentId, selectedAgent]);

  return workspace;
}
