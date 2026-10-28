import React, { useState } from 'react';
import { useT } from '../i18n/LanguageContext';
import { useNavigate, Link, Link as RouterLink } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import toast from 'react-hot-toast';
import { API_BASE } from '../config';

const PetitionerRegistration = () => {
  const navigate = useNavigate();
  const { t } = useT();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
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

    if (!formData.password) {
      tempErrors.password = 'validation.passwordRequired';
      formIsValid = false;
    } else if (formData.password.length < 6) {
      tempErrors.password = 'validation.passwordMin6';
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
        const response = await fetch(`${API_BASE}/api/petitioner/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (response.ok) {
          toast.success(t('register.success'));
          navigate('/login/petitioner');
        } else {
          toast.error(data.message || t('register.failed'));
        }
      } catch (error) {
        console.error("Error during registration:", error);
        toast.error(t('common.serverError'));
      }
    }
  };

  return (
    <AuthShell
      role={t('login.petitioner.role')}
      title={t('register.petitioner.title')}
      lede={t('register.petitioner.lede')}
      back="/register"
      backLabel={t('register.allTypes')}
      accentThread={1}
      wide
    >

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

        <div className="mt-3">
          <label htmlFor="address" className="form-label">{t('form.address')}</label>
          <input
            type="text"
            className="form-control"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
          />
        </div>

        <div className="row g-3 mt-1">
          <div className="col-md-6">
            <label htmlFor="city" className="form-label">{t('form.city')}</label>
            <input
              type="text"
              className="form-control"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-3">
            <label htmlFor="state" className="form-label">{t('form.state')}</label>
            <select
              className="form-select"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
            >
              <option value="">{t('form.choose')}</option>
              <option value="TN">{t('form.tamilNadu')}</option>
            </select>
          </div>

          <div className="col-md-3">
            <label htmlFor="pincode" className="form-label">{t('form.pincode')}</label>
            <input
              type="text"
              className="form-control"
              id="pincode"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
            />
          </div>
        </div>

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
                {t('register.agreeBefore')} <RouterLink to="/terms-and-conditions">{t('register.termsOfService')}</RouterLink> {t('register.and')} <RouterLink to="/privacy-policy">{t('footer.privacy')}</RouterLink>{t('register.agreeAfter')}
              </label>
            </div>
          </div>
        </div>

        <div className="d-grid gap-2 mt-4">
          <button type="submit" className="btn btn-primary btn-lg">
            {t('register.petitioner.submit')}
          </button>
        </div>
      </form>
      <p className="tk-auth__alt">
        {t('register.already')} <Link to="/login/petitioner">{t('nav.signIn')}</Link>
      </p>
    </AuthShell>
  );
};

export default PetitionerRegistration;