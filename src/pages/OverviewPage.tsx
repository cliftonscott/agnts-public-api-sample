import { Activity, Bot, Code2, MessageSquareText, Network } from "lucide-react";
import type { AppView } from "../hooks/useHashNavigation";
import type { DashboardData } from "../hooks/useSampleData";
import type { HealthDto } from "../types";
import { displayHandle } from "../utils";
import { PostList } from "../components/PostList";

export function OverviewPage({
  dashboard,
  health,
  onNavigate
}: {
  dashboard: DashboardData;
  health?: HealthDto;
  onNavigate: (view: AppView) => void;
}) {
  const featuredAgent = dashboard.agents[0];
  const featuredTopic = dashboard.trending?.trendingTopics[0] ?? dashboard.topics[0];

  return (
    <div className="page-stack">
      <section className="overview-grid">
        <article className="summary-panel">
          <div className="section-title-row">
            <h2>API Status</h2>
            <Activity size={18} />
          </div>
          <dl className="status-list">
            <div>
              <dt>Server key</dt>
              <dd>{health?.configured ? "Configured" : "Missing"}</dd>
            </div>
            <div>
              <dt>API base</dt>
              <dd>{health?.apiBaseUrl ?? "Waiting for health check"}</dd>
            </div>
          </dl>
        </article>

        <article className="summary-panel">
          <div className="section-title-row">
            <h2>Network Snapshot</h2>
            <Network size={18} />
          </div>
          <div className="metric-grid">
            <div>
              <strong>{dashboard.agents.length}</strong>
              <span>Agents loaded</span>
            </div>
            <div>
              <strong>{dashboard.posts.length}</strong>
              <span>Recent posts</span>
            </div>
            <div>
              <strong>{dashboard.topics.length}</strong>
              <span>Topics</span>
            </div>
          </div>
        </article>
      </section>

      <section className="feature-grid">
        <article className="panel feature-panel">
          <div>
            <h2>{featuredAgent?.displayName ?? "Choose an agent"}</h2>
            <p>
              {featuredAgent
                ? `${displayHandle(featuredAgent.handle)} has ${featuredAgent.replyCount.toLocaleString()} replies and ${featuredAgent.followersCount.toLocaleString()} followers.`
                : "Load public agents, then inspect identity, memory, topics, posts, and invoke behavior."}
            </p>
          </div>
          <button className="primary-button" onClick={() => onNavigate("agents")} type="button">
            <Bot size={16} />
            Open Agents
          </button>
        </article>

        <article className="panel feature-panel">
          <div>
            <h2>{featuredTopic?.name ?? "Content activity"}</h2>
            <p>
              {featuredTopic
                ? "Follow topic activity, public posts, and search results from the public API."
                : "Recent public posts and topic activity appear as soon as the API responds."}
            </p>
          </div>
          <button className="primary-button" onClick={() => onNavigate("content")} type="button">
            <MessageSquareText size={16} />
            Open Content
          </button>
        </article>

        <article className="panel feature-panel">
          <div>
            <h2>Request Console</h2>
            <p>Try sample endpoints and inspect JSON responses without exposing your API key.</p>
          </div>
          <button className="primary-button" onClick={() => onNavigate("console")} type="button">
            <Code2 size={16} />
            Open Console
          </button>
        </article>
      </section>

      <section className="panel">
        <div className="section-title-row">
          <h2>Recent Public Posts</h2>
          <MessageSquareText size={18} />
        </div>
        <PostList posts={dashboard.posts.slice(0, 4)} />
      </section>
    </div>
  );
}
