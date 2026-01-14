import axios from 'axios';
import authService from './authService';

const API_URL = 'https://mariage-hall-booking-system.vercel.app/api/commissions/';

const uploadPaymentProof = async (paymentId, formData) => {
    const response = await axios.post(API_URL + 'upload-proof/' + paymentId, formData, {
        headers: {
            ...authService.authHeader(),
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

const getManagerPayments = async () => {
    const response = await axios.get(API_URL + 'my-payments', {
        headers: authService.authHeader()
    });
    return response.data;
};

const getPendingPayments = async () => {
    const response = await axios.get(API_URL + 'pending', {
        headers: authService.authHeader()
    });
    return response.data;
};

const verifyPayment = async (id) => {
    const response = await axios.put(API_URL + 'verify/' + id, {}, {
        headers: authService.authHeader()
    });
    return response.data;
};

const rejectPayment = async (id, reason) => {
    const response = await axios.put(API_URL + 'reject/' + id, { reason }, {
        headers: authService.authHeader()
    });
    return response.data;
};

const commissionService = {
    uploadPaymentProof,
    getManagerPayments,
    getPendingPayments,
    verifyPayment,
    rejectPayment
};

export default commissionService;
