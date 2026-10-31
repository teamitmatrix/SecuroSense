import { db } from '../index';
import logger from '../utils/logger';

export interface QAParameter {
    name: string;
    description: string;
    passCriteria: string;
    weight?: number; // For weighted scoring
}

export interface CreateQATemplateInput {
    name: string;
    nameAr?: string;
    description?: string;
    industry: string;
    parameters: QAParameter[];
    createdBy?: number;
    organizationId?: number | null; // For super_admin: can create for specific organization or global (null)
}

/**
 * Create a new QA template
 */
export const createQATemplate = async (input: CreateQATemplateInput) => {
    const template = await db.qATemplate.create({
        data: {
            name: input.name,
            nameAr: input.nameAr || null,
            description: input.description || null,
            industry: input.industry,
            isActive: true,
            parameters: input.parameters as any,
            createdBy: input.createdBy || null,
            organizationId: input.organizationId ?? null // Default to global (null)
        }
    });

    logger.info('QA template created', { 
        templateId: template.id, 
        name: template.name,
        organizationId: template.organizationId 
    });
    return template;
};

/**
 * Get all QA templates with optional industry and organization filter
 * For super_admin (organizationId = null): Shows all templates
 * For regular admin: Shows their org templates + global templates
 */
export const getAllQATemplates = async (industry?: string, organizationId?: number | null, includeUsage = false) => {
    const where: any = { isActive: true };

    if (industry) {
        where.industry = industry;
    }

    if (organizationId !== null && organizationId !== undefined) {
        // Business Admin view: Their org + Global
        where.OR = [
            { organizationId: organizationId },
            { organizationId: null }
        ];
    }
    // If organizationId is null/undefined, it's super_admin - show ALL templates

    const templates = await db.qATemplate.findMany({
        where,
        include: {
            organization: {
                select: {
                    id: true,
                    name: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    // If includeUsage is true, count organizations that have copied this template
    if (includeUsage) {
        return templates.map(template => {
            // Count how many organizations have a copy of this template (organizationId matches template's organizationId if it's a copy)
            // For global templates, count organizations that have templates with same name/industry
            let usageCount = 0;
            const organizationsUsing: Array<{ id: number; name: string }> = [];

            if (template.organizationId === null) {
                // Global template: count organizations that have copied it
                // This would require checking for templates with same name/industry but different organizationId
                // For now, we'll return empty array as usage tracking is not critical
            } else if (template.organization) {
                // Organization-specific template: show the organization
                organizationsUsing.push({
                    id: template.organization.id,
                    name: template.organization.name
                });
                usageCount = 1;
            }

            return {
                ...template,
                organizationsUsing,
                usageCount
            };
        });
    }

    return templates;
};

/**
 * Get QA template by ID
 */
export const getQATemplateById = async (id: number) => {
    return await db.qATemplate.findUnique({
        where: { id },
        include: {
            organization: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });
};

/**
 * Update QA template
 */
export const updateQATemplate = async (
    id: number,
    updates: Partial<CreateQATemplateInput>
) => {
    const updateData: any = {
        name: updates.name,
        nameAr: updates.nameAr,
        description: updates.description,
        industry: updates.industry,
        parameters: updates.parameters as any,
    };

    // Allow updating organizationId if provided
    if (updates.organizationId !== undefined) {
        updateData.organizationId = updates.organizationId;
    }

    return await db.qATemplate.update({
        where: { id },
        data: updateData
    });
};

/**
 * Delete (deactivate) QA template
 */
export const deleteQATemplate = async (id: number) => {
    return await db.qATemplate.update({
        where: { id },
        data: { isActive: false }
    });
};

/**
 * Copy template to organization (for Organization Admin)
 * Creates a new template for the organization based on an existing template
 */
export const copyTemplateToOrganization = async (templateId: number, organizationId: number, createdBy?: number) => {
    // Get the source template
    const sourceTemplate = await db.qATemplate.findUnique({
        where: { id: templateId }
    });

    if (!sourceTemplate) {
        throw new Error('Template not found');
    }

    // Create a copy for the organization
    const copiedTemplate = await db.qATemplate.create({
        data: {
            name: sourceTemplate.name,
            nameAr: (sourceTemplate as any).nameAr || null,
            description: sourceTemplate.description,
            industry: sourceTemplate.industry,
            parameters: sourceTemplate.parameters as any, // Copy all parameters
            isActive: true,
            organizationId: organizationId,
            createdBy: createdBy || null
        }
    });

    logger.info('QA template copied to organization', {
        sourceTemplateId: templateId,
        newTemplateId: copiedTemplate.id,
        organizationId
    });

    return copiedTemplate;
};

/**
 * Get organization's QA template (for call analysis)
 * Now also includes organization's GlobalQAParameters merged with template parameters
 */
export const getOrganizationQATemplate = async (organizationId: number) => {
    // First, get organization's GlobalQAParameters (these are the custom parameters added via QA Parameters page)
    let orgQAParameters: any[] = [];
    try {
        orgQAParameters = await db.globalQAParameter.findMany({
            where: {
                isActive: true,
                OR: [
                    { organizationId: organizationId }, // Organization-specific parameters
                    { organizationId: null }             // Global parameters
                ]
            },
            orderBy: { name: 'asc' }
        });
    } catch (error: any) {
        // If GlobalQAParameter table doesn't exist or query fails, log and continue to template fallback
        logger.warn('Failed to fetch GlobalQAParameters, falling back to templates', {
            organizationId,
            error: error.message
        });
        orgQAParameters = [];
    }

    // If organization has custom QA parameters, use those
    if (orgQAParameters && orgQAParameters.length > 0) {
        // Convert GlobalQAParameters to the format expected by AI service
        const parameters = orgQAParameters.map(param => ({
            name: param.name,
            description: param.description,
            passCriteria: param.passCriteria,
            weight: param.weight || 1
        }));

        logger.info('Using organization GlobalQAParameters for analysis', {
            organizationId,
            parameterCount: parameters.length
        });

        // Return a virtual template object with the merged parameters
        return {
            id: 0,
            name: 'Organization QA Parameters',
            description: 'Auto-generated from organization QA parameters',
            industry: 'Custom',
            isActive: true,
            parameters: parameters,
            organizationId: organizationId,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }

    // Fallback: Get organization's template (if exists)
    const orgTemplate = await db.qATemplate.findFirst({
        where: {
            organizationId: organizationId,
            isActive: true
        },
        orderBy: { createdAt: 'desc' }
    });

    if (orgTemplate) {
        return orgTemplate;
    }

    // Fallback: Get global template for organization's industry
    const org = await db.organization.findUnique({
        where: { id: organizationId },
        select: { industry: true }
    });

    if (org?.industry) {
        const globalTemplate = await db.qATemplate.findFirst({
            where: {
                industry: org.industry,
                organizationId: null, // Global template
                isActive: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return globalTemplate;
    }

    return null;
};


/**
 * Generate AI prompt section for QA parameters
 */
export const generateQAPromptSection = (parameters: QAParameter[]): string => {
    if (!parameters || parameters.length === 0) {
        return ''; // Use default hardcoded parameters
    }

    const qaChecks = parameters.map((param, index) => {
        return `${index + 1}. "${param.name}": ${param.description} (${param.passCriteria})`;
    }).join('\n                ');

    return `
                - qaResults: (array) Mandatory QA compliance check. Evaluate each of the following parameters:
                ${qaChecks}
                
                For each, return: { "parameter": string, "status": "PASS" | "FAIL" | "N/A", "notes": string }
    `;
};

/**
 * Seed default QA templates for different industries
 */
export const seedDefaultTemplates = async () => {
    const templates: CreateQATemplateInput[] = [
        {
            name: 'Insurance Sales - Aetna/CICA',
            nameAr: 'مبيعات التأمين - Aetna/CICA',
            industry: 'Insurance',
            description: 'Standard QA parameters for insurance sales calls (Aetna, CICA)',
            parameters: [
                { name: 'Health / Knockout Questions', description: 'Were they asked clearly and properly?', passCriteria: 'Questions asked and answered' },
                { name: 'OTP Verification', description: 'If reference to Aetna is found, was OTP mentioned?', passCriteria: 'OTP verification completed if applicable' },
                { name: 'Payment Mode Confirmation', description: 'Was a valid mode of payment confirmed BEFORE quoting prices?', passCriteria: 'Payment mode confirmed before pricing' },
                { name: 'Decision Maker Presence', description: 'Was it confirmed that the Decision Maker is on the call?', passCriteria: 'Decision maker confirmed present' },
                { name: 'Plan Benefits Explanation', description: 'Were correct benefits explained according to the selected plan?', passCriteria: 'Benefits accurately explained' },
                { name: 'Honest Representation', description: 'Did the agent avoid misguiding/misinforming about policy papers or details?', passCriteria: 'No misinformation detected' },
                { name: 'Beneficiary DOB Verification', description: 'Was the beneficiary\'s Date of Birth verified without confusion?', passCriteria: 'DOB verified correctly' },
                { name: 'Income Verification', description: 'Was it confirmed the customer receives income in the same account?', passCriteria: 'Income verification completed' },
                { name: 'Draft Date Alignment', description: 'Was the draft date set according to the customer\'s payment cycle?', passCriteria: 'Draft date aligned with payment cycle' },
                { name: 'PDF Notification', description: 'Did the agent inform about receiving a PDF via text/email from Aetna/CICA?', passCriteria: 'PDF notification communicated' },
            ]
        },
        {
            name: 'Insurance Sales - Arabic (Aetna/CICA)',
            nameAr: 'مبيعات التأمين - عربي (Aetna/CICA)',
            industry: 'Insurance',
            description: 'Arabic QA parameters for insurance sales calls (Aetna, CICA). Use for Arabic-speaking teams.',
            parameters: [
                {
                    name: 'أسئلة الصحة / أسئلة الاستبعاد',
                    description: 'هل تم طرح أسئلة الصحة/الاستبعاد بوضوح وبشكل صحيح؟',
                    passCriteria: 'يجب طرح أسئلة الاستبعاد والحصول على إجابات واضحة',
                    weight: 1
                },
                {
                    name: 'التحقق من رمز OTP',
                    description: 'إذا تم ذكر Aetna، هل تم ذكر/التحقق من OTP؟',
                    passCriteria: 'يجب إكمال التحقق من OTP عند الحاجة',
                    weight: 1
                },
                {
                    name: 'تأكيد طريقة الدفع',
                    description: 'هل تم تأكيد طريقة دفع صالحة قبل ذكر الأسعار؟',
                    passCriteria: 'يجب تأكيد طريقة الدفع قبل التسعير',
                    weight: 1
                },
                {
                    name: 'وجود صاحب القرار',
                    description: 'هل تم التأكد من وجود صاحب القرار على المكالمة؟',
                    passCriteria: 'يجب تأكيد أن صاحب القرار موجود',
                    weight: 1
                },
                {
                    name: 'شرح مزايا الخطة',
                    description: 'هل تم شرح المزايا الصحيحة وفقًا للخطة المختارة؟',
                    passCriteria: 'يجب شرح المزايا بدقة ووضوح',
                    weight: 1
                },
                {
                    name: 'التمثيل الصادق',
                    description: 'هل تجنّب الموظف التضليل أو إعطاء معلومات خاطئة حول الوثائق/تفاصيل الوثيقة؟',
                    passCriteria: 'لا توجد معلومات مضللة أو وعود غير دقيقة',
                    weight: 1
                },
                {
                    name: 'التحقق من تاريخ ميلاد المستفيد',
                    description: 'هل تم التحقق من تاريخ ميلاد المستفيد بدون لبس؟',
                    passCriteria: 'يجب التحقق من تاريخ الميلاد بشكل صحيح',
                    weight: 1
                },
                {
                    name: 'التحقق من الدخل',
                    description: 'هل تم التأكد من أن العميل يستلم الدخل في نفس الحساب؟',
                    passCriteria: 'يجب إكمال التحقق من الدخل عند الحاجة',
                    weight: 1
                },
                {
                    name: 'مواءمة تاريخ الخصم',
                    description: 'هل تم ضبط تاريخ الخصم وفق دورة دفع العميل؟',
                    passCriteria: 'يجب مواءمة تاريخ الخصم مع دورة الدفع',
                    weight: 1
                },
                {
                    name: 'إشعار ملف PDF',
                    description: 'هل أبلغ الموظف العميل باستلام PDF عبر رسالة/بريد من Aetna/CICA؟',
                    passCriteria: 'يجب إبلاغ العميل بإشعار الـ PDF',
                    weight: 1
                },
            ]
        },
        {
            name: 'Banking - Customer Service',
            nameAr: 'الخدمات المصرفية - خدمة العملاء',
            industry: 'Banking',
            description: 'QA parameters for banking customer service calls',
            parameters: [
                { name: 'Customer Identification', description: 'Was customer identity properly verified?', passCriteria: 'Identity verification completed' },
                { name: 'Issue Understanding', description: 'Did the agent clearly understand the customer issue?', passCriteria: 'Issue acknowledged and confirmed' },
                { name: 'Solution Provided', description: 'Was an appropriate solution offered?', passCriteria: 'Solution provided and accepted' },
                { name: 'Security Questions', description: 'Were appropriate security questions asked?', passCriteria: 'Security protocol followed' },
                { name: 'Compliance Disclosure', description: 'Were required disclosures communicated?', passCriteria: 'Disclosures read/confirmed' },
                { name: 'Call Summary', description: 'Did agent summarize the call and actions taken?', passCriteria: 'Summary provided' },
                { name: 'Customer Satisfaction', description: 'Was customer satisfaction confirmed?', passCriteria: 'Satisfaction check performed' },
            ]
        },
        {
            name: 'Banking - Customer Service (Arabic)',
            nameAr: 'الخدمات المصرفية - خدمة العملاء (عربي)',
            industry: 'Banking',
            description: 'Arabic QA parameters for banking customer service calls. Use for Arabic-speaking teams.',
            parameters: [
                { name: 'التحقق من هوية العميل', description: 'هل تم التحقق من هوية العميل بشكل صحيح؟', passCriteria: 'إكمال التحقق من الهوية', weight: 1 },
                { name: 'فهم المشكلة', description: 'هل فهم الموظف مشكلة العميل بوضوح؟', passCriteria: 'تأكيد المشكلة وإعادة صياغتها', weight: 1 },
                { name: 'تقديم الحل', description: 'هل تم تقديم حل مناسب؟', passCriteria: 'تقديم حل واضح ومقبول', weight: 1 },
                { name: 'أسئلة الأمان', description: 'هل تم طرح أسئلة الأمان المناسبة؟', passCriteria: 'اتباع بروتوكول الأمان', weight: 1 },
                { name: 'إفصاحات الامتثال', description: 'هل تم ذكر الإفصاحات المطلوبة؟', passCriteria: 'قراءة/تأكيد الإفصاحات', weight: 1 },
                { name: 'ملخص المكالمة', description: 'هل لخص الموظف المكالمة والإجراءات المتخذة؟', passCriteria: 'تقديم ملخص وخطوات تالية', weight: 1 },
                { name: 'تأكيد رضا العميل', description: 'هل تم التأكد من رضا العميل؟', passCriteria: 'تنفيذ فحص رضا العميل', weight: 1 },
            ]
        },
        {
            name: 'Retail - Sales Call',
            nameAr: 'البيع بالتجزئة - مكالمة مبيعات',
            industry: 'Retail',
            description: 'QA parameters for retail sales calls',
            parameters: [
                { name: 'Greeting Protocol', description: 'Was customer greeted professionally?', passCriteria: 'Professional greeting provided' },
                { name: 'Needs Assessment', description: 'Did agent assess customer needs?', passCriteria: 'Needs identified through questions' },
                { name: 'Product Knowledge', description: 'Did agent demonstrate product expertise?', passCriteria: 'Accurate product information given' },
                { name: 'Upselling Attempt', description: 'Did agent attempt to upsell or cross-sell?', passCriteria: 'Upsell offered appropriately' },
                { name: 'Objection Handling', description: 'Were customer objections addressed effectively?', passCriteria: 'Objections handled professionally' },
                { name: 'Call to Action', description: 'Was a clear next step communicated?', passCriteria: 'Next action clearly stated' },
                { name: 'Closing Protocol', description: 'Was call closed professionally?', passCriteria: 'Professional closing' },
            ]
        },
        {
            name: 'Healthcare - Appointment Scheduling',
            nameAr: 'الرعاية الصحية - جدولة المواعيد',
            industry: 'Healthcare',
            description: 'QA parameters for healthcare appointment scheduling',
            parameters: [
                { name: 'HIPAA Compliance', description: 'Was patient privacy maintained?', passCriteria: 'HIPAA protocols followed' },
                { name: 'Patient Information', description: 'Was patient information collected accurately?', passCriteria: 'Complete information gathered' },
                { name: 'Insurance Verification', description: 'Was insurance information verified?', passCriteria: 'Insurance confirmed' },
                { name: 'Appointment Confirmation', description: 'Was appointment date/time clearly confirmed?', passCriteria: 'Appointment details confirmed' },
                { name: 'Pre-visit Instructions', description: 'Were pre-visit instructions provided if needed?', passCriteria: 'Instructions given if applicable' },
                { name: 'Questions Addressed', description: 'Were patient questions answered?', passCriteria: 'All questions addressed' },
            ]
        }
    ];

    for (const templateData of templates) {
        try {
            // Check if template already exists
            const existing = await db.qATemplate.findFirst({
                where: { name: templateData.name }
            });

            if (existing) {
                logger.info('QA template already exists, skipping', { name: templateData.name });
                continue;
            }

            await db.qATemplate.create({
                data: {
                    name: templateData.name,
                    nameAr: templateData.nameAr || null,
                    description: templateData.description || null,
                    industry: templateData.industry,
                    parameters: templateData.parameters as any,
                    isActive: true
                }
            });
            logger.info('Seeded QA template', { name: templateData.name });
        } catch (error) {
            logger.error('Failed to seed template', { name: templateData.name, error });
        }
    }

    logger.info('QA template seeding complete');
};
