import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getRedirectPath } from "../utils/authUtils";

// Dummy admin user for testing
const adminUser = {
    adminId: "admin001",
    email: "admin@example.com",
    password: "admin123",
    role: "admin",
};

const AdminLogin = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
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
            tempErrors.adminId = "Admin ID is required";
            formIsValid = false;
        }

        if (!formData.email.trim()) {
            tempErrors.email = "Email is required";
            formIsValid = false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            tempErrors.email = "Invalid email format";
            formIsValid = false;
        }

        if (!formData.password) {
            tempErrors.password = "Password is required";
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
            setServerError(error.message || "Login failed");
        }
    };

    return (
        <AuthShell
            role="For the grievance cell: escalations, analytics and Smart Query"
            title="Grievance cell sign in"
            lede="Escalated petitions land here first."
            back="/login"
            backLabel="All sign-in options"
            accentThread={5}
        >
            {serverError && <div className="alert alert-danger" role="alert">{serverError}</div>}
            <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                    <label htmlFor="adminId" className="form-label">Admin ID</label>
                    <input
                        type="text"
                        className={`form-control ${errors.adminId ? "is-invalid" : ""}`}
                        id="adminId"
                        name="adminId"
                        value={formData.adminId}
                        onChange={handleChange}
                        autoComplete="username"
                    />
                    {errors.adminId && <div className="invalid-feedback">{errors.adminId}</div>}
                </div>
                <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                        type="email"
                        className={`form-control ${errors.email ? "is-invalid" : ""}`}
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        autoComplete="email"
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>
                <div className="mb-3">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input
                        type="password"
                        className={`form-control ${errors.password ? "is-invalid" : ""}`}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        autoComplete="current-password"
                    />
                    {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                </div>
                <button type="submit" className="btn btn-primary btn-lg tk-auth__submit">
                    Sign in <ArrowRight size={18} aria-hidden="true" />
                </button>
            </form>
            <p className="tk-auth__alt">Need access? <Link to="/register/admin">Register as an admin</Link></p>
        </AuthShell>
    );
};

export default AdminLogin;