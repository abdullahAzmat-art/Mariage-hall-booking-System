import api from '../api/axios';

const hallService = {
    getAllHalls: async () => {
        const response = await api.get('/halls');
        return response.data;
    },

    getManagerHalls: async () => {
        const response = await api.get('/halls/manager');
        return response.data;
    },

    getHallById: async (id) => {
        const response = await api.get(`/halls/${id}`);
        return response.data;
    },

    createHall: async (hallData) => {
        const response = await api.post('/halls', hallData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    updateHall: async (id, hallData) => {
        const isFormData = hallData instanceof FormData;
        const config = isFormData ? {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        } : {};
        
        const response = await api.put(`/halls/${id}`, hallData, config);
        return response.data;
    },

    deleteHall: async (id) => {
        const response = await api.delete(`/halls/${id}`);
        return response.data;
    }
};

export default hallService;
