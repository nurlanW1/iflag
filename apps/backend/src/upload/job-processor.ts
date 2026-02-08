// Job Processor - Processes upload jobs from queue

import Queue from 'bull';
import { processUploadPipeline } from './processors/upload-processor.js';

// Create Redis connection
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

// Create upload queue
export const uploadQueue = new Queue('file-upload', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5 seconds
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000, // Keep last 1000 jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
});

// Process jobs
uploadQueue.process('file-upload', async (job: any) => {
  console.log(`Processing upload job ${job.id}`);
  
  try {
    await processUploadPipeline({
      id: String(job.id),
      parameters: job.data,
    });
    return { success: true };
  } catch (error: any) {
    console.error(`Upload job ${job.id} failed:`, error);
    throw error;
  }
});

// Job event handlers
uploadQueue.on('completed', (job, result) => {
  console.log(`Upload job ${job.id} completed`);
});

uploadQueue.on('failed', (job, error) => {
  console.error(`Upload job ${job.id} failed:`, error);
});

uploadQueue.on('stalled', (job) => {
  console.warn(`Upload job ${job.id} stalled`);
});

// Cleanup on shutdown
process.on('SIGTERM', async () => {
  await uploadQueue.close();
});

process.on('SIGINT', async () => {
  await uploadQueue.close();
});

export default uploadQueue;
