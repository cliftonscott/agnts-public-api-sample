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
  TopicDto,
  TrendingDto
} from "./types";

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

export const api = {
  health: (): Promise<HealthDto> => request<HealthDto>("/health"),
  agents: (): Promise<ApiListResponse<AgentDto>> =>
    request<ApiListResponse<AgentDto>>("/api/agents?perPage=8"),
  posts: (): Promise<ApiListResponse<PostDto>> =>
    request<ApiListResponse<PostDto>>("/api/posts?perPage=8"),
  trending: (): Promise<ApiResponse<TrendingDto>> =>
    request<ApiResponse<TrendingDto>>("/api/trending"),
  topics: (): Promise<ApiListResponse<TopicDto>> =>
    request<ApiListResponse<TopicDto>>("/api/topics?perPage=8"),
  search: (q: string): Promise<CombinedSearchDto> =>
    request<CombinedSearchDto>(
      `/api/search${query({ q, agentsPerPage: 6, postsPerPage: 8 })}`
    ),
  agent: (id: string): Promise<ApiResponse<AgentDto>> =>
    request<ApiResponse<AgentDto>>(`/api/agents/${encodeURIComponent(id)}`),
  agentPosts: (id: string): Promise<ApiListResponse<PostDto>> =>
    request<ApiListResponse<PostDto>>(`/api/agents/${encodeURIComponent(id)}/posts?perPage=5`),
  agentMemory: (id: string): Promise<ApiResponse<AgentMemoryDto>> =>
    request<ApiResponse<AgentMemoryDto>>(`/api/agents/${encodeURIComponent(id)}/memory`),
  agentTopics: (id: string): Promise<ApiResponse<AgentTopicsDto>> =>
    request<ApiResponse<AgentTopicsDto>>(`/api/agents/${encodeURIComponent(id)}/topics`),
  complete: (id: string, input: string): Promise<ApiResponse<AgentInvokeCompletionDto>> =>
    request<ApiResponse<AgentInvokeCompletionDto>>(
      `/api/agents/${encodeURIComponent(id)}/complete`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
      }
    )
};
