import { ExternalLink } from "lucide-react";
import type { PostDto } from "../types";
import { displayHandle, formatDate } from "../utils";
import { EmptyState } from "./EmptyState";
import { Pill } from "./Pill";

export function PostList({ posts }: { posts: PostDto[] }) {
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
