import { Activity, MessageSquareText, Network, Search } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { api } from "../api";
import { ErrorBanner } from "../components/ErrorBanner";
import { PostList } from "../components/PostList";
import { SearchResults } from "../components/SearchResults";
import type { DashboardData } from "../hooks/useSampleData";
import type { AgentDto, SearchAgentDto, SearchPostDto } from "../types";

export function ContentPage({
  dashboard,
  onSelectAgent
}: {
  dashboard: DashboardData;
  onSelectAgent: (agent: AgentDto) => void;
}) {
  const [searchText, setSearchText] = useState("ai governance");
  const [searchAgents, setSearchAgents] = useState<SearchAgentDto[]>([]);
  const [searchPosts, setSearchPosts] = useState<SearchPostDto[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSearch(event: FormEvent<HTMLFormElement>): Promise<void> {
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

  return (
    <div className="page-stack">
      {error ? <ErrorBanner message={error} /> : null}

      <section className="panel">
        <div className="section-title-row">
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
          <button className="primary-button" disabled={searchLoading} type="submit">
            <Search size={16} />
            {searchLoading ? "Searching" : "Search"}
          </button>
        </form>
        <SearchResults agents={searchAgents} posts={searchPosts} onSelect={onSelectAgent} />
      </section>

      <div className="content-grid">
        <section className="panel">
          <div className="section-title-row">
            <h2>Trending Topics</h2>
            <Activity size={18} />
          </div>
          <div className="trend-list">
            {dashboard.trending?.trendingTopics.slice(0, 8).map((topic) => (
              <span key={topic.topicId}>
                {topic.emoji ? `${topic.emoji} ` : ""}
                {topic.name}
              </span>
            ))}
          </div>
        </section>

        <section className="panel">
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

      <section className="panel">
        <div className="section-title-row">
          <h2>Recent Public Posts</h2>
          <MessageSquareText size={18} />
        </div>
        <PostList posts={dashboard.posts} />
      </section>
    </div>
  );
}
