import api from '../api/axios';

const authService = {
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        if (response.data.token) {
            sessionStorage.setItem('token', response.data.token);
            sessionStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    login: async (userData) => {
        const response = await api.post('/auth/login', userData);
        if (response.data.token) {
            sessionStorage.setItem('token', response.data.token);
            sessionStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    logout: () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
    },

    getCurrentUser: () => {
        return JSON.parse(sessionStorage.getItem('user'));
    },

    authHeader: () => {
        const token = sessionStorage.getItem('token');
        if (token) {
            return { Authorization: 'Bearer ' + token };
        } else {
            return {};
        }
    }
};

export default authService;
