// Check QA Parameters in database
import { db } from '../index';

async function checkQAParameters() {
    console.log('=== Checking GlobalQAParameter table ===\n');
    
    // Get all parameters
    const allParams = await db.globalQAParameter.findMany({
        select: {
            id: true,
            name: true,
            industry: true,
            organizationId: true,
            isActive: true
        },
        orderBy: { industry: 'asc' }
    });
    
    console.log(`Total parameters: ${allParams.length}\n`);
    console.log('All parameters:');
    allParams.forEach(p => {
        console.log(`  ID: ${p.id}, Name: ${p.name}, Industry: ${p.industry}, OrgId: ${p.organizationId}, Active: ${p.isActive}`);
    });
    
    // Get Healthcare parameters
    const healthcareParams = await db.globalQAParameter.findMany({
        where: {
            industry: 'Healthcare',
            isActive: true
        },
        select: {
            id: true,
            name: true,
            industry: true,
            organizationId: true,
            isActive: true
        }
    });
    
    console.log(`\n=== Healthcare Parameters (Active) ===`);
    console.log(`Count: ${healthcareParams.length}`);
    healthcareParams.forEach(p => {
        console.log(`  ID: ${p.id}, Name: ${p.name}, OrgId: ${p.organizationId}, Active: ${p.isActive}`);
    });
    
    // Get Global Healthcare parameters (organizationId = null)
    const globalHealthcareParams = await db.globalQAParameter.findMany({
        where: {
            industry: 'Healthcare',
            organizationId: null,
            isActive: true
        },
        select: {
            id: true,
            name: true,
            industry: true,
            organizationId: true,
            isActive: true
        }
    });
    
    console.log(`\n=== Global Healthcare Parameters (OrgId = null, Active) ===`);
    console.log(`Count: ${globalHealthcareParams.length}`);
    globalHealthcareParams.forEach(p => {
        console.log(`  ID: ${p.id}, Name: ${p.name}, OrgId: ${p.organizationId}, Active: ${p.isActive}`);
    });
    
    // Test the query that the API uses
    const testOrgId = 1; // Example organization ID
    const testIndustry = 'Healthcare';
    
    const testQuery = {
        AND: [
            { isActive: true },
            {
                OR: [
                    { organizationId: testOrgId, industry: testIndustry },
                    { organizationId: null, industry: testIndustry }
                ]
            }
        ]
    };
    
    console.log(`\n=== Testing Query for OrgId=${testOrgId}, Industry=${testIndustry} ===`);
    console.log('Query:', JSON.stringify(testQuery, null, 2));
    
    const testResults = await db.globalQAParameter.findMany({
        where: testQuery
    });
    
    console.log(`Results: ${testResults.length}`);
    testResults.forEach(p => {
        console.log(`  ID: ${p.id}, Name: ${p.name}, OrgId: ${p.organizationId}`);
    });
    
    await db.$disconnect();
}

checkQAParameters().catch(console.error);

