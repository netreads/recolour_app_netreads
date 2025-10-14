// Environment variable validation and type safety
// This centralizes all environment variable access with proper typing

interface ServerEnv {
  // Database
  DATABASE_URL: string;
  
  // R2 Storage
  R2_BUCKET: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_PUBLIC_URL: string;
  R2_ACCOUNT_ID?: string; // Required when using R2.dev public URLs
  
  // Gemini AI
  GEMINI_API_KEY: string;
  
  // PhonePe
  PHONEPE_CLIENT_ID: string;
  PHONEPE_CLIENT_SECRET: string;
  PHONEPE_CLIENT_VERSION?: string;
  PHONEPE_ENVIRONMENT?: string;
  PHONEPE_WEBHOOK_USERNAME?: string;
  PHONEPE_WEBHOOK_PASSWORD?: string;
  
  // Facebook Conversions API (Server-Side Tracking)
  FACEBOOK_PIXEL_ID?: string;
  FACEBOOK_CONVERSIONS_API_TOKEN?: string;
  
  // App
  NEXT_PUBLIC_APP_URL?: string;
  NODE_ENV: string;
}

interface ClientEnv {
  NEXT_PUBLIC_APP_URL?: string;
  FACEBOOK_PIXEL_ID?: string;
}

class EnvValidator {
  private static instance: EnvValidator;
  private serverEnv: ServerEnv | null = null;

  private constructor() {}

  static getInstance(): EnvValidator {
    if (!EnvValidator.instance) {
      EnvValidator.instance = new EnvValidator();
    }
    return EnvValidator.instance;
  }

  getServerEnv(): ServerEnv {
    if (this.serverEnv) {
      return this.serverEnv;
    }

    const env = process.env;
    
    // Validate required environment variables
    const required: (keyof ServerEnv)[] = [
      'DATABASE_URL',
      'R2_BUCKET',
      'R2_ACCESS_KEY_ID',
      'R2_SECRET_ACCESS_KEY',
      'R2_PUBLIC_URL',
      'GEMINI_API_KEY',
      'PHONEPE_CLIENT_ID',
      'PHONEPE_CLIENT_SECRET',
    ];

    const missing = required.filter(key => !env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    this.serverEnv = {
      DATABASE_URL: env.DATABASE_URL!,
      R2_BUCKET: env.R2_BUCKET!,
      R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID!,
      R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY!,
      R2_PUBLIC_URL: env.R2_PUBLIC_URL!,
      R2_ACCOUNT_ID: env.R2_ACCOUNT_ID,
      GEMINI_API_KEY: env.GEMINI_API_KEY!,
      PHONEPE_CLIENT_ID: env.PHONEPE_CLIENT_ID!,
      PHONEPE_CLIENT_SECRET: env.PHONEPE_CLIENT_SECRET!,
      PHONEPE_CLIENT_VERSION: env.PHONEPE_CLIENT_VERSION,
      PHONEPE_ENVIRONMENT: env.PHONEPE_ENVIRONMENT,
      PHONEPE_WEBHOOK_USERNAME: env.PHONEPE_WEBHOOK_USERNAME,
      PHONEPE_WEBHOOK_PASSWORD: env.PHONEPE_WEBHOOK_PASSWORD,
      FACEBOOK_PIXEL_ID: env.FACEBOOK_PIXEL_ID,
      FACEBOOK_CONVERSIONS_API_TOKEN: env.FACEBOOK_CONVERSIONS_API_TOKEN,
      NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
      NODE_ENV: env.NODE_ENV || 'development',
    };

    return this.serverEnv;
  }

  getClientEnv(): ClientEnv {
    return {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      FACEBOOK_PIXEL_ID: process.env.FACEBOOK_PIXEL_ID,
    };
  }

  // Helper to safely get optional env vars
  getOptionalEnv(key: string, defaultValue: string = ''): string {
    return process.env[key] || defaultValue;
  }
}

export const envValidator = EnvValidator.getInstance();
export const getServerEnv = () => envValidator.getServerEnv();
export const getClientEnv = () => envValidator.getClientEnv();

