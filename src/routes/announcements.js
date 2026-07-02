const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { successResponse, errorResponse } = require('../utils/helpers');
const announcementService = require('../services/announcementService');
const { protectAdmin } = require('../middlewares/auth');

// Admin: list all (published + drafts)
router.get('/', protectAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await announcementService.getAll(req.tenant.id, Number(page), Number(limit));
    return successResponse(res, result, 'Announcements retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
});

// Admin: create (optional image upload to Wasabi)
router.post('/', protectAdmin, upload.single('image'), async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) return errorResponse(res, 'title and body are required', 400);
    const imageUrl = req.file?.location || null;
    const result = await announcementService.create(req.tenant.id, { title, body, imageUrl });
    return successResponse(res, result, 'Announcement created successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
});

// Admin: update (unpublished only)
router.put('/:id', protectAdmin, upload.single('image'), async (req, res) => {
  try {
    const { title, body } = req.body;
    const imageUrl = req.file?.location;
    const result = await announcementService.update(req.params.id, req.tenant.id, { title, body, imageUrl });
    return successResponse(res, result, 'Announcement updated successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
});

// Admin: delete
router.delete('/:id', protectAdmin, async (req, res) => {
  try {
    await announcementService.delete(req.params.id, req.tenant.id);
    return successResponse(res, null, 'Announcement deleted successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
});

// Admin: publish + send FCM (optional targeted recipients)
router.post('/:id/publish', protectAdmin, async (req, res) => {
  try {
    const { userIds, captainIds } = req.body;
    const result = await announcementService.publish(req.params.id, req.tenant.id, { userIds, captainIds });
    return successResponse(res, result, 'Announcement published and notifications sent');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
});

// Public: list published only (for user & captain apps)
router.get('/public', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await announcementService.getPublished(req.tenant.id, Number(page), Number(limit));
    return successResponse(res, result, 'Announcements retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
});

module.exports = router;
