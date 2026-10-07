import type { INodeProperties } from "n8n-workflow";
export const properties: INodeProperties[] = [
  {
    displayName: "Resource",
    name: "resource",
    type: "options",
    default: "video",
    options: [
      {
        name: "Video",
        value: "video",
      },
      {
        name: "Task",
        value: "task",
      },
    ],
    noDataExpression: true,
  },
  {
    displayName: "Operation",
    name: "operation",
    type: "options",
    default: "generate",
    displayOptions: {
      show: {
        resource: ["video"],
      },
    },
    options: [
      {
        name: "Generate",
        value: "generate",
        description: "Create a video from text",
        action: "Generate a video",
      },
      {
        name: "Animate Frames",
        value: "frames",
        description: "Animate a first frame and optional last frame",
        action: "Animate video frames",
      },
      {
        name: "Reference to Video",
        value: "reference",
        description: "Guide a video with image, video and audio references",
        action: "Generate a reference video",
      },
    ],
    noDataExpression: true,
  },
  {
    displayName: "Operation",
    name: "operation",
    type: "options",
    default: "get",
    displayOptions: {
      show: {
        resource: ["task"],
      },
    },
    options: [
      {
        name: "Get",
        value: "get",
        description: "Retrieve one task",
        action: "Get a task",
      },
      {
        name: "Get Many",
        value: "getMany",
        description: "Retrieve up to 50 specific task IDs",
        action: "Get many tasks",
      },
    ],
    noDataExpression: true,
  },
  {
    displayName: "Task ID",
    name: "taskId",
    type: "string",
    default: "",
    displayOptions: {
      show: {
        resource: ["task"],
        operation: ["get"],
      },
    },
    required: true,
  },
  {
    displayName: "Task IDs",
    name: "taskIds",
    type: "string",
    default: "",
    displayOptions: {
      show: {
        resource: ["task"],
        operation: ["getMany"],
      },
    },
    required: true,
    description: "Up to 50 task IDs, separated by commas or new lines",
  },
  {
    displayName: "Prompt",
    name: "prompt",
    type: "string",
    default: "",
    displayOptions: {
      show: {
        resource: ["video"],
      },
    },
    required: true,
    typeOptions: {
      rows: 4,
    },
    description: "Describe the video in up to 7000 characters",
  },
  {
    displayName: "Model",
    name: "model",
    type: "options",
    default: "MiniMax-H3",
    displayOptions: {
      show: {
        resource: ["video"],
      },
    },
    options: [
      {
        name: "MiniMax-H3",
        value: "MiniMax-H3",
      },
    ],
  },
  {
    displayName: "Resolution",
    name: "resolution",
    type: "options",
    default: "768P",
    displayOptions: {
      show: {
        resource: ["video"],
      },
    },
    options: [
      {
        name: "768P",
        value: "768P",
      },
      {
        name: "2K",
        value: "2K",
      },
    ],
  },
  {
    displayName: "Duration",
    name: "duration",
    type: "number",
    default: 4,
    displayOptions: {
      show: {
        resource: ["video"],
      },
    },
    typeOptions: {
      minValue: 4,
      maxValue: 15,
      numberPrecision: 0,
    },
    description: "Output duration in seconds",
  },
  {
    displayName: "Aspect Ratio",
    name: "ratio",
    type: "options",
    default: "16:9",
    displayOptions: {
      show: {
        resource: ["video"],
        operation: ["generate", "reference"],
      },
    },
    options: [
      { name: "1:1", value: "1:1" },
      { name: "16:9", value: "16:9" },
      { name: "21:9", value: "21:9" },
      { name: "3:4", value: "3:4" },
      { name: "4:3", value: "4:3" },
      { name: "9:16", value: "9:16" },
      { name: "Adaptive", value: "adaptive" },
    ],
    description:
      "Text generation requires a fixed ratio. Frame animation uses adaptive.",
  },
  {
    displayName: "First Frame URL",
    name: "firstFrameUrl",
    type: "string",
    default: "",
    displayOptions: {
      show: {
        resource: ["video"],
        operation: ["frames"],
      },
    },
    required: true,
    description: "Public image URL, mm_file reference or image data URI",
  },
  {
    displayName: "Last Frame URL",
    name: "lastFrameUrl",
    type: "string",
    default: "",
    displayOptions: {
      show: {
        resource: ["video"],
        operation: ["frames"],
      },
    },
    description: "Optional ending frame",
  },
  {
    displayName: "Image URLs",
    name: "imageUrls",
    type: "string",
    default: "",
    displayOptions: {
      show: {
        resource: ["video"],
        operation: ["reference"],
      },
    },
    typeOptions: {
      rows: 3,
    },
    description: "Up to 9 reference images, one per line",
  },
  {
    displayName: "Video URLs",
    name: "videoUrls",
    type: "string",
    default: "",
    displayOptions: {
      show: {
        resource: ["video"],
        operation: ["reference"],
      },
    },
    typeOptions: {
      rows: 3,
    },
    description: "Up to 3 reference videos, one per line",
  },
  {
    displayName: "Audio URLs",
    name: "audioUrls",
    type: "string",
    default: "",
    displayOptions: {
      show: {
        resource: ["video"],
        operation: ["reference"],
      },
    },
    typeOptions: {
      rows: 3,
    },
    description:
      "Up to 3 reference audio files, one per line. At most 12 reference files in total.",
  },
  {
    displayName: "Options",
    name: "options",
    type: "collection",
    default: {},
    displayOptions: {
      show: {
        resource: ["video"],
      },
    },
    placeholder: "Add Option",
    options: [
      {
        displayName: "Callback URL",
        name: "callbackUrl",
        type: "string",
        default: "",
        description: "Optional public HTTPS webhook for final task status",
      },
    ],
  },
  {
    displayName: "Simplify",
    name: "simplify",
    type: "boolean",
    default: true,
    description:
      "Whether to return essential fields instead of the raw API response",
  },
];
