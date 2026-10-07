# MiniMax H3 by AceDataCloud — n8n community node

MiniMax H3 generation and task queries for n8n, using [AceDataCloud's API](https://platform.acedata.cloud/documents/minimax-videos). Maintained by **Ace Data Cloud**; this is an AceDataCloud integration and does not claim to be an official node from the model developer.

Package: `@acedatacloud/n8n-nodes-minimax` · License: MIT.

## Installation

On self-hosted n8n, open **Settings → Community Nodes → Install** and enter `@acedatacloud/n8n-nodes-minimax`. See the [n8n community-node installation guide](https://docs.n8n.io/integrations/community-nodes/installation-and-management/).

n8n Cloud requires verified community nodes. npm publication does not establish verification; check the current node panel for availability.

## Credentials

1. Get an AceDataCloud application API token from the [console](https://platform.acedata.cloud/console/applications).
2. Create a **MiniMax H3 by AceDataCloud API** credential in n8n and paste the token.
3. Run the credential test. It queries an empty batch of tasks and does not generate media.

The token is masked, stored in n8n's credential store and sent as a Bearer token only to `https://api.acedata.cloud`. A direct model-provider subscription is not an AceDataCloud API token.

## Operations

| Resource | Operation          | Purpose                              |
| -------- | ------------------ | ------------------------------------ |
| Video    | Generate           | Text-to-video                        |
| Video    | Animate Frames     | First frame and optional last frame  |
| Video    | Reference to Video | Image, video and audio references    |
| Task     | Get / Get Many     | Query one or up to 50 known task IDs |

This node exposes the published `MiniMax-H3` model at 768P or 2K for 4–15 seconds. It does not expose H3 Max, prompt enhancement or regeneration. The default is 768P, four seconds and a 16:9 ratio.

- Text prompts are required and limited to 7000 characters. Text-only generation requires a fixed aspect ratio.
- Frame animation requires a first frame, allows an optional last frame, and uses the adaptive ratio. Frame inputs are separate from reference inputs.
- Reference mode accepts up to nine images, three videos and three audio files, with at most 12 reference files total. Media availability and format constraints are validated by the service.
- Public HTTP(S) URLs, existing `mm_file://` references, and matching image/video/audio Base64 data URIs are supported. The node does not upload local files.
- The native task API returns `{ "task": {...} }` for a single query. Simplified results expose completed video content as `data.url`, preserve `usage`, and terminate polling for failure or cancellation. Raw output returns the native task object.

Additional examples: [frame animation](examples/animate-frames.json), [reference generation](examples/reference-video.json).

## Workflow examples

Import [generate and wait](examples/generate-and-wait.json), select your credential on both service nodes and edit the prompt. Creation submits once with `async: true`, returning `taskId`, `status: "submitted"`, `finished: false` and `successful: null`. It then polls every 15 seconds with a separate 30-minute deadline. A submission acknowledgment is not a finished generation. Completion returns `finished: true`; check `successful` before consuming media.

The polling loop never returns to Create. A deadline does not cancel a submitted task: save its ID and query it later. Disable **Simplify** to inspect native task data.

Import the [AI Agent task tool](examples/ai-agent-task-tool.json) to query an existing task through an Agent. Set the existing task ID, service credential and your chosen chat-model credential before running. This example incurs any chat-model usage but does not generate new media.

## Billing, retries and data

Generation uses your AceDataCloud balance. Check the [service documentation](https://platform.acedata.cloud/documents/minimax-videos) for current models, limits and pricing. The node preserves your model selection and never substitutes a model.

Creation requests are not automatically retried. Re-running a creation node or enabling retry-on-fail can create another paid task. After a timeout, retain the existing task ID and query its state where possible. Each incoming n8n item produces its own request, so multiple input items can incur multiple charges. Task queries do not generate another paid task.

Only configured prompts, media references and request parameters are sent to AceDataCloud. Public media URLs must be accessible to the service. The node has no telemetry, filesystem access, environment-variable access or additional runtime dependencies. Optional callbacks must be public HTTPS URLs.

## Development

```sh
pnpm install --frozen-lockfile
pnpm run build
pnpm run lint
pnpm test
```

Node.js 24 and the official `@n8n/node-cli` are used in CI. Tests exercise payload validation, async completion, media constraints, error handling and input-item pairing without paid network calls. CI builds twice and loads the package in n8n 2.42.3, reaching credential validation without generating media. Programmatic nodes keep model-specific input validation and task-response normalization explicit while using n8n's authenticated HTTP helper.

Release merged code with the [Publish workflow](.github/workflows/publish.yml), which runs validation and publishes with npm provenance. Keep published versions immutable. Icons are bundled from the Studio service catalog; see [asset provenance](assets/README.md).

## Support

Report issues at [AceDataCloud/MinimaxN8N](https://github.com/AceDataCloud/MinimaxN8N/issues) with the package version, n8n version, operation and a redacted error. Never include API tokens or private generation content.
