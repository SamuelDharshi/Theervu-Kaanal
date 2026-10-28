import React from 'react';
import { useT } from '../i18n/LanguageContext';
import { Nav } from 'react-bootstrap';
import { LayoutDashboard, AlertTriangle, Database, Settings, LogOut, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminSidebar = ({ activeTab, onTabChange }) => {
    const navigate = useNavigate();
    const { t } = useT();

    const handleNavigation = (path) => {
        switch (path) {
            case 'dashboard':
                navigate('/admin/dashboard');
                break;
            case 'escalated':
                navigate('/admin/escalated');
                break;
            case 'resource':
                navigate('/admin/resource-management');
                break;
            case 'settings':
                navigate('/admin/settings');
                break;
            case 'smart-query':
                navigate('/admin/smart-query');
                break;
            default:
                navigate('/admin/dashboard');
        }
    };

    return (
        <div className="sidebar bg-dark text-white" style={{
            width: '250px',
            minHeight: '100vh',
            position: 'sticky',
            top: 0,
            paddingTop: '1rem'
        }}>
            <div className="px-3 py-2 mb-4">
                <h5 className="mb-0 text-white">{t('admin.panel')}</h5>
            </div>

            <Nav className="flex-column">
                <Nav.Link
                    onClick={() => handleNavigation('dashboard')}
                    className={`d-flex align-items-center px-3 py-2 mb-1 ${activeTab === 'dashboard' ? 'active bg-primary' : 'text-white-50'}`}
                    style={{ cursor: 'pointer' }}
                >
                    <LayoutDashboard size={20} className="me-2" />
                    <span>{t('nav.dashboard')}</span>
                </Nav.Link>

                <Nav.Link
                    onClick={() => handleNavigation('escalated')}
                    className={`d-flex align-items-center px-3 py-2 mb-1 ${activeTab === 'escalated' ? 'active bg-primary' : 'text-white-50'}`}
                    style={{ cursor: 'pointer' }}
                >
                    <AlertTriangle size={20} className="me-2" />
                    <span>{t('admin.escalatedCases')}</span>
                </Nav.Link>

                <Nav.Link
                    onClick={() => handleNavigation('resource')}
                    className={`d-flex align-items-center px-3 py-2 mb-1 ${activeTab === 'resource' ? 'active bg-primary' : 'text-white-50'}`}
                    style={{ cursor: 'pointer' }}
                >
                    <Database size={20} className="me-2" />
                    <span>{t('admin.resources')}</span>
                </Nav.Link>

                <Nav.Link
                    onClick={() => handleNavigation('smart-query')}
                    className={`d-flex align-items-center px-3 py-2 mb-1 ${activeTab === 'smart-query' ? 'active bg-primary' : 'text-white-50'}`}
                    style={{ cursor: 'pointer' }}
                >
                    <MessageSquare size={20} className="me-2" />
                    <span>{t('admin.smartQuery')}</span>
                </Nav.Link>

                <Nav.Link
                    onClick={() => handleNavigation('settings')}
                    className={`d-flex align-items-center px-3 py-2 mb-1 ${activeTab === 'settings' ? 'active bg-primary' : 'text-white-50'}`}
                    style={{ cursor: 'pointer' }}
                >
                    <Settings size={20} className="me-2" />
                    <span>{t('nav.settings')}</span>
                </Nav.Link>

                <div className="mt-auto">
                    <Nav.Link
                        onClick={() => navigate('/logout')}
                        className="d-flex align-items-center px-3 py-2 text-danger mt-5"
                        style={{ cursor: 'pointer' }}
                    >
                        <LogOut size={20} className="me-2" />
                        <span>{t('nav.logout')}</span>
                    </Nav.Link>
                </div>
            </Nav>
        </div>
    );
};

export default AdminSidebar;
