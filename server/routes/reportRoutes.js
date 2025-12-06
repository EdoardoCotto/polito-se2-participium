"use strict"

const express = require('express');
const router = express.Router();
const reportController = require('../controller/reportController')
const uploadMiddleware = require('../middlewares/uploadMiddleware.js');
const { isLoggedIn, isAdmin, isMunicipal_public_relations_officer, isTechnicalOfficeStaff } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /reports:
 *   post:
 *     summary: Add one new report (with photos upload)
 *     tags: [Reports]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [latitude, longitude, title, description, category, photos, anonymous]
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: 45.062394
 *               longitude:
 *                 type: number
 *                 example: 7.662697
 *               title:
 *                 type: string
 *                 example: "Pothole in via Garibaldi"
 *               description:
 *                 type: string
 *                 example: "Large pothole causing danger for cyclists"
 *               category:
 *                 type: string
 *                 enum:
 *                   - Water Supply – Drinking Water
 *                   - Architectural Barriers
 *                   - Sewer System
 *                   - Public Lighting
 *                   - Waste
 *                   - Road Signs and Traffic Lights
 *                   - Roads and Urban Furnishings
 *                   - Public Green Areas and Playgrounds
 *                   - Other
 *               photos:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 3
 *                 description: "Attach 1–3 images using the same key 'photos'."
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Report created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/reports', isLoggedIn, uploadMiddleware, reportController.createReport);

