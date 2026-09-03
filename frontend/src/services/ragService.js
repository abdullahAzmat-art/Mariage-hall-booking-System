import api from '../api/axios';

const ragService = {
    /**
     * Upload a document file for RAG indexing.
     * @param {File} file - The file object from the input element
     * @param {function} onProgress - Optional progress callback (0–100)
     */
    uploadDocument: async (file, onProgress) => {
        const formData = new FormData();
        formData.append('document', file);

        const response = await api.post('/rag/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(pct);
                }
            },
        });
        return response.data;
    },

    /**
     * Fetch all indexed documents.
     */
    getDocuments: async () => {
        const response = await api.get('/rag/documents');
        return response.data;
    },

    /**
     * Delete a document and its vectors from Qdrant.
     * @param {string} id - MongoDB document ID
     */
    deleteDocument: async (id) => {
        const response = await api.delete(`/rag/documents/${id}`);
        return response.data;
    },
};

export default ragService;
