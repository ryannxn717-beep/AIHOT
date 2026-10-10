import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { config } from "../config.ts";
import { FeedbackRejected } from "./feedback-rejection.ts";
import { sniffImageType } from "./feedback.ts";

export async function storeFeedbackScreenshot(screenshot: { mime: string; data: Buffer }): Promise<string> {
  // Some phones send JPEGs as image/jpg or with no type at all: the bytes decide.
  const mime = sniffImageType(screenshot.data);
  if (!mime) throw new FeedbackRejected(400, "invalid_request", "截图需要是 PNG、JPG、WebP 或 GIF。");
  if (screenshot.data.length > 8 * 1024 * 1024) throw new FeedbackRejected(400, "invalid_request", "截图最大 8MB。");
  // The first bytes are not enough: a PNG signature followed by noise would be kept and offered to
  // Feishu again and again. Decoding the whole picture settles it (a long phone capture fits the cap).
  const decodes = await sharp(screenshot.data, { limitInputPixels: 60_000_000, failOn: "error" }).stats().then(() => true, () => false);
  if (!decodes) throw new FeedbackRejected(400, "invalid_request", "截图无法识别，请换一张图片。");
  // Stored locally until it is forwarded (notify/feishu.ts), for good where there is no internal chat;
  // the database keeps only an identifier.
  // Forwarding or erasing one feedback removes its file, even if another used the same picture.
  const name = `${randomUUID()}.${mime.split("/")[1]}`;
  const dir = path.join(config.dataDir, "feedback-screenshots");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), screenshot.data);
  return `local:${name}`;

}
