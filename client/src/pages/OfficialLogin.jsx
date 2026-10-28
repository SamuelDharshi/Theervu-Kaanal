import React, { useState } from "react";
import { useT } from '../i18n/LanguageContext';
import { Link } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const OfficialLogin = () => {
    const { login } = useAuth();
    const { t } = useT();
    const [formData, setFormData] = useState({
        employeeId: "",
        email: "",
        password: "",
        department: ""
    });
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

        if (!formData.employeeId.trim()) {
            tempErrors.employeeId = "validation.employeeIdRequired";
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

        if (!formData.department) {
            tempErrors.department = "validation.departmentRequired";
            formIsValid = false;
        }

        setErrors(tempErrors);
        return formIsValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            await login(formData.email, formData.password, formData.department, formData.employeeId);
        } catch (error) {
            console.error('Login error:', error);
            setServerError(error.message || t('common.serverError'));
        }
    };

    return (
        <AuthShell
            role={t('login.official.role')}
            title={t('login.official.title')}
            lede={t('login.official.lede')}
            back="/login"
            backLabel={t('login.allOptions')}
            accentThread={3}
        >
            {serverError && <div className="alert alert-danger" role="alert">{serverError}</div>}
            <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                    <label htmlFor="employeeId" className="form-label">{t('form.employeeId')}</label>
                    <input
                        type="text"
                        className={`form-control ${errors.employeeId ? "is-invalid" : ""}`}
                        id="employeeId"
                        name="employeeId"
                        value={formData.employeeId}
                        onChange={handleChange}
                        autoComplete="username"
                    />
                    {errors.employeeId && <div className="invalid-feedback">{t(errors.employeeId)}</div>}
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
                <div className="mb-3">
                    <label htmlFor="department" className="form-label">{t('common.department')}</label>
                    <select
                        className={`form-select ${errors.department ? "is-invalid" : ""}`}
                        id="department"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                    >
                        <option value="">{t('form.selectDepartment')}</option>
                        <option value="Water">{t('dept.Water')}</option>
                        <option value="RTO">{t('dept.RTO')}</option>
                        <option value="Electricity">{t('dept.Electricity')}</option>
                    </select>
                    {errors.department && <div className="invalid-feedback">{t(errors.department)}</div>}
                </div>
                <button type="submit" className="btn btn-primary btn-lg tk-auth__submit">
                    {t('nav.signIn')} <ArrowRight size={18} aria-hidden="true" />
                </button>
            </form>
            <p className="tk-auth__alt">{t('login.official.newToDesk')} <Link to="/register/official">{t('login.official.registerLink')}</Link></p>
        </AuthShell>
    );
};

export default OfficialLogin;