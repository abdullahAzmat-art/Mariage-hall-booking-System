import api from '../api/axios';

const bookingService = {
    createBooking: async (bookingData) => {
        const response = await api.post('/bookings', bookingData);
        return response.data;
    },

    getUserBookings: async () => {
        const response = await api.get('/bookings/my');
        return response.data;
    },

    getAllBookings: async () => {
        const response = await api.get('/bookings');
        return response.data;
    },

    getManagerBookings: async () => {
        const response = await api.get('/bookings/manager');
        return response.data;
    },

    updateBookingStatus: async (id, status) => {
        const response = await api.put(`/bookings/${id}/status`, { status });
        return response.data;
    },

    deleteBooking: async (id) => {
        const response = await api.delete(`/bookings/${id}`);
        return response.data;
    },

    submitPaymentProof: async (id, transactionId, paymentProofFile) => {
        const formData = new FormData();
        formData.append('transactionId', transactionId);
        formData.append('paymentProof', paymentProofFile);
        
        const response = await api.put(`/bookings/${id}/payment-proof`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    verifyPayment: async (id) => {
        const response = await api.put(`/bookings/${id}/verify-payment`);
        return response.data;
    },

    rejectPayment: async (id, reason) => {
        const response = await api.put(`/bookings/${id}/reject-payment`, { reason });
        return response.data;
    },

    addCustomFood: async (id, customFood) => {
        const response = await api.post(`/bookings/${id}/custom-food`, { customFood });
        return response.data;
    },

    updateCustomFoodStatus: async (id, status) => {
        const response = await api.patch(`/bookings/${id}/custom-food-status`, { status });
        return response.data;
    }
};

export default bookingService;
