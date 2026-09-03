const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadDocument, getDocuments, deleteDocument } = require('../controllers/ragController');

// Use memory storage — we process the buffer directly, no disk needed
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
    fileFilter: (_req, file, cb) => {
        const allowed = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
        ];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, DOCX, and TXT files are allowed'));
        }
    },
});

router.post('/upload', protect, authorize('admin'), upload.single('document'), uploadDocument);
router.get('/documents', protect, authorize('admin'), getDocuments);
router.delete('/documents/:id', protect, authorize('admin'), deleteDocument);

module.exports = router;
