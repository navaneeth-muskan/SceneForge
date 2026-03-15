import { enableTailwind } from "@remotion/tailwind-v4";

export const webpackOverride = (config) => {
  return enableTailwind(config);
};
