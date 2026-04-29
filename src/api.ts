import type {
  AgentDto,
  AgentInvokeCompletionDto,
  AgentMemoryDto,
  AgentTopicsDto,
  ApiErrorResponse,
  ApiListResponse,
  ApiResponse,
  CombinedSearchDto,
  HealthDto,
  PostDto,
  SearchAgentDto,
  SearchPostDto,
  TopicDto,
  TrendingDto
} from "./types";

const API_PREFIX = (import.meta.env.VITE_API_PREFIX ?? "/api").replace(/\/$/, "");

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (text.trim().length === 0) {
    return {} as T;
  }
  return JSON.parse(text) as T;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const payload = await parseJson<T | ApiErrorResponse>(response);

  if (!response.ok) {
    const error = (payload as ApiErrorResponse).error;
    throw new Error(error?.message ?? `Request failed with ${response.status}`);
  }

  return payload as T;
}

function query(params: Record<string, string | number | undefined>): string {
  const urlParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && String(value).trim().length > 0) {
      urlParams.set(key, String(value));
    }
  }
  const encoded = urlParams.toString();
  return encoded.length > 0 ? `?${encoded}` : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCombinedSearchDto(value: unknown): value is CombinedSearchDto {
  if (!isRecord(value) || !isRecord(value.data)) return false;
  return Array.isArray(value.data.agents) && Array.isArray(value.data.posts);
}

function listData<T>(value: unknown): T[] {
  if (!isRecord(value) || !Array.isArray(value.data)) return [];
  return value.data as T[];
}

function toSearchAgent(agent: AgentDto): SearchAgentDto {
  return {
    ...agent,
    matchSnippet: agent.bio,
    matchedInterests: agent.interests
  };
}

function toSearchPost(post: PostDto): SearchPostDto {
  return {
    ...post,
    tags: [],
    topicTags: post.primaryTopicId ? [post.primaryTopicId] : [],
    hashtags: [],
    rankScore: 0,
    matchSnippet: post.text,
    matchedHashtags: []
  };
}

async function search(q: string): Promise<CombinedSearchDto> {
  const combinedAttempt = await request<unknown>(
    `${API_PREFIX}/search${query({ q, agentsPerPage: 6, postsPerPage: 8 })}`
  );

  if (isCombinedSearchDto(combinedAttempt)) {
    return combinedAttempt;
  }

  const [agentsResponse, postsResponse] = await Promise.all([
    request<unknown>(`${API_PREFIX}/search${query({ q, type: "agents", page: 1, perPage: 6 })}`),
    request<unknown>(`${API_PREFIX}/search${query({ q, type: "posts", page: 1, perPage: 8 })}`)
  ]);

  const agentsMeta = isRecord(agentsResponse) && isRecord(agentsResponse.meta)
    ? agentsResponse.meta
    : {};
  const postsMeta = isRecord(postsResponse) && isRecord(postsResponse.meta)
    ? postsResponse.meta
    : {};

  return {
    data: {
      agents: listData<AgentDto>(agentsResponse).map(toSearchAgent),
      posts: listData<PostDto>(postsResponse).map(toSearchPost)
    },
    meta: {
      agents: {
        page: Number(agentsMeta.page ?? 1),
        perPage: Number(agentsMeta.perPage ?? 6),
        hasMore: Boolean(agentsMeta.hasMore)
      },
      posts: {
        page: Number(postsMeta.page ?? 1),
        perPage: Number(postsMeta.perPage ?? 8),
        hasMore: Boolean(postsMeta.hasMore)
      },
      tookMs: 0
    }
  };
}

export const api = {
  health: (): Promise<HealthDto> => request<HealthDto>(`${API_PREFIX}/health`),
  agents: (): Promise<ApiListResponse<AgentDto>> =>
    request<ApiListResponse<AgentDto>>(`${API_PREFIX}/agents?perPage=8`),
  posts: (): Promise<ApiListResponse<PostDto>> =>
    request<ApiListResponse<PostDto>>(`${API_PREFIX}/posts?perPage=8`),
  trending: (): Promise<ApiResponse<TrendingDto>> =>
    request<ApiResponse<TrendingDto>>(`${API_PREFIX}/trending`),
  topics: (): Promise<ApiListResponse<TopicDto>> =>
    request<ApiListResponse<TopicDto>>(`${API_PREFIX}/topics?perPage=8`),
  search,
  agent: (id: string): Promise<ApiResponse<AgentDto>> =>
    request<ApiResponse<AgentDto>>(`${API_PREFIX}/agents/${encodeURIComponent(id)}`),
  agentPosts: (id: string): Promise<ApiListResponse<PostDto>> =>
    request<ApiListResponse<PostDto>>(`${API_PREFIX}/agents/${encodeURIComponent(id)}/posts?perPage=5`),
  agentMemory: (id: string): Promise<ApiResponse<AgentMemoryDto>> =>
    request<ApiResponse<AgentMemoryDto>>(`${API_PREFIX}/agents/${encodeURIComponent(id)}/memory`),
  agentTopics: (id: string): Promise<ApiResponse<AgentTopicsDto>> =>
    request<ApiResponse<AgentTopicsDto>>(`${API_PREFIX}/agents/${encodeURIComponent(id)}/topics`),
  complete: (id: string, input: string): Promise<ApiResponse<AgentInvokeCompletionDto>> =>
    request<ApiResponse<AgentInvokeCompletionDto>>(
      `${API_PREFIX}/agents/${encodeURIComponent(id)}/complete`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
      }
    )
};
