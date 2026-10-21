import { S3Client } from '@aws-sdk/client-s3';

// Fallback across all possible naming conventions
const accountId = 
  process.env.R2_ACCOUNT_ID || 
  process.env.CLOUDFLARE_ACCOUNT_ID || 
  process.env.CLOUDFLARE_R2_ACCOUNT_ID;

const accessKeyId = 
  process.env.R2_ACCESS_KEY_ID || 
  process.env.CLOUDFLARE_ACCESS_KEY_ID || 
  process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;

const secretAccessKey = 
  process.env.R2_SECRET_ACCESS_KEY || 
  process.env.CLOUDFLARE_SECRET_ACCESS_KEY || 
  process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

const bucketName = 
  process.env.R2_BUCKET_NAME || 
  process.env.CLOUDFLARE_BUCKET_NAME || 
  process.env.CLOUDFLARE_R2_BUCKET_NAME || 
  'untamed';

if (!accountId || !accessKeyId || !secretAccessKey) {
  throw new Error('Missing Cloudflare R2 environment variables in server configuration.');
}

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export const R2_BUCKET_NAME = bucketName;