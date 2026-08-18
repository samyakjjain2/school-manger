import React, { useState } from 'react';
import { Search, UserPlus, Trash2, Calendar, Phone, Mail } from 'lucide-react';
import StudentForm from './StudentForm';

function StudentList({ students, loading, onDelete, onSuccessAdd, onFailureAdd }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Extract unique classes for filter dropdown
  const classes = Array.from(new Set(students.map((s) => s.class_name))).filter(Boolean);

  // Client-side filtering
  const filteredStudents = students.filter((student) => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    const email = student.email.toLowerCase();
    const roll = student.roll_number.toLowerCase();
    const searchLower = searchQuery.toLowerCase();

    const matchesSearch =
      fullName.includes(searchLower) ||
      email.includes(searchLower) ||
      roll.includes(searchLower);

    const matchesGender = selectedGender === '' || student.gender === selectedGender;
    const matchesClass = selectedClass === '' || student.class_name === selectedClass;

    return matchesSearch && matchesGender && matchesClass;
  });

  // Helper for displaying birthdates nicely
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="glass-card">
      {/* Search & Filter Header controls */}
      <div className="controls-row">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, email, roll number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select
            className="filter-select"
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

          <select
            className="filter-select"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">All Classes</option>
            {classes.map((cls, idx) => (
              <option key={idx} value={cls}>
                {cls}
              </option>
            ))}
          </select>

          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <UserPlus size={18} />
            Add Student
          </button>
        </div>
      </div>

      {/* Main Student Table */}
      <div className="table-container">
        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            Loading student records...
          </p>
        ) : filteredStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>No student records found</p>
            <p style={{ fontSize: '0.9rem' }}>Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll Number</th>
                <th>Class</th>
                <th>Contact Info</th>
                <th>Birth Date</th>
                <th>Gender</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => {
                const initial = student.first_name.charAt(0);
                const genderLetter = student.gender.charAt(0);
                
                return (
                  <tr key={student.id}>
                    <td className="student-avatar-cell">
                      <div className={`avatar-circle ${genderLetter}`}>
                        {initial}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{student.first_name} {student.last_name}</div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {student.roll_number}
                      </span>
                    </td>
                    <td>{student.class_name}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.85rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                          <Mail size={12} /> {student.email}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                          <Phone size={12} /> {student.phone}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                        <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                        {formatDate(student.date_of_birth)}
                      </span>
                    </td>
                    <td>
                      <span className={`gender-badge ${student.gender.toLowerCase()}`}>
                        {student.gender}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="icon-btn danger"
                        title="Delete Student"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to remove ${student.first_name} ${student.last_name}?`)) {
                            onDelete(student.id);
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <StudentForm
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            onSuccessAdd();
          }}
          onFailure={onFailureAdd}
        />
      )}
    </div>
  );
}

export default StudentList;
