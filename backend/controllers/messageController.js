const messageController = async (req, res) => {
    try {
        const { userId, managerId } = req.params;
        const messages = await messageModel.find({
            $or: [
                { fromUserId: userId, toUserId: managerId },
                { fromUserId: managerId, toUserId: userId }
            ]
        }).sort({ timestamp: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
module.exports = messageController;