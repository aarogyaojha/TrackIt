import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),
  PORT: Joi.number().port().default(4000),
  MONGODB_URI: Joi.string().required(),
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  SUPERADMIN_EMAIL: Joi.string().email({ tlds: false }).optional(),
  SUPERADMIN_PASSWORD: Joi.string().min(8).optional(),
  RESEND_API_KEY: Joi.string().optional(),
  EMAIL_FROM_ADDRESS: Joi.string().email({ tlds: false }).default('noreply@trackit.local'),
  EMAIL_FROM_NAME: Joi.string().default('TrackIt'),
});
