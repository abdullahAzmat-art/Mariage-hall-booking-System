const fs = require('fs');
const path = require('path');
const os = require('os');
const { QdrantClient } = require('@qdrant/js-client-rest');
const { PDFLoader } = require('@langchain/community/document_loaders/fs/pdf');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const { OpenAIEmbeddings } = require('@langchain/openai');
const mammoth = require('mammoth');
const crypto = require('crypto');
const RagDocument = require('../models/ragDocumentModel');

// ── Qdrant client ────────────────────────────────────────────────────────────
const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
    checkCompatibility: false,
});

const COLLECTION_NAME = 'venuora_knowledge';
const EMBEDDING_MODEL = 'openai/text-embedding-3-small';
const VECTOR_SIZE = 1536; // text-embedding-3-small dimension

// ── LangChain Embeddings client (OpenRouter) ─────────────────────────────────
const embeddings = new OpenAIEmbeddings({
    model: EMBEDDING_MODEL,
    apiKey: process.env.OPENROUTER_API_KEY,
    configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
    },
});

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract plain text from the uploaded file buffer based on mimetype.
 * Uses LangChain's PDFLoader for PDFs as requested.
 */
async function extractText(buffer, mimetype, originalname) {
    if (mimetype === 'text/plain') {
        return buffer.toString('utf-8');
    }

    if (mimetype === 'application/pdf') {
        // PDFLoader accepts a file path or Blob; writing temporarily to OS temp folder
        const tempFilePath = path.join(os.tmpdir(), `upload_${Date.now()}_${originalname}`);
        try {
            await fs.promises.writeFile(tempFilePath, buffer);
            const loader = new PDFLoader(tempFilePath);
            const docs = await loader.load();
            return docs.map((doc) => doc.pageContent).join('\n\n');
        } finally {
            if (fs.existsSync(tempFilePath)) {
                await fs.promises.unlink(tempFilePath).catch(() => {});
            }
        }
    }

    if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    }

    throw new Error('Unsupported file type');
}

/**
 * Split text into overlapping chunks using LangChain's RecursiveCharacterTextSplitter.
 */
async function chunkText(text, chunkSize = 500, chunkOverlap = 50) {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize,
        chunkOverlap,
    });

    const splitDocs = await splitter.createDocuments([text]);
    return splitDocs.map((doc) => doc.pageContent).filter((chunk) => chunk.trim().length > 20);
}

/**
 * Ensure the Qdrant collection exists and proper payload indexes are set; create if not.
 */
async function ensureCollection() {
    try {
        await qdrant.getCollection(COLLECTION_NAME);
    } catch {
        await qdrant.createCollection(COLLECTION_NAME, {
            vectors: {
                size: VECTOR_SIZE,
                distance: 'Cosine',
            },
        });
        console.log(`✅ Created Qdrant collection: ${COLLECTION_NAME}`);
    }

    try {
        await qdrant.createPayloadIndex(COLLECTION_NAME, {
            field_name: 'documentId',
            field_schema: 'keyword',
        });
    } catch {
        // Index already exists or handled
    }
}

// ── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/rag/upload
 * Pipeline: parse (PDFLoader) → chunk (RecursiveCharacterTextSplitter) → embed (embedDocuments) → upsert into Qdrant → save MongoDB record
 */
const uploadDocument = async (req, res) => {
    let docRecord = null;
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { buffer, mimetype, originalname } = req.file;

        // 1. Extract text using LangChain PDFLoader for PDF
        const rawText = await extractText(buffer, mimetype, originalname);
        if (!rawText || rawText.trim().length < 10) {
            return res.status(400).json({ message: 'Could not extract any text from the file' });
        }

        // 2. Chunk using LangChain RecursiveCharacterTextSplitter
        const chunks = await chunkText(rawText, 500, 50);
        if (chunks.length === 0) {
            return res.status(400).json({ message: 'No text chunks could be generated' });
        }

        // 3. Ensure Qdrant collection and payload index exist
        await ensureCollection();

        // 4. Create MongoDB record
        const fileTypeMap = {
            'application/pdf': 'pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
            'text/plain': 'txt',
        };

        docRecord = await RagDocument.create({
            name: originalname.replace(/\.[^/.]+$/, ''),
            originalName: originalname,
            fileType: fileTypeMap[mimetype] || 'txt',
            chunkCount: chunks.length,
            collectionName: COLLECTION_NAME,
            uploadedBy: req.user._id,
        });

        // 5. Generate embeddings for all chunks via LangChain embedDocuments()
        const vectors = await embeddings.embedDocuments(chunks);

        // 6. Map embeddings to Qdrant points and upsert in batches
        const BATCH_SIZE = 10;
        const points = [];

        for (let i = 0; i < chunks.length; i++) {
            points.push({
                id: crypto.randomUUID(),
                vector: vectors[i],
                payload: {
                    documentId: docRecord._id.toString(),
                    documentName: docRecord.name,
                    chunkIndex: i,
                    text: chunks[i],
                },
            });

            if (points.length === BATCH_SIZE || i === chunks.length - 1) {
                await qdrant.upsert(COLLECTION_NAME, { points });
                points.length = 0;
            }
        }

        res.status(201).json({
            message: 'Document uploaded and indexed successfully',
            document: {
                _id: docRecord._id,
                name: docRecord.name,
                originalName: docRecord.originalName,
                fileType: docRecord.fileType,
                chunkCount: docRecord.chunkCount,
                uploadedAt: docRecord.uploadedAt,
            },
        });
    } catch (error) {
        if (docRecord?._id) {
            await RagDocument.findByIdAndDelete(docRecord._id).catch(() => {});
        }
        const errorDetail = error.data?.status?.error || error.response?.data?.message || error.message;
        console.error('RAG upload error:', errorDetail, error.data || error.response?.data || '');
        res.status(500).json({ message: 'Failed to process document', error: errorDetail });
    }
};

/**
 * GET /api/rag/documents
 */
const getDocuments = async (req, res) => {
    try {
        const documents = await RagDocument.find()
            .sort({ uploadedAt: -1 })
            .populate('uploadedBy', 'name email');
        res.json(documents);
    } catch (error) {
        console.error('RAG get docs error:', error.message);
        res.status(500).json({ message: 'Failed to fetch documents' });
    }
};

/**
 * DELETE /api/rag/documents/:id
 */
const deleteDocument = async (req, res) => {
    try {
        const doc = await RagDocument.findById(req.params.id);
        if (!doc) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Delete vectors from Qdrant by payload filter
        await qdrant.delete(COLLECTION_NAME, {
            filter: {
                must: [
                    {
                        key: 'documentId',
                        match: { value: doc._id.toString() },
                    },
                ],
            },
        });

        await RagDocument.findByIdAndDelete(req.params.id);

        res.json({ message: 'Document and its vectors deleted successfully' });
    } catch (error) {
        console.error('RAG delete error:', error.message);
        res.status(500).json({ message: 'Failed to delete document', error: error.message });
    }
};

module.exports = { uploadDocument, getDocuments, deleteDocument };
