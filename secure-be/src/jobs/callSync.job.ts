import cron from 'node-cron';
import { syncCalls } from '../services/ingestion.service';

export const initCronJobs = () => {
    // Schedule task to run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        console.log('Running 5-minute Call Sync Job...');
        try {
            await syncCalls();
            console.log('Call Sync Job Finished.');
        } catch (error) {
            console.error('Call Sync Job Failed:', error);
        }
    });

    console.log('Cron Jobs Initialized: Call Sync (every 5 min)');
};
