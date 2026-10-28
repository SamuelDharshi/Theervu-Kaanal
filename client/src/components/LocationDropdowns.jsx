import React from 'react';
import { useLocationDropdowns } from '../hooks/useLocationDropdowns';

const LocationDropdowns = ({ onLocationChange, initialValues = {} }) => {
  const {
    districts,
    divisions,
    taluks,
    selectedDistrict,
    selectedDivision,
    selectedTaluk,
    handleDistrictChange,
    handleDivisionChange,
    handleTalukChange
  } = useLocationDropdowns();

  // Handle changes and notify parent component
  const handleDistrictSelect = (e) => {
    const district = e.target.value;
    handleDistrictChange(district);
    onLocationChange({ district, division: '', taluk: '' });
  };

  const handleDivisionSelect = (e) => {
    const division = e.target.value;
    handleDivisionChange(division);
    onLocationChange({ district: selectedDistrict, division, taluk: '' });
  };

  const handleTalukSelect = (e) => {
    const taluk = e.target.value;
    handleTalukChange(taluk);
    onLocationChange({ district: selectedDistrict, division: selectedDivision, taluk });
  };

  return (
    <div className="row g-3">
      <div className="col-md-4">
        <label htmlFor="loc-district" className="form-label">
          District*
        </label>
        <select
          id="loc-district"
          value={selectedDistrict || initialValues.district || ''}
          onChange={handleDistrictSelect}
          className="form-select"
          required
        >
          <option value="">Select District</option>
          {districts.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>
      </div>

      <div className="col-md-4">
        <label htmlFor="loc-division" className="form-label">
          Division*
        </label>
        <select
          id="loc-division"
          value={selectedDivision || initialValues.division || ''}
          onChange={handleDivisionSelect}
          className="form-select"
          required
          disabled={!selectedDistrict}
        >
          <option value="">Select Division</option>
          {divisions.map((division) => (
            <option key={division} value={division}>
              {division}
            </option>
          ))}
        </select>
      </div>

      <div className="col-md-4">
        <label htmlFor="loc-taluk" className="form-label">
          Taluk*
        </label>
        <select
          id="loc-taluk"
          value={selectedTaluk || initialValues.taluk || ''}
          onChange={handleTalukSelect}
          className="form-select"
          required
          disabled={!selectedDivision}
        >
          <option value="">Select Taluk</option>
          {taluks.map((taluk) => (
            <option key={taluk} value={taluk}>
              {taluk}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default LocationDropdowns; 