import { useCallback, useMemo, useState } from "react";
import { z } from "zod";
import { CompositionProps } from "../../types/constants";
import { getProgress, renderVideo } from "../lambda/api";
import {
  getProgressViaRenderServer,
  renderVideoViaRenderServer,
} from "../render-server/api";

export type State =
  | {
      status: "init";
    }
  | {
      status: "invoking";
    }
  | {
      renderId: string;
      bucketName: string;
      progress: number;
      status: "rendering";
    }
  | {
      renderId: string | null;
      status: "error";
      error: Error;
    }
  | {
      url: string;
      size: number;
      status: "done";
    };

const wait = async (milliSeconds: number) => {
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, milliSeconds);
  });
};

export type RenderBackend = "lambda" | "renderServer";

export const useRendering = (
  inputProps: z.infer<typeof CompositionProps>,
  backend: RenderBackend = "lambda",
) => {
  const [state, setState] = useState<State>({
    status: "init",
  });

  const renderMedia = useCallback(async () => {
    setState({
      status: "invoking",
    });
    try {
      const useLambda = backend === "lambda";
      const { renderId, bucketName } = useLambda
        ? await renderVideo({ inputProps })
        : await renderVideoViaRenderServer({ inputProps });
      setState({
        status: "rendering",
        progress: 0,
        renderId: renderId,
        bucketName: bucketName,
      });

      let pending = true;

      while (pending) {
        const useLambdaForProgress = backend === "lambda";
        const result = await (useLambdaForProgress
          ? getProgress({
              id: renderId,
              bucketName: bucketName,
            })
          : getProgressViaRenderServer({
              id: renderId,
              bucketName: bucketName,
            }));
        switch (result.type) {
          case "error": {
            setState({
              status: "error",
              renderId: renderId,
              error: new Error(result.message),
            });
            pending = false;
            break;
          }
          case "done": {
            setState({
              size: result.size,
              url: result.url,
              status: "done",
            });
            pending = false;
            break;
          }
          case "progress": {
            setState({
              status: "rendering",
              bucketName: bucketName,
              progress: result.progress,
              renderId: renderId,
            });
            await wait(1000);
          }
        }
      }
    } catch (err) {
      setState({
        status: "error",
        error: err as Error,
        renderId: null,
      });
    }
  }, [backend, inputProps]);

  const undo = useCallback(() => {
    setState({ status: "init" });
  }, []);

  return useMemo(() => {
    return {
      renderMedia,
      state,
      undo,
    };
  }, [renderMedia, state, undo]);
};
