import path from "path";

/**
 * Centralized environment variable management
 */
export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  meta: {
    appId: process.env.META_APP_ID,
    appSecret: process.env.META_APP_SECRET,
    businessAccountId: process.env.META_BUSINESS_ACCOUNT_ID,
    phoneNumberId: process.env.META_PHONE_NUMBER_ID,
    accessToken: process.env.META_ACCESS_TOKEN,
  },
  
  whatsappProvider: process.env.WHATSAPP_PROVIDER || 'meta',
  uploadsDir: path.resolve(process.cwd(), 'uploads'),
};

export default config;
