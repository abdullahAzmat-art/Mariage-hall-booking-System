import api from '../api/axios';

const userService = {
    applyForManager: async (applicationData) => {
        const response = await api.post('/users/apply-manager', applicationData);
        // Update local user data if successful
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (user) {
            user.managerApplication = response.data.managerApplication;
            sessionStorage.setItem('user', JSON.stringify(user));
        }
        return response.data;
    },

    getManagerApplications: async () => {
        const response = await api.get('/users/manager-applications');
        return response.data;
    },

    updateManagerApplicationStatus: async (userId, status) => {
        const response = await api.put(`/users/manager-application/${userId}`, { status });
        return response.data;
    },

    getUsers: async () => {
        const response = await api.get('/users');
        return response.data;
    },

    deleteUser: async (id) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    }
};

export default userService;
