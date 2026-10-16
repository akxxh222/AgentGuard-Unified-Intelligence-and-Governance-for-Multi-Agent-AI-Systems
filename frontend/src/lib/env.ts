import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:8000"),
  NEXT_PUBLIC_WS_URL: z.string().default("ws://localhost:8000"),
  NEXT_PUBLIC_USE_MOCK: z
    .union([z.string(), z.boolean()])
    .optional()
    .default(true)
    .transform((val) => {
      if (typeof val === "boolean") return val;
      return val === "true" || val === "1";
    }),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000",
  NEXT_PUBLIC_USE_MOCK: process.env.NEXT_PUBLIC_USE_MOCK ?? "true",
});

export type Env = z.infer<typeof envSchema>;
