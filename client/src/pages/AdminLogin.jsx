import React, { useState } from "react";
import { useT } from '../i18n/LanguageContext';
import { Link } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const AdminLogin = () => {
    const { login } = useAuth();
    const { t } = useT();
    const [formData, setFormData] = useState({ adminId: "", email: "", password: "" });
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        // Clear error when user starts typing
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: "" });
        }
    };

    const validateForm = () => {
        let tempErrors = {};
        let formIsValid = true;

        if (!formData.adminId.trim()) {
            tempErrors.adminId = "validation.adminIdRequired";
            formIsValid = false;
        }

        if (!formData.email.trim()) {
            tempErrors.email = "validation.emailRequired";
            formIsValid = false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            tempErrors.email = "validation.emailInvalid";
            formIsValid = false;
        }

        if (!formData.password) {
            tempErrors.password = "validation.passwordRequired";
            formIsValid = false;
        }

        setErrors(tempErrors);
        return formIsValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            // Use the AuthContext login function directly
            await login(formData.email, formData.password, null, null, formData.adminId);
        } catch (error) {
            setServerError(error.message || t('common.loginFailed'));
        }
    };

    return (
        <AuthShell
            role={t('login.admin.role')}
            title={t('login.admin.title')}
            lede={t('login.admin.lede')}
            back="/login"
            backLabel={t('login.allOptions')}
            accentThread={5}
        >
            {serverError && <div className="alert alert-danger" role="alert">{serverError}</div>}
            <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                    <label htmlFor="adminId" className="form-label">{t('form.adminId')}</label>
                    <input
                        type="text"
                        className={`form-control ${errors.adminId ? "is-invalid" : ""}`}
                        id="adminId"
                        name="adminId"
                        value={formData.adminId}
                        onChange={handleChange}
                        autoComplete="username"
                    />
                    {errors.adminId && <div className="invalid-feedback">{t(errors.adminId)}</div>}
                </div>
                <div className="mb-3">
                    <label htmlFor="email" className="form-label">{t('form.email')}</label>
                    <input
                        type="email"
                        className={`form-control ${errors.email ? "is-invalid" : ""}`}
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        autoComplete="email"
                    />
                    {errors.email && <div className="invalid-feedback">{t(errors.email)}</div>}
                </div>
                <div className="mb-3">
                    <label htmlFor="password" className="form-label">{t('form.password')}</label>
                    <input
                        type="password"
                        className={`form-control ${errors.password ? "is-invalid" : ""}`}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        autoComplete="current-password"
                    />
                    {errors.password && <div className="invalid-feedback">{t(errors.password)}</div>}
                </div>
                <button type="submit" className="btn btn-primary btn-lg tk-auth__submit">
                    {t('nav.signIn')} <ArrowRight size={18} aria-hidden="true" />
                </button>
            </form>
            <p className="tk-auth__alt">{t('login.admin.needAccess')} <Link to="/register/admin">{t('login.admin.registerLink')}</Link></p>
        </AuthShell>
    );
};

export default AdminLogin;