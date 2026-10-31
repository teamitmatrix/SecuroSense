import { analyzeCall } from './analysis.service';

// Mock External Call Interface
interface ExternalCall {
    id: string;
    customerName: string;
    duration: number; // seconds
    recordingUrl: string;
    transcript: string; // In real life, might fetch from recordingUrl -> STT service
    timestamp: Date;
}

export const syncCalls = async () => {
    console.log("Starting Call Sync Job...");

    // 1. Fetch Calls from "External Provider"
    const externalCalls = await mockFetchFromExternalProvider();

    const results = [];

    // 2. Process each call
    for (const data of externalCalls) {
        try {
            // Check deduplication (simple check via recordingUrl or we could use external ID if stored)
            // For MVP, we'll just process everything as new or rely on logic to not re-fetch old ones.
            // In a real app: check if Call with externalId exists. 

            // For this MVP demo: We will just Create them.
            // But to avoid flooding DB every 5 mins with SAME calls, let's random-gen new ones 
            // OR only fetch "new" ones.
            // Let's assume the provider only returns NEW calls since last sync.

            const processed = await analyzeCall({
                transcript: data.transcript,
                customerName: data.customerName,
                duration: data.duration,
                recordingUrl: data.recordingUrl
            });
            console.log(`Synced Call ID: ${processed.id}`);
            results.push(processed);
        } catch (err) {
            console.error(`Failed to process external call ${data.id}`, err);
        }
    }

    return results;
};


const mockFetchFromExternalProvider = async (): Promise<ExternalCall[]> => {
    // Simulate API latency
    await new Promise(r => setTimeout(r, 1000));

    // Randomly decide if there are new calls (30% chance) or always return one for Demo purposes?
    // Let's return 1 new call every time this runs for the Demo to be visible.

    const randomKeywords = ['pricing', 'bug', 'feature request', 'renewal', 'cancellation'];
    const randomMoods = ['happy', 'angry', 'neutral'];

    const mood = randomMoods[Math.floor(Math.random() * randomMoods.length)];
    const keyword = randomKeywords[Math.floor(Math.random() * randomKeywords.length)];

    const mockTranscript = `
    Agent: Hello, thanks for calling. How can I help?
    Customer: Hi, I am calling about ${keyword}. I am feeling quite ${mood} about the service.
    Agent: I understand. Let me look into that ${keyword} issue for you.
    Customer: Thanks. Please solve it quickly.
    Agent: Working on it... Done. Is there anything else?
    Customer: No, that's it. Bye.
    `;

    return [{
        id: `call-${Date.now()}`,
        customerName: `Customer ${Math.floor(Math.random() * 1000)}`,
        duration: 120 + Math.floor(Math.random() * 300),
        recordingUrl: `https://example.com/rec/${Date.now()}.mp3`,
        transcript: mockTranscript,
        timestamp: new Date()
    }];
};
