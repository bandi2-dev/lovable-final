import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/config")({
  server: {
    handlers: {
      GET: async () => {
        const appEnv = process.env.VITE_APP_ENV ?? "unknown";
        const model = process.env.VITE_MISTRAL_MODEL ?? "mistral-small-latest";
        const enableAi = (process.env.VITE_ENABLE_AI ?? "true") !== "false";
        return Response.json({
          env: appEnv,
          aiEnabled: enableAi,
          model,
          apiBaseUrl: process.env.VITE_API_BASE_URL ?? "/api",
        });
      },
    },
  },
});
