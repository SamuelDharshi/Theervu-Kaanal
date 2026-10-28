import React, { useState } from 'react';
import { useT } from '../i18n/LanguageContext';
import { useNavigate, Link, Link as RouterLink } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import LocationDropdowns from '../components/LocationDropdowns';
import { API_BASE } from '../config';

const OfficialRegistration = () => {
  const navigate = useNavigate();
  const { t } = useT();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    employeeId: '',
    department: '',
    designation: '',
    city: '',
    state: '',
    pincode: '',
    taluk: '',
    district: '',
    division: '',
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

  const handleLocationChange = ({ district, division, taluk }) => {
    setFormData(prev => ({
      ...prev,
      district,
      division,
      taluk
    }));
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

    if (!formData.employeeId.trim()) {
      tempErrors.employeeId = 'validation.employeeIdRequired';
      formIsValid = false;
    }

    if (!formData.department.trim()) {
      tempErrors.department = 'validation.departmentRequired';
      formIsValid = false;
    }

    if (!formData.designation.trim()) {
      tempErrors.designation = 'validation.designationRequired';
      formIsValid = false;
    }

    if (!formData.taluk.trim()) {
      tempErrors.taluk = 'validation.talukRequired';
      formIsValid = false;
    }

    if (!formData.district.trim()) {
      tempErrors.district = 'validation.districtRequired';
      formIsValid = false;
    }

    if (!formData.division.trim()) {
      tempErrors.division = 'validation.divisionRequired';
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
    try {
      if (!validateForm()) {
        return;
      }

      const response = await axios.post(`${API_BASE}/api/register/official`, formData);

      if (response.status === 201) {
        toast.success(t('register.success'));
        navigate('/login/official');
      } else {
        setErrors(response.data.error || t('register.failed'));
      }
    } catch (error) {
      console.error('Registration error:', error);

      if (error.response) {
        // Handle server validation errors
        if (error.response.data.validationErrors) {
          setErrors(error.response.data.validationErrors);
          toast.error(t('register.correctFields'));
        } else if (error.response.data.error) {
          toast.error(error.response.data.error);
        } else {
          toast.error(t('register.failed'));
        }
      } else {
        toast.error(t('common.serverError'));
      }
    }
  };

  return (
    <AuthShell
      role={t('login.official.role')}
      title={t('register.official.title')}
      lede={t('register.official.lede')}
      back="/register"
      backLabel={t('register.allTypes')}
      accentThread={3}
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

        <div className="row g-3 mt-1">
          <div className="col-md-6">
            <label htmlFor="employeeId" className="form-label">{t('form.employeeId')}*</label>
            <input
              type="text"
              className={`form-control ${errors.employeeId ? 'is-invalid' : ''}`}
              id="employeeId"
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
            />
            {errors.employeeId && <div className="invalid-feedback">{t(errors.employeeId)}</div>}
          </div>

          <div className="col-md-6">
            <label htmlFor="department" className="form-label">{t('form.department')}*</label>
            <select
              className={`form-select ${errors.department ? 'is-invalid' : ''}`}
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
        </div>

        <div className="row g-3 mt-1">
          <div className="col-12">
            <label htmlFor="designation" className="form-label">{t('form.designation')}*</label>
            <input
              type="text"
              className={`form-control ${errors.designation ? 'is-invalid' : ''}`}
              id="designation"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
            />
            {errors.designation && <div className="invalid-feedback">{t(errors.designation)}</div>}
          </div>
        </div>

        <div className="row g-3 mt-1">
          <div className="col-12">
            <LocationDropdowns
              onLocationChange={handleLocationChange}
              initialValues={{
                district: formData.district,
                division: formData.division,
                taluk: formData.taluk
              }}
            />
          </div>
        </div>

        <div className="row g-3 mt-1">
          <div className="col-md-4">
            <label htmlFor="city" className="form-label">{t('form.city')}*</label>
            <input
              type="text"
              className="form-control"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4">
            <label htmlFor="state" className="form-label">{t('form.state')}*</label>
            <input
              type="text"
              className="form-control"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4">
            <label htmlFor="pincode" className="form-label">{t('form.pincode')}*</label>
            <input
              type="text"
              className="form-control"
              id="pincode"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              pattern="[0-9]{6}"
            />
          </div>
        </div>

        <div className="row g-3 mt-1">
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
            <div className="alert alert-info" role="alert">
              <small>{t('register.official.note')}</small>
            </div>
          </div>
        </div>

        <div className="row mt-2">
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
          <button type="submit" className="btn btn-success btn-lg">
            {t('register.official.submit')}
          </button>
        </div>
      </form>
      <p className="tk-auth__alt">
        {t('register.already')} <Link to="/login/official">{t('nav.signIn')}</Link>
      </p>
    </AuthShell>
  );
};

export default OfficialRegistration;