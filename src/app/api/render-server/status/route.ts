import { ProgressRequest, ProgressResponse } from "../../../../../types/schema";
import { executeApi } from "../../../../helpers/api-response";

type QueuedOrInProgressJob =
  | {
      status: "queued";
      data: { titleText: string };
    }
  | {
      status: "in-progress";
      progress: number;
      data: { titleText: string };
    };

type CompletedJob = {
  status: "completed";
  videoUrl: string;
  data: { titleText: string };
};

type FailedJob = {
  status: "failed";
  error: { message?: string } | Error;
  data: { titleText: string };
};

type JobState = QueuedOrInProgressJob | CompletedJob | FailedJob | undefined;

export const POST = executeApi<ProgressResponse, typeof ProgressRequest>(
  ProgressRequest,
  async (_req, body) => {
    const baseUrl = process.env.RENDER_SERVER_URL;

    if (!baseUrl) {
      throw new Error(
        "RENDER_SERVER_URL is not set. Please configure it in your .env file.",
      );
    }

    const response = await fetch(
      new URL(`/renders/${body.id}`, baseUrl).toString(),
    );

    if (!response.ok) {
      const message = await response.text();
      return {
        type: "error",
        message: `Render Server status error ${response.status}: ${message}`,
      };
    }

    const job = (await response.json()) as JobState;

    if (!job) {
      return {
        type: "error",
        message: `Render job with id ${body.id} not found on Render Server.`,
      };
    }

    if (job.status === "failed") {
      const message =
        (job.error as { message?: string } | undefined)?.message ??
        "Render job failed on Render Server.";

      return {
        type: "error",
        message,
      };
    }

    if (job.status === "completed") {
      const headResponse = await fetch(job.videoUrl, {
        method: "HEAD",
      });

      const contentLength = headResponse.headers.get("content-length");
      const size = contentLength ? Number(contentLength) : 0;

      return {
        type: "done",
        url: job.videoUrl,
        size: Number.isNaN(size) ? 0 : size,
      };
    }

    const progress =
      job.status === "in-progress" && typeof job.progress === "number"
        ? job.progress
        : 0;

    return {
      type: "progress",
      progress: Math.max(0.03, progress),
    };
  },
);

