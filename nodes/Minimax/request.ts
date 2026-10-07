import type { IDataObject, IExecuteFunctions } from "n8n-workflow";
import {
  callback,
  choice,
  integer,
  object,
  publicUrl,
  requiredText,
} from "./helpers";

function mediaUrl(value: unknown, kind: string): string {
  const text = requiredText(value, `${kind} URL`);
  if (/^mm_file:\/\/[A-Za-z0-9_-]+$/.test(text)) return text;
  if (
    new RegExp(`^data:${kind}/[A-Za-z0-9.+-]+;base64,[A-Za-z0-9+/=]+$`).test(
      text,
    )
  )
    return text;
  return publicUrl(text, `${kind} URL`);
}

function urls(value: unknown, kind: string, max: number): string[] {
  const rows = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value
          .split(/\r?\n/)
          .map((v) => v.trim())
          .filter(Boolean)
      : [];
  if (rows.length > max)
    throw new Error(`Provide at most ${max} ${kind} references`);
  return rows.map((v) => mediaUrl(v, kind));
}

export function buildRequest(
  context: IExecuteFunctions,
  index: number,
): { endpoint: string; body: IDataObject } {
  const get = (name: string, fallback?: unknown) =>
    context.getNodeParameter(name, index, fallback as never);
  const operation = choice(get("operation"), "Operation", [
    "generate",
    "frames",
    "reference",
  ]);
  const prompt = requiredText(get("prompt"), "Prompt");
  if ([...prompt].length > 7000)
    throw new Error("Prompt must not exceed 7000 characters");
  const content: IDataObject[] = [{ type: "text", text: prompt }];
  const body: IDataObject = {
    model: choice(get("model", "MiniMax-H3"), "Model", ["MiniMax-H3"]),
    content,
    resolution: choice(get("resolution", "768P"), "Resolution", ["768P", "2K"]),
    duration: integer(get("duration", 4), "Duration", 4, 15),
    async: true,
  };
  if (operation === "frames") {
    content.push({
      type: "image_url",
      image_url: { url: mediaUrl(get("firstFrameUrl"), "image") },
      role: "first_frame",
    });
    if (get("lastFrameUrl", ""))
      content.push({
        type: "image_url",
        image_url: { url: mediaUrl(get("lastFrameUrl"), "image") },
        role: "last_frame",
      });
    body.ratio = "adaptive";
  } else {
    body.ratio = choice(get("ratio", "16:9"), "Aspect ratio", [
      "adaptive",
      "21:9",
      "16:9",
      "4:3",
      "1:1",
      "3:4",
      "9:16",
    ]);
    if (operation === "generate" && body.ratio === "adaptive")
      throw new Error("Text-to-video requires a fixed aspect ratio");
    if (operation === "reference") {
      for (const [name, kind, max] of [
        ["imageUrls", "image", 9],
        ["videoUrls", "video", 3],
        ["audioUrls", "audio", 3],
      ] as const) {
        for (const url of urls(get(name, ""), kind, max))
          content.push({
            type: `${kind}_url`,
            [`${kind}_url`]: { url },
            role: `reference_${kind}`,
          });
      }
      if (content.length < 2)
        throw new Error("Provide at least one image, video or audio reference");
      if (content.length > 13)
        throw new Error("Provide at most 12 reference media files in total");
    }
  }
  callback(object(get("options", {})), body);
  return { endpoint: "/minimax/videos", body };
}
