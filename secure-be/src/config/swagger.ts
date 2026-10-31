import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'SecuroSense API',
            version: '1.0.0',
            description: `
# SecuroSense API Documentation

AI-driven communication analytics platform for compliance, security, and business intelligence.

## Features
- 🔐 JWT Authentication
- 📞 Multilingual Call Analysis
- 📊 Real-time Analytics & Reporting
- 🌍 Support for 50+ Languages
- 🎯 Sentiment Analysis & Topic Detection
- ⚡ MiFID II/III Compliance Ready

## Authentication
Most endpoints require JWT authentication. Use the \`/api/auth/login\` endpoint to obtain a token,
then include it in the Authorization header:
\`\`\`
Authorization: Bearer <your-token>
\`\`\`

## Organization-Based Data Isolation
The API automatically filters data based on the user's organization:
- **Regular Users**: Can only access data from their own organization
- **Super Admin** (organizationId = null): Can access all data across all organizations

This filtering is handled automatically by middleware - you don't need to pass organizationId in requests.
            `,
            contact: {
                name: 'Securotek Support',
                email: 'support@securotek.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
            {
                url: 'http://3.128.203.121:3000',
                description: 'EC2 Production server (IP)',
            },
            {
                url: 'http://ec2-3-128-203-121.us-east-2.compute.amazonaws.com:3000',
                description: 'EC2 Production server (Domain)',
            },
            {
                url: 'https://api.securosense.com',
                description: 'Production server (with domain)',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        email: { type: 'string', format: 'email' },
                        name: { type: 'string' },
                        role: { 
                            oneOf: [
                                { type: 'string' },
                                { 
                                    type: 'object',
                                    properties: {
                                        id: { type: 'integer' },
                                        name: { type: 'string' },
                                        description: { type: 'string' }
                                    }
                                }
                            ]
                        },
                        roleId: { type: 'integer', nullable: true },
                        teamId: { type: 'integer', nullable: true },
                        organizationId: { type: 'integer', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Team: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        organizationId: { type: 'integer', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Organization: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        industry: { type: 'string' },
                        size: { type: 'string', nullable: true },
                        adminEmail: { type: 'string', nullable: true },
                        adminName: { type: 'string', nullable: true },
                        userCount: { type: 'integer' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                QATemplate: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        description: { type: 'string', nullable: true },
                        industry: { type: 'string' },
                        isActive: { type: 'boolean' },
                        parameters: { type: 'object' },
                        organizationId: { type: 'integer', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                QAParameter: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        passCriteria: { type: 'string' },
                        industry: { type: 'string' },
                        weight: { type: 'integer' },
                        isActive: { type: 'boolean' },
                        organizationId: { type: 'integer', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Role: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        description: { type: 'string', nullable: true },
                        isSystem: { type: 'boolean' },
                        permissions: {
                            type: 'array',
                            items: { type: 'object' }
                        },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Promise: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        title: { type: 'string' },
                        description: { type: 'string', nullable: true },
                        status: { type: 'string', enum: ['PENDING', 'FULFILLED', 'BROKEN'] },
                        dueDate: { type: 'string', format: 'date-time' },
                        userId: { type: 'integer' },
                        categoryId: { type: 'integer' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Call: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        agentId: { type: 'integer', nullable: true },
                        customerName: { type: 'string', nullable: true },
                        duration: { type: 'integer', description: 'Duration in seconds' },
                        recordingUrl: { type: 'string', nullable: true },
                        transcript: { type: 'string', nullable: true },
                        language: { type: 'string', nullable: true, description: 'Detected language (e.g., English, Arabic, Spanish)' },
                        timestamp: { type: 'string', format: 'date-time' },
                        analysis: { $ref: '#/components/schemas/CallAnalysis' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                CallAnalysis: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        callId: { type: 'integer' },
                        sentiment: { type: 'string', enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL'], nullable: true },
                        keywords: { type: 'array', items: { type: 'string' } },
                        topics: { type: 'array', items: { type: 'string' } },
                        actionItems: { type: 'array', items: { type: 'string' } },
                        summary: { type: 'string', nullable: true },
                        score: { type: 'integer', minimum: 0, maximum: 100, nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
        tags: [
            {
                name: 'Authentication',
                description: 'User authentication and registration',
            },
            {
                name: 'Call Analysis',
                description: 'Call recording upload, transcript analysis, and retrieval',
            },
            {
                name: 'Data Ingestion',
                description: 'External system integration and data synchronization',
            },
            {
                name: 'Teams',
                description: 'Team management and agent assignment',
            },
            {
                name: 'QA Templates',
                description: 'QA template management (super_admin only)',
            },
            {
                name: 'QA Parameters',
                description: 'Global QA parameter management',
            },
            {
                name: 'Roles',
                description: 'Role and permission management',
            },
            {
                name: 'Organizations',
                description: 'Organization management (super_admin only)',
            },
            {
                name: 'Sales',
                description: 'Sales dashboard and analytics',
            },
            {
                name: 'Promises',
                description: 'Promise tracking and management',
            },
            {
                name: 'Onboarding',
                description: 'Organization onboarding workflow',
            },
        ],
    },
    apis: ['./src/routes/*.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
