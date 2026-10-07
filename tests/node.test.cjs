const { test } = require("node:test");
const assert = require("node:assert/strict");
const { Minimax } = require("../dist/nodes/Minimax/Minimax.node.js");
const { taskResult } = require("../dist/nodes/Minimax/helpers.js");
const {
  AceDataMinimaxApi,
} = require("../dist/credentials/AceDataMinimaxApi.credentials.js");
const node = new Minimax();
const create = {
  resource: "video",
  operation: "generate",
  model: "MiniMax-H3",
  prompt:
    "A paper boat floating across a calm blue pond, gentle camera movement",
  resolution: "768P",
  duration: 4,
  ratio: "16:9",
  simplify: true,
};
function context(parameters, responses = [], options = {}) {
  let next = 0;
  const calls = [];
  return {
    calls,
    getInputData: () =>
      Array.from({ length: options.count ?? 1 }, () => ({ json: {} })),
    getNode: () => ({
      name: "Test",
      type: "@acedatacloud/n8n-nodes-minimax.minimax",
      typeVersion: 1,
      parameters: {},
      position: [0, 0],
    }),
    getNodeParameter: (name, index, fallback) => {
      const p = Array.isArray(parameters) ? parameters[index] : parameters;
      return name in p ? p[name] : fallback;
    },
    continueOnFail: () => options.continueOnFail ?? false,
    helpers: {
      httpRequestWithAuthentication: async (credential, request) => {
        calls.push({ credential, ...request });
        const response = responses[next++];
        if (response instanceof Error) throw response;
        return response;
      },
      returnJsonArray: (data) => data.map((json) => ({ json })),
      constructExecutionMetaData: (data, meta) =>
        data.map((item) => ({ ...item, pairedItem: meta.itemData })),
    },
  };
}
async function submitted(p) {
  const ctx = context({ ...create, ...p }, [
    { task_id: "new", trace_id: "trace" },
  ]);
  await node.execute.call(ctx);
  return ctx.calls[0].body;
}
async function invalid(p, pattern) {
  const ctx = context({ ...create, ...p });
  await assert.rejects(node.execute.call(ctx), pattern);
  assert.equal(ctx.calls.length, 0);
}
test("creation submits exactly once with async=true and preserves selected model and item pairing", async () => {
  const ctx = context(create, [{ task_id: "new", trace_id: "trace" }]);
  const [out] = await node.execute.call(ctx);
  assert.equal(ctx.calls.length, 1);
  assert.equal(ctx.calls[0].url, "https://api.acedata.cloud/minimax/videos");
  assert.equal(ctx.calls[0].credential, "aceDataMinimaxApi");
  assert.equal(ctx.calls[0].body.async, true);
  assert.equal(ctx.calls[0].body.model, create.model);
  assert.deepEqual(out[0].json, {
    taskId: "new",
    status: "submitted",
    finished: false,
    successful: null,
    traceId: "trace",
  });
  assert.deepEqual(out[0].pairedItem, { item: 0 });
});
test("credentials are masked and the test only queries an empty batch", () => {
  const c = new AceDataMinimaxApi();
  assert.equal(c.properties[0].typeOptions.password, true);
  assert.match(c.authenticate.properties.headers.Authorization, /Bearer/);
  assert.equal(c.test.request.url, "/minimax/tasks");
  assert.deepEqual(c.test.request.body, { action: "retrieve_batch", ids: [] });
});
test("missing tasks and malformed acknowledgments fail instead of reporting completion", async () => {
  await assert.rejects(
    node.execute.call(
      context({ resource: "task", operation: "get", taskId: "missing" }, [{}]),
    ),
    /not found/i,
  );
  await assert.rejects(
    node.execute.call(context(create, [{ success: true }])),
    /task ID/i,
  );
});
test("batch queries preserve input pairing and reject an empty or excessive ID list", async () => {
  const ctx = context(
    {
      resource: "task",
      operation: "getMany",
      taskIds: "a, b\nc",
      simplify: true,
    },
    [{ items: [{ id: "a" }, { id: "b" }, { id: "c" }] }],
  );
  const [out] = await node.execute.call(ctx);
  assert.deepEqual(ctx.calls[0].body, {
    action: "retrieve_batch",
    ids: ["a", "b", "c"],
  });
  assert.equal(out.length, 3);
  assert.deepEqual(out[2].pairedItem, { item: 0 });
  for (const ids of ["", Array(51).fill("a").join(",")]) {
    const bad = context({
      resource: "task",
      operation: "getMany",
      taskIds: ids,
    });
    await assert.rejects(node.execute.call(bad));
    assert.equal(bad.calls.length, 0);
  }
});
test("continue-on-fail preserves later inputs without retrying generation", async () => {
  const ctx = context(
    [create, create],
    [new Error("429 rate limit"), { task_id: "second" }],
    { count: 2, continueOnFail: true },
  );
  const [out] = await node.execute.call(ctx);
  assert.equal(ctx.calls.length, 2);
  assert.match(out[0].json.error, /429/);
  assert.equal(out[1].json.taskId, "second");
  assert.deepEqual(out[1].pairedItem, { item: 1 });
});
test("HTTP and API errors retain failure meaning", async () => {
  for (const error of [
    new Error("403 content rejected"),
    { success: false, error: { message: "Invalid request" } },
  ])
    await assert.rejects(
      node.execute.call(context(create, [error])),
      /rejected|Invalid request/i,
    );
});
test("example polling is bounded and cannot resubmit generation", () => {
  const w = require("../examples/generate-and-wait.json");
  const queue = ["Get Task"];
  const seen = new Set();
  while (queue.length) {
    const n = queue.shift();
    if (seen.has(n)) continue;
    seen.add(n);
    for (const branch of w.connections[n]?.main ?? [])
      for (const edge of branch) queue.push(edge.node);
  }
  assert.equal(seen.has("Create"), false);
  assert.equal(seen.has("Stop Waiting"), true);
  assert.equal(seen.has("Generation Failed"), true);
  assert.equal(w.nodes.find((n) => n.name === "Create").retryOnFail, false);
  assert.equal(JSON.stringify(w).includes("apiToken"), false);
  const agent = require("../examples/ai-agent-task-tool.json");
  assert.equal(
    agent.nodes.find((n) => n.name === "Get Task").type,
    "@acedatacloud/n8n-nodes-minimax.minimaxTool",
  );
});

