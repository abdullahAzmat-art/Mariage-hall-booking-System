import React, { useState, useEffect, useRef } from 'react';
import { 
    FaUsers, FaMoneyBillWave, FaUserTie, FaTrash, FaBuilding, 
    FaEnvelope, FaReply, FaMapMarkerAlt, FaCheckCircle, FaTimesCircle,
    FaClock, FaShieldAlt, FaStore, FaDatabase, FaFileAlt,
    FaFilePdf, FaFileWord, FaCloudUploadAlt, FaSpinner
} from 'react-icons/fa';
import userService from '../services/userService';
import hallService from '../services/hallService';
import commissionService from '../services/commissionService';
import ragService from '../services/ragService';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('users');
    const [applications, setApplications] = useState([]);
    const [users, setUsers] = useState([]);
    const [halls, setHalls] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [replyText, setReplyText] = useState({});
    const [payments, setPayments] = useState([]);
    const [rejectionReasons, setRejectionReasons] = useState({});

    // Knowledge Base state
    const [knowledgeDocs, setKnowledgeDocs] = useState([]);
    const [uploadStatus, setUploadStatus] = useState('idle'); // idle | uploading | success | error
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadMessage, setUploadMessage] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (activeTab === 'applications') fetchApplications();
        else if (activeTab === 'users') fetchUsers();
        else if (activeTab === 'halls') fetchHalls();
        else if (activeTab === 'complaints') fetchComplaints();
        else if (activeTab === 'commissions') fetchPayments();
        else if (activeTab === 'knowledgeBase') fetchKnowledgeDocs();
    }, [activeTab]);

    const fetchApplications = async () => {
        try { const data = await userService.getManagerApplications(); setApplications(data); }
        catch (error) { console.error('Failed to fetch applications', error); }
    };
    const fetchUsers = async () => {
        try { const data = await userService.getUsers(); setUsers(data); }
        catch (error) { console.error('Failed to fetch users', error); }
    };
    const fetchHalls = async () => {
        try { const data = await hallService.getAllHalls(); setHalls(data); }
        catch (error) { console.error('Failed to fetch halls', error); }
    };
    const fetchPayments = async () => {
        try { const data = await commissionService.getPendingPayments(); setPayments(data); }
        catch (error) { console.error('Failed to fetch payments', error); }
    };
    const handleVerifyPayment = async (paymentId) => {
        if (window.confirm('Verify this payment?')) {
            try { await commissionService.verifyPayment(paymentId); alert('Payment verified'); fetchPayments(); }
            catch { alert('Failed to verify payment'); }
        }
    };
    const handleRejectPayment = async (paymentId) => {
        const reason = rejectionReasons[paymentId];
        if (!reason) { alert('Please provide a rejection reason'); return; }
        if (window.confirm('Reject this payment?')) {
            try { await commissionService.rejectPayment(paymentId, reason); alert('Payment rejected'); fetchPayments(); setRejectionReasons({ ...rejectionReasons, [paymentId]: '' }); }
            catch { alert('Failed to reject payment'); }
        }
    };
    const fetchComplaints = async () => {
        try { const complaintService = (await import('../services/complaintService')).default; const data = await complaintService.getAllComplaints(); setComplaints(data); }
        catch (error) { console.error('Failed to fetch complaints', error); }
    };
    const handleReply = async (complaintId) => {
        try { const complaintService = (await import('../services/complaintService')).default; await complaintService.replyToComplaint(complaintId, replyText[complaintId]); alert('Reply sent'); fetchComplaints(); setReplyText({ ...replyText, [complaintId]: '' }); }
        catch { alert('Failed to send reply'); }
    };
    const handleStatusUpdate = async (userId, status) => {
        try { await userService.updateManagerApplicationStatus(userId, status); fetchApplications(); alert(`Application ${status}`); }
        catch { alert('Failed to update status'); }
    };
    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try { await userService.deleteUser(userId); setUsers(users.filter(u => u._id !== userId)); alert('User deleted'); }
            catch { alert('Failed to delete user'); }
        }
    };
    const handleDeleteHall = async (hallId) => {
        if (window.confirm('Are you sure you want to delete this hall? This action cannot be undone.')) {
            try { await hallService.deleteHall(hallId); setHalls(halls.filter(h => h._id !== hallId)); alert('Hall deleted'); }
            catch { alert('Failed to delete hall'); }
        }
    };

    // ── Knowledge Base handlers ──────────────────────────────────────────────
    const fetchKnowledgeDocs = async () => {
        try { const data = await ragService.getDocuments(); setKnowledgeDocs(data); }
        catch (error) { console.error('Failed to fetch knowledge docs', error); }
    };

    const handleFileUpload = async (file) => {
        if (!file) return;
        const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        if (!allowed.includes(file.type)) {
            setUploadStatus('error');
            setUploadMessage('Only PDF, DOCX, or TXT files are allowed.');
            return;
        }
        setUploadStatus('uploading');
        setUploadProgress(0);
        setUploadMessage('');
        try {
            const result = await ragService.uploadDocument(file, (pct) => setUploadProgress(pct));
            setUploadStatus('success');
            setUploadMessage(`✅ "${result.document.originalName}" indexed — ${result.document.chunkCount} chunks stored in Qdrant`);
            fetchKnowledgeDocs();
            setTimeout(() => { setUploadStatus('idle'); setUploadProgress(0); setUploadMessage(''); }, 5000);
        } catch (err) {
            setUploadStatus('error');
            setUploadMessage(err?.response?.data?.message || 'Upload failed. Please try again.');
        }
    };

    const handleDropZoneDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    };

    const handleDeleteKnowledgeDoc = async (docId) => {
        if (!window.confirm('Delete this document and remove all its vectors from Qdrant?')) return;
        try {
            await ragService.deleteDocument(docId);
            setKnowledgeDocs(knowledgeDocs.filter(d => d._id !== docId));
        } catch { alert('Failed to delete document'); }
    };

    const fileTypeIcon = (type) => {
        if (type === 'pdf') return <FaFilePdf className="text-red-500" />;
        if (type === 'docx') return <FaFileWord className="text-blue-500" />;
        return <FaFileAlt className="text-gray-500" />;
    };
    // ─────────────────────────────────────────────────────────────────────────

    const getInitials = (name) => (name || 'U')[0].toUpperCase();
    const roleBadge = (role) => {
        if (role === 'admin') return 'bg-navy text-white';
        if (role === 'manager') return 'bg-terracotta text-white';
        return 'bg-gray-100 text-gray-600';
    };

    const tabs = [
        { id: 'users', label: 'Users', icon: FaUsers },
        { id: 'applications', label: 'Applications', icon: FaUserTie, badge: applications.length },
        { id: 'halls', label: 'Venue Supervision', icon: FaBuilding },
        { id: 'complaints', label: 'Complaints', icon: FaEnvelope },
        { id: 'commissions', label: 'Commissions', icon: FaMoneyBillWave },
        { id: 'knowledgeBase', label: 'Knowledge Base', icon: FaDatabase },
    ];

    const thCls = "px-4 py-3 text-xs font-bold uppercase tracking-wider text-left";
    const tdCls = "px-4 py-4 text-sm";
    const inputCls = "w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-navy text-sm font-medium focus:bg-white focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 transition-all placeholder-gray-400";

    return (
        <div className="space-y-6">
            {/* ── Stats Row ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 border-t-4 border-t-emerald-500">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Revenue</p>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <FaMoneyBillWave />
                        </div>
                    </div>
                    <p className="text-2xl font-playfair font-bold text-navy">Rs 45,200</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 border-t-4 border-t-navy">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Bookings</p>
                        <div className="w-10 h-10 rounded-xl bg-navy/10 text-navy flex items-center justify-center">
                            <FaBuilding />
                        </div>
                    </div>
                    <p className="text-2xl font-playfair font-bold text-navy">128</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 border-t-4 border-t-terracotta">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Venues</p>
                        <div className="w-10 h-10 rounded-xl bg-terracotta/10 text-terracotta flex items-center justify-center">
                            <FaStore />
                        </div>
                    </div>
                    <p className="text-2xl font-playfair font-bold text-navy">{halls.length || 12}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 border-t-4 border-t-amber-400">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Users</p>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <FaUsers />
                        </div>
                    </div>
                    <p className="text-2xl font-playfair font-bold text-navy">{users.length || 850}</p>
                </div>
            </div>

            {/* ── Tab Navigation ── */}
            <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex gap-1 overflow-x-auto scrollbar-none">
                {tabs.map(({ id, label, icon: Icon, badge }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 relative ${
                            activeTab === id
                                ? 'bg-navy text-white shadow-sm'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-navy'
                        }`}
                    >
                        <Icon className="text-xs" />
                        {label}
                        {badge > 0 && (
                            <span className="w-4 h-4 rounded-full bg-terracotta text-white text-[10px] font-bold flex items-center justify-center">
                                {badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Content Panel ── */}
            <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 sm:p-8 min-h-[500px]">

                {/* USERS */}
                {activeTab === 'users' && (
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1 h-7 bg-terracotta rounded-full" />
                            <h2 className="text-xl font-playfair font-bold text-navy">User Management</h2>
                            <span className="ml-auto text-xs font-bold bg-navy/10 text-navy px-3 py-1 rounded-full">{users.length} users</span>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-gray-100">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className={thCls + " text-gray-500"}>User</th>
                                        <th className={thCls + " text-gray-500"}>Email</th>
                                        <th className={thCls + " text-gray-500"}>Role</th>
                                        <th className={thCls + " text-gray-500"}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.map(user => (
                                        <tr key={user._id} className="hover:bg-ivory-warm transition-colors">
                                            <td className={tdCls}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-navy/10 text-navy font-bold flex items-center justify-center text-sm shrink-0">
                                                        {getInitials(user.name)}
                                                    </div>
                                                    <span className="font-semibold text-navy">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className={tdCls + " text-gray-500"}>{user.email}</td>
                                            <td className={tdCls}>
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${roleBadge(user.role)}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className={tdCls}>
                                                <button
                                                    onClick={() => handleDeleteUser(user._id)}
                                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                    title="Delete User"
                                                >
                                                    <FaTrash className="text-xs" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {users.length === 0 && (
                                <p className="text-center text-gray-400 py-8 text-sm">No users found.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* APPLICATIONS */}
                {activeTab === 'applications' && (
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1 h-7 bg-terracotta rounded-full" />
                            <h2 className="text-xl font-playfair font-bold text-navy">Manager Applications</h2>
                        </div>
                        {applications.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400 text-2xl"><FaUserTie /></div>
                                <p className="text-gray-500 font-medium">No pending applications</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {applications.map(app => (
                                    <div key={app._id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-all">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                                            <div className="flex-1">
                                                <h3 className="font-playfair text-xl font-bold text-navy mb-1">
                                                    {app.managerApplication?.businessName}
                                                </h3>
                                                <div className="flex items-center gap-1.5 text-terracotta text-sm mb-2">
                                                    <FaMapMarkerAlt className="text-xs" />
                                                    <span>{app.managerApplication?.businessAddress}</span>
                                                </div>
                                                <p className="text-gray-600 text-sm leading-relaxed mb-3">
                                                    {app.managerApplication?.description}
                                                </p>
                                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                                    <FaUserTie className="text-xs" />
                                                    <span>{app.name} · {app.email}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <button
                                                    onClick={() => handleStatusUpdate(app._id, 'approved')}
                                                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(app._id, 'rejected')}
                                                    className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* HALLS */}
                {activeTab === 'halls' && (
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1 h-7 bg-terracotta rounded-full" />
                            <h2 className="text-xl font-playfair font-bold text-navy">Venue Supervision</h2>
                            <span className="ml-auto text-xs font-bold bg-terracotta/10 text-terracotta px-3 py-1 rounded-full">{halls.length} venues</span>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-gray-100">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className={thCls + " text-gray-500"}>Hall Name</th>
                                        <th className={thCls + " text-gray-500"}>Location</th>
                                        <th className={thCls + " text-gray-500"}>Capacity</th>
                                        <th className={thCls + " text-gray-500"}>Price</th>
                                        <th className={thCls + " text-gray-500"}>Manager</th>
                                        <th className={thCls + " text-gray-500"}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {halls.map(hall => (
                                        <tr key={hall._id} className="hover:bg-ivory-warm transition-colors">
                                            <td className={tdCls + " font-semibold text-navy"}>{hall.name}</td>
                                            <td className={tdCls}>
                                                <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                                                    <FaMapMarkerAlt className="text-terracotta text-[10px]" />
                                                    {hall.location}
                                                </div>
                                            </td>
                                            <td className={tdCls}>
                                                <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">
                                                    {hall.capacity} guests
                                                </span>
                                            </td>
                                            <td className={tdCls + " font-bold text-terracotta"}>Rs {hall.price?.toLocaleString?.() || hall.price}</td>
                                            <td className={tdCls}>
                                                {hall.manager ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-navy/10 text-navy font-bold flex items-center justify-center text-xs shrink-0">
                                                            {getInitials(hall.manager?.name)}
                                                        </div>
                                                        <span className="text-gray-600 text-xs">{hall.manager?.name}</span>
                                                    </div>
                                                ) : <span className="text-gray-400 text-xs">N/A</span>}
                                            </td>
                                            <td className={tdCls}>
                                                <button
                                                    onClick={() => handleDeleteHall(hall._id)}
                                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                >
                                                    <FaTrash className="text-xs" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {halls.length === 0 && (
                                <p className="text-center text-gray-400 py-8 text-sm">No halls found.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* COMPLAINTS */}
                {activeTab === 'complaints' && (
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1 h-7 bg-terracotta rounded-full" />
                            <h2 className="text-xl font-playfair font-bold text-navy">User Complaints</h2>
                        </div>
                        {complaints.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400 text-2xl"><FaEnvelope /></div>
                                <p className="text-gray-500 font-medium">No complaints found</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {complaints.map(complaint => (
                                    <div key={complaint._id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="font-bold text-navy">{complaint.subject}</h3>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    From: {complaint.name} · {complaint.email} · {new Date(complaint.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ml-4 ${complaint.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {complaint.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-4 text-gray-700 text-sm mb-4">
                                            {complaint.message}
                                        </div>
                                        {complaint.adminReply ? (
                                            <div className="bg-terracotta/5 rounded-xl p-4 border-l-2 border-terracotta">
                                                <p className="text-xs font-bold uppercase tracking-wider text-terracotta mb-1.5 flex items-center gap-1.5">
                                                    <FaReply className="text-[10px]" /> Your Reply
                                                </p>
                                                <p className="text-gray-700 text-sm">{complaint.adminReply}</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <textarea
                                                    className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 resize-none mb-3"
                                                    placeholder="Write your reply..."
                                                    rows="3"
                                                    value={replyText[complaint._id] || ''}
                                                    onChange={(e) => setReplyText({ ...replyText, [complaint._id]: e.target.value })}
                                                />
                                                <button
                                                    onClick={() => handleReply(complaint._id)}
                                                    disabled={!replyText[complaint._id]}
                                                    className="flex items-center gap-2 px-5 py-2.5 bg-terracotta text-white text-xs font-bold rounded-xl hover:bg-terracotta/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <FaReply className="text-[10px]" /> Send Reply
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* COMMISSIONS */}
                {activeTab === 'commissions' && (
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1 h-7 bg-terracotta rounded-full" />
                            <h2 className="text-xl font-playfair font-bold text-navy">Commission Payments</h2>
                        </div>
                        {payments.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400 text-2xl"><FaMoneyBillWave /></div>
                                <p className="text-gray-500 font-medium">No pending commission payments</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {payments.map(payment => (
                                    <div key={payment._id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-10 h-10 rounded-xl bg-navy/10 text-navy font-bold flex items-center justify-center">
                                                        {getInitials(payment.managerId?.name)}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-navy">{payment.managerId?.name}</h3>
                                                        <p className="text-xs text-gray-400">{payment.managerId?.email}</p>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500">Booking Ref: #{payment.bookingId?._id?.slice(-6)}</p>
                                                <p className="text-xs text-gray-400">Due: {new Date(payment.dueDate).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Commission</p>
                                                <p className="text-2xl font-playfair font-bold text-terracotta">
                                                    Rs {payment.amount?.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        {payment.paymentProof && (
                                            <div className="mb-5">
                                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Payment Proof</p>
                                                <img
                                                    src={`https://mariage-hall-booking-system.vercel.app/${payment.paymentProof}`}
                                                    alt="Payment Proof"
                                                    className="max-w-sm rounded-2xl border border-gray-200 shadow-sm"
                                                />
                                            </div>
                                        )}

                                        <div className="flex flex-col sm:flex-row items-end gap-3">
                                            <div className="flex-1">
                                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                                    Rejection Reason (if rejecting)
                                                </label>
                                                <input
                                                    type="text"
                                                    className={inputCls}
                                                    placeholder="Enter reason for rejection"
                                                    value={rejectionReasons[payment._id] || ''}
                                                    onChange={(e) => setRejectionReasons({ ...rejectionReasons, [payment._id]: e.target.value })}
                                                />
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <button
                                                    onClick={() => handleVerifyPayment(payment._id)}
                                                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                                                >
                                                    <FaCheckCircle className="text-[11px]" /> Verify
                                                </button>
                                                <button
                                                    onClick={() => handleRejectPayment(payment._id)}
                                                    className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                                                >
                                                    <FaTimesCircle className="text-[11px]" /> Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}\n

                {/* KNOWLEDGE BASE */}
                {activeTab === 'knowledgeBase' && (
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1 h-7 bg-terracotta rounded-full" />
                            <h2 className="text-xl font-playfair font-bold text-navy">Knowledge Base</h2>
                            <span className="ml-auto text-xs font-bold bg-navy/10 text-navy px-3 py-1 rounded-full">
                                {knowledgeDocs.length} document{knowledgeDocs.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {/* Pipeline explanation */}
                        <div className="mb-6 bg-navy/5 rounded-2xl p-4 flex flex-wrap gap-3 items-center justify-center text-xs font-bold text-navy/70">
                            <span className="flex items-center gap-1.5"><FaCloudUploadAlt className="text-terracotta" /> Upload</span>
                            <span className="text-gray-300">→</span>
                            <span>Chunking</span>
                            <span className="text-gray-300">→</span>
                            <span>Embedding</span>
                            <span className="text-gray-300">→</span>
                            <span className="flex items-center gap-1.5"><FaDatabase className="text-emerald-500" /> Qdrant Vector DB</span>
                        </div>

                        {/* Drop Zone */}
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDropZoneDrop}
                            onClick={() => uploadStatus !== 'uploading' && fileInputRef.current?.click()}
                            className={`relative cursor-pointer border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 mb-6
                                ${dragOver ? 'border-terracotta bg-terracotta/5 scale-[1.01]' : 'border-gray-200 bg-gray-50/60 hover:border-terracotta hover:bg-terracotta/5'}
                                ${uploadStatus === 'uploading' ? 'pointer-events-none opacity-80' : ''}
                            `}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.docx,.txt"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e.target.files[0])}
                            />
                            <div className="flex flex-col items-center gap-3">
                                {uploadStatus === 'uploading' ? (
                                    <FaSpinner className="text-4xl text-terracotta animate-spin" />
                                ) : (
                                    <FaCloudUploadAlt className={`text-4xl ${dragOver ? 'text-terracotta' : 'text-gray-300'}`} />
                                )}
                                <div>
                                    <p className="text-navy font-bold text-sm">
                                        {uploadStatus === 'uploading'
                                            ? `Processing document... ${uploadProgress}%`
                                            : 'Drag & drop a file here, or click to browse'}
                                    </p>
                                    <p className="text-gray-400 text-xs mt-1">Supports PDF, DOCX, TXT — max 20 MB</p>
                                </div>
                            </div>

                            {/* Progress bar */}
                            {uploadStatus === 'uploading' && (
                                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-200 rounded-b-2xl overflow-hidden">
                                    <div
                                        className="h-full bg-terracotta transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Status message */}
                        {uploadMessage && (
                            <div className={`mb-6 px-5 py-3.5 rounded-xl text-sm font-medium flex items-start gap-3
                                ${uploadStatus === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}
                            `}>
                                {uploadStatus === 'success'
                                    ? <FaCheckCircle className="mt-0.5 shrink-0" />
                                    : <FaTimesCircle className="mt-0.5 shrink-0" />
                                }
                                {uploadMessage}
                            </div>
                        )}

                        {/* Documents list */}
                        {knowledgeDocs.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300 text-3xl">
                                    <FaDatabase />
                                </div>
                                <p className="text-gray-400 text-sm font-medium">No documents indexed yet.</p>
                                <p className="text-gray-300 text-xs mt-1">Upload a file above to get started.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Indexed Documents</p>
                                {knowledgeDocs.map(doc => (
                                    <div key={doc._id} className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-sm transition-all">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-lg shrink-0">
                                            {fileTypeIcon(doc.fileType)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-navy font-bold text-sm truncate">{doc.name}</p>
                                            <p className="text-gray-400 text-xs mt-0.5">{doc.originalName}</p>
                                        </div>
                                        <div className="flex items-center gap-4 shrink-0">
                                            <div className="text-center hidden sm:block">
                                                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Chunks</p>
                                                <p className="text-navy font-bold text-sm">{doc.chunkCount}</p>
                                            </div>
                                            <div className="text-center hidden sm:block">
                                                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Type</p>
                                                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full
                                                    ${doc.fileType === 'pdf' ? 'bg-red-50 text-red-500' :
                                                      doc.fileType === 'docx' ? 'bg-blue-50 text-blue-500' :
                                                      'bg-gray-100 text-gray-500'}`}>
                                                    {doc.fileType}
                                                </span>
                                            </div>
                                            <div className="text-center hidden md:block">
                                                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Uploaded</p>
                                                <p className="text-gray-600 text-xs">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteKnowledgeDoc(doc._id)}
                                                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                title="Delete document"
                                            >
                                                <FaTrash className="text-xs" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default AdminDashboard;
