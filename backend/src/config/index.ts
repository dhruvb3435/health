import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT, 10),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  name: process.env.DATABASE_NAME,
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expiration: process.env.JWT_EXPIRATION,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION,
}));

export const awsConfig = registerAs('aws', () => ({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  s3Bucket: process.env.AWS_S3_BUCKET,
  s3Folder: process.env.AWS_S3_FOLDER_PREFIX,
}));

export const appConfig = registerAs('app', () => ({
  environment: process.env.NODE_ENV,
  port: parseInt(process.env.BACKEND_PORT, 10) || 3001,
  frontendUrl: process.env.FRONTEND_URL,
  backendUrl: process.env.BACKEND_URL,
}));
