// Lightweight wrapper around an in-browser background removal library.
// The concrete library is loaded dynamically on the client to avoid
// impacting initial bundle size and to keep SSR safe.

export const removeBackgroundFromImage = async (
  imageUrl: string,
): Promise<string> => {
  if (typeof window === "undefined") {
    throw new Error("Background removal can only run in the browser.");
  }

  const mod: any = await import("@imgly/background-removal");
  const removeBackground = (mod?.removeBackground ??
    mod?.default) as (input: any, options?: any) => Promise<Blob | any>;

  const response = await removeBackground(imageUrl, {
    output: {
      format: "image/png",
    },
  });

  const blob: Blob =
    response instanceof Blob
      ? response
      : (response?.blob as Blob | undefined) ??
        (response?.image as Blob | undefined) ??
        (() => {
          throw new Error("Unexpected response from background removal library.");
        })();

  return URL.createObjectURL(blob);
};

