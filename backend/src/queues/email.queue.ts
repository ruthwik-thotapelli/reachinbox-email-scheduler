import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';

// We use BullMQ Queue to manage email jobs
export const emailQueue = new Queue('email-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true, // Keep DB clean, we store state in Postgres
    removeOnFail: false,
  },
});

export const addEmailJob = async (jobData: {
  emailJobId: string;
  toAddress: string;
  subject: string;
  body: string;
  campaignId: string;
  delaySeconds: number;
  hourlyLimit: number;
}, delay: number) => {
  return await emailQueue.add('send-email', jobData, { delay });
};
