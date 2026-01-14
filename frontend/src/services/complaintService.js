import axios from 'axios';
import authService from './authService';

const API_URL = 'http://localhost:5000/api/complaints/';

const createComplaint = async (complaintData) => {
    const response = await axios.post(API_URL, complaintData, {
        headers: authService.authHeader()
    });
    return response.data;
};

const getMyComplaints = async () => {
    const response = await axios.get(API_URL + 'my', {
        headers: authService.authHeader()
    });
    return response.data;
};

const getAllComplaints = async () => {
    const response = await axios.get(API_URL, {
        headers: authService.authHeader()
    });
    return response.data;
};

const replyToComplaint = async (id, reply) => {
    const response = await axios.put(API_URL + id + '/reply', { reply }, {
        headers: authService.authHeader()
    });
    return response.data;
};

const deleteComplaint = async (id) => {
    const response = await axios.delete(API_URL + id, {
        headers: authService.authHeader()
    });
    return response.data;
};

const complaintService = {
    createComplaint,
    getMyComplaints,
    getAllComplaints,
    replyToComplaint,
    deleteComplaint
};

export default complaintService;
