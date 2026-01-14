import api from '../api/axios';

const packageService = {
    getPackagesByHallId: async (hallId) => {
        const response = await api.get(`/packages/${hallId}`);
        return response.data;
    },

    getPackageById: async (id) => {
        const response = await api.get(`/packages/${id}`);
        return response.data;
    },

    createPackage: async (packageData) => {
        const response = await api.post('/packages', packageData);
        return response.data;
    },

    updatePackage: async (id, packageData) => {
        const response = await api.put(`/packages/${id}`, packageData);
        return response.data;
    },

    deletePackage: async (id) => {
        const response = await api.delete(`/packages/${id}`);
        return response.data;
    }
};

export default packageService;