/**
 * @swagger
 * /reports/anonymous:
 *   post:
 *     summary: Add one new anonymous report (with photos upload)
 *     description: Create a report without userId.
 *     tags: [Reports]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [latitude, longitude, title, description, category, photos]
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: 45.062394
 *               longitude:
 *                 type: number
 *                 example: 7.662697
 *               title:
 *                 type: string
 *                 example: "Pothole in via Garibaldi"
 *               description:
 *                 type: string
 *                 example: "Large pothole causing danger for cyclists"
 *               category:
 *                 type: string
 *                 enum:
 *                   - Water Supply – Drinking Water
 *                   - Architectural Barriers
 *                   - Sewer System
 *                   - Public Lighting
 *                   - Waste
 *                   - Road Signs and Traffic Lights
 *                   - Roads and Urban Furnishings
 *                   - Public Green Areas and Playgrounds
 *                   - Other
 *               photos:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 3
 *                 description: "Attach 1–3 images using the same key 'photos'."
 *                 items:
 *                   type: string
 *                   format: binary
 *               anonymous:
 *                 type: boolean
 *                 example: true
 *                 description: Must be true for anonymous reports
 *     responses:
 *       201:
 *         description: Anonymous report created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/reports/anonymous',isLoggedIn, uploadMiddleware, reportController.createReport);

/**
 * @swagger
 * /reports/pending:
 *   get:
 *     summary: List all pending reports for review
 *     description: Returns all reports with status "pending" that must be reviewed by a municipal public relations officer / admin.
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: List of pending reports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Report'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden (user is not allowed to review reports)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/reports/pending', isLoggedIn, isMunicipal_public_relations_officer, reportController.getPendingReports);

/**
 * @swagger
 * /reports/approved:
 *   get:
 *     summary: Get approved reports for the public map
 *     description: >
 *       Returns all reports with status "accepted". Optional bounding box parameters
 *       (`north`, `south`, `east`, `west`) can be provided to limit the results to
 *       the visible map area.
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: north
 *         schema:
 *           type: number
 *         description: Northern latitude of the bounding box
 *       - in: query
 *         name: south
 *         schema:
 *           type: number
 *         description: Southern latitude of the bounding box
 *       - in: query
 *         name: east
 *         schema:
 *           type: number
 *         description: Eastern longitude of the bounding box
 *       - in: query
 *         name: west
 *         schema:
 *           type: number
 *         description: Western longitude of the bounding box
 *     responses:
 *       200:
 *         description: List of approved reports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Report'
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/reports/approved', reportController.getApprovedReports);
/**
 * @swagger
 * /reports/citizen:
 *   get:
 *     summary: Get reports visible to citizens
 *     description: Returns a list of reports (excluding pending and rejected) for citizens.
 *     tags: [Reports]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: north
 *         schema:
 *           type: number
 *         description: Northern latitude
 *       - in: query
 *         name: south
 *         schema:
 *           type: number
 *         description: Southern latitude
 *       - in: query
 *         name: east
 *         schema:
 *           type: number
 *         description: Eastern longitude
 *       - in: query
 *         name: west
 *         schema:
 *           type: number
 *         description: Western longitude
 *     responses:
 *       200:
 *         description: List of reports found
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Report'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/reports/citizen', isLoggedIn, reportController.getCitizenReports);
/**
 * @swagger
 * /reports/assigned:
 *   get:
 *     summary: Get reports assigned to the logged-in technical office staff member
 *     description: >
 *       Returns all reports assigned the authenticated user.
 *       Only technical office staff members can access this endpoint.
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: List of assigned reports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Report'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden (user is not a technical office staff member)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/reports/assigned', isLoggedIn, isTechnicalOfficeStaff, reportController.getAssignedReports);

/**
 * @swagger
 * /reports/{id}:
 *   get:
 *     summary: Get a single report by ID
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report identifier
 *     responses:
 *       200:
 *         description: Report details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       400:
 *         description: Invalid report id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Report not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/reports/:id', isLoggedIn, reportController.getReportById);



/**
 * @swagger
 * /reports/{id}/review:
 *   put:
 *     summary: Review (accept or reject) a report
 *     description: >
 *       Allows a municipal public relations officer (or admin) to approve or reject a report.
 *       - If `status` is `"accepted"`, a valid `technicalOffice` must be provided.
 *       - If `status` is `"rejected"`, an `explanation` must be provided.
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, rejected]
 *                 example: accepted
 *               explanation:
 *                 type: string
 *                 description: Required when status is "rejected".
 *                 example: "The issue has already been resolved."
 *               technicalOffice:
 *                 type: string
 *                 description: >
 *                   Required when status is "accepted". Must be one of the allowed technical officer roles
 *                   (e.g. 'urban_planner', 'public_works_engineer', 'environment_technician', ...).
 *                 enum:
 *                   - urban_planner
 *                   - building_permit_officer
 *                   - building_inspector
 *                   - suap_officer
 *                   - public_works_engineer
 *                   - mobility_traffic_engineer
 *                   - environment_technician
 *                 example: public_works_engineer
 *     responses:
 *       200:
 *         description: Report successfully reviewed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       400:
 *         description: Validation error (invalid status, missing explanation/technicalOffice, invalid id, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden (user is not allowed to review reports)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Report not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/reports/:id/review', isLoggedIn, isMunicipal_public_relations_officer, reportController.reviewReport);

/**
 * @swagger
 * /reports/{id}/assign-external:
 *   put:
 *     summary: Assign a report to an external maintainer
 *     description: >
 *       Allows a technical office staff member to assign a report that is assigned to them
 *       to an external maintainer. The report must be in "assigned" status and assigned to
 *       the requesting technical office staff member.
 *     tags: [Reports]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - externalMaintainerId
 *             properties:
 *               externalMaintainerId:
 *                 type: integer
 *                 description: ID of the external maintainer to assign the report to
 *                 example: 5
 *     responses:
 *       200:
 *         description: Report successfully assigned to external maintainer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       400:
 *         description: Bad request (invalid report ID, missing external maintainer ID, or report not in assigned status)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden (user is not a technical office staff member or report not assigned to them)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Report or external maintainer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/reports/:id/assign-external', isLoggedIn, isTechnicalOfficeStaff, reportController.assignReportToExternalMaintainer);

module.exports = router;
