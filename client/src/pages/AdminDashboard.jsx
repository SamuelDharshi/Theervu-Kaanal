import React, { useState, useEffect } from "react";
import { useT } from '../i18n/LanguageContext';
import { useLocation, useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import AdminSidebar from '../components/AdminSidebar';
import SmartQueryChatbot from '../components/SmartQueryChatbot';
import { Bar, BarChart, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid } from "recharts";
import { Container, Row, Col, Card, Button, Table, Modal, Form } from "react-bootstrap";
import { Bell, AlertTriangle } from "lucide-react";
import toast from 'react-hot-toast';
import api from '../utils/api';
import { engineReasons, span } from '../engine/format';

const AdminDashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t, formatDate, locale } = useT();
    const [resourceData, setResourceData] = useState([]);
    const [resourceLoading, setResourceLoading] = useState(true);
    const [resourceError, setResourceError] = useState(null);
    const [activeTab, setActiveTab] = useState(() => {
        // Set initial activeTab based on current path
        if (location.pathname === '/admin/escalated') return 'escalated';
        if (location.pathname === '/admin/resource-management') return 'resource';
        if (location.pathname === '/admin/settings') return 'settings';
        if (location.pathname === '/admin/smart-query') return 'smart-query';
        return 'dashboard';
    });
    const [escalatedGrievances, setEscalatedGrievances] = useState([]);
    const [flaggedGrievances, setFlaggedGrievances] = useState([]);
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [selectedGrievance, setSelectedGrievance] = useState(null);
    const [escalationResponse, setEscalationResponse] = useState('');
    const [newAssignedTo, setNewAssignedTo] = useState('');
    const [officials, setOfficials] = useState([]);
    const [escalatedLoading, setEscalatedLoading] = useState(false);
    const [escalatedError, setEscalatedError] = useState(null);
    const [departmentStats, setDepartmentStats] = useState([]);
    const [monthlyStats, setMonthlyStats] = useState([]);
    const [dashboardLoading, setDashboardLoading] = useState(false);
    const [dashboardError, setDashboardError] = useState(null);
    const [quickStats, setQuickStats] = useState({
        totalCases: { value: 0, trend: '0%' },
        activeCases: { value: 0, trend: '0%' },
        resolvedCases: { value: 0, trend: '0%' },
        departments: { value: 0, trend: 'Stable' }
    });

    useEffect(() => {
        // Update activeTab when route changes
        if (location.pathname === '/admin/escalated') setActiveTab('escalated');
        else if (location.pathname === '/admin/resource-management') setActiveTab('resource');
        else if (location.pathname === '/admin/settings') setActiveTab('settings');
        else if (location.pathname === '/admin/smart-query') setActiveTab('smart-query');
        else if (location.pathname === '/admin/dashboard') setActiveTab('dashboard');
    }, [location.pathname]);

    useEffect(() => {
        console.log('Active tab changed to:', activeTab);

        // Check if user is authenticated before making API calls
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');

        if (!token || !user) {
            console.log('No token or user found, redirecting to login');
            navigate('/login');
            return;
        }

        if (activeTab === 'dashboard') {
            fetchResourceData();
            fetchDashboardStats();
            fetchQuickStats();
        } else if (activeTab === 'escalated') {
            fetchEscalatedGrievances();
            fetchOfficials();
        } else if (activeTab === 'resource') {
            fetchResourceData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- load each tab's data when it is opened
    }, [activeTab]);

    const fetchResourceData = async () => {
        try {
            setResourceLoading(true);
            setResourceError(null);

            const response = await api.get('/admin/resource-management');
            setResourceData(response.data.resources);
        } catch (error) {
            console.error('Error fetching resource data:', error);
            setResourceError(t('admin.resourcesFailed'));
            if (error.message === 'AUTH_REQUIRED' || error.isAuthError) {
                // Clear any stale data
                setResourceData([]);
                navigate('/login');
            }
        } finally {
            setResourceLoading(false);
        }
    };

    const fetchEscalatedGrievances = async () => {
        try {
            setEscalatedLoading(true);
            setEscalatedError(null);

            const [escalated, flagged] = await Promise.all([
                api.get('/grievances/escalated'),
                api.get('/grievances/engine-flagged')
            ]);
            setEscalatedGrievances(escalated.data.grievances);
            setFlaggedGrievances(flagged.data.grievances || []);
        } catch (error) {
            console.error('Error fetching escalated grievances:', error);
            setEscalatedError(error.message);
            if (error.message === 'AUTH_REQUIRED' || error.isAuthError) {
                navigate('/login');
            }
        } finally {
            setEscalatedLoading(false);
        }
    };

    const fetchOfficials = async (department) => {
        try {
            const response = await api.get(`/admin/officials?department=${department}`);
            setOfficials(response.data.officials.filter(official => official.department === department));
        } catch (error) {
            console.error('Error fetching officials:', error);
            toast.error(t('admin.officialsFailed'));
            if (error.message === 'AUTH_REQUIRED' || error.isAuthError) {
                navigate('/login');
            }
        }
    };

    const handleOpenResponseModal = (grievance) => {
        setSelectedGrievance(grievance);
        // Fetch officials specific to the grievance department
        fetchOfficials(grievance.department);
        setShowResponseModal(true);
    };

    const fetchDashboardStats = async () => {
        try {
            setDashboardLoading(true);
            setDashboardError(null);

            // Fetch department performance data
            const deptResponse = await api.get('/admin/department-stats');
            setDepartmentStats(deptResponse.data.departmentStats);

            // Fetch monthly trends data
            const monthlyResponse = await api.get('/admin/monthly-stats');
            setMonthlyStats(monthlyResponse.data.monthlyStats);

        } catch (error) {
            console.error('Error fetching dashboard statistics:', error);
            setDashboardError(t('admin.statsFailed'));
            toast.error(t('admin.statsFailed'));
            if (error.message === 'AUTH_REQUIRED' || error.isAuthError) {
                // Clear any stale data
                setDepartmentStats([]);
                setMonthlyStats([]);
                navigate('/login');
            }
        } finally {
            setDashboardLoading(false);
        }
    };

    const fetchQuickStats = async () => {
        try {
            const response = await api.get('/admin/quick-stats');
            setQuickStats(response.data);
        } catch (error) {
            console.error('Error fetching quick statistics:', error);
            toast.error(t('admin.statsFailed'));
            if (error.message === 'AUTH_REQUIRED' || error.isAuthError) {
                // Reset quick stats to default values
                setQuickStats({
                    totalCases: { value: 0, trend: '0%' },
                    activeCases: { value: 0, trend: '0%' },
                    resolvedCases: { value: 0, trend: '0%' },
                    departments: { value: 0, trend: 'Stable' }
                });
                navigate('/login');
            }
        }
    };

    const handleRespondToEscalation = async () => {
        try {
            // Validate response
            if (!escalationResponse?.trim()) {
                toast.error(t('admin.responseRequired'));
                return;
            }

            if (!selectedGrievance?._id) {
                toast.error(t('admin.invalidGrievance'));
                return;
            }

            const isReassignment = !!newAssignedTo;
            const payload = {
                escalationResponse: escalationResponse.trim(),
                isReassignment,
                newAssignedTo: newAssignedTo || undefined
            };

            await api.post(`/grievances/${selectedGrievance._id}/escalation-response`, payload);

            toast.success(t('admin.responseSent'));
            setShowResponseModal(false);
            setEscalationResponse('');
            setNewAssignedTo('');
            fetchEscalatedGrievances();
        } catch (error) {
            console.error('Error responding to escalation:', error);
            toast.error(error.response?.data?.error || error.message || t('admin.responseFailed'));
            if (error.message === 'AUTH_REQUIRED' || error.isAuthError) {
                navigate('/login');
            }
        }
    };

    const handleTabChange = (tab) => {
        console.log('Changing tab to:', tab);
        setActiveTab(tab);
    };

    const getPriorityBadgeClass = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return 'danger';
            case 'medium':
                return 'warning';
            case 'low':
                return 'success';
            default:
                return 'secondary';
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'resolved':
                return 'success';
            case 'in-progress':
                return 'primary';
            case 'assigned':
                return 'info';
            case 'pending':
                return 'warning';
            default:
                return 'secondary';
        }
    };

    const renderDashboardCharts = () => (
        <Row className="mb-4">
            <Col md={6}>
                <Card className="p-3 shadow-sm">
                    <h6>{t('admin.deptPerformance')}</h6>
                    {dashboardLoading ? (
                        <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">{t('common.loading')}</span>
                            </div>
                        </div>
                    ) : dashboardError ? (
                        <div className="alert alert-danger">{dashboardError}</div>
                    ) : (
                        <BarChart
                            width={500}
                            height={300}
                            data={departmentStats}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="department" tickFormatter={(d) => t(`dept.${d}`)} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="resolved" fill="#2d6a4f" name={t('status.resolved')} barSize={50} />
                            <Bar dataKey="pending" fill="#b7791f" name={t('status.pending')} barSize={50} />
                            <Bar dataKey="inProgress" fill="#19486a" name={t('status.in-progress')} barSize={50} />
                        </BarChart>
                    )}
                </Card>
            </Col>
            <Col md={6}>
                <Card className="p-3 shadow-sm">
                    <h6>{t('admin.monthlyTrends')}</h6>
                    {dashboardLoading ? (
                        <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">{t('common.loading')}</span>
                            </div>
                        </div>
                    ) : dashboardError ? (
                        <div className="alert alert-danger">{dashboardError}</div>
                    ) : (
                        <LineChart width={400} height={250} data={monthlyStats}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="total" stroke="#141416" name={t('admin.totalCases')} />
                            <Line type="monotone" dataKey="resolved" stroke="#2d6a4f" name={t('admin.casesResolved')} />
                        </LineChart>
                    )}
                </Card>
            </Col>
        </Row>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <>
                        <div className="p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h2>{t('nav.dashboard')}</h2>
                                <div className="d-flex align-items-center gap-3">
                                    <Bell size={20} />
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <Row className="mb-4">
                            <Col xs={12} sm={6} md={3} className="mb-3 mb-md-0">
                                <Card className="p-3 shadow-sm h-100">
                                    <h6 className="text-muted">{t('admin.totalCases')}</h6>
                                    <h4>{quickStats.totalCases.value}</h4>
                                    <span className={`text-${quickStats.totalCases.trend.includes("+") ? "success" : "muted"}`}>
                                        {quickStats.totalCases.trend}
                                    </span>
                                </Card>
                            </Col>
                            <Col xs={12} sm={6} md={3} className="mb-3 mb-md-0">
                                <Card className="p-3 shadow-sm h-100">
                                    <h6 className="text-muted">{t('admin.activeCases')}</h6>
                                    <h4>{quickStats.activeCases.value}</h4>
                                    <span className={`text-${quickStats.activeCases.trend.includes("+") ? "warning" : "muted"}`}>
                                        {quickStats.activeCases.trend}
                                    </span>
                                </Card>
                            </Col>
                            <Col xs={12} sm={6} md={3} className="mb-3 mb-md-0">
                                <Card className="p-3 shadow-sm h-100">
                                    <h6 className="text-muted">{t('admin.casesResolved')}</h6>
                                    <h4>{quickStats.resolvedCases.value}</h4>
                                    <span className={`text-${quickStats.resolvedCases.trend.includes("+") ? "success" : "muted"}`}>
                                        {quickStats.resolvedCases.trend}
                                    </span>
                                </Card>
                            </Col>
                            <Col xs={12} sm={6} md={3}>
                                <Card className="p-3 shadow-sm h-100">
                                    <h6 className="text-muted">{t('admin.departments')}</h6>
                                    <h4>{quickStats.departments.value}</h4>
                                    <span className="text-muted">{quickStats.departments.trend === 'Stable' ? t('admin.stable') : quickStats.departments.trend}</span>
                                </Card>
                            </Col>
                        </Row>

                        {/* Charts */}
                        {renderDashboardCharts()}

                        {/* Resource Management Section */}
                        <Card className="shadow-sm mt-4">
                            <Card.Header>
                                <h6>{t('admin.deptResources')}</h6>
                            </Card.Header>
                            <Card.Body>
                                {resourceLoading ? (
                                    <div className="text-center">{t('admin.loadingResources')}</div>
                                ) : resourceError ? (
                                    <div className="text-danger">{resourceError}</div>
                                ) : (
                                    <Table responsive>
                                        <thead>
                                            <tr>
                                                <th>{t('common.department')}</th>
                                                <th>{t('common.grievanceId')}</th>
                                                <th>{t('form.taluk')}</th>
                                                <th>{t('form.division')}</th>
                                                <th>{t('form.district')}</th>
                                                <th>{t('resource.startDate')}</th>
                                                <th>{t('resource.endDate')}</th>
                                                <th>{t('resource.requirements')}</th>
                                                <th>{t('resource.funds')}</th>
                                                <th>{t('resource.materials')}</th>
                                                <th>{t('resource.manpower')}</th>
                                                <th>{t('common.status')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {resourceData.map((resource) => (
                                                <tr key={resource._id}>
                                                    <td>{t(`dept.${resource.department}`)}</td>
                                                    <td>{resource.petitionId}</td>
                                                    <td>{resource.taluk || t('common.na')}</td>
                                                    <td>{resource.division || t('common.na')}</td>
                                                    <td>{resource.district || t('common.na')}</td>
                                                    <td>{formatDate(resource.startDate)}</td>
                                                    <td>{formatDate(resource.endDate)}</td>
                                                    <td>{resource.requirementsNeeded}</td>
                                                    <td>₹{resource.fundsRequired.toLocaleString(locale)}</td>
                                                    <td>{resource.resourcesRequired}</td>
                                                    <td>{resource.manpowerNeeded}</td>
                                                    <td>
                                                        <span className={`badge bg-${getStatusBadgeClass(resource.status)}`}>
                                                            {t(`status.${resource.status}`)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                )}
                            </Card.Body>
                        </Card>
                    </>
                );
            case 'escalated':
                return (
                    <>
                    <Card className="shadow-sm mb-4 tk-flagged-queue">
                        <Card.Header>
                            <h6 className="mb-0">{t('admin.flaggedTitle')}</h6>
                        </Card.Header>
                        <Card.Body>
                            <p className="mb-3">
                                {t('admin.flaggedLede')}
                            </p>
                            {escalatedLoading ? (
                                <div className="text-center py-3">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">{t('common.loading')}</span>
                                    </div>
                                </div>
                            ) : flaggedGrievances.length === 0 ? (
                                <p className="text-muted mb-0">{t('admin.nothingFlagged')}</p>
                            ) : (
                                <Table responsive>
                                    <thead>
                                        <tr>
                                            <th>{t('common.grievanceId')}</th>
                                            <th>{t('form.title')}</th>
                                            <th>{t('common.department')}</th>
                                            <th>{t('common.priority')}</th>
                                            <th>{t('common.status')}</th>
                                            <th>{t('admin.openFor')}</th>
                                            <th>{t('admin.whyFlagged')}</th>
                                            <th>{t('common.assignedTo')}</th>
                                            <th>{t('common.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {flaggedGrievances.map((grievance) => (
                                            <tr key={grievance._id}>
                                                <td>{grievance.petitionId}</td>
                                                <td>{grievance.title}</td>
                                                <td>{t(`dept.${grievance.department}`)}</td>
                                                <td>
                                                    <span className={`badge bg-${getPriorityBadgeClass(grievance.priority)}`}>{t(`priority.${grievance.priority}`)}</span>
                                                </td>
                                                <td>{t(`status.${grievance.status}`)}</td>
                                                <td>{span(Date.now() - new Date(grievance.createdAt).getTime(), t)}</td>
                                                <td className="tk-flagged-queue__why">{engineReasons(grievance.engine, t).join(' ')}</td>
                                                <td>
                                                    {grievance.assignedTo
                                                        ? `${grievance.assignedTo.firstName || ''} ${grievance.assignedTo.lastName || ''}`.trim()
                                                        : t('common.notAssigned')}
                                                </td>
                                                <td>
                                                    <Button variant="danger" size="sm" onClick={() => handleOpenResponseModal(grievance)}>
                                                        {t('admin.actOnIt')}
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                    <Card className="shadow-sm">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <h6 className="mb-0">{t('admin.escalatedTitle')}</h6>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={fetchEscalatedGrievances}
                                disabled={escalatedLoading}
                            >
                                {escalatedLoading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        {t('common.loading')}
                                    </>
                                ) : (
                                    <>{t('common.refresh')}</>
                                )}
                            </Button>
                        </Card.Header>
                        <Card.Body>
                            {escalatedError ? (
                                <div className="alert alert-danger" role="alert">
                                    <AlertTriangle size={18} className="me-2" />
                                    {escalatedError}
                                </div>
                            ) : escalatedLoading ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">{t('common.loading')}</span>
                                    </div>
                                </div>
                            ) : escalatedGrievances.length === 0 ? (
                                <div className="text-center py-4 text-muted">
                                    {t('admin.noEscalated')}
                                </div>
                            ) : (
                                <Table responsive>
                                    <thead>
                                        <tr>
                                            <th>{t('common.grievanceId')}</th>
                                            <th>{t('form.title')}</th>
                                            <th>{t('common.department')}</th>
                                            <th>{t('form.taluk')}</th>
                                            <th>{t('form.division')}</th>
                                            <th>{t('form.district')}</th>
                                            <th>{t('common.status')}</th>
                                            <th>{t('common.priority')}</th>
                                            <th>{t('common.assignedTo')}</th>
                                            <th>{t('common.filed')}</th>
                                            <th>{t('admin.escalatedAt')}</th>
                                            <th>{t('admin.daysSince')}</th>
                                            <th>{t('admin.escalationReason')}</th>
                                            <th>{t('common.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {escalatedGrievances.map((grievance) => (
                                            <tr key={grievance._id}>
                                                <td>{grievance.petitionId || t('common.na')}</td>
                                                <td>
                                                    <div className="text-truncate" style={{ maxWidth: '200px' }} title={grievance.title}>
                                                        {grievance.title || t('common.na')}
                                                    </div>
                                                </td>
                                                <td>{grievance.department ? t(`dept.${grievance.department}`) : t('common.na')}</td>
                                                <td>{grievance.taluk || t('common.na')}</td>
                                                <td>{grievance.division || t('common.na')}</td>
                                                <td>{grievance.district || t('common.na')}</td>
                                                <td>
                                                    <span className={`badge bg-${getStatusBadgeClass(grievance.status)}`}>
                                                        {grievance.status ? t(`status.${grievance.status}`) : t('common.na')}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge bg-${getPriorityBadgeClass(grievance.priority)}`}>
                                                        {grievance.priority ? t(`priority.${grievance.priority}`) : t('common.na')}
                                                    </span>
                                                </td>
                                                <td>
                                                    {grievance.assignedTo ?
                                                        `${grievance.assignedTo.firstName || ''} ${grievance.assignedTo.lastName || ''}`.trim() || t('common.na') :
                                                        t('common.notAssigned')
                                                    }
                                                </td>
                                                <td>{grievance.createdAt ? formatDate(grievance.createdAt) : 'N/A'}</td>
                                                <td>{grievance.escalatedAt ? formatDate(grievance.escalatedAt) : 'N/A'}</td>
                                                <td>
                                                    {grievance.escalatedAt ?
                                                        Math.floor((new Date() - new Date(grievance.escalatedAt)) / (1000 * 60 * 60 * 24)) :
                                                        t('common.na')
                                                    }
                                                </td>
                                                <td>
                                                    <div className="text-truncate" style={{ maxWidth: '200px' }} title={grievance.escalationReason}>
                                                        {grievance.escalationReason || t('common.na')}
                                                    </div>
                                                </td>
                                                <td>
                                                    <Button
                                                        variant={grievance.escalationResponse ? "success" : "primary"}
                                                        size="sm"
                                                        onClick={() => handleOpenResponseModal(grievance)}
                                                        disabled={grievance.escalationResponse}
                                                    >
                                                        {grievance.escalationResponse ? "Responded" : "Respond"}
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                    </>
                );
            case 'resource':
                return (
                    <Container fluid>
                        <Row>
                            <Col>
                                <Card className="shadow-sm">
                                    <Card.Header>
                                        <h6>{t('admin.resources')}</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        {resourceLoading ? (
                                            <div className="text-center">{t('admin.loadingResources')}</div>
                                        ) : resourceError ? (
                                            <div className="text-danger">{resourceError}</div>
                                        ) : (
                                            <Table responsive>
                                                <thead>
                                                    <tr>
                                                        <th>{t('common.department')}</th>
                                                        <th>{t('common.grievanceId')}</th>
                                                        <th>{t('resource.requirements')}</th>
                                                        <th>{t('resource.funds')}</th>
                                                        <th>{t('resource.materials')}</th>
                                                        <th>{t('resource.manpower')}</th>
                                                        <th>{t('common.status')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {resourceData.map((resource) => (
                                                        <tr key={resource._id}>
                                                            <td>{t(`dept.${resource.department}`)}</td>
                                                            <td>{resource.petitionId}</td>
                                                            <td>{resource.requirementsNeeded}</td>
                                                            <td>₹{resource.fundsRequired.toLocaleString(locale)}</td>
                                                            <td>{resource.resourcesRequired}</td>
                                                            <td>{resource.manpowerNeeded}</td>
                                                            <td>
                                                                <span className={`badge bg-${getStatusBadgeClass(resource.status)}`}>
                                                                    {t(`status.${resource.status}`)}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Container>
                );
            case 'smart-query':
                return (
                    <Container fluid>
                        <Row>
                            <Col>
                                <Card className="shadow-sm">
                                    <Card.Body>
                                        <h4 className="mb-4">{t('admin.smartQueryTitle')}</h4>
                                        <p className="text-muted mb-4">
                                            {t('admin.smartQueryLede')}
                                        </p>
                                        <SmartQueryChatbot />
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Container>
                );
            default:
                return null;
        }
    };

    return (
        <div className="d-flex">
            <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} />
            <div className="flex-grow-1">
                <NavBar />
                <Container fluid className="py-3">
                    {renderContent()}
                </Container>
            </div>

            {/* Response Modal */}
            <Modal
                show={showResponseModal}
                onHide={() => setShowResponseModal(false)}
                style={{ zIndex: 9999 }}
                dialogClassName="modal-90w"
            >
                <Modal.Header closeButton>
                    <Modal.Title>{t('admin.respondTitle')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedGrievance && (
                        <Form>
                            {/* Grievance Details Section */}
                            <div className="grievance-details mb-4 p-3 bg-light rounded">
                                <h6 className="border-bottom pb-2 mb-3">{t('submit.grievanceDetails')}</h6>
                                <div className="mb-2">
                                    <strong>{t('common.grievanceId')}:</strong> {selectedGrievance.petitionId || t('common.na')}
                                </div>
                                <div className="mb-2">
                                    <strong>{t('form.title')}:</strong> {selectedGrievance.title}
                                </div>
                                <div className="mb-2">
                                    <strong>{t('form.description')}:</strong>
                                    <p className="text-muted mb-2">{selectedGrievance.description}</p>
                                </div>
                                <div className="mb-2">
                                    <strong>{t('common.status')}:</strong>{' '}
                                    <span className={`badge bg-${getStatusBadgeClass(selectedGrievance.status)}`}>
                                        {t(`status.${selectedGrievance.status}`)}
                                    </span>
                                </div>
                                <div className="mb-2">
                                    <strong>{t('common.priority')}:</strong>{' '}
                                    <span className={`badge bg-${getPriorityBadgeClass(selectedGrievance.priority)}`}>
                                        {t(`priority.${selectedGrievance.priority}`)}
                                    </span>
                                </div>
                                <div className="mb-2">
                                    <strong>{t('admin.escalationReason')}:</strong>
                                    <p className="text-muted mb-0">{selectedGrievance.escalationReason || engineReasons(selectedGrievance.engine, t).join(' ')}</p>
                                </div>
                            </div>

                            {/* Response Form Section */}
                            <h6 className="border-bottom pb-2 mb-3">{t('admin.responseDetails')}</h6>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('common.department')}</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={t(`dept.${selectedGrievance.department}`)}
                                    disabled
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('admin.reassignTo', { dept: t(`dept.${selectedGrievance.department}`) })}</Form.Label>
                                <Form.Select
                                    value={newAssignedTo}
                                    onChange={(e) => setNewAssignedTo(e.target.value)}
                                    required
                                >
                                    <option value="">{t('admin.selectOfficial')}</option>
                                    {officials.map((official) => (
                                        <option key={official._id} value={official._id}>
                                            {official.firstName} {official.lastName} - {official.email}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('admin.response')}</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={4}
                                    value={escalationResponse}
                                    onChange={(e) => setEscalationResponse(e.target.value)}
                                    placeholder={t('admin.responsePlaceholder')}
                                    required
                                />
                            </Form.Group>
                        </Form>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowResponseModal(false)}>
                        {t('common.cancel')}
                    </Button>
                    <Button variant="primary" onClick={handleRespondToEscalation}>
                        {t('admin.submitResponse')}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default AdminDashboard;
