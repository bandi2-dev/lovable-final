import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/ready")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({
          status: "ready",
          timestamp: new Date().toISOString(),
        }),
    },
  },
});