test("frame animation sends first and last roles and adaptive ratio", async () => {
  const body = await submitted({
    operation: "frames",
    firstFrameUrl: "https://example.com/first.png",
    lastFrameUrl: "https://example.com/last.png",
  });
  assert.deepEqual(
    body.content.slice(1).map((x) => x.role),
    ["first_frame", "last_frame"],
  );
  assert.equal(body.ratio, "adaptive");
  assert.equal("prompt" in body, false);
  await invalid(
    { operation: "frames", lastFrameUrl: "https://example.com/last.png" },
    /required/,
  );
});
test("multimodal references keep media kinds and never include frame inputs", async () => {
  const body = await submitted({
    operation: "reference",
    imageUrls: "https://example.com/a.png",
    videoUrls: "https://example.com/a.mp4",
    audioUrls: "https://example.com/a.mp3",
    firstFrameUrl: "https://example.com/ignored.png",
  });
  assert.deepEqual(
    body.content.slice(1).map((x) => x.role),
    ["reference_image", "reference_video", "reference_audio"],
  );
  assert.equal(body.content[2].video_url.url, "https://example.com/a.mp4");
});
test("reference counts and combined limit are enforced before submission", async () => {
  const rows = (n, ext) =>
    Array(n)
      .fill("https://example.com/a." + ext)
      .join("\n");
  for (const p of [
    {},
    { imageUrls: rows(10, "png") },
    { videoUrls: rows(4, "mp4") },
    { audioUrls: rows(4, "mp3") },
    {
      imageUrls: rows(9, "png"),
      videoUrls: rows(3, "mp4"),
      audioUrls: rows(1, "mp3"),
    },
  ])
    await invalid({ operation: "reference", ...p });
});
test("private file references and data URIs retain media type", async () => {
  const body = await submitted({
    operation: "reference",
    imageUrls: "mm_file://abc123",
    audioUrls: "data:audio/mp3;base64,YQ==",
  });
  assert.equal(body.content[1].image_url.url, "mm_file://abc123");
  await invalid({
    operation: "reference",
    audioUrls: "data:image/png;base64,YQ==",
  });
  await invalid({
    operation: "frames",
    firstFrameUrl: "file:///private/image.png",
  });
});
test("unsupported models, durations, resolutions and adaptive text ratio are rejected", async () => {
  for (const p of [
    { model: "MiniMax-H3-Max" },
    { duration: 3 },
    { duration: 4.5 },
    { duration: 16 },
    { resolution: "480P" },
    { ratio: "adaptive" },
    { prompt: "x".repeat(7001) },
  ])
    await invalid(p);
});
test("native task envelope exposes finished media only after succeeded", async () => {
  const task = {
    id: "a",
    status: "succeeded",
    content: { url: "https://example.com/a.mp4" },
    usage: { total_seconds: 4 },
  };
  const [out] = await node.execute.call(
    context(
      { resource: "task", operation: "get", taskId: "a", simplify: true },
      [{ task }],
    ),
  );
  assert.equal(out[0].json.status, "succeeded");
  assert.deepEqual(out[0].json.data, task.content);
  assert.deepEqual(out[0].json.usage, task.usage);
  const pending = taskResult({ ...task, status: "running" });
  assert.equal(pending.finished, false);
  assert.equal(pending.data, null);
  const [raw] = await node.execute.call(
    context(
      { resource: "task", operation: "get", taskId: "a", simplify: false },
      [{ task }],
    ),
  );
  assert.deepEqual(raw[0].json, task);
});
test("native failed and cancelled states terminate polling and keep errors", () => {
  for (const status of ["failed", "cancelled"]) {
    const result = taskResult({
      id: "a",
      status,
      error: { code: "rejected", message: "Rejected" },
    });
    assert.equal(result.finished, true);
    assert.equal(result.successful, false);
    assert.equal(result.error.code, "rejected");
    assert.equal(result.data, null);
  }
});
