import React, { useState } from 'react';
import { X } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

function StudentForm({ onClose, onSuccess, onFailure }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    class_name: '',
    roll_number: '',
    date_of_birth: '',
    gender: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Field change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Client-side validations
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    
    // Email Validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Phone Validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[0-9\s-]{7,15}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number (7-15 digits)';
    }

    if (!formData.class_name.trim()) newErrors.class_name = 'Class/Grade is required';
    if (!formData.roll_number.trim()) newErrors.roll_number = 'Roll number is required';
    
    // Date of Birth Validation
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
    } else {
      const dob = new Date(formData.date_of_birth);
      const today = new Date();
      if (dob >= today) {
        newErrors.date_of_birth = 'Date of birth must be in the past';
      }
    }

    if (!formData.gender) newErrors.gender = 'Gender selection is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Server error saving student registration');
      }

      onSuccess();
    } catch (err) {
      console.error(err);
      onFailure(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Enroll New Student</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="first_name">First Name *</label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                className={`form-input ${errors.first_name ? 'error' : ''}`}
                placeholder="e.g. John"
                value={formData.first_name}
                onChange={handleChange}
              />
              {errors.first_name && <span className="form-error-msg">{errors.first_name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="last_name">Last Name *</label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                className={`form-input ${errors.last_name ? 'error' : ''}`}
                placeholder="e.g. Doe"
                value={formData.last_name}
                onChange={handleChange}
              />
              {errors.last_name && <span className="form-error-msg">{errors.last_name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                id="email"
                name="email"
                type="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="e.g. john.doe@example.com"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <span className="form-error-msg">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                id="phone"
                name="phone"
                type="text"
                className={`form-input ${errors.phone ? 'error' : ''}`}
                placeholder="e.g. 555-0199"
                value={formData.phone}
                onChange={handleChange}
              />
              {errors.phone && <span className="form-error-msg">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="class_name">Class / Grade *</label>
              <input
                id="class_name"
                name="class_name"
                type="text"
                className={`form-input ${errors.class_name ? 'error' : ''}`}
                placeholder="e.g. Grade 10-A"
                value={formData.class_name}
                onChange={handleChange}
              />
              {errors.class_name && <span className="form-error-msg">{errors.class_name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="roll_number">Roll Number *</label>
              <input
                id="roll_number"
                name="roll_number"
                type="text"
                className={`form-input ${errors.roll_number ? 'error' : ''}`}
                placeholder="e.g. R-1024"
                value={formData.roll_number}
                onChange={handleChange}
              />
              {errors.roll_number && <span className="form-error-msg">{errors.roll_number}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="date_of_birth">Date of Birth *</label>
              <input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                className={`form-input ${errors.date_of_birth ? 'error' : ''}`}
                value={formData.date_of_birth}
                onChange={handleChange}
              />
              {errors.date_of_birth && <span className="form-error-msg">{errors.date_of_birth}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender *</label>
              <select
                id="gender"
                name="gender"
                className={`form-input ${errors.gender ? 'error' : ''}`}
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <span className="form-error-msg">{errors.gender}</span>}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Enrolling...' : 'Register Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StudentForm;
