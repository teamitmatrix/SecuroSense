import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || '');
const SYSTEM_INSTRUCTION = `
You are an AI assistant for SecuroSense, a multilingual call analytics platform.

IMPORTANT INSTRUCTIONS:
- The transcript may be in ANY language (English, Arabic, Spanish, French, Urdu, Hindi, etc.)
- You MUST analyze the transcript regardless of its language
- Your analysis output MUST ALWAYS be in ENGLISH
- Translate all content to English in your response

CRITICAL SPEAKER ANALYSIS INSTRUCTIONS:
- The transcript is diarized with "AGENT:" and "CUSTOMER:".
- "AGENT" is our representative. "CUSTOMER" is the lead.
- ONLY extract "painPoints" and "objections" from the "CUSTOMER" speaker's statements.
- If the AGENT mentions their own struggles (e.g., "I find it hard to set a budget"), do NOT list this as a customer pain point.
- Be extremely defensive: if you are unsure if a pain point belongs to the customer, do NOT include it.

Return JSON with these fields:
- summary: (string) A concise paragraph summarizing the call IN ENGLISH.
- sentiment: (string) "POSITIVE", "NEGATIVE", or "NEUTRAL".
- keywords: (string[]) Top 5 important keywords IN ENGLISH.
- topics: (string[]) Top 3 topics discussed IN ENGLISH.
- actionItems: (string[]) List of derived action items IN ENGLISH.
- score: (number) 0-100 rating of the call quality/outcome.
- detectedLanguage: (string) The detected language of the transcript.
- agentName: (string) The name of the agent speaking. Look carefully for introductions like "Hi, this is [Name]", "I am [Name]", "My name is [Name]". If not found, return "Unknown".
- callType: (string) Categorize the interaction: "Discovery", "Pitch", "Follow-up", "Objection Handling", "Closing", or "Administrative".
- wasDealClosed: (boolean) true if the customer agreed to a deal, signed a contract, or made a purchase during this call. false otherwise.
- agentDetails: (object) Extract the following about the AGENT (representative):
    - name: (string) Agent's name.
    - role: (string) Agent's job title/role.
    - company: (string) Agent's company name.
    - painPoints: (string[]) List of problems, needs, or frustrations EXCLUSIVELY expressed by the AGENT.
- coachingTips: (string) A constructive tip for the agent. What did they do well? What could they do better? Be specific.
- objections: (string[]) List of specific objections or concerns raised EXCLUSIVELY by the CUSTOMER.
- mifidCompliance: (object, optional) MiFID II & III compliance check:
    - suitabilityAssessment: (boolean) Was a suitability assessment performed?
    - bestExecution: (boolean) Was best execution policy mentioned or verified?
    - clientCategorization: (string | null) "RETAIL", "PROFESSIONAL", "ELIGIBLE_COUNTERPARTY", or null.
    - regulatoryDisclosures: (boolean) Were required regulatory disclosures made?
- suitabilityAssessment: (object, optional) If investment advice was given, extract:
    - riskProfile: (string | null) "CONSERVATIVE", "MODERATE", "AGGRESSIVE", or null.
    - investmentObjectives: (string[])
    - knowledgeExperience: (string[])
    - financialSituation: (string[])

Return ONLY raw JSON. Do not use markdown code fences.
`;

const model = genAI.getGenerativeModel({
        model: 'gemini-flash-latest',
        systemInstruction: SYSTEM_INSTRUCTION
});

export interface AIAnalysisResult {
    summary: string;
    sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    keywords: string[];
    topics: string[];
    actionItems: string[];
    score: number;
    detectedLanguage?: string;
    agentName?: string;
    callType?: string;
    wasDealClosed?: boolean;
    agentDetails?: {
        name?: string;
        role?: string;
        company?: string;
        painPoints?: string[];
    };
    coachingTips?: string;
    objections?: string[];
    qaResults?: Array<{
        parameter: string;
        status: 'PASS' | 'FAIL' | 'N/A';
        notes: string;
    }>;
    // MiFID Compliance Fields
    mifidCompliance?: {
        suitabilityAssessment?: boolean;
        bestExecution?: boolean;
        clientCategorization?: 'RETAIL' | 'PROFESSIONAL' | 'ELIGIBLE_COUNTERPARTY' | null;
        regulatoryDisclosures?: boolean;
    };
    suitabilityAssessment?: {
        riskProfile?: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
        investmentObjectives?: string[];
        knowledgeExperience?: string[];
        financialSituation?: string[];
    };
}

