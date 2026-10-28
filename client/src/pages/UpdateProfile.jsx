import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/NavBar';
import Footer from '../shared/Footer';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Save } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useT } from '../i18n/LanguageContext';

const UpdateProfile = () => {
    const { user, authenticatedFetch, updateUser } = useAuth();
    const { t } = useT();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
    });

    useEffect(() => {
        if (user) {
            setProfileData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.phone || '',
            });
        }
    }, [user]);

    const getSettingsPath = () => {
        if (!user) return '/';
        switch (user.role?.toLowerCase()) {
            case 'admin':
                return '/admin/settings';
            case 'official':
                switch (user.department?.toLowerCase()) {
                    case 'rto':
                        return '/official-dashboard/rto/settings';
                    case 'water':
                        return '/official-dashboard/water/settings';
                    case 'electricity':
                        return '/official-dashboard/electricity/settings';
                    default:
                        return '/official/settings';
                }
            case 'petitioner':
                return '/petitioner/settings';
            default:
                return '/';
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await authenticatedFetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profileData)
            });

            const updatedUser = await response.json();
            updateUser(updatedUser);
            toast.success(t('settings.profileUpdated'));
            navigate(getSettingsPath());

        } catch (error) {
            toast.error(error.message || t('settings.profileFailed'));
            console.error('Profile update error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="min-vh-100 d-flex flex-column">
            <NavBar />
            <div className="container py-4 flex-grow-1">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-8 col-lg-6">
                        <div className={`card shadow-sm ${theme === 'dark' ? 'text-bg-dark' : ''}`}>
                            <div className="card-header bg-body-tertiary">
                                <h3 className="mb-0">{t('settings.editProfile')}</h3>
                            </div>
                            <div className="card-body">
                                <form onSubmit={handleProfileUpdate}>
                                    <div className="text-center mb-4">
                                        <img 
                                            src={`https://ui-avatars.com/api/?name=${profileData.firstName}+${profileData.lastName}&background=random&size=128`} 
                                            alt="profile" 
                                            className="rounded-circle"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="firstName" className="form-label">{t('form.firstName')}</label>
                                        <div className="input-group">
                                            <span className="input-group-text"><User /></span>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="firstName"
                                                name="firstName"
                                                value={profileData.firstName}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="lastName" className="form-label">{t('form.lastName')}</label>
                                        <div className="input-group">
                                            <span className="input-group-text"><User /></span>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="lastName"
                                                name="lastName"
                                                value={profileData.lastName}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="email" className="form-label">{t('form.email')}</label>
                                        <div className="input-group">
                                            <span className="input-group-text"><Mail /></span>
                                            <input
                                                type="email"
                                                className="form-control"
                                                id="email"
                                                name="email"
                                                value={profileData.email}
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="phone" className="form-label">{t('form.phone')}</label>
                                        <div className="input-group">
                                            <span className="input-group-text"><Phone /></span>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="phone"
                                                name="phone"
                                                value={profileData.phone}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                                        <Save className="me-2" size={16} />
                                        {loading ? t('common.updating') : t('settings.save')}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default UpdateProfile; 