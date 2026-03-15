import { RenderRequest } from "../../../../../types/schema";
import { executeApi } from "../../../../helpers/api-response";

type RenderServerStartResponse = {
  renderId: string;
  bucketName: string;
};

export const POST = executeApi<
  RenderServerStartResponse,
  typeof RenderRequest
>(RenderRequest, async (_req, body) => {
  const baseUrl = process.env.RENDER_SERVER_URL;

  if (!baseUrl) {
    throw new Error(
      "RENDER_SERVER_URL is not set. Please configure it in your .env file.",
    );
  }

  const titleText =
    body.inputProps.code && typeof body.inputProps.code === "string"
      ? body.inputProps.code
      : "Hello, world!";

  const response = await fetch(new URL("/renders", baseUrl).toString(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ titleText }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `Render Server responded with ${response.status}: ${message}`,
    );
  }

  const json = (await response.json()) as { jobId: string };

  return {
    renderId: json.jobId,
    // Dummy bucket name, kept for compatibility with existing ProgressRequest shape.
    bucketName: "render-server",
  };
});

