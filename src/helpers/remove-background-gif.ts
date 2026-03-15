import { parseGIF, decompressFrames } from "gifuct-js";
import GIF from "gif.js.optimized";
import { removeBackgroundFromImage } from "./remove-background";

export const removeBackgroundFromGif = async (gifUrl: string): Promise<string> => {
  if (typeof window === "undefined") {
    throw new Error("Background removal can only run in the browser.");
  }

  const response = await fetch(gifUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch GIF: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();

  const gif = parseGIF(arrayBuffer);
  const frames = decompressFrames(gif, true);

  if (!frames.length) {
    throw new Error("GIF has no frames.");
  }

  // Infer dimensions from the first frame.
  const { width, height } = frames[0].dims;

  const gifEncoder = new GIF({
    workers: 2,
    quality: 10,
    width,
    height,
  });

  for (const frame of frames) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      continue;
    }

    const patchData = new Uint8ClampedArray(frame.patch.length);
    patchData.set(frame.patch);
    const imageData = new ImageData(
      patchData,
      frame.dims.width,
      frame.dims.height,
    );
    ctx.putImageData(imageData, frame.dims.left, frame.dims.top);

    const frameDataUrl = canvas.toDataURL("image/png");
    const processedUrl = await removeBackgroundFromImage(frameDataUrl);

    const processedImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = processedUrl;
    });

    const processedCanvas = document.createElement("canvas");
    processedCanvas.width = width;
    processedCanvas.height = height;
    const processedCtx = processedCanvas.getContext("2d");
    if (!processedCtx) {
      continue;
    }
    processedCtx.drawImage(processedImg, 0, 0, width, height);

    gifEncoder.addFrame(processedCanvas, {
      delay: frame.delay || 100,
    });
  }

  const blob: Blob = await new Promise((resolve) => {
    gifEncoder.on("finished", (b: Blob) => {
      resolve(b);
    });
    gifEncoder.render();
  });

  return URL.createObjectURL(blob);
};

