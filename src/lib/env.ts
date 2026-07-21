import { z } from "zod";

const EnvSchema = z.object({
  APP_ENV: z.enum(["local", "dev", "test", "prod"]).default("local"),
  APP_VERSION: z.string().default("0.0.0"),
  API_BASE_URL: z.string().default("/api"),
  MISTRAL_API_KEY: z.string().default(""),
  MISTRAL_MODEL: z.string().default("devstral-2512"),
  ENABLE_AI: z.boolean().default(true),
});

export type AppEnv = z.infer<typeof EnvSchema>;

function toBool(v: string | undefined, fallback: boolean): boolean {
  if (v === undefined || v === "") return fallback;
  return v === "true" || v === "1" || v === "yes";
}

function readEnv(): AppEnv {
  // import.meta.env is populated at build time by Vite for VITE_* vars
  const raw = (import.meta as { env?: Record<string, string | undefined> }).env ?? {};
  const parsed = EnvSchema.parse({
    APP_ENV: raw.VITE_APP_ENV,
    APP_VERSION: raw.VITE_APP_VERSION,
    API_BASE_URL: raw.VITE_API_BASE_URL,
    MISTRAL_API_KEY: raw.VITE_MISTRAL_API_KEY ?? "",
    MISTRAL_MODEL: raw.VITE_MISTRAL_MODEL,
    ENABLE_AI: toBool(raw.VITE_ENABLE_AI, true),
  });
  return parsed;
}

export const env: AppEnv = readEnv();

export const isProd = env.APP_ENV === "prod";
export const isTest = env.APP_ENV === "test";
export const hasMistralKey = env.MISTRAL_API_KEY.trim().length > 0;
export const aiEnabled = env.ENABLE_AI && hasMistralKey;
