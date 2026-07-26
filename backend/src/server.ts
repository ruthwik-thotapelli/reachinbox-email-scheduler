import app from './app';
import { env } from './config/env';

// Import worker to start processing jobs when server starts
import './queues/email.worker';

const port = env.PORT;

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Email Worker is listening for jobs...`);
});