export interface QAParameter {
    name: string;
    description: string;
    passCriteria: string;
}

export const analyzeTranscriptWithAI = async (
    transcript: string,
    qaParameters?: QAParameter[]
): Promise<AIAnalysisResult> => {
    if (!process.env.GOOGLE_AI_KEY) {
        logger.error("GOOGLE_AI_KEY not found. Cannot perform AI analysis.");
        throw new Error("GOOGLE_AI_KEY is required for AI analysis. Please configure the API key in your environment variables.");
    }

    try {
        logger.info('Starting AI analysis with Gemini', { transcriptLength: transcript.length });
        
        const prompt = `
            Analyze the following call transcript and provide output in strict JSON format.

            ${generateQASection(qaParameters)}

            Transcript:
            """
            ${transcript.substring(0, 15000)}
            """
        `;

        logger.debug('Sending request to Google AI Studio');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const content = response.text();

        if (!content) throw new Error("Empty AI response");

        logger.debug('Received response from Gemini', { responseLength: content.length });

        try {
            // Attempt to clean code blocks if present (though prompt asks for raw JSON)
            const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(cleanJson);

            logger.info('AI analysis completed successfully with Gemini', {
                sentiment: data.sentiment,
                detectedLanguage: data.detectedLanguage,
                score: data.score
            });

            return {
                summary: data.summary || "No summary provided",
                sentiment: ['POSITIVE', 'NEGATIVE', 'NEUTRAL'].includes(data.sentiment) ? data.sentiment : 'NEUTRAL',
                keywords: Array.isArray(data.keywords) ? data.keywords : [],
                topics: Array.isArray(data.topics) ? data.topics : [],
                actionItems: Array.isArray(data.actionItems) ? data.actionItems : [],
                score: typeof data.score === 'number' ? data.score : 50,
                detectedLanguage: data.detectedLanguage || 'Unknown',
                agentName: data.agentName && data.agentName !== 'Unknown' ? data.agentName : undefined,
                callType: data.callType || 'Discovery',
                wasDealClosed: !!data.wasDealClosed,
                agentDetails: data.agentDetails || data.customerDetails || {},
                coachingTips: data.coachingTips || "Overall good performance. Focus on maintaining high engagement.",
                objections: Array.isArray(data.objections) ? data.objections : [],
                qaResults: Array.isArray(data.qaResults) ? data.qaResults : [],
                mifidCompliance: data.mifidCompliance || undefined,
                suitabilityAssessment: data.suitabilityAssessment || undefined
            };
        } catch (parseError) {
            logger.error("Failed to parse AI JSON from Gemini", { content, parseError });
            throw new Error("Failed to parse AI response. The AI service returned invalid JSON.");
        }

    } catch (error) {
        logger.error("AI Analysis failed with Gemini", { error });
        throw error;
    }
};

/**
 * Generate QA parameters section for AI prompt
 */
function generateQASection(qaParameters?: QAParameter[]): string {
    if (!qaParameters || qaParameters.length === 0) {
        // Default Insurance parameters (backwards compatibility)
        return `- qaResults: (array) Mandatory QA compliance check. Evaluate each of the following parameters:
                1. "Health / Knockout Questions": Were they asked clearly and properly?
                2. "OTP Verification": If reference to Aetna is found, was OTP mentioned?
                3. "Payment Mode Confirmation": Was a valid mode of payment confirmed BEFORE quoting prices?
                4. "Decision Maker Presence": Was it confirmed that the Decision Maker is on the call?
                5. "Plan Benefits Explanation": Were correct benefits explained according to the selected plan?
                6. "Honest Representation": Did the agent avoid misguiding/misinforming about policy papers or details?
                7. "Beneficiary DOB Verification": Was the beneficiary's Date of Birth verified without confusion?
                8. "Income Verification": Was it confirmed the customer receives income in the same account?
                9. "Draft Date Alignment": Was the draft date set according to the customer's payment cycle?
                10. "PDF Notification": Did the agent inform about receiving a PDF via text/email from Aetna/CICA?
                
                For each, return: { "parameter": string, "status": "PASS" | "FAIL" | "N/A", "notes": string }`;
    }

    const qaChecks = qaParameters.map((param, index) => {
        return `${index + 1}. "${param.name}": ${param.description} (${param.passCriteria})`;
    }).join('\n                ');

    return `- qaResults: (array) Mandatory QA compliance check. Evaluate each of the following parameters:
                ${qaChecks}
                
                For each, return: { "parameter": string, "status": "PASS" | "FAIL" | "N/A", "notes": string }`;
}
