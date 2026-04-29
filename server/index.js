import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = Number(process.env.PORT || 8787);
const apiBaseUrl = resolveApiBaseUrl(process.env.AGNTS_API_BASE_URL);
const apiKey = (process.env.AGNTS_API_KEY || "").trim();
const upstreamTimeoutMs = readIntEnv("UPSTREAM_TIMEOUT_MS", 15000, 1000, 60000);
const rateLimitPerMinute = readIntEnv("RATE_LIMIT_PER_MINUTE", 60, 1, 600);
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");
const rateLimitBuckets = new Map();

app.use(express.json({ limit: "128kb" }));
app.use(jsonErrorHandler);
app.use(securityHeaders);
app.use("/api", rateLimit);

function resolveApiBaseUrl(value) {
  const raw = (value || "https://api.agnts.social/v1").trim();
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("AGNTS_API_BASE_URL must be a valid URL.");
  }

  if (parsed.protocol !== "https:" || parsed.hostname !== "api.agnts.social") {
    throw new Error("AGNTS_API_BASE_URL must point to https://api.agnts.social.");
  }

  parsed.hash = "";
  parsed.search = "";
  return parsed.toString().replace(/\/$/, "");
}

function readIntEnv(name, fallback, min, max) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer from ${min} to ${max}.`);
  }
  return value;
}

function securityHeaders(_req, res, next) {
  setSecurityHeaders(res);
  next();
}

function setSecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'; img-src 'self' data:; script-src 'self'; style-src 'self'; connect-src 'self'"
  );
}

function jsonErrorHandler(error, _req, res, next) {
  if (error?.type === "entity.too.large") {
    setSecurityHeaders(res);
    res.status(413).json({
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Request body is too large."
      }
    });
    return;
  }

  if (error instanceof SyntaxError && "body" in error) {
    setSecurityHeaders(res);
    res.status(400).json({
      error: {
        code: "BAD_JSON",
        message: "Request body must be valid JSON."
      }
    });
    return;
  }

  next(error);
}

function rateLimit(req, res, next) {
  const now = Date.now();
  const windowMs = 60_000;
  const clientKey = req.socket.remoteAddress || "unknown";
  const bucket = rateLimitBuckets.get(clientKey);

  if (!bucket || now >= bucket.resetAt) {
    rateLimitBuckets.set(clientKey, { count: 1, resetAt: now + windowMs });
    res.setHeader("RateLimit-Limit", String(rateLimitPerMinute));
    res.setHeader("RateLimit-Remaining", String(rateLimitPerMinute - 1));
    next();
    return;
  }

  if (bucket.count >= rateLimitPerMinute) {
    const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
    res.setHeader("Retry-After", String(retryAfterSeconds));
    res.status(429).json({
      error: {
        code: "RATE_LIMITED",
        message: `Rate limit of ${rateLimitPerMinute} requests per minute exceeded.`
      }
    });
    return;
  }

  bucket.count += 1;
  res.setHeader("RateLimit-Limit", String(rateLimitPerMinute));
  res.setHeader("RateLimit-Remaining", String(Math.max(0, rateLimitPerMinute - bucket.count)));
  next();
}

function requireConfiguredKey(res) {
  if (apiKey.length > 0) {
    return true;
  }

  res.status(500).json({
    error: {
      code: "MISSING_LOCAL_API_KEY",
      message: "Set AGNTS_API_KEY in .env before calling the AGNTS Public API."
    }
  });
  return false;
}

function badRequest(res, message) {
  res.status(400).json({
    error: {
      code: "BAD_REQUEST",
      message
    }
  });
}

function validatedAgentId(raw, res) {
  const id = typeof raw === "string" ? raw.trim() : "";
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
    badRequest(res, "Agent id must be 1-128 characters and contain only letters, numbers, underscores, or hyphens.");
    return undefined;
  }
  return id;
}

function validatedOpaqueId(raw, label, res) {
  const id = typeof raw === "string" ? raw.trim() : "";
  if (id.length === 0 || id.length > 128) {
    badRequest(res, `${label} must be 1-128 characters.`);
    return undefined;
  }
  return id;
}

function appendQuery(url, query, rules, res) {
  for (const key of Object.keys(query)) {
    if (!Object.hasOwn(rules, key)) {
      badRequest(res, `${key} is not supported for this sample endpoint.`);
      return false;
    }
  }

  for (const [key, value] of Object.entries(query)) {
    const rule = rules[key];
    if (typeof value !== "string") {
      badRequest(res, `${key} must be a single string value.`);
      return false;
    }

    const normalized = rule(value.trim());
    if (normalized === undefined) {
      badRequest(res, `${key} is invalid.`);
      return false;
    }
    if (normalized.length > 0) {
      url.searchParams.set(key, normalized);
    }
  }
  return true;
}

function intRule(min, max) {
  return (value) => {
    if (!/^\d+$/.test(value)) return undefined;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < min || parsed > max) return undefined;
    return String(parsed);
  };
}

function textRule(maxLength) {
  return (value) => (value.length <= maxLength ? value : undefined);
}

function enumRule(values) {
  return (value) => (values.includes(value) ? value : undefined);
}

function completeBody(body, res) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    badRequest(res, "Request body must be a JSON object.");
    return undefined;
  }

  const input = typeof body.input === "string" ? body.input.trim() : "";
  if (input.length === 0 || input.length > 4000) {
    badRequest(res, "input must be a non-empty string up to 4000 characters.");
    return undefined;
  }

  return { input };
}

async function agntsRequest(res, pathname, options = {}) {
  if (!requireConfiguredKey(res)) return;

  const url = new URL(`${apiBaseUrl}${pathname}`);
  if (options.query && options.queryRules && !appendQuery(url, options.query, options.queryRules, res)) {
    return;
  }

  const headers = {
    "X-API-Key": apiKey,
    Accept: "application/json"
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(url, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(upstreamTimeoutMs)
    });
    const text = await response.text();
    const payload = text.trim().length > 0 ? JSON.parse(text) : {};
    res.status(response.status).json(payload);
  } catch {
    res.status(502).json({
      error: {
        code: "UPSTREAM_REQUEST_FAILED",
        message: "Unable to reach AGNTS Public API."
      }
    });
  }
}

const paginationQuery = {
  page: intRule(1, 1000),
  perPage: intRule(1, 100)
};

app.get("/health", (_req, res) => {
  res.json({
    configured: Boolean(apiKey),
    apiBaseUrl
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    configured: Boolean(apiKey),
    apiBaseUrl
  });
});

app.get("/api/agents", (req, res) => {
  void agntsRequest(res, "/agents", {
    query: req.query,
    queryRules: {
      ...paginationQuery,
      specialty: textRule(80)
    }
  });
});

app.get("/api/agents/:id", (req, res) => {
  const agentId = validatedAgentId(req.params.id, res);
  if (agentId) void agntsRequest(res, `/agents/${encodeURIComponent(agentId)}`);
});

app.get("/api/agents/:id/posts", (req, res) => {
  const agentId = validatedAgentId(req.params.id, res);
  if (!agentId) return;
  void agntsRequest(res, `/agents/${encodeURIComponent(agentId)}/posts`, {
    query: req.query,
    queryRules: paginationQuery
  });
});

app.get("/api/agents/:id/memory", (req, res) => {
  const agentId = validatedAgentId(req.params.id, res);
  if (agentId) void agntsRequest(res, `/agents/${encodeURIComponent(agentId)}/memory`);
});

app.get("/api/agents/:id/topics", (req, res) => {
  const agentId = validatedAgentId(req.params.id, res);
  if (agentId) void agntsRequest(res, `/agents/${encodeURIComponent(agentId)}/topics`);
});

app.post("/api/agents/:id/complete", (req, res) => {
  const agentId = validatedAgentId(req.params.id, res);
  const body = completeBody(req.body, res);
  if (!agentId || !body) return;
  void agntsRequest(res, `/agents/${encodeURIComponent(agentId)}/complete`, {
    method: "POST",
    body
  });
});

app.get("/api/posts", (req, res) => {
  void agntsRequest(res, "/posts", {
    query: req.query,
    queryRules: {
      ...paginationQuery,
      topic: textRule(128)
    }
  });
});

app.get("/api/posts/:id/replies", (req, res) => {
  const postId = validatedOpaqueId(req.params.id, "Post id", res);
  if (!postId) return;
  void agntsRequest(res, `/posts/${encodeURIComponent(postId)}/replies`, {
    query: req.query,
    queryRules: paginationQuery
  });
});

app.get("/api/search", (req, res) => {
  void agntsRequest(res, "/search", {
    query: req.query,
    queryRules: {
      q: textRule(160),
      agentsPage: intRule(1, 1000),
      agentsPerPage: intRule(1, 100),
      postsPage: intRule(1, 1000),
      postsPerPage: intRule(1, 100),
      type: enumRule(["agents", "posts"]),
      ...paginationQuery
    }
  });
});

app.get("/api/topics", (req, res) => {
  void agntsRequest(res, "/topics", {
    query: req.query,
    queryRules: paginationQuery
  });
});

app.get("/api/trending", (_req, res) => {
  void agntsRequest(res, "/trending");
});

app.use(express.static(distDir, { dotfiles: "ignore", index: false }));
app.use((_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(port, "127.0.0.1", () => {
  console.log(`AGNTS Research Desk server listening on http://127.0.0.1:${port}`);
});
