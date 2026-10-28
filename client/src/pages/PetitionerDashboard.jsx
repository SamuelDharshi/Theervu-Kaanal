import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Footer from "../shared/Footer";
import NavBar from "../components/NavBar";
import { Plus, Eye, MessageCircle, AlertCircle, Clock, ArrowLeft, Star } from "lucide-react";
import moment from 'moment';
import ChatComponent from '../components/ChatComponent';
import TimelineView from '../components/TimelineView';
import "../styles/Chat.css";
import { toast } from "react-hot-toast";
import EscalateModal from '../components/EscalateModal';
import { API_BASE } from '../config';
import EngineVerdict from '../components/EngineVerdict';

const PetitionerDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, authenticatedFetch } = useAuth();
    const [grievances, setGrievances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [message, setMessage] = useState(location.state?.message || null);
    const [messageType] = useState(location.state?.type || 'info');
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        assigned: 0,
        inProgress: 0,
        resolved: 0
    });
    const [activeTab, setActiveTab] = useState('all');
    const [filteredGrievances, setFilteredGrievances] = useState([]);
    const [selectedGrievance, setSelectedGrievance] = useState(null);
    const [showChat, setShowChat] = useState(false);
    const [showTimeline, setShowTimeline] = useState(false);
    const [showDocumentModal, setShowDocumentModal] = useState(false);
    const [showEscalateModal, setShowEscalateModal] = useState(false);
    const [selectedGrievanceForEscalation, setSelectedGrievanceForEscalation] = useState(null);
    const [escalationReason, setEscalationReason] = useState('');
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [selectedGrievanceForFeedback, setSelectedGrievanceForFeedback] = useState(null);

    useEffect(() => {
        fetchGrievances();
        // Clear location state after showing message
        if (location.state?.message) {
            window.history.replaceState({}, document.title);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount; the flash message comes from the initial location
    }, []);

    useEffect(() => {
        // First filter by status (activeTab)
        let statusFiltered;
        if (activeTab === 'all') {
            statusFiltered = grievances;
        } else if (activeTab === 'assigned') {
            statusFiltered = grievances.filter(g => g.status === 'assigned');
        } else {
            statusFiltered = grievances.filter(g => g.status === activeTab);
        }

        // Then apply search filter
        const searchFiltered = statusFiltered.filter(grievance =>
            grievance.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            grievance.petitionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            grievance.department.toLowerCase().includes(searchTerm.toLowerCase())
        );

        setFilteredGrievances(searchFiltered);
    }, [activeTab, searchTerm, grievances]);

    const fetchGrievances = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await authenticatedFetch(`${API_BASE}/api/grievances/user/${user.id}`);
            const data = await response.json();

            if (response.ok) {
                // Transform the data to match the expected format
                const transformedGrievances = data.grievances.map(grievance => ({
                    ...grievance,
                    grievanceId: grievance.petitionId || grievance.grievanceId,
                    submittedDate: grievance.createdAt,
                    lastUpdated: grievance.updatedAt,
                    assignedTo: grievance.assignedTo || null,
                    // The engine's live verdict counts as well as the flag the noon check stores.
                    escalationEligible: grievance.escalationEligible || grievance.engine?.eligible || false,
                    isEscalated: grievance.isEscalated || false,
                    resourceManagement: grievance.resourceManagement || null
                }));

                setGrievances(transformedGrievances);

                // Calculate stats
                const stats = {
                    total: transformedGrievances.length,
                    pending: transformedGrievances.filter(g => g.status === 'pending').length,
                    assigned: transformedGrievances.filter(g => g.status === 'assigned').length,
                    inProgress: transformedGrievances.filter(g => g.status === 'in-progress').length,
                    resolved: transformedGrievances.filter(g => g.status === 'resolved').length
                };
                setStats(stats);
            } else {
                setError(data.error || 'Failed to fetch grievances');
            }
        } catch (error) {
            console.error('Error fetching grievances:', error);
            if (error.message === 'No authentication token available') {
                setError('Your session has expired. Please log in again.');
                setTimeout(() => {
                    navigate('/login/petitioner');
                }, 2000);
            } else {
                setError('Failed to fetch grievances. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'bg-warning';
            case 'in-progress':
                return 'bg-primary';
            case 'resolved':
                return 'bg-success';
            case 'rejected':
                return 'bg-danger';
            default:
                return 'bg-secondary';
        }
    };

    const flaggedGrievances = grievances.filter((g) => g.escalationEligible && !g.isEscalated && g.status !== 'resolved');

    const handleViewChat = (grievance) => {
        setSelectedGrievance(grievance);
        setShowChat(true);
    };

    const handleEscalate = async (grievance) => {
        setSelectedGrievanceForEscalation(grievance);
        setShowEscalateModal(true);
    };

    const handleEscalateSubmit = async (reason) => {
        try {
            const response = await authenticatedFetch(`${API_BASE}/api/grievances/${selectedGrievanceForEscalation._id}/escalate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ escalationReason: reason }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Grievance escalated successfully');
                fetchGrievances(); // Refresh the list
                setShowEscalateModal(false);
            } else {
                toast.error(data.error || 'Failed to escalate grievance');
            }
        } catch (error) {
            console.error('Error escalating grievance:', error);
            toast.error('Failed to escalate grievance');
        }
    };

    const handleGiveFeedback = async (grievance) => {
        try {
            // First, get the latest grievance data to make sure we have current feedback status
            const response = await authenticatedFetch(`${API_BASE}/api/grievances/${grievance._id}/status`);

            if (!response.ok) {
                throw new Error('Failed to fetch grievance details');
            }

            const updatedGrievance = await response.json();

            // Check if feedback already exists using the updated data
            if (updatedGrievance.feedback && updatedGrievance.feedback.rating) {
                toast.error('Feedback has already been submitted for this grievance');
                return;
            }

            // If no feedback exists, proceed with showing the modal
            setSelectedGrievanceForFeedback(updatedGrievance);
            setShowFeedbackModal(true);

        } catch (error) {
            console.error('Error fetching grievance details:', error);
            toast.error(error.message || 'Failed to fetch grievance details');
        }
    };

    const submitFeedback = async () => {
        try {
            if (!selectedGrievanceForFeedback) {
                toast.error('No grievance selected for feedback');
                return;
            }

            // More robust check for existing feedback
            if (selectedGrievanceForFeedback.feedback && selectedGrievanceForFeedback.feedback.rating) {
                toast.error('Feedback has already been submitted for this grievance');
                setShowFeedbackModal(false);
                return;
            }

            if (feedbackRating === 0) {
                toast.error('Please select a rating');
                return;
            }

            const response = await authenticatedFetch(`${API_BASE}/api/grievances/${selectedGrievanceForFeedback._id}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    rating: feedbackRating,
                    comment: feedbackComment
                })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Thank you for your feedback!');
                setShowFeedbackModal(false);
                setFeedbackRating(0);
                setFeedbackComment('');
                setSelectedGrievanceForFeedback(null);
                fetchGrievances(); // Refresh the list
            } else {
                throw new Error(data.error || 'Failed to submit feedback');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            toast.error(error.message || 'Failed to submit feedback');

            // Close the modal for any error containing "already submitted"
            if (error.message && error.message.toLowerCase().includes('already submitted')) {
                setShowFeedbackModal(false);
                setFeedbackRating(0);
                setFeedbackComment('');
                setSelectedGrievanceForFeedback(null);
                // Refresh to get latest data
                fetchGrievances();
            }
        }
    };

    return (
        <>
            <NavBar />
            <div className="container-fluid py-4">
                {/* Header Section */}
                <div className="row mb-4 align-items-center">
                    <div className="col-12 col-md-6">
                        <h2 className="mb-0">My Grievances</h2>
                    </div>
                    <div className="col-12 col-md-6 d-flex justify-content-md-end mt-3 mt-md-0">
                        <button
                            className="btn btn-primary d-flex align-items-center w-100 w-md-auto flex-grow-0"
                            onClick={() => navigate("/submit-grievance")}
                        >
                            <Plus size={18} className="me-2" />
                            Submit New Grievance
                        </button>
                    </div>
                </div>

                {/* Alert Message */}
                {message && (
                    <div className={`alert alert-${messageType} alert-dismissible fade show`} role="alert">
                        {message}
                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => setMessage(null)}
                        ></button>
                    </div>
                )}

                {/* Stats Section */}
                <div className="row mb-4">
                    <div className="col-12 col-sm-6 col-md-2 mb-3 mb-md-0">
                        <div className="card bg-primary text-white h-100">
                            <div className="card-body">
                                <h5 className="card-title">Total Grievances</h5>
                                <h2 className="card-text">{stats.total}</h2>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-sm-6 col-md-2 mb-3 mb-md-0">
                        <div className="card bg-warning text-dark h-100">
                            <div className="card-body">
                                <h5 className="card-title">Pending</h5>
                                <h2 className="card-text">{stats.pending}</h2>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-sm-6 col-md-2 mb-3 mb-md-0">
                        <div className="card bg-secondary text-white h-100">
                            <div className="card-body">
                                <h5 className="card-title">Assigned</h5>
                                <h2 className="card-text">{stats.assigned}</h2>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-sm-6 col-md-3 mb-3 mb-md-0">
                        <div className="card bg-info text-white h-100">
                            <div className="card-body">
                                <h5 className="card-title">In Progress</h5>
                                <h2 className="card-text">{stats.inProgress}</h2>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-sm-6 col-md-3">
                        <div className="card bg-success text-white h-100">
                            <div className="card-body">
                                <h5 className="card-title">Resolved</h5>
                                <h2 className="card-text">{stats.resolved}</h2>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions Section */}
                <div className="row mb-4">
                    <div className="col-md-8">
                        <div className="btn-group" role="group">
                            <button
                                className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setActiveTab('all')}
                            >
                                All
                            </button>
                            <button
                                className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setActiveTab('pending')}
                            >
                                Pending
                            </button>
                            <button
                                className={`btn ${activeTab === 'assigned' ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setActiveTab('assigned')}
                            >
                                Assigned
                            </button>
                            <button
                                className={`btn ${activeTab === 'in-progress' ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setActiveTab('in-progress')}
                            >
                                In Progress
                            </button>
                            <button
                                className={`btn ${activeTab === 'resolved' ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setActiveTab('resolved')}
                            >
                                Resolved
                            </button>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="input-group">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search grievances..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button className="btn btn-outline-secondary" type="button">
                                <i className="bi bi-search"></i>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="alert alert-danger" role="alert">
                        <AlertCircle className="me-2" size={20} />
                        {error}
                    </div>
                )}

                {/* Petitions the escalation engine has flagged */}
                {flaggedGrievances.length > 0 && (
                    <section className="tk-flagged mb-4" aria-labelledby="flagged-title">
                        <h2 id="flagged-title">
                            The escalation engine flagged {flaggedGrievances.length === 1 ? 'one of your petitions' : `${flaggedGrievances.length} of your petitions`}
                        </h2>
                        <p>You can escalate it to the grievance cell with your reason. The cell answers or reassigns it to another official.</p>
                        <ul>
                            {flaggedGrievances.map((g) => (
                                <li key={g._id}>
                                    <div>
                                        <strong>{g.grievanceId} · {g.title}</strong>
                                        <span>{(g.engine?.reason || g.escalationReason || '').split('; ').join('. ')}</span>
                                    </div>
                                    <button type="button" className="btn btn-accent" onClick={() => handleEscalate(g)}>
                                        Escalate
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Grievances Table */}
                <div className="table-responsive">
                    <table className="table table-hover">
                        <thead className="table-light">
                            <tr>
                                <th>Grievance ID</th>
                                <th>Title</th>
                                <th>Department</th>
                                <th>Status</th>
                                <th>Escalation</th>
                                <th>Assigned To</th>
                                <th>Submitted Date</th>
                                <th>Last Updated</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="9" className="text-center py-4">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredGrievances.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="text-center py-4">
                                        No grievances found
                                    </td>
                                </tr>
                            ) : (
                                filteredGrievances.map((grievance) => (
                                    <tr key={grievance._id}>
                                        <td>{grievance.grievanceId || 'N/A'}</td>
                                        <td>{grievance.title}</td>
                                        <td>{grievance.department}</td>
                                        <td>
                                            <span className={`badge ${getStatusBadgeClass(grievance.status)}`}>
                                                {grievance.status}
                                            </span>
                                        </td>
                                        <td><EngineVerdict grievance={grievance} compact /></td>
                                        <td>
                                            {grievance.assignedTo ?
                                                `${grievance.assignedTo.firstName} ${grievance.assignedTo.lastName}` :
                                                'Not Assigned'
                                            }
                                        </td>
                                        <td>{moment(grievance.createdAt).format('MMM D, YYYY')}</td>
                                        <td>{moment(grievance.updatedAt).format('MMM D, YYYY')}</td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                {(grievance.status === 'assigned' || grievance.status === 'in-progress') && grievance.assignedTo && (
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => handleViewChat(grievance)}
                                                    >
                                                        <MessageCircle size={16} className="me-1" />
                                                        Chat
                                                    </button>
                                                )}
                                                <button
                                                    className="btn btn-sm btn-info"
                                                    onClick={() => {
                                                        setSelectedGrievance(grievance);
                                                        setShowTimeline(true);
                                                    }}
                                                >
                                                    <Clock size={16} className="me-1" />
                                                    Timeline
                                                </button>
                                                {grievance.status === 'resolved' && (
                                                    <>
                                                        <button
                                                            className="btn btn-sm btn-outline-primary me-2"
                                                            onClick={() => {
                                                                setSelectedGrievance(grievance);
                                                                setShowDocumentModal(true);
                                                            }}
                                                            disabled={!grievance.resolutionDocument}
                                                        >
                                                            <Eye size={16} className="me-1" />
                                                            View Resolution
                                                        </button>
                                                        {!grievance.feedback && (
                                                            <button
                                                                className="btn btn-sm btn-success"
                                                                onClick={() => handleGiveFeedback(grievance)}
                                                            >
                                                                <Star size={16} className="me-1" />
                                                                Give Feedback
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                                {grievance.escalationEligible && !grievance.isEscalated && (
                                                    <button
                                                        className="btn btn-warning btn-sm"
                                                        onClick={() => handleEscalate(grievance)}
                                                    >
                                                        Escalate
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Timeline Modal */}
                {showTimeline && selectedGrievance && (
                    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                        <div className="modal-dialog modal-lg">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        Timeline - Grievance {selectedGrievance.grievanceId}
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => {
                                            setShowTimeline(false);
                                            setSelectedGrievance(null);
                                        }}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <TimelineView
                                        grievanceId={selectedGrievance.grievanceId}
                                        onBack={() => {
                                            setShowTimeline(false);
                                            setSelectedGrievance(null);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Chat Modal */}
                {showChat && selectedGrievance && (
                    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                        <div className="modal-dialog modal-lg">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <div className="d-flex align-items-center">
                                        <button
                                            type="button"
                                            className="btn btn-link text-dark me-3"
                                            onClick={() => {
                                                setShowChat(false);
                                                setSelectedGrievance(null);
                                            }}
                                        >
                                            <ArrowLeft size={24} />
                                        </button>
                                        <h5 className="modal-title mb-0">
                                            Chat - Grievance {selectedGrievance.grievanceId}
                                        </h5>
                                    </div>
                                </div>
                                <div className="modal-body" style={{ height: '500px', padding: 0 }}>
                                    <ChatComponent
                                        grievanceId={selectedGrievance._id}
                                        petitionerId={selectedGrievance.petitioner?._id || selectedGrievance.petitioner}
                                        officialId={selectedGrievance.assignedOfficials?.[0]?._id || selectedGrievance.assignedOfficials?.[0]}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Resolution Document Modal */}
                {showDocumentModal && selectedGrievance && (
                    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                        <div className="modal-dialog modal-lg">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Resolution Document</h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => {
                                            setShowDocumentModal(false);
                                            setSelectedGrievance(null);
                                        }}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    {selectedGrievance.resolutionDocument ? (
                                        <div className="text-center">
                                            <a
                                                href={`${API_BASE}/uploads/resolution-docs/${selectedGrievance.resolutionDocument.path.split(/[/\\]/).pop()}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-primary"
                                            >
                                                <Eye size={16} className="me-2" />
                                                View Resolution Document
                                            </a>
                                        </div>
                                    ) : (
                                        <p className="text-center text-muted">No resolution document available</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Escalate Modal */}
                {showEscalateModal && selectedGrievanceForEscalation && (
                    <EscalateModal
                        show={showEscalateModal}
                        onHide={() => setShowEscalateModal(false)}
                        onSubmit={handleEscalateSubmit}
                        selectedGrievance={selectedGrievanceForEscalation}
                        escalationReason={escalationReason}
                        setEscalationReason={setEscalationReason}
                    />
                )}

                {/* Feedback Modal */}
                {showFeedbackModal && selectedGrievanceForFeedback && (
                    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                        <div className="modal-dialog modal-lg">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        Give Feedback - Grievance {selectedGrievanceForFeedback.grievanceId}
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => {
                                            setShowFeedbackModal(false);
                                            setSelectedGrievanceForFeedback(null);
                                        }}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label htmlFor="feedbackRating" className="form-label">Rating</label>
                                        <select
                                            id="feedbackRating"
                                            className="form-select"
                                            value={feedbackRating}
                                            onChange={(e) => setFeedbackRating(Number(e.target.value))}
                                        >
                                            <option value={0}>Select a rating</option>
                                            <option value={1}>1</option>
                                            <option value={2}>2</option>
                                            <option value={3}>3</option>
                                            <option value={4}>4</option>
                                            <option value={5}>5</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="feedbackComment" className="form-label">Comment</label>
                                        <textarea
                                            id="feedbackComment"
                                            className="form-control"
                                            rows="3"
                                            value={feedbackComment}
                                            onChange={(e) => setFeedbackComment(e.target.value)}
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setShowFeedbackModal(false);
                                            setSelectedGrievanceForFeedback(null);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={submitFeedback}
                                    >
                                        Submit Feedback
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
};

export default PetitionerDashboard;