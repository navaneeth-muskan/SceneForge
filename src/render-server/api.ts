import type { RenderMediaOnLambdaOutput } from "@remotion/lambda/client";
import { z } from "zod";
import {
  ProgressRequest,
  ProgressResponse,
  RenderRequest,
} from "../../types/schema";
import { ApiResponse } from "../helpers/api-response";

const makeRequest = async <Res>(
  endpoint: string,
  body: unknown,
): Promise<Res> => {
  const result = await fetch(endpoint, {
    method: "post",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
  });

  const json = (await result.json()) as ApiResponse<Res>;

  if (json.type === "error") {
    throw new Error(json.message);
  }

  return json.data;
};

export const renderVideoViaRenderServer = async ({
  inputProps,
}: {
  inputProps: z.infer<typeof RenderRequest>["inputProps"];
}) => {
  const body: z.infer<typeof RenderRequest> = {
    inputProps,
  };

  // Shape is intentionally the same as RenderMediaOnLambdaOutput usage in use-rendering,
  // but bucketName is a dummy value since the Render Server does not use S3.
  return makeRequest<Pick<RenderMediaOnLambdaOutput, "renderId" | "bucketName">>(
    "/api/render-server/render",
    body,
  );
};

export const getProgressViaRenderServer = async ({
  id,
  bucketName,
}: {
  id: string;
  bucketName: string;
}) => {
  const body: z.infer<typeof ProgressRequest> = {
    id,
    bucketName,
  };

  return makeRequest<ProgressResponse>("/api/render-server/status", body);
};

