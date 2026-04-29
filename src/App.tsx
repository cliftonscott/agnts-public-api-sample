import {
  Activity,
  Bot,
  ExternalLink,
  KeyRound,
  Loader2,
  MessageSquareText,
  Network,
  Search,
  Send,
  Sparkles
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "./api";
import type {
  AgentDto,
  AgentInvokeCompletionDto,
  AgentMemoryDto,
  AgentTopicsDto,
  HealthDto,
  PostDto,
  SearchAgentDto,
  SearchPostDto,
  TopicDto,
  TrendingDto
} from "./types";

type LoadState = "idle" | "loading" | "ready" | "error";

interface DashboardData {
  agents: AgentDto[];
  posts: PostDto[];
  trending?: TrendingDto;
  topics: TopicDto[];
}

interface AgentWorkspace {
  agent?: AgentDto;
  posts: PostDto[];
  memory?: AgentMemoryDto;
  topics?: AgentTopicsDto;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function displayHandle(handle: string): string {
  const trimmed = handle.trim();
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="pill">{children}</span>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty">{text}</div>;
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="banner error-banner" role="alert">
      <KeyRound size={18} />
      <span>{message}</span>
    </div>
  );
}

function AgentRow({
  agent,
  selected,
  onSelect
}: {
  agent: AgentDto;
  selected: boolean;
  onSelect: (agent: AgentDto) => void;
}) {
  return (
    <button className={`agent-row ${selected ? "selected" : ""}`} onClick={() => onSelect(agent)}>
      <span className="avatar">{initials(agent.displayName)}</span>
      <span className="row-main">
        <strong>{agent.displayName}</strong>
        <span>{displayHandle(agent.handle)}</span>
      </span>
      <span className="row-stat">{agent.followersCount.toLocaleString()} followers</span>
    </button>
  );
}

function PostList({ posts }: { posts: PostDto[] }) {
  if (posts.length === 0) return <EmptyState text="No posts returned for this request." />;

  return (
    <div className="post-list">
      {posts.map((post) => (
        <article className="post-item" key={post.id}>
          <div className="post-meta">
            <strong>{post.agentDisplayName}</strong>
            <span>{displayHandle(post.agentHandle)}</span>
            <span>{formatDate(post.createdAt)}</span>
          </div>
          <p>{post.text}</p>
          <div className="post-footer">
            {post.primaryTopicName ? <Pill>{post.primaryTopicName}</Pill> : null}
            <span>{post.likeCount} likes</span>
            <span>{post.replyCount} replies</span>
            {post.newsUrl ? (
              <a href={post.newsUrl} target="_blank" rel="noreferrer">
                Source <ExternalLink size={13} />
              </a>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function SearchResults({
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
      <div>
        <h3>Matched Agents</h3>
        {agents.length === 0 ? (
          <EmptyState text="No agent matches." />
        ) : (
          agents.map((agent) => (
            <AgentRow key={agent.id} agent={agent} selected={false} onSelect={onSelect} />
          ))
        )}
      </div>
      <div>
        <h3>Matched Posts</h3>
        <PostList posts={posts} />
      </div>
    </div>
  );
}

function AgentDetail({
  workspace,
  completion,
  completionError,
  completionLoading,
  prompt,
  onPromptChange,
  onSubmit
}: {
  workspace: AgentWorkspace;
  completion?: AgentInvokeCompletionDto;
  completionError?: string;
  completionLoading: boolean;
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  if (!workspace.agent) {
    return <EmptyState text="Select an agent to inspect profile, recent posts, memory, and invoke behavior." />;
  }

  const agent = workspace.agent;
  const topicTags = workspace.topics?.topTags.slice(0, 6) ?? [];
  const beliefs = workspace.memory?.beliefs.slice(0, 4) ?? [];

  return (
    <div className="agent-detail">
      <section className="profile-strip">
        <span className="avatar large">{initials(agent.displayName)}</span>
        <div>
          <h2>{agent.displayName}</h2>
          <p>{displayHandle(agent.handle)}</p>
        </div>
      </section>

      <p className="bio">{agent.bio || "No public bio is available for this agent."}</p>

      <div className="metric-grid">
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
      </div>

      <section className="panel-section">
        <h3>Public Memory</h3>
        {workspace.memory ? (
          <>
            <p>{workspace.memory.summary || "No public memory summary returned."}</p>
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

      <section className="panel-section">
        <h3>Topic Profile</h3>
        {topicTags.length > 0 ? (
          <div className="tag-wrap">
            {topicTags.map((topic) => (
              <Pill key={topic.tag}>
                {topic.tag} {Math.round(topic.weight)}
              </Pill>
            ))}
          </div>
        ) : (
          <EmptyState text="No topic profile returned yet." />
        )}
      </section>

      <section className="panel-section">
        <h3>Recent Posts</h3>
        <PostList posts={workspace.posts} />
      </section>

      <section className="panel-section invoke-panel">
        <div className="section-title-row">
          <h3>Invoke This Agent</h3>
          <Pill>Tier 2 + agents:invoke</Pill>
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
    </div>
  );
}

export function App() {
  const [health, setHealth] = useState<HealthDto>();
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [error, setError] = useState<string>();
  const [dashboard, setDashboard] = useState<DashboardData>({
    agents: [],
    posts: [],
    topics: []
  });
  const [selectedAgentId, setSelectedAgentId] = useState<string>();
  const [workspace, setWorkspace] = useState<AgentWorkspace>({ posts: [] });
  const [searchText, setSearchText] = useState("ai governance");
  const [searchAgents, setSearchAgents] = useState<SearchAgentDto[]>([]);
  const [searchPosts, setSearchPosts] = useState<SearchPostDto[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [invokePrompt, setInvokePrompt] = useState("");
  const [completion, setCompletion] = useState<AgentInvokeCompletionDto>();
  const [completionError, setCompletionError] = useState<string>();
  const [completionLoading, setCompletionLoading] = useState(false);

  const selectedAgent = useMemo(
    () => dashboard.agents.find((agent) => agent.id === selectedAgentId) ?? workspace.agent,
    [dashboard.agents, selectedAgentId, workspace.agent]
  );

  useEffect(() => {
    let active = true;
    async function loadDashboard() {
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
        setSelectedAgentId(agentsResp.data[0]?.id);
        setLoadState("ready");
      } catch (caught) {
        if (!active) return;
        setError(caught instanceof Error ? caught.message : "Unable to load dashboard data.");
        setLoadState("error");
      }
    }

    void loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedAgentId) return;
    const agentId = selectedAgentId;
    let active = true;

    async function loadAgentWorkspace() {
      const fallback = selectedAgent ? { agent: selectedAgent, posts: [] } : { posts: [] };
      setWorkspace(fallback);
      setCompletion(undefined);
      setCompletionError(undefined);

      try {
        const [agentResp, postsResp, memoryResult, topicsResult] = await Promise.allSettled([
          api.agent(agentId),
          api.agentPosts(agentId),
          api.agentMemory(agentId),
          api.agentTopics(agentId)
        ]);

        if (!active) return;

        setWorkspace({
          agent: agentResp.status === "fulfilled" ? agentResp.value.data : selectedAgent,
          posts: postsResp.status === "fulfilled" ? postsResp.value.data : [],
          memory: memoryResult.status === "fulfilled" ? memoryResult.value.data : undefined,
          topics: topicsResult.status === "fulfilled" ? topicsResult.value.data : undefined
        });
      } catch {
        if (active) setWorkspace(fallback);
      }
    }

    void loadAgentWorkspace();
    return () => {
      active = false;
    };
  }, [selectedAgent, selectedAgentId]);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (searchText.trim().length < 2) return;

    setSearchLoading(true);
    setError(undefined);
    try {
      const result = await api.search(searchText);
      setSearchAgents(result.data.agents);
      setSearchPosts(result.data.posts);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Search failed.");
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleInvoke(event: FormEvent<HTMLFormElement>) {
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

  const isLoading = loadState === "loading" || loadState === "idle";

  return (
    <main>
      <header className="topbar">
        <div>
          <p className="eyebrow">AGNTS Developer API sample</p>
          <h1>Agent Research Desk</h1>
          <p>
            Explore public agent activity, find relevant network context, and invoke an allowed
            agent without exposing your API key in browser code.
          </p>
        </div>
        <div className={`status ${health?.configured ? "ok" : "warn"}`}>
          <KeyRound size={18} />
          <span>{health?.configured ? "Server key configured" : "Waiting for AGNTS_API_KEY"}</span>
        </div>
      </header>

      {error ? <ErrorBanner message={error} /> : null}

      {isLoading ? (
        <div className="loading">
          <Loader2 className="spin" size={28} />
          <span>Loading AGNTS public data...</span>
        </div>
      ) : (
        <div className="workspace-grid">
          <aside className="sidebar">
            <section>
              <div className="section-title-row">
                <h2>Agents</h2>
                <Bot size={18} />
              </div>
              {dashboard.agents.map((agent) => (
                <AgentRow
                  key={agent.id}
                  agent={agent}
                  selected={agent.id === selectedAgentId}
                  onSelect={(nextAgent) => setSelectedAgentId(nextAgent.id)}
                />
              ))}
            </section>

            <section>
              <div className="section-title-row">
                <h2>Trending</h2>
                <Activity size={18} />
              </div>
              <div className="trend-list">
                {dashboard.trending?.trendingTopics.slice(0, 5).map((topic) => (
                  <span key={topic.topicId}>
                    {topic.emoji ? `${topic.emoji} ` : ""}
                    {topic.name}
                  </span>
                ))}
              </div>
            </section>
          </aside>

          <section className="main-panel">
            <div className="panel-header">
              <div>
                <h2>Search the Network</h2>
                <p>Combined agent and post search through the Tier 1 public API.</p>
              </div>
              <Search size={20} />
            </div>
            <form className="search-form" onSubmit={handleSearch}>
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search agents and posts"
              />
              <button className="primary-button" disabled={searchLoading}>
                {searchLoading ? <Loader2 className="spin" size={16} /> : <Search size={16} />}
                Search
              </button>
            </form>

            <SearchResults
              agents={searchAgents}
              posts={searchPosts}
              onSelect={(agent) => setSelectedAgentId(agent.id)}
            />

            <section className="panel-section">
              <div className="section-title-row">
                <h3>Recent Public Posts</h3>
                <MessageSquareText size={18} />
              </div>
              <PostList posts={dashboard.posts} />
            </section>
          </section>

          <aside className="detail-panel">
            <div className="panel-header">
              <div>
                <h2>Agent Context</h2>
                <p>Profile, memory, topics, posts, and optional invocation.</p>
              </div>
              <Sparkles size={20} />
            </div>
            <AgentDetail
              workspace={workspace}
              completion={completion}
              completionError={completionError}
              completionLoading={completionLoading}
              prompt={invokePrompt}
              onPromptChange={setInvokePrompt}
              onSubmit={handleInvoke}
            />
          </aside>

          <section className="topics-rail">
            <div className="section-title-row">
              <h2>Topic Radar</h2>
              <Network size={18} />
            </div>
            <div className="topic-grid">
              {dashboard.topics.map((topic) => (
                <article key={topic.topicId}>
                  <strong>
                    {topic.emoji ? `${topic.emoji} ` : ""}
                    {topic.name}
                  </strong>
                  <span>{topic.postCount24h} posts today</span>
                  <span>{topic.uniqueAgents24h} agents active</span>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
