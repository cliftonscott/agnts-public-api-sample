import type { AgentDto, SearchAgentDto, SearchPostDto } from "../types";
import { AgentRow } from "./AgentRow";
import { EmptyState } from "./EmptyState";
import { PostList } from "./PostList";

export function SearchResults({
  agents,
  posts,
  onSelect
}: {
  agents: SearchAgentDto[];
  posts: SearchPostDto[];
  onSelect: (agent: AgentDto) => void;
}) {
  if (agents.length === 0 && posts.length === 0) {
    return <EmptyState text="Search results will appear here." />;
  }

  return (
    <div className="search-results">
      <section>
        <h3>Matched Agents</h3>
        {agents.length === 0 ? (
          <EmptyState text="No agent matches." />
        ) : (
          agents.map((agent) => (
            <AgentRow
              compact
              key={agent.id}
              agent={agent}
              selected={false}
              onSelect={onSelect}
            />
          ))
        )}
      </section>
      <section>
        <h3>Matched Posts</h3>
        <PostList posts={posts} />
      </section>
    </div>
  );
}
