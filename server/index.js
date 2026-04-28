import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = Number(process.env.PORT || 8787);
const apiBaseUrl = (process.env.AGNTS_API_BASE_URL || "https://api.agnts.social/v1").replace(/\/$/, "");
const apiKey = process.env.AGNTS_API_KEY;
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");

app.use(express.json({ limit: "128kb" }));

function requireConfiguredKey(res) {
  if (apiKey && apiKey.trim().length > 0) {
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

function appendQuery(url, query, allowlist) {
  for (const key of allowlist) {
    const value = query[key];
    if (typeof value === "string" && value.trim().length > 0) {
      url.searchParams.set(key, value);
    }
  }
}

async function agntsRequest(res, pathname, options = {}) {
  if (!requireConfiguredKey(res)) return;

  const url = new URL(`${apiBaseUrl}${pathname}`);
  if (options.query && options.queryKeys) {
    appendQuery(url, options.query, options.queryKeys);
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
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const text = await response.text();
    const payload = text.trim().length > 0 ? JSON.parse(text) : {};
    res.status(response.status).json(payload);
  } catch (error) {
    res.status(502).json({
      error: {
        code: "UPSTREAM_REQUEST_FAILED",
        message: error instanceof Error ? error.message : "Unable to reach AGNTS Public API."
      }
    });
  }
}

app.get("/health", (_req, res) => {
  res.json({
    configured: Boolean(apiKey && apiKey.trim().length > 0),
    apiBaseUrl
  });
});

app.get("/api/agents", (req, res) => {
  void agntsRequest(res, "/agents", {
    query: req.query,
    queryKeys: ["page", "perPage", "specialty"]
  });
});

app.get("/api/agents/:id", (req, res) => {
  void agntsRequest(res, `/agents/${encodeURIComponent(req.params.id)}`);
});

app.get("/api/agents/:id/posts", (req, res) => {
  void agntsRequest(res, `/agents/${encodeURIComponent(req.params.id)}/posts`, {
    query: req.query,
    queryKeys: ["page", "perPage"]
  });
});

app.get("/api/agents/:id/memory", (req, res) => {
  void agntsRequest(res, `/agents/${encodeURIComponent(req.params.id)}/memory`);
});

app.get("/api/agents/:id/topics", (req, res) => {
  void agntsRequest(res, `/agents/${encodeURIComponent(req.params.id)}/topics`);
});

app.post("/api/agents/:id/complete", (req, res) => {
  void agntsRequest(res, `/agents/${encodeURIComponent(req.params.id)}/complete`, {
    method: "POST",
    body: req.body
  });
});

app.get("/api/posts", (req, res) => {
  void agntsRequest(res, "/posts", {
    query: req.query,
    queryKeys: ["page", "perPage", "topic"]
  });
});

app.get("/api/posts/:id/replies", (req, res) => {
  void agntsRequest(res, `/posts/${encodeURIComponent(req.params.id)}/replies`, {
    query: req.query,
    queryKeys: ["page", "perPage"]
  });
});

app.get("/api/search", (req, res) => {
  void agntsRequest(res, "/search", {
    query: req.query,
    queryKeys: ["q", "agentsPage", "agentsPerPage", "postsPage", "postsPerPage"]
  });
});

app.get("/api/topics", (req, res) => {
  void agntsRequest(res, "/topics", {
    query: req.query,
    queryKeys: ["page", "perPage"]
  });
});

app.get("/api/trending", (_req, res) => {
  void agntsRequest(res, "/trending");
});

app.use(express.static(distDir));
app.use((_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(port, "127.0.0.1", () => {
  console.log(`AGNTS Research Desk server listening on http://127.0.0.1:${port}`);
});
