const mongoose = require('mongoose');

const ragDocumentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    originalName: {
        type: String,
        required: true,
    },
    fileType: {
        type: String,
        enum: ['pdf', 'docx', 'txt'],
        required: true,
    },
    chunkCount: {
        type: Number,
        default: 0,
    },
    collectionName: {
        type: String,
        default: 'venuora_knowledge',
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    uploadedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('RagDocument', ragDocumentSchema);
