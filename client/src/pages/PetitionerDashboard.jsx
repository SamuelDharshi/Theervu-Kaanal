import React, { useState, useEffect } from "react";
import { useT } from '../i18n/LanguageContext';
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Footer from "../shared/Footer";
import NavBar from "../components/NavBar";
import { Plus, Eye, MessageCircle, AlertCircle, Clock, ArrowLeft, Star } from "lucide-react";
import ChatComponent from '../components/ChatComponent';
import TimelineView from '../components/TimelineView';
import "../styles/Chat.css";
import { toast } from "react-hot-toast";
import EscalateModal from '../components/EscalateModal';
import { API_BASE } from '../config';
import EngineVerdict from '../components/EngineVerdict';
import { engineReasons } from '../engine/format';

const PetitionerDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, authenticatedFetch } = useAuth();
    const { t, formatDate } = useT();
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
                setError(data.error || t('petitioner.fetchFailed'));
            }
        } catch (error) {
            console.error('Error fetching grievances:', error);
            if (error.message === 'No authentication token available') {
                setError(t('common.sessionExpired'));
                setTimeout(() => {
                    navigate('/login/petitioner');
                }, 2000);
            } else {
                setError(t('petitioner.fetchFailed'));
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
                toast.success(t('escalate.success'));
                fetchGrievances(); // Refresh the list
                setShowEscalateModal(false);
            } else {
                toast.error(data.error || t('escalate.failed'));
            }
        } catch (error) {
            console.error('Error escalating grievance:', error);
            toast.error(t('escalate.failed'));
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
                toast.error(t('feedback.already'));
                return;
            }

            // If no feedback exists, proceed with showing the modal
            setSelectedGrievanceForFeedback(updatedGrievance);
            setShowFeedbackModal(true);

        } catch (error) {
            console.error('Error fetching grievance details:', error);
            toast.error(error.message || t('petitioner.detailsFailed'));
        }
    };

    const submitFeedback = async () => {
        try {
            if (!selectedGrievanceForFeedback) {
                toast.error(t('feedback.noneSelected'));
                return;
            }

            // More robust check for existing feedback
            if (selectedGrievanceForFeedback.feedback && selectedGrievanceForFeedback.feedback.rating) {
                toast.error(t('feedback.already'));
                setShowFeedbackModal(false);
                return;
            }

            if (feedbackRating === 0) {
                toast.error(t('feedback.selectRating'));
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
                toast.success(t('feedback.thanks'));
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
            toast.error(error.message || t('feedback.failed'));

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
                        <h2 className="mb-0">{t('petitioner.title')}</h2>
                    </div>
                    <div className="col-12 col-md-6 d-flex justify-content-md-end mt-3 mt-md-0">
                        <button
                            className="btn btn-primary d-flex align-items-center w-100 w-md-auto flex-grow-0"
                            onClick={() => navigate("/submit-grievance")}
                        >
                            <Plus size={18} className="me-2" />
                            {t('submit.title')}
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
                                <h5 className="card-title">{t('petitioner.total')}</h5>
                                <h2 className="card-text">{stats.total}</h2>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-sm-6 col-md-2 mb-3 mb-md-0">
                        <div className="card bg-warning text-dark h-100">
                            <div className="card-body">
                                <h5 className="card-title">{t('status.pending')}</h5>
                                <h2 className="card-text">{stats.pending}</h2>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-sm-6 col-md-2 mb-3 mb-md-0">
                        <div className="card bg-secondary text-white h-100">
                            <div className="card-body">
                                <h5 className="card-title">{t('status.assigned')}</h5>
                                <h2 className="card-text">{stats.assigned}</h2>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-sm-6 col-md-3 mb-3 mb-md-0">
                        <div className="card bg-info text-white h-100">
                            <div className="card-body">
                                <h5 className="card-title">{t('status.in-progress')}</h5>
                                <h2 className="card-text">{stats.inProgress}</h2>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-sm-6 col-md-3">
                        <div className="card bg-success text-white h-100">
                            <div className="card-body">
                                <h5 className="card-title">{t('status.resolved')}</h5>
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
                                {t('common.all')}
                            </button>
                            <button
                                className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setActiveTab('pending')}
                            >
                                {t('status.pending')}
                            </button>
                            <button
                                className={`btn ${activeTab === 'assigned' ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setActiveTab('assigned')}
                            >
                                {t('status.assigned')}
                            </button>
                            <button
                                className={`btn ${activeTab === 'in-progress' ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setActiveTab('in-progress')}
                            >
                                {t('status.in-progress')}
                            </button>
                            <button
                                className={`btn ${activeTab === 'resolved' ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setActiveTab('resolved')}
                            >
                                {t('status.resolved')}
                            </button>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="input-group">
                            <input
                                type="text"
                                className="form-control"
                                placeholder={t('petitioner.search')}
                                aria-label={t('petitioner.search')}
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
                            {flaggedGrievances.length === 1
                                ? t('petitioner.flaggedOne')
                                : t('petitioner.flaggedMany', { n: flaggedGrievances.length })}
                        </h2>
                        <p>{t('petitioner.flaggedBody')}</p>
                        <ul>
                            {flaggedGrievances.map((g) => (
                                <li key={g._id}>
                                    <div>
                                        <strong>{g.grievanceId} · {g.title}</strong>
                                        <span>{engineReasons(g.engine, t).join(' ') || g.escalationReason}</span>
                                    </div>
                                    <button type="button" className="btn btn-accent" onClick={() => handleEscalate(g)}>
                                        {t('escalate.action')}
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
                                <th>{t('common.grievanceId')}</th>
                                <th>{t('form.title')}</th>
                                <th>{t('common.department')}</th>
                                <th>{t('common.status')}</th>
                                <th>{t('petitioner.escalation')}</th>
                                <th>{t('common.assignedTo')}</th>
                                <th>{t('petitioner.submitted')}</th>
                                <th>{t('common.lastUpdate')}</th>
                                <th>{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="9" className="text-center py-4">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">{t('common.loading')}</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredGrievances.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="text-center py-4">
                                        {t('common.noGrievances')}
                                    </td>
                                </tr>
                            ) : (
                                filteredGrievances.map((grievance) => (
                                    <tr key={grievance._id}>
                                        <td>{grievance.grievanceId || 'N/A'}</td>
                                        <td>{grievance.title}</td>
                                        <td>{t(`dept.${grievance.department}`)}</td>
                                        <td>
                                            <span className={`badge ${getStatusBadgeClass(grievance.status)}`}>
                                                {t(`status.${grievance.status}`)}
                                            </span>
                                        </td>
                                        <td><EngineVerdict grievance={grievance} compact /></td>
                                        <td>
                                            {grievance.assignedTo ?
                                                `${grievance.assignedTo.firstName} ${grievance.assignedTo.lastName}` :
                                                t('common.notAssigned')
                                            }
                                        </td>
                                        <td>{formatDate(grievance.createdAt)}</td>
                                        <td>{formatDate(grievance.updatedAt)}</td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                {(grievance.status === 'assigned' || grievance.status === 'in-progress') && grievance.assignedTo && (
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => handleViewChat(grievance)}
                                                    >
                                                        <MessageCircle size={16} className="me-1" />
                                                        {t('common.chat')}
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
                                                    {t('common.timeline')}
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
                                                            {t('petitioner.viewResolution')}
                                                        </button>
                                                        {!grievance.feedback && (
                                                            <button
                                                                className="btn btn-sm btn-success"
                                                                onClick={() => handleGiveFeedback(grievance)}
                                                            >
                                                                <Star size={16} className="me-1" />
                                                                {t('feedback.give')}
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                                {grievance.escalationEligible && !grievance.isEscalated && (
                                                    <button
                                                        className="btn btn-warning btn-sm"
                                                        onClick={() => handleEscalate(grievance)}
                                                    >
                                                        {t('escalate.action')}
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
                                        {t('common.timeline')} · {selectedGrievance.grievanceId}
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
                                            {t('common.chat')} · {selectedGrievance.grievanceId}
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
                                    <h5 className="modal-title">{t('petitioner.resolutionDoc')}</h5>
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
                                                {t('petitioner.viewResolutionDoc')}
                                            </a>
                                        </div>
                                    ) : (
                                        <p className="text-center text-muted">{t('petitioner.noResolutionDoc')}</p>
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
                                        {t('feedback.give')} · {selectedGrievanceForFeedback.grievanceId}
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
                                        <label htmlFor="feedbackRating" className="form-label">{t('feedback.rating')}</label>
                                        <select
                                            id="feedbackRating"
                                            className="form-select"
                                            value={feedbackRating}
                                            onChange={(e) => setFeedbackRating(Number(e.target.value))}
                                        >
                                            <option value={0}>{t('feedback.selectRating')}</option>
                                            <option value={1}>1</option>
                                            <option value={2}>2</option>
                                            <option value={3}>3</option>
                                            <option value={4}>4</option>
                                            <option value={5}>5</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="feedbackComment" className="form-label">{t('feedback.comment')}</label>
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
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={submitFeedback}
                                    >
                                        {t('feedback.submit')}
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