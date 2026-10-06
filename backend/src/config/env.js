import { z } from 'zod';

const durationPattern = /^\d+[smhd]$/;

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
    JWT_EXPIRES_IN: z
      .string()
      .regex(durationPattern, 'JWT_EXPIRES_IN must look like 15m, 12h or 1d')
      .default('1d'),
    CORS_ORIGINS: z.string().optional(),
    TRUST_PROXY: z.coerce.number().int().min(0).default(0),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
    AUTH_RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().default(15),
    API_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
    BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
  })
  .superRefine((values, ctx) => {
    if (values.NODE_ENV !== 'production') return;
    if (!values.CORS_ORIGINS) {
      ctx.addIssue({
        code: 'custom',
        path: ['CORS_ORIGINS'],
        message: 'CORS_ORIGINS must list the deployed web origin(s) in production',
      });
    }
    if (values.BCRYPT_SALT_ROUNDS < 10) {
      ctx.addIssue({
        code: 'custom',
        path: ['BCRYPT_SALT_ROUNDS'],
        message: 'BCRYPT_SALT_ROUNDS must be at least 10 in production',
      });
    }
  });

function parseOrigins(value) {
  return value
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

function loadEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    // Only variable names and rule descriptions are printed, never the values.
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    console.error(`Invalid environment configuration:\n${details}`);
    process.exit(1);
  }

  const values = result.data;
  return Object.freeze({
    ...values,
    isProduction: values.NODE_ENV === 'production',
    isTest: values.NODE_ENV === 'test',
    corsOrigins: parseOrigins(values.CORS_ORIGINS ?? 'http://localhost:5173'),
  });
}

export const env = loadEnv();
