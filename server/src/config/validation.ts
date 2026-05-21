import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required().min(16),
  JWT_REFRESH_SECRET: Joi.string().optional().min(16).default(''),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional().allow(''),
  AI_API_KEY: Joi.string().required(),
  AI_API_URL: Joi.string().uri().required(),
  WECHAT_APPID: Joi.string().optional().allow(''),
  WECHAT_SECRET: Joi.string().optional().allow(''),
  ALLOWED_ORIGINS: Joi.string().allow('').default(''),
});
