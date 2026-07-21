import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/version")({
  server: {
    handlers: {
      GET: async () => {
        const appEnv = process.env.VITE_APP_ENV ?? "unknown";
        const version = process.env.VITE_APP_VERSION ?? "0.0.0";
        return Response.json({
          name: "resume-analyzer",
          env: appEnv,
          version,
          commit: process.env.GIT_COMMIT ?? null,
          builtAt: process.env.BUILD_TIME ?? null,
        });
      },
    },
  },
});
