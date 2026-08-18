import React from 'react';
import { Users, GraduationCap, Calendar, Award, UserPlus, Clock } from 'lucide-react';

function Dashboard({ stats, loading, onViewStudents }) {
  const { totalStudents, genderBreakdown, classDistribution, recentStudents } = stats;

  // Calculate gender percentages for pie chart
  const maleCount = genderBreakdown.male || 0;
  const femaleCount = genderBreakdown.female || 0;
  const otherCount = genderBreakdown.other || 0;
  const totalGender = maleCount + femaleCount + otherCount || 1;

  const malePercent = Math.round((maleCount / totalGender) * 100);
  const femalePercent = Math.round((femaleCount / totalGender) * 100);
  const otherPercent = Math.round((otherCount / totalGender) * 100);

  // SVG dash array and offsets for 100-circumference circle
  // Radius r = 15.9155 => Circumference = 2 * Math.PI * r = 100
  const maleStrokeDash = `${malePercent} ${100 - malePercent}`;
  const femaleStrokeDash = `${femalePercent} ${100 - femalePercent}`;
  const otherStrokeDash = `${otherPercent} ${100 - otherPercent}`;

  const femaleOffset = 100 - malePercent;
  const otherOffset = femaleOffset - femalePercent;

  // Find max count for scaling bar chart
  const maxClassCount = classDistribution.length > 0 
    ? Math.max(...classDistribution.map(c => c.count)) 
    : 1;

  // Format date helper
  const formatTimeAgo = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading Dashboard Overview...</p>
      </div>
    );
  }

  return (
    <div>
      {/* 4 Summary Stat Cards */}
      <section className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-details">
            <h3>Total Students</h3>
            <span className="stat-number">{totalStudents}</span>
          </div>
          <div className="stat-icon-wrapper purple">
            <Users size={24} />
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-details">
            <h3>Total Classes</h3>
            <span className="stat-number">
              {classDistribution.length || 6}
            </span>
          </div>
          <div className="stat-icon-wrapper cyan">
            <GraduationCap size={24} />
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-details">
            <h3>Avg Attendance</h3>
            <span className="stat-number">94.8%</span>
          </div>
          <div className="stat-icon-wrapper green">
            <Calendar size={24} />
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-details">
            <h3>Active Teachers</h3>
            <span className="stat-number">48</span>
          </div>
          <div className="stat-icon-wrapper pink">
            <Award size={24} />
          </div>
        </div>
      </section>

      {/* Grid containing Charts & Recent Activity */}
      <section className="dashboard-grid">
        {/* Left Side: Class Distribution Bar Chart */}
        <div className="glass-card chart-card">
          <h2>Students per Grade (Top Classes)</h2>
          <div className="chart-container">
            {classDistribution.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No student records found</p>
            ) : (
              <div className="custom-bar-chart">
                {classDistribution.map((item, idx) => {
                  const percent = (item.count / maxClassCount) * 80; // max height of 80%
                  return (
                    <div key={idx} className="bar-wrapper">
                      <div 
                        className="bar" 
                        style={{ '--bar-height': `${percent}%` }}
                      >
                        <span className="bar-tooltip">{item.count} students</span>
                      </div>
                      <span className="bar-label">{item.className}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Gender Distribution Pie Chart */}
        <div className="glass-card chart-card" style={{ justifyContent: 'space-between' }}>
          <h2>Gender Breakdown</h2>
          {totalStudents === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
              No gender statistics available.
            </div>
          ) : (
            <>
              <div className="chart-container" style={{ minHeight: '160px' }}>
                <svg width="120" height="120" viewBox="0 0 40 40" className="pie-chart-svg">
                  {/* Male Slice */}
                  {malePercent > 0 && (
                    <circle
                      className="pie-slice pie-slice-male"
                      r="15.9155"
                      cx="20"
                      cy="20"
                      strokeDasharray={maleStrokeDash}
                      strokeDashoffset="0"
                    />
                  )}
                  {/* Female Slice */}
                  {femalePercent > 0 && (
                    <circle
                      className="pie-slice pie-slice-female"
                      r="15.9155"
                      cx="20"
                      cy="20"
                      strokeDasharray={femaleStrokeDash}
                      strokeDashoffset={femaleOffset}
                    />
                  )}
                  {/* Other Slice */}
                  {otherPercent > 0 && (
                    <circle
                      className="pie-slice pie-slice-other"
                      r="15.9155"
                      cx="20"
                      cy="20"
                      strokeDasharray={otherStrokeDash}
                      strokeDashoffset={otherOffset}
                    />
                  )}
                </svg>
              </div>

              <div className="chart-legends">
                <div className="legend-item">
                  <div className="legend-color-label">
                    <div className="legend-dot male"></div>
                    <span>Male</span>
                  </div>
                  <strong>{malePercent}% ({maleCount})</strong>
                </div>
                <div className="legend-item">
                  <div className="legend-color-label">
                    <div className="legend-dot female"></div>
                    <span>Female</span>
                  </div>
                  <strong>{femalePercent}% ({femaleCount})</strong>
                </div>
                <div className="legend-item">
                  <div className="legend-color-label">
                    <div className="legend-dot other"></div>
                    <span>Other</span>
                  </div>
                  <strong>{otherPercent}% ({otherCount})</strong>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Recent Admissions Section */}
      <section className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Recent Enrollments</h2>
          <button className="btn btn-secondary" onClick={onViewStudents}>
            View All Students
          </button>
        </div>

        <div className="activity-list">
          {recentStudents.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
              No recent enrollments to display.
            </p>
          ) : (
            recentStudents.map((student) => (
              <div key={student.id} className="activity-item">
                <div className="activity-icon">
                  <UserPlus size={18} />
                </div>
                <div className="activity-details">
                  <p className="activity-text">
                    New student <strong>{student.first_name} {student.last_name}</strong> was enrolled in <strong>{student.class_name}</strong>.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                    <span className="activity-time">{formatTimeAgo(student.created_at)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
