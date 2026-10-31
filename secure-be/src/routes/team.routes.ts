import { Router } from 'express';
import * as teamService from '../services/team.service';
import logger from '../utils/logger';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { filterByOrganization } from '../middlewares/organization.middleware';

const router = Router();

// All routes require authentication and organization filtering
router.use(authenticateJWT);
router.use(filterByOrganization);

/**
 * @swagger
 * /api/teams:
 *   get:
 *     summary: Get all teams for the user's organization
 *     description: Returns all teams. Super Admin sees all teams, regular users see only their organization's teams.
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of teams
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   organizationId:
 *                     type: integer
 *                     nullable: true
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                   _count:
 *                     type: object
 *                     properties:
 *                       users:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', async (req, res) => {
    try {
        const organizationId = (req as any).organizationId;
        const teams = await teamService.getAllTeams(organizationId);
        res.json(teams);
    } catch (error: any) {
        logger.error('Error fetching teams', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/teams/{id}:
 *   get:
 *     summary: Get team by ID
 *     description: Returns a specific team with its members
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       email:
 *                         type: string
 *                       name:
 *                         type: string
 *                       role:
 *                         type: object
 *       404:
 *         description: Team not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req, res) => {
    try {
        const team = await teamService.getTeamById(Number.parseInt(req.params.id));
        if (!team) return res.status(404).json({ error: 'Team not found' });
        res.json(team);
    } catch (error: any) {
        logger.error('Error fetching team', { error: error.message, id: req.params.id });
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/teams:
 *   post:
 *     summary: Create a new team
 *     description: Creates a new team associated with the user's organization
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Sales Team Alpha
 *     responses:
 *       201:
 *         description: Team created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 organizationId:
 *                   type: integer
 *                   nullable: true
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;
        const organizationId = (req as any).organizationId;
        const result = await teamService.createTeam(name, organizationId);
        logger.info('Team created', { id: result.id, name, organizationId });
        res.status(201).json(result);
    } catch (error: any) {
        logger.error('Error creating team', { error: error.message });
        res.status(400).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/teams/{id}:
 *   put:
 *     summary: Update team name
 *     description: Updates the name of an existing team
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Team Name
 *     responses:
 *       200:
 *         description: Team updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Team not found
 */
router.put('/:id', async (req, res) => {
    try {
        const { name } = req.body;
        const result = await teamService.updateTeam(Number.parseInt(req.params.id), name);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/teams/{id}:
 *   delete:
 *     summary: Delete a team
 *     description: Deletes a team by ID
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *     responses:
 *       204:
 *         description: Team deleted successfully
 *       400:
 *         description: Bad request (team may have members)
 *       404:
 *         description: Team not found
 */
router.delete('/:id', async (req, res) => {
    try {
        await teamService.deleteTeam(Number.parseInt(req.params.id));
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/teams/agents/all:
 *   get:
 *     summary: Get all agents
 *     description: Returns all agents in the user's organization. Super Admin sees all agents.
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of agents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   email:
 *                     type: string
 *                   name:
 *                     type: string
 *                   role:
 *                     type: object
 *                   team:
 *                     type: object
 *                     nullable: true
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/agents/all', async (req, res) => {
    try {
        const organizationId = (req as any).organizationId;
        const agents = await teamService.getAllAgents(organizationId);
        res.json(agents);
    } catch (error: any) {
        logger.error('Error fetching all agents', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});


/**
 * @swagger
 * /api/teams/{id}/agents:
 *   post:
 *     summary: Create an agent in a team
 *     description: Creates a new agent user and assigns them to the specified team
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: agent@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePassword123!
 *               name:
 *                 type: string
 *                 example: John Agent
 *     responses:
 *       201:
 *         description: Agent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *                 role:
 *                   type: object
 *       400:
 *         description: Bad request
 *       404:
 *         description: Team not found
 */
router.post('/:id/agents', async (req, res) => {
    try {
        const teamId = Number.parseInt(req.params.id);
        const { email, password, name } = req.body;
        const organizationId = (req as any).organizationId;
        const result = await teamService.createAgentInTeam(teamId, { email, password, name, organizationId });
        const { password: _, ...userWithoutPassword } = result;
        res.status(201).json(userWithoutPassword);
    } catch (error: any) {
        logger.error('Error creating agent', { error: error.message, teamId: req.params.id });
        res.status(400).json({ error: error.message });
    }
});

export default router;
