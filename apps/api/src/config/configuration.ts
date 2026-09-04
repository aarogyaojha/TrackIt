export interface AppConfig {
  nodeEnv: string;
  port: number;
  mongodbUri: string;
  corsOrigin: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtAccessExpiresIn: string;
  jwtRefreshExpiresIn: string;
  superadminEmail?: string;
  superadminPassword?: string;
}

export const configuration = (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/trackit',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || '',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || '',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  superadminEmail: process.env.SUPERADMIN_EMAIL,
  superadminPassword: process.env.SUPERADMIN_PASSWORD,
});

export default configuration;
