import { Router } from 'express';
import { createCampaign, getScheduledEmails, getSentEmails } from '../controllers/campaign.controller';

const router = Router();

router.post('/', createCampaign);
router.get('/scheduled', getScheduledEmails);
router.get('/sent', getSentEmails);

export default router;
