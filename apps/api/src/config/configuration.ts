export interface AppConfig {
  nodeEnv: string;
  port: number;
  mongodbUri: string;
}

export const configuration = (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/trackit',
});

export default configuration;
