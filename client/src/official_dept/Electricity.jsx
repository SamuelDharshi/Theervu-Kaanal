import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/WaterBoard.css";
import { useAuth } from "../context/AuthContext";
import { useT } from '../i18n/LanguageContext';
import { FaSearch, FaUser, FaSignOutAlt, FaCheck, FaCheckCircle, FaClock, FaComments, FaTimes, FaEye, FaTools } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import ChatComponent from '../components/ChatComponent';
import "../styles/Chat.css";
import NotificationBell from '../components/NotificationBell';
import { Dropdown } from 'react-bootstrap';
import RepeatedCaseIndicator from '../components/RepeatedCaseIndicator';
import { API_BASE } from '../config';

const ElectricityDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, formatDate } = useT();
  const [email, setEmail] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [grievances, setGrievances] = useState({
    pending: [],
    assigned: [],
    inProgress: [],
    resolved: []
  });
  const [stats, setStats] = useState({
    pending: 0,
    assigned: 0,
    inProgress: 0,
    resolved: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [resourceForm, setResourceForm] = useState({
    startDate: '',
    endDate: '',
    requirementsNeeded: '',
    fundsRequired: '',
    resourcesRequired: '',
    manpowerNeeded: ''
  });
  const [timelineForm, setTimelineForm] = useState({
    stageName: '',
    date: '',
    description: ''
  });

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'status-badge pending';
      case 'assigned':
        return 'status-badge assigned';
      case 'in-progress':
        return 'status-badge in-progress';
      case 'resolved':
        return 'status-badge resolved';
      default:
        return 'status-badge';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'priority-badge priority-high';
      case 'medium':
        return 'priority-badge priority-medium';
      case 'low':
        return 'priority-badge priority-low';
      default:
        return 'priority-badge';
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Set user info
    setEmail(user.email);

    // Fetch initial data
    fetchGrievances();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchGrievances reads activeTab/priorityFilter from this render
  }, [user, activeTab, priorityFilter]);

  const analyzePriorityLocally = (grievance) => {
    const description = grievance.description?.toLowerCase() || '';
    const title = grievance.title?.toLowerCase() || '';

    // Keywords indicating high priority for Electricity department
    const highPriorityKeywords = [
      'urgent', 'emergency', 'immediate', 'critical', 'severe', 'dangerous',
      'power outage', 'blackout', 'electrical fire', 'spark', 'short circuit',
      'electrocution', 'dangerous wiring', 'exposed wire', 'live wire',
      'transformer failure', 'substation issue', 'grid failure', 'safety hazard'
    ];

    // Keywords indicating medium priority
    const mediumPriorityKeywords = [
      'important', 'moderate', 'repair', 'fix', 'maintenance',
      'billing issue', 'meter reading', 'connection request',
      'voltage fluctuation', 'power quality', 'load shedding',
      'transformer maintenance', 'line maintenance', 'cable work'
    ];

    // Check for high priority keywords
    const hasHighPriority = highPriorityKeywords.some(keyword =>
      description.includes(keyword) || title.includes(keyword)
    );

    // Check for medium priority keywords
    const hasMediumPriority = mediumPriorityKeywords.some(keyword =>
      description.includes(keyword) || title.includes(keyword)
    );

    if (hasHighPriority) {
      return {
        priority: 'High',
        explanation: t('official.analysis.Electricity.high.explanation'),
        impactAssessment: t('official.analysis.Electricity.high.impact'),
        recommendedResponseTime: t('official.analysis.highTime')
      };
    } else if (hasMediumPriority) {
      return {
        priority: 'Medium',
        explanation: t('official.analysis.Electricity.medium.explanation'),
        impactAssessment: t('official.analysis.Electricity.medium.impact'),
        recommendedResponseTime: t('official.analysis.mediumTime')
      };
    } else {
      return {
        priority: 'Low',
        explanation: t('official.analysis.Electricity.low.explanation'),
        impactAssessment: t('official.analysis.Electricity.low.impact'),
        recommendedResponseTime: t('official.analysis.lowTime')
      };
    }
  };

  const fetchGrievances = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        `${API_BASE}/api/grievances/department/Electricity/${activeTab}${priorityFilter ? `?priority=${priorityFilter}` : ''}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch grievances');
      }

      const data = await response.json();

      // Process grievances with priority analysis
      const processedGrievances = await Promise.all(data.grievances.map(async (grievance) => {
        try {
          // Call Gemini AI for priority analysis
          const priorityResponse = await fetch(`${API_BASE}/api/grievances/analyze-priority`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              title: grievance.title || '',
              description: grievance.description || '',
              department: 'Electricity'
            })
          });

          if (!priorityResponse.ok) {
            throw new Error('Failed to analyze priority');
          }

          const priorityData = await priorityResponse.json();

          return {
            ...grievance,
            grievanceId: grievance.petitionId || grievance.grievanceId || t('common.na'),
            title: grievance.title || 'No Title',
            description: grievance.description || 'No Description',
            createdAt: grievance.createdAt || new Date().toISOString(),
            priority: priorityData.priority,
            priorityExplanation: priorityData.priorityExplanation,
            impactAssessment: priorityData.impactAssessment,
            recommendedResponseTime: priorityData.recommendedResponseTime,
            originalDocument: grievance.originalDocument || null,
            attachments: grievance.attachments || []
          };
        } catch (error) {
          console.error('Error analyzing priority:', error);
          // Fallback to local analysis if API fails
          const localPriorityData = analyzePriorityLocally(grievance);
          return {
            ...grievance,
            grievanceId: grievance.petitionId || grievance.grievanceId || t('common.na'),
            title: grievance.title || 'No Title',
            description: grievance.description || 'No Description',
            createdAt: grievance.createdAt || new Date().toISOString(),
            priority: localPriorityData.priority,
            priorityExplanation: localPriorityData.explanation,
            impactAssessment: localPriorityData.impactAssessment,
            recommendedResponseTime: localPriorityData.recommendedResponseTime,
            originalDocument: grievance.originalDocument || null,
            attachments: grievance.attachments || []
          };
        }
      }));

      // Apply client-side filtering for priority
      const filteredGrievances = processedGrievances.filter(grievance => {
        if (!priorityFilter) return true;
        return grievance.priority?.toLowerCase() === priorityFilter.toLowerCase();
      });

      setGrievances(prev => ({
        ...prev,
        [activeTab]: filteredGrievances
      }));

      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching grievances:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptGrievance = async (grievanceId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE}/api/grievances/${grievanceId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to accept grievance');
      }

      toast.success(t('official.accepted'));
      fetchGrievances();
    } catch (error) {
      console.error('Error accepting grievance:', error);
      toast.error(t('official.acceptFailed'));
    }
  };

  const handleDeclineGrievance = async (grievanceId) => {
    if (!declineReason.trim()) {
      toast.error(t('official.declineReasonRequired'));
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE}/api/grievances/${grievanceId}/decline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: declineReason })
      });

      if (!response.ok) {
        throw new Error('Failed to decline grievance');
      }

      toast.success(t('official.declined'));
      setShowDeclineModal(false);
      setDeclineReason('');
      fetchGrievances();
    } catch (error) {
      console.error('Error declining grievance:', error);
      toast.error(t('official.declineFailed'));
    }
  };

  const handleResolveGrievance = async (grievanceId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.pdf,.jpg,.jpeg,.png';
      fileInput.onchange = async (e) => {
        try {
          const file = e.target.files[0];
          if (!file) return;

          const formData = new FormData();
          formData.append('document', file);

          // First upload the document
          const uploadResponse = await fetch(`${API_BASE}/api/grievances/${grievanceId}/upload-resolution`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData
          });

          const uploadData = await uploadResponse.json();

          if (!uploadResponse.ok) {
            throw new Error(uploadData.error || 'Failed to upload resolution document');
          }

          // Then resolve the grievance
          const resolveResponse = await fetch(`${API_BASE}/api/grievances/${grievanceId}/resolve`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              resolutionMessage: 'Grievance resolved with attached document'
            })
          });

          const resolveData = await resolveResponse.json();

          if (!resolveResponse.ok) {
            throw new Error(resolveData.error || t('official.resolveFailed'));
          }

          // Refresh the grievances list
          fetchGrievances();
          toast.success(t('official.resolved'));
        } catch (error) {
          console.error('Error in file upload:', error);
          toast.error(error.message || t('official.resolveFailed'));
        }
      };

      fileInput.click();
    } catch (error) {
      console.error('Error resolving grievance:', error);
      toast.error(error.message || t('official.resolveFailed'));
    }
  };

  const handleViewChat = (grievance) => {
    setSelectedGrievance(grievance);
    setShowChat(true);
  };

  const handleResourceSubmit = async (grievanceId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE}/api/grievances/${grievanceId}/resource-management`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resourceForm)
      });

      if (!response.ok) {
        throw new Error('Failed to update resource management');
      }

      toast.success(t('official.resourceSaved'));
      setShowResourceModal(false);
      setResourceForm({
        startDate: '',
        endDate: '',
        requirementsNeeded: '',
        fundsRequired: '',
        resourcesRequired: '',
        manpowerNeeded: ''
      });
      fetchGrievances();
    } catch (error) {
      console.error('Error updating resource management:', error);
      toast.error(t('official.resourceFailed'));
    }
  };

  const handleTimelineSubmit = async (grievanceId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${API_BASE}/api/grievances/${grievanceId}/timeline-stage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(timelineForm)
      });

      if (!response.ok) throw new Error('Failed to update timeline');

      setShowTimelineModal(false);
      toast.success(t('official.timelineSaved'));
      fetchGrievances();
    } catch (error) {
      console.error('Error updating timeline:', error);
      toast.error(t('official.timelineFailed'));
    }
  };

  const renderDetailsModal = () => {
    if (!selectedGrievance) return null;
    return (
      <div className="modal">
        <div className="modal-content">
          <div className="modal-header">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t('official.details')}</h2>
              <p className="text-sm text-gray-500 mt-1">ID: {selectedGrievance.grievanceId}</p>
            </div>
            <button
              onClick={() => setShowDetails(false)}
              className="text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full p-2 transition-colors"
            >
              <FaTimes size={20} />
            </button>
          </div>

          <div className="modal-body space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{t('official.priorityAnalysis')}</h3>
                <span className={getPriorityBadgeClass(selectedGrievance.priority)}>
                  {selectedGrievance.priority ? t(`priority.${selectedGrievance.priority}`) : t('common.na')}
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {selectedGrievance.priorityExplanation || t('official.noExplanation')}
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('official.impact')}</h3>
              <p className="text-gray-700 leading-relaxed">
                {selectedGrievance.impactAssessment || t('official.noImpact')}
              </p>
            </div>

            {/* Document Viewing Section */}
            {(selectedGrievance.originalDocument || (selectedGrievance.attachments && selectedGrievance.attachments.length > 0)) && (
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('official.documents')}</h3>

                {selectedGrievance.originalDocument && (
                  <div className="mb-3">
                    <h5 className="font-medium">{t('official.originalDoc')}</h5>
                    <a
                      href={`${API_BASE}/uploads/documents/${selectedGrievance.originalDocument.path.split(/[/\\]/).pop()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center mt-2 px-4 py-2 bg-blue-500 text-white font-medium rounded hover:bg-blue-600 transition-colors"
                      style={{
                        fontSize: '0.875rem',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <FaEye /> {t('official.viewDocument')}
                    </a>
                  </div>
                )}

                {selectedGrievance.attachments && selectedGrievance.attachments.length > 0 && (
                  <div>
                    <h5 className="font-medium">{t('official.attachments')}</h5>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {selectedGrievance.attachments.map((attachment, index) => (
                        <a
                          key={index}
                          href={`${API_BASE}/uploads/documents/${attachment.path.split(/[/\\]/).pop()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-blue-500 text-white font-medium rounded hover:bg-blue-600 transition-colors"
                          style={{
                            fontSize: '0.875rem',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <FaEye /> {t('official.attachmentN', { n: index + 1 })}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('official.responseTime')}</h3>
              <p className="text-gray-700 leading-relaxed">
                {selectedGrievance.recommendedResponseTime || t('official.standardTime')}
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('official.location')}</h3>
              <p className="text-gray-700 leading-relaxed">
                {selectedGrievance.location || t('official.noLocation')}
              </p>
            </div>

            {selectedGrievance.assignedTo && (
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('official.personnel')}</h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FaUser className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedGrievance.assignedTo.firstName} {selectedGrievance.assignedTo.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{selectedGrievance.assignedTo.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button
              onClick={() => setShowDetails(false)}
              className="btn btn-secondary"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderGrievanceCard = (grievance) => {
    return (
      <div key={grievance._id} className="grievance-card">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold text-gray-900">{grievance.title}</h3>
              <span className={getPriorityBadgeClass(grievance.priority)}>
                {grievance.priority ? t(`priority.${grievance.priority}`) : t('common.na')}
              </span>
              <RepeatedCaseIndicator
                currentGrievance={grievance}
                previousGrievances={grievances[activeTab]}
                onGrievanceClick={(g) => setSelectedGrievance(g)}
              />
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="flex items-center gap-2">
                <span className="font-medium">ID:</span> {grievance.grievanceId}
              </p>
              <p className="flex items-center gap-2">
                <span className="font-medium">{t('common.filed')}:</span> {formatDate(grievance.createdAt)}
              </p>
              <p className="flex items-center gap-2">
                <span className="font-medium">{t('common.status')}:</span>
                <span className={getStatusBadgeClass(grievance.status)}>{t(`status.${grievance.status}`)}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedGrievance(grievance);
                setShowDetails(true);
              }}
              className="btn btn-primary"
            >
              <FaEye className="mr-2" /> {t('official.viewDetails')}
            </button>
            {(activeTab === 'assigned' || activeTab === 'inProgress') && !grievance.isResolved && (
              <button
                onClick={() => handleViewChat(grievance)}
                className="btn btn-secondary"
              >
                <FaComments className="mr-2" /> {t('common.chat')}
              </button>
            )}
          </div>
        </div>
        <p className="text-gray-700 mb-4 line-clamp-2">{grievance.description}</p>
        <div className="flex justify-end gap-2">
          {activeTab === 'pending' && (
            <>
              <button
                onClick={() => handleAcceptGrievance(grievance._id)}
                className="btn btn-success"
              >
                <FaCheck className="mr-2" /> {t('official.accept')}
              </button>
              <button
                onClick={() => {
                  setSelectedGrievance(grievance);
                  setShowDeclineModal(true);
                }}
                className="btn btn-danger"
              >
                <FaTimes className="mr-2" /> {t('official.decline')}
              </button>
            </>
          )}
          {activeTab === 'assigned' && (
            <button
              onClick={() => {
                setSelectedGrievance(grievance);
                setShowResourceModal(true);
              }}
              className="btn btn-primary"
            >
              <FaTools className="mr-2" /> {t('official.resourceTitle')}
            </button>
          )}
          {activeTab === 'inProgress' && (
            <>
              <button
                onClick={() => {
                  setSelectedGrievance(grievance);
                  setShowTimelineModal(true);
                }}
                className="btn btn-primary"
              >
                <FaClock className="mr-2" /> {t('official.updateTimeline')}
              </button>
              <button
                onClick={() => handleResolveGrievance(grievance._id)}
                className="btn btn-success"
              >
                <FaCheckCircle className="mr-2" /> {t('official.markResolved')}
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="department-header bg-primary text-white p-3 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <h2 className="mb-0">{t('official.deptTitle', { dept: t('dept.Electricity') })}</h2>
          <span className="badge bg-info ms-2">
            {t('official.jurisdiction')}: {user?.taluk || t('common.na')}, {user?.district || t('common.na')}, {user?.division || t('common.na')}
          </span>
        </div>
        <div className="d-flex align-items-center gap-3">
          {/* Notification Bell */}
          {user && (
            <div className="position-relative">
              <NotificationBell
                userId={user.id}
                userRole={user.role}
              />
            </div>
          )}

          {/* User Profile */}
          <Dropdown>
            <Dropdown.Toggle variant="light" className="d-flex align-items-center">
              <FaUser className="me-2" />
              {email}
              <span className="badge bg-secondary ms-2">{t('dept.Electricity')}</span>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => navigate('/official-dashboard/electricity/settings')}>
                <FaTools className="me-2" />
                {t('nav.settings')}
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => {
                logout();
                navigate('/login');
              }} className="text-danger">
                <FaSignOutAlt className="me-2" />
                {t('nav.logout')}
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content p-4">
        {/* Stats Section */}
        <div className="stats-container mb-4">
          <div className="row">
            <div className="col-md-3">
              <div className="stat-card" onClick={() => setActiveTab("pending")}>
                <div className={`card ${activeTab === "pending" ? 'border-primary' : ''}`}>
                  <div className="card-body">
                    <h5 className="card-title">{t('status.pending')}</h5>
                    <h2 className="card-text">{stats.pending}</h2>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card" onClick={() => setActiveTab("assigned")}>
                <div className={`card ${activeTab === "assigned" ? 'border-primary' : ''}`}>
                  <div className="card-body">
                    <h5 className="card-title">{t('status.assigned')}</h5>
                    <h2 className="card-text">{stats.assigned}</h2>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card" onClick={() => setActiveTab("inProgress")}>
                <div className={`card ${activeTab === "inProgress" ? 'border-primary' : ''}`}>
                  <div className="card-body">
                    <h5 className="card-title">{t('status.in-progress')}</h5>
                    <h2 className="card-text">{stats.inProgress}</h2>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card" onClick={() => setActiveTab("resolved")}>
                <div className={`card ${activeTab === "resolved" ? 'border-primary' : ''}`}>
                  <div className="card-body">
                    <h5 className="card-title">{t('status.resolved')}</h5>
                    <h2 className="card-text">{stats.resolved}</h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-container mb-4">
          <div className="row">
            <div className="col-md-8">
              <div className="input-group">
                <span className="input-group-text">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder={t('petitioner.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">{t('official.allPriorities')}</option>
                <option value="High">{t('official.highPriority')}</option>
                <option value="Medium">{t('official.mediumPriority')}</option>
                <option value="Low">{t('official.lowPriority')}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="content-area">
          <main className="main-content w-100">
            <div className="page-header">
              <h1>{t('official.grievances')}</h1>
            </div>

            <div className="tab-container">
              <div className="tabs">
                <button
                  className={`tab ${activeTab === "pending" ? "active" : ""}`}
                  onClick={() => setActiveTab("pending")}
                >
                  {t('status.pending')}
                </button>
                <button
                  className={`tab ${activeTab === "assigned" ? "active" : ""}`}
                  onClick={() => setActiveTab("assigned")}
                >
                  {t('status.assigned')}
                </button>
                <button
                  className={`tab ${activeTab === "inProgress" ? "active" : ""}`}
                  onClick={() => setActiveTab("inProgress")}
                >
                  {t('status.in-progress')}
                </button>
                <button
                  className={`tab ${activeTab === "resolved" ? "active" : ""}`}
                  onClick={() => setActiveTab("resolved")}
                >
                  {t('status.resolved')}
                </button>
              </div>

              <div className="grievances-list">
                {loading ? (
                  <div className="loading">{t('common.loading')}</div>
                ) : error ? (
                  <div className="error">{error}</div>
                ) : grievances[activeTab].length === 0 ? (
                  <div className="no-grievances">
                    <h4>{t('common.noGrievances')}</h4>
                  </div>
                ) : (
                  grievances[activeTab].map((grievance) => renderGrievanceCard(grievance))
                )}
              </div>
            </div>
          </main>

          {showDetails && renderDetailsModal()}
        </div>
      </div>

      {/* Decline Modal */}
      {showDeclineModal && selectedGrievance && (
        <div className="modal">
          <div className="modal-content">
            <h3>{t('official.declineTitle')}</h3>
            <p>{t('official.declineReasonLabel')}</p>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="form-control mb-3"
              rows="4"
              placeholder={t('official.declinePlaceholder')}
            />
            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowDeclineModal(false);
                  setDeclineReason('');
                }}
                className="btn btn-secondary"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => handleDeclineGrievance(selectedGrievance._id)}
                className="btn btn-danger"
              >
                {t('official.decline')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resource Modal */}
      {showResourceModal && selectedGrievance && (
        <div className="modal">
          <div className="modal-content">
            <h3>{t('official.resourceTitle')}</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleResourceSubmit(selectedGrievance._id);
            }}>
              <div className="form-group">
                <label>{t('resource.startDate')}</label>
                <input
                  type="date"
                  value={resourceForm.startDate}
                  onChange={(e) => setResourceForm(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t('resource.endDate')}</label>
                <input
                  type="date"
                  value={resourceForm.endDate}
                  onChange={(e) => setResourceForm(prev => ({ ...prev, endDate: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t('resource.requirements')}</label>
                <textarea
                  value={resourceForm.requirementsNeeded}
                  onChange={(e) => setResourceForm(prev => ({ ...prev, requirementsNeeded: e.target.value }))}
                  required
                  placeholder={t('official.requirementsPlaceholder')}
                />
              </div>
              <div className="form-group">
                <label>{t('resource.fundsRupees')}</label>
                <input
                  type="number"
                  value={resourceForm.fundsRequired}
                  onChange={(e) => setResourceForm(prev => ({ ...prev, fundsRequired: e.target.value }))}
                  required
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>{t('resource.materials')}</label>
                <textarea
                  value={resourceForm.resourcesRequired}
                  onChange={(e) => setResourceForm(prev => ({ ...prev, resourcesRequired: e.target.value }))}
                  required
                  placeholder={t('official.resourcesPlaceholder')}
                />
              </div>
              <div className="form-group">
                <label>{t('resource.manpower')}</label>
                <input
                  type="number"
                  value={resourceForm.manpowerNeeded}
                  onChange={(e) => setResourceForm(prev => ({ ...prev, manpowerNeeded: e.target.value }))}
                  required
                  min="0"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowResourceModal(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('common.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Timeline Modal */}
      {showTimelineModal && selectedGrievance && (
        <div className="modal">
          <div className="modal-content">
            <h3>{t('official.updateTimeline')}</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleTimelineSubmit(selectedGrievance._id);
            }}>
              <div className="form-group">
                <label>{t('official.stage')}</label>
                <select
                  value={timelineForm.stageName}
                  onChange={(e) => setTimelineForm(prev => ({ ...prev, stageName: e.target.value }))}
                  required
                >
                  <option value="">{t('official.selectStage')}</option>
                  <option value="Under Review">{t('stage.review')}</option>
                  <option value="Investigation">{t('stage.investigation')}</option>
                  <option value="Resolution">{t('stage.resolution')}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t('official.date')}</label>
                <input
                  type="date"
                  value={timelineForm.date}
                  onChange={(e) => setTimelineForm(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t('form.description')}</label>
                <textarea
                  value={timelineForm.description}
                  onChange={(e) => setTimelineForm(prev => ({ ...prev, description: e.target.value }))}
                  required
                  placeholder={t('official.stagePlaceholder')}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTimelineModal(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('official.saveStage')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && selectedGrievance && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Chat - Grievance {selectedGrievance.grievanceId}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowChat(false);
                    setSelectedGrievance(null);
                  }}
                ></button>
              </div>
              <div className="modal-body" style={{ height: '500px', padding: 0 }}>
                <ChatComponent
                  grievanceId={selectedGrievance._id}
                  petitionerId={selectedGrievance.petitioner?._id || selectedGrievance.petitioner}
                  officialId={user.id}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElectricityDashboard;