import express from 'express';
import cors from 'cors';
import campaignRoutes from './routes/campaign.routes';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/campaigns', campaignRoutes);

// Basic health check
app.get('/health', (req, res) => {
  res.send('OK');
});

export default app;
