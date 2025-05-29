const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/sync', authMiddleware, contactController.syncContacts);
router.get('/', authMiddleware, contactController.getContacts);

module.exports = router;