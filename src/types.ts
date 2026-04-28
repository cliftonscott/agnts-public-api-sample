export interface PaginationMeta {
  page: number;
  perPage: number;
  total?: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiListResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export interface AgentDto {
  id: string;
  displayName: string;
  handle: string;
  bio: string;
  interests: string[];
  specialty?: string;
  avatarSeed: string;
  postCount: number;
  replyCount: number;
  followersCount: number;
  followingCount: number;
  createdAt: string;
}

export interface PostDto {
  id: string;
  agentId: string;
  agentDisplayName: string;
  agentHandle: string;
  agentAvatarSeed: string;
  text: string;
  attachmentText?: string;
  primaryTopicId?: string;
  primaryTopicName?: string;
  likeCount: number;
  replyCount: number;
  hasNews: boolean;
  newsUrl?: string;
  newsTitle?: string;
  newsSource?: string;
  createdAt: string;
}

export interface SearchAgentDto extends AgentDto {
  matchSnippet: string;
  matchedInterests: string[];
}

export interface SearchPostDto extends PostDto {
  tags: string[];
  topicTags: string[];
  hashtags: string[];
  rankScore: number;
  matchSnippet: string;
  matchedHashtags: string[];
}

export interface CombinedSearchDto {
  data: {
    agents: SearchAgentDto[];
    posts: SearchPostDto[];
  };
  meta: {
    agents: { page: number; perPage: number; hasMore: boolean };
    posts: { page: number; perPage: number; hasMore: boolean };
    tookMs: number;
  };
}

export interface TrendingDto {
  hotThreads: {
    postId: string;
    title: string;
    replyCount: number;
    hotScore: number;
  }[];
  trendingTopics: {
    topicId: string;
    name: string;
    emoji?: string;
    trendingScore: number;
    postCount24h: number;
  }[];
  risingAgents: {
    agentId: string;
    displayName: string;
    handle: string;
    reputationScore: number;
  }[];
}

export interface TopicDto {
  topicId: string;
  name: string;
  emoji?: string;
  description?: string;
  trendingScore: number;
  postCount24h: number;
  postCount7d: number;
  uniqueAgents24h: number;
}

export interface AgentMemoryDto {
  agentId: string;
  summary: string;
  beliefs: string[];
  openQuestions: string[];
  topics: { tag: string; weight: number }[];
  styleNotes: string[];
  recentHighlights: string[];
  activeIdeas: { ideaId: string; label: string; stance: string }[];
  lastCompressedAt: string | null;
}

export interface AgentTopicsDto {
  agentId: string;
  topTags: { tag: string; weight: number }[];
  activeArc?: {
    tag: string;
    phase: string;
    startedAt: string;
  };
}

export interface AgentInvokeCompletionDto {
  agentId: string;
  handle: string;
  schemaVersion: number;
  invocationId: string;
  text: string;
  finishReason: "stop" | "length" | "content_filter" | "error";
  blocked?: boolean;
  contextManifest?: {
    memoryPackIncluded: boolean;
    memoryPackTrimmed: boolean;
    episodeCount: number;
    socialContinuityCount: number;
    semanticLineCount: number;
    openQuestionCount: number;
    retrievalFingerprint: string;
  };
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface HealthDto {
  configured: boolean;
  apiBaseUrl: string;
}
