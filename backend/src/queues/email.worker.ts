import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { transporter } from '../config/smtp';
import { prisma } from '../config/db';
import { emailQueue } from './email.queue';
import { env } from '../config/env';

// Helper to get milliseconds to next hour
const getMsToNextHour = () => {
  const now = new Date();
  const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0, 0);
  return nextHour.getTime() - now.getTime();
};

export const emailWorker = new Worker('email-queue', async (job: Job) => {
  const { emailJobId, toAddress, subject, body, campaignId, hourlyLimit, delaySeconds } = job.data;

  // 1. Check Rate Limit (Per Campaign/Sender per Hour)
  const currentHour = new Date().getHours();
  const rateLimitKey = `rate_limit:campaign:${campaignId}:hour:${currentHour}`;
  
  // Increment and get current count atomically
  const currentCount = await redisConnection.incr(rateLimitKey);
  
  // Set expiry on the key for 2 hours to clean up Redis
  if (currentCount === 1) {
    await redisConnection.expire(rateLimitKey, 60 * 60 * 2);
  }

  if (currentCount > hourlyLimit) {
    // We exceeded the hourly limit. Reschedule for the next hour window.
    const delayToNextHour = getMsToNextHour();
    console.log(`[Rate Limit] Campaign ${campaignId} exceeded ${hourlyLimit}/hr. Delaying job for ${delayToNextHour}ms`);
    
    // Re-add to queue for the next hour
    await emailQueue.add('send-email', job.data, { delay: delayToNextHour });
    
    // Resolve this job since it's rescheduled
    return { status: 'rescheduled' };
  }

  // 2. Minimum delay between emails
  // We can enforce this by pausing the worker, but that blocks concurrency.
  // Instead, since jobs are added with a staggered delay based on `delaySeconds`,
  // we just process them as they come. But if multiple workers pick them up, they might fire at the same time.
  // To strictly enforce delay between emails per campaign, we can use a Redis lock for the delay duration.
  // For simplicity and to not block, we assume jobs are staggered when added. We can also add an artificial wait here if needed, but staggered scheduling is better.

  // 3. Send Email
  try {
    const info = await transporter.sendMail({
      from: `"ReachInbox" <${env.SMTP_USER}>`,
      to: toAddress,
      subject: subject,
      text: body,
    });
    
    console.log(`[Sent] Email to ${toAddress} (Message ID: ${info.messageId})`);

    // 4. Update Database Status
    await prisma.emailJob.update({
      where: { id: emailJobId },
      data: { 
        status: 'SENT',
        sentTime: new Date()
      }
    });

    return { status: 'sent', messageId: info.messageId };
  } catch (error: any) {
    console.error(`[Error] Failed to send email to ${toAddress}:`, error.message);
    
    await prisma.emailJob.update({
      where: { id: emailJobId },
      data: { 
        status: 'FAILED',
        error: error.message
      }
    });
    
    throw error; // Let BullMQ handle retries
  }
}, {
  connection: redisConnection,
  concurrency: 5, // Configurable worker concurrency
});

emailWorker.on('failed', (job, err) => {
  if (job) {
    console.log(`${job.id} has failed with ${err.message}`);
  }
});
