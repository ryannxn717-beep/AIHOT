import { FeedbackRejected } from "../../packages/backend/src/operations/feedback-rejection.ts";

/** No persistent attachment storage is configured for the free reading MVP. */
export async function storeFeedbackScreenshot(): Promise<never> {
  throw new FeedbackRejected(400, "invalid_request", "当前版本仅支持文字反馈，请在内容中描述问题。");
}
