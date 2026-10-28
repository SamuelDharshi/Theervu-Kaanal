import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getRedirectPath } from "../utils/authUtils";

const PetitionerLogin = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({ email: "", password: "" });
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
            // Use the login function from AuthContext
            await login(formData.email, formData.password);

            // Log success for debugging
            console.log('Login successful');

            // Check if there's a redirect path stored
            const redirectPath = localStorage.getItem('redirectAfterLogin');
            if (redirectPath) {
                localStorage.removeItem('redirectAfterLogin'); // Clear the stored path
                navigate(redirectPath);
            } else {
                // Default navigation to dashboard
                navigate(getRedirectPath('petitioner'));
            }
        } catch (error) {
            console.error('Login error:', error);
            setServerError(error.message || "Server error. Please try again later.");
        }
    };

    return (
        <AuthShell
            role="For citizens filing and tracking petitions"
            title="Sign in to file and track"
            lede="Your petitions, their timelines and your chats with officials are in one place."
            back="/login"
            backLabel="All sign-in options"
            accentThread={1}
        >
            {serverError && <div className="alert alert-danger" role="alert">{serverError}</div>}
            <form onSubmit={handleSubmit} noValidate>
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
            <p className="tk-auth__alt">No account yet? <Link to="/register/petitioner">Create one</Link></p>
        </AuthShell>
    );
};

export default PetitionerLogin;