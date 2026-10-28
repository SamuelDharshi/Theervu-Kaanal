import React, { useState } from 'react';
import { useT } from '../i18n/LanguageContext';
import { useNavigate, Link, Link as RouterLink } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import toast from 'react-hot-toast';
import { API_BASE } from '../config';

const AdminRegistration = () => {
  const navigate = useNavigate();
  const { t } = useT();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    adminId: '',
    position: '',
    securityKey: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateForm = () => {
    let tempErrors = {};
    let formIsValid = true;

    if (!formData.firstName.trim()) {
      tempErrors.firstName = 'validation.firstNameRequired';
      formIsValid = false;
    }

    if (!formData.lastName.trim()) {
      tempErrors.lastName = 'validation.lastNameRequired';
      formIsValid = false;
    }

    if (!formData.email.trim()) {
      tempErrors.email = 'validation.emailRequired';
      formIsValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'validation.emailInvalid';
      formIsValid = false;
    }

    if (!formData.phone.trim()) {
      tempErrors.phone = 'validation.phoneRequired';
      formIsValid = false;
    } else if (!/^\d{10}$/.test(formData.phone)) {
      tempErrors.phone = 'validation.phoneDigits';
      formIsValid = false;
    }

    if (!formData.adminId.trim()) {
      tempErrors.adminId = 'validation.adminIdRequired';
      formIsValid = false;
    }

    if (!formData.position.trim()) {
      tempErrors.position = 'validation.positionRequired';
      formIsValid = false;
    }

    if (!formData.password) {
      tempErrors.password = 'validation.passwordRequired';
      formIsValid = false;
    } else if (formData.password.length < 8) {
      tempErrors.password = 'validation.passwordMin8';
      formIsValid = false;
    } else if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/.test(formData.password)) {
      tempErrors.password = 'validation.passwordComplex';
      formIsValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      tempErrors.confirmPassword = 'validation.passwordMismatch';
      formIsValid = false;
    }

    setErrors(tempErrors);
    return formIsValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        const response = await fetch(`${API_BASE}/api/admin/register`, {  // Use your actual backend URL
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),  // Ensure formData contains username, email, password
        });

        const data = await response.json();

        if (response.ok) {
          toast.success(t('register.success'));
          navigate('/login/admin'); // Redirect to login after successful registration
        } else {
          toast.error(data.message || t('register.failed'));
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        toast.error(t('common.serverError'));
      }
    }
  };


  return (
    <AuthShell
      role={t('login.admin.role')}
      title={t('register.admin.title')}
      lede={t('register.admin.lede')}
      back="/register"
      backLabel={t('register.allTypes')}
      accentThread={5}
      wide
    >

      <div className="alert alert-warning" role="alert">
        <strong>{t('register.admin.importantLabel')}</strong> {t('register.admin.important')}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row g-3">
          <div className="col-md-6">
            <label htmlFor="firstName" className="form-label">{t('form.firstName')}*</label>
            <input
              type="text"
              className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
            />
            {errors.firstName && <div className="invalid-feedback">{t(errors.firstName)}</div>}
          </div>

          <div className="col-md-6">
            <label htmlFor="lastName" className="form-label">{t('form.lastName')}*</label>
            <input
              type="text"
              className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
            />
            {errors.lastName && <div className="invalid-feedback">{t(errors.lastName)}</div>}
          </div>
        </div>

        <div className="row g-3 mt-1">
          <div className="col-md-6">
            <label htmlFor="email" className="form-label">{t('form.email')}*</label>
            <input
              type="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <div className="invalid-feedback">{t(errors.email)}</div>}
          </div>

          <div className="col-md-6">
            <label htmlFor="phone" className="form-label">{t('form.phone')}*</label>
            <input
              type="tel"
              className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
            {errors.phone && <div className="invalid-feedback">{t(errors.phone)}</div>}
          </div>
        </div>

        <div className="row g-3 mt-1">
          <div className="col-md-6">
            <label htmlFor="adminId" className="form-label">{t('form.adminId')}*</label>
            <input
              type="text"
              className={`form-control ${errors.adminId ? 'is-invalid' : ''}`}
              id="adminId"
              name="adminId"
              value={formData.adminId}
              onChange={handleChange}
              placeholder={t('register.admin.adminIdPlaceholder')}
            />
            {errors.adminId && <div className="invalid-feedback">{t(errors.adminId)}</div>}
          </div>

          <div className="col-md-6">
            <label htmlFor="position" className="form-label">{t('form.position')}*</label>
            <input
              type="text"
              className={`form-control ${errors.position ? 'is-invalid' : ''}`}
              id="position"
              name="position"
              value={formData.position}
              onChange={handleChange}
              placeholder={t('register.admin.positionPlaceholder')}
            />
            {errors.position && <div className="invalid-feedback">{t(errors.position)}</div>}
          </div>
        </div>

        {/* <div className="mt-3"> */}
        {/* <label htmlFor="securityKey" className="form-label">{t('form.securityKey')}*</label> */}
        {/* <input
            type="password"
            className={`form-control ${errors.securityKey ? 'is-invalid' : ''}`}
            id="securityKey"
            name="securityKey"
            value={formData.securityKey}
            onChange={handleChange}
            placeholder="Enter your administrator security key"
          /> */}
        {/* {errors.securityKey && <div className="invalid-feedback">{t(errors.securityKey)}</div>}
          <small className="form-text text-muted">The security key is provided by existing administrators.</small>
        </div> */}

        <div className="row g-3 mt-3">
          <div className="col-md-6">
            <label htmlFor="password" className="form-label">{t('form.password')}*</label>
            <input
              type="password"
              className={`form-control ${errors.password ? 'is-invalid' : ''}`}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
            />
            {errors.password && <div className="invalid-feedback">{t(errors.password)}</div>}
            <small className="form-text text-muted">Password must be at least 8 characters and include uppercase, lowercase, number, and special character.</small>
          </div>

          <div className="col-md-6">
            <label htmlFor="confirmPassword" className="form-label">{t('form.confirmPassword')}*</label>
            <input
              type="password"
              className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            {errors.confirmPassword && <div className="invalid-feedback">{t(errors.confirmPassword)}</div>}
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-12">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="terms"
                required
              />
              <label className="form-check-label" htmlFor="terms">
                {t('register.agreeBefore')} <RouterLink to="/terms-and-conditions" target="_blank">{t('register.termsOfService')}</RouterLink>, <RouterLink to="/privacy-policy" target="_blank">{t('footer.privacy')}</RouterLink> {t('register.admin.andSecurity')}
              </label>
            </div>

            <div className="form-check mt-2">
              <input
                className="form-check-input"
                type="checkbox"
                id="responsibility"
                required
              />
              <label className="form-check-label" htmlFor="responsibility">
                {t('register.admin.responsibility')}
              </label>
            </div>
          </div>
        </div>

        <div className="d-grid gap-2 mt-4">
          <button type="submit" className="btn btn-danger btn-lg">
            {t('register.admin.submit')}
          </button>
        </div>
      </form>
      <p className="tk-auth__alt">
        {t('register.already')} <Link to="/login/admin">{t('nav.signIn')}</Link>
      </p>
    </AuthShell>
  );
};

export default AdminRegistration;