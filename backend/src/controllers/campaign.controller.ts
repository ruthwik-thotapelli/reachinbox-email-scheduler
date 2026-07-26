import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { addEmailJob } from '../queues/email.queue';

export const createCampaign = async (req: Request, res: Response) => {
  try {
    const { subject, body, emails, startTime, delaySeconds, hourlyLimit } = req.body;
    
    // For now, let's create a dummy user or fetch first user
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'test@reachinbox.com',
          name: 'Test User',
        }
      });
    }

    const startDateTime = new Date(startTime);
    const now = new Date();
    
    // Calculate initial delay to start time
    const initialDelay = Math.max(0, startDateTime.getTime() - now.getTime());

    const campaign = await prisma.campaign.create({
      data: {
        subject,
        body,
        startTime: startDateTime,
        delaySeconds: delaySeconds || 2,
        hourlyLimit: hourlyLimit || 100,
        userId: user.id,
        status: 'ACTIVE'
      }
    });

    const jobs = [];
    
    // Create EmailJobs in DB and push to Queue
    for (let i = 0; i < emails.length; i++) {
      const emailAddress = emails[i];
      
      const emailJob = await prisma.emailJob.create({
        data: {
          toAddress: emailAddress,
          scheduledTime: new Date(startDateTime.getTime() + (i * campaign.delaySeconds * 1000)),
          campaignId: campaign.id
        }
      });
      
      // Calculate delay for this specific job
      const jobDelay = initialDelay + (i * campaign.delaySeconds * 1000);
      
      await addEmailJob({
        emailJobId: emailJob.id,
        toAddress: emailAddress,
        subject: campaign.subject,
        body: campaign.body,
        campaignId: campaign.id,
        delaySeconds: campaign.delaySeconds,
        hourlyLimit: campaign.hourlyLimit,
      }, jobDelay);
      
      jobs.push(emailJob);
    }

    res.status(201).json({ message: 'Campaign scheduled successfully', campaign, jobCount: jobs.length });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to schedule campaign' });
  }
};

export const getScheduledEmails = async (req: Request, res: Response) => {
  try {
    const emails = await prisma.emailJob.findMany({
      where: { status: 'SCHEDULED' },
      include: { campaign: true },
      orderBy: { scheduledTime: 'asc' }
    });
    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scheduled emails' });
  }
};

export const getSentEmails = async (req: Request, res: Response) => {
  try {
    const emails = await prisma.emailJob.findMany({
      where: { 
        status: { in: ['SENT', 'FAILED'] }
      },
      include: { campaign: true },
      orderBy: { sentTime: 'desc' }
    });
    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sent emails' });
  }
};
