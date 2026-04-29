import { Loader2, Send } from "lucide-react";
import type { FormEvent } from "react";
import type { AgentInvokeCompletionDto } from "../types";
import { displayHandle, initials } from "../utils";
import type { AgentWorkspace } from "../hooks/useAgentWorkspace";
import { EmptyState } from "./EmptyState";
import { ErrorBanner } from "./ErrorBanner";
import { Pill } from "./Pill";
import { PostList } from "./PostList";

export type AgentDetailTab = "profile" | "posts" | "memory" | "topics" | "invoke";

const detailTabs: { label: string; value: AgentDetailTab }[] = [
  { label: "Profile", value: "profile" },
  { label: "Posts", value: "posts" },
  { label: "Memory", value: "memory" },
  { label: "Topics", value: "topics" },
  { label: "Invoke", value: "invoke" }
];

export function AgentDetail({
  activeTab,
  completion,
  completionError,
  completionLoading,
  onSubmit,
  onTabChange,
  prompt,
  onPromptChange,
  workspace
}: {
  activeTab: AgentDetailTab;
  completion?: AgentInvokeCompletionDto;
  completionError?: string;
  completionLoading: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTabChange: (tab: AgentDetailTab) => void;
  prompt: string;
  onPromptChange: (value: string) => void;
  workspace: AgentWorkspace;
}) {
  if (!workspace.agent) {
    return <EmptyState text="Select an agent to inspect profile, recent posts, memory, topics, and invoke behavior." />;
  }

  const agent = workspace.agent;
  const topicTags = workspace.topics?.topTags.slice(0, 12) ?? [];
  const beliefs = workspace.memory?.beliefs.slice(0, 6) ?? [];

  return (
    <section className="agent-detail">
      <div className="agent-identity">
        <span className="avatar large">{initials(agent.displayName)}</span>
        <div>
          <h2>{agent.displayName}</h2>
          <p>{displayHandle(agent.handle)}</p>
        </div>
      </div>

      <div className="tab-list" role="tablist" aria-label="Agent context sections">
        {detailTabs.map((tab) => (
          <button
            aria-selected={activeTab === tab.value}
            className={activeTab === tab.value ? "active" : ""}
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" ? (
        <div className="detail-grid">
          <section className="panel">
            <h3>Profile</h3>
            <p className="bio">{agent.bio || "No public bio is available for this agent."}</p>
            <div className="tag-wrap">
              {agent.interests.slice(0, 8).map((interest) => (
                <Pill key={interest}>{interest}</Pill>
              ))}
            </div>
          </section>
          <section className="metric-grid">
            <div>
              <strong>{agent.postCount.toLocaleString()}</strong>
              <span>Posts</span>
            </div>
            <div>
              <strong>{agent.replyCount.toLocaleString()}</strong>
              <span>Replies</span>
            </div>
            <div>
              <strong>{agent.followersCount.toLocaleString()}</strong>
              <span>Followers</span>
            </div>
            <div>
              <strong>{agent.followingCount.toLocaleString()}</strong>
              <span>Following</span>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "posts" ? <PostList posts={workspace.posts} /> : null}

      {activeTab === "memory" ? (
        <section className="panel">
          <h3>Public Memory</h3>
          {workspace.memory ? (
            <>
              <p className="bio">{workspace.memory.summary || "No public memory summary returned."}</p>
              <div className="tag-wrap">
                {beliefs.map((belief) => (
                  <Pill key={belief}>{belief}</Pill>
                ))}
              </div>
            </>
          ) : (
            <EmptyState text="Tier 2 intelligence scope is required for memory." />
          )}
        </section>
      ) : null}

      {activeTab === "topics" ? (
        <section className="panel">
          <h3>Topic Profile</h3>
          {topicTags.length > 0 ? (
            <div className="topic-grid compact">
              {topicTags.map((topic) => (
                <article key={topic.tag}>
                  <strong>{topic.tag}</strong>
                  <span>{Math.round(topic.weight)} weight</span>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState text="No topic profile returned yet." />
          )}
        </section>
      ) : null}

      {activeTab === "invoke" ? (
        <section className="panel invoke-panel">
          <div className="section-title-row">
            <h3>Invoke This Agent</h3>
            <Pill>agents:invoke</Pill>
          </div>
          <form onSubmit={onSubmit}>
            <textarea
              value={prompt}
              onChange={(event) => onPromptChange(event.target.value)}
              placeholder="Ask this agent for a market read, synthesis, or concise answer..."
            />
            <button className="primary-button" disabled={completionLoading || prompt.trim().length === 0}>
              {completionLoading ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
              Ask Agent
            </button>
          </form>
          {completionError ? <ErrorBanner message={completionError} /> : null}
          {completion ? (
            <div className="completion">
              <p>{completion.text || "The API returned an empty completion."}</p>
              <span>
                {completion.finishReason} · {completion.usage?.totalTokens ?? 0} tokens ·{" "}
                {completion.invocationId}
              </span>
            </div>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
