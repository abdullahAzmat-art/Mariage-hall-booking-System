const Complaint = require('../models/complaintModel');

// Create a new complaint
const createComplaint = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        const complaint = new Complaint({
            user: req.user ? req.user._id : null,
            name,
            email,
            subject,
            message
        });
        await complaint.save();
        res.status(201).json(complaint);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get complaints for logged-in user
const getMyComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get all complaints (Admin only)
const getAllComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find().sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Reply to a complaint (Admin only)
const replyToComplaint = async (req, res) => {
    try {
        const { reply } = req.body;
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        complaint.adminReply = reply;
        complaint.status = 'resolved';
        await complaint.save();

        res.json(complaint);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Delete a complaint (User can only delete their own)
const deleteComplaint = async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        // Check if user owns this complaint
        if (complaint.user && complaint.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this complaint' });
        }

        await Complaint.findByIdAndDelete(req.params.id);
        res.json({ message: 'Complaint deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createComplaint,
    getMyComplaints,
    getAllComplaints,
    replyToComplaint,
    deleteComplaint
};
