import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../context/AuthContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Phone, Mail, MapPin, Calendar, User, Trash2, Edit2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const fetchStudent = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/students/${id}`);
      if (res.data.success) {
        setStudent(res.data.student);
        setFormData({
          firstName: res.data.student.firstName,
          lastName: res.data.student.lastName,
          email: res.data.student.email,
          phone: res.data.student.phone,
          rollNumber: res.data.student.rollNumber,
          className: res.data.student.className,
          gender: res.data.student.gender,
          dateOfBirth: res.data.student.dateOfBirth ? new Date(res.data.student.dateOfBirth).toISOString().split('T')[0] : '',
          parentName: res.data.student.parentName || '',
          parentPhone: res.data.student.parentPhone || '',
          address: res.data.student.address || '',
          status: res.data.student.status
        });
      }
    } catch {
      toast.error('Failed to load student card');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${API_URL}/students/${id}`, formData);
      if (res.data.success) {
        toast.success('Student profile updated');
        setEditModal(false);
        fetchStudent();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to permanently delete this student record?')) {
      try {
        const res = await axios.delete(`${API_URL}/students/${id}`);
        if (res.data.success) {
          toast.success('Student record deleted');
          navigate('/students');
        }
      } catch {
        toast.error('Delete failed');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!student) {
    return <div className="text-center py-16 italic">Student card not found.</div>;
  }

  return (
    <div className="space-y-6 text-xs sm:text-sm text-left font-sans">
      {/* Top Banner and Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            Student Profile Card
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">{user?.schoolName || 'School'} student registry.</p>
        </div>
        <div className="flex gap-2 self-start">
          <Button variant="outline" className="gap-1 text-xs cursor-pointer" onClick={() => setEditModal(true)}>
            <Edit2 size={13} /> Edit Profile
          </Button>
          <Button variant="danger" className="gap-1 text-xs cursor-pointer" onClick={handleDelete}>
            <Trash2 size={13} /> Delete Student
          </Button>
        </div>
      </div>

      {/* Main Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="premium-card p-6 !rounded-2xl lg:col-span-1 text-center space-y-4">
          <div className="mx-auto h-24 w-24 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-2xl border-2 border-slate-200 uppercase">
            {student.firstName.charAt(0)}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-805">{student.firstName} {student.lastName}</h3>
            <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{student.rollNumber}</span>
          </div>

          <Badge variant={student.status === 'Active' ? 'success' : student.status === 'Graduated' ? 'primary' : 'danger'}>
            {student.status}
          </Badge>

          <div className="border-t border-slate-100 pt-4 text-left space-y-3">
            <div className="flex items-center gap-2.5 text-slate-600">
              <Phone size={15} className="text-slate-400 shrink-0" />
              <span>{student.phone || 'No Phone'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600">
              <Mail size={15} className="text-slate-400 shrink-0" />
              <span className="truncate">{student.email || 'No Email'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600">
              <Calendar size={15} className="text-slate-400 shrink-0" />
              <span>DOB: {new Date(student.dateOfBirth).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Secondary Details */}
        <div className="premium-card p-6 !rounded-2xl lg:col-span-2 space-y-6 text-left">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">
              Academic & Family Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Enrolled Class</span>
                <span className="text-slate-700 font-semibold">{student.className}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Gender</span>
                <span className="text-slate-700 font-semibold">{student.gender}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Parent/Guardian Name</span>
                <span className="text-slate-700 font-semibold">{student.parentName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Parent/Guardian Phone</span>
                <span className="text-slate-700 font-semibold">{student.parentPhone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Admission Date</span>
                <span className="text-slate-700 font-semibold">{new Date(student.admissionDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">
              Correspondence Address
            </h3>
            <div className="flex items-start gap-2 text-slate-600">
              <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <span>{student.address || 'No address registered.'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction & Fee Records */}
      <div className="premium-card p-6 !rounded-2xl text-left space-y-4">
        <h3 className="text-xs font-bold text-slate-805 uppercase tracking-wider border-b border-slate-100 pb-2">
          Tuition Fee Ledger
        </h3>
        {student.fees?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 font-semibold border-b border-slate-100">
                  <th className="py-2 text-left">Bill Month/Year</th>
                  <th className="py-2 text-left">Fee Type</th>
                  <th className="py-2 text-left">Bill Amount</th>
                  <th className="py-2 text-left">Paid Amount</th>
                  <th className="py-2 text-left">Paid Status</th>
                  <th className="py-2 text-left">Paid Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {student.fees.map((fee) => (
                  <tr key={fee.id}>
                    <td className="py-3">{fee.month}/{fee.year}</td>
                    <td className="py-3">{fee.type}</td>
                    <td className="py-3">₹ {fee.amount}</td>
                    <td className="py-3">₹ {fee.paidAmount}</td>
                    <td className="py-3">
                      <Badge variant={fee.status === 'Paid' ? 'success' : fee.status === 'Partial' ? 'warning' : 'danger'}>
                        {fee.status}
                      </Badge>
                    </td>
                    <td className="py-3">{fee.paidAt ? new Date(fee.paidAt).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-400 italic text-center py-6">No fee ledger logs found.</p>
        )}
      </div>

      {/* Edit Student Modal */}
      <Modal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title="Edit Student Profile Details"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditModal(false)}>Cancel</Button>
            <Button variant="gradient" type="submit" form="edit-student-form">Save Changes</Button>
          </>
        }
      >
        <form id="edit-student-form" onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName || ''}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName || ''}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Roll Number *</label>
              <input
                type="text"
                required
                value={formData.rollNumber || ''}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Class / Section *</label>
              <select
                required
                value={formData.className || ''}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none focus:border-blue-500"
              >
                <option value="Nursery">Nursery</option>
                <option value="LKG">LKG</option>
                <option value="UKG">UKG</option>
                <option value="Class 1">Class 1</option>
                <option value="Class 2">Class 2</option>
                <option value="Class 3">Class 3</option>
                <option value="Class 4">Class 4</option>
                <option value="Class 5">Class 5</option>
                <option value="Class 6">Class 6</option>
                <option value="Class 7">Class 7</option>
                <option value="Class 8">Class 8</option>
                <option value="Class 9">Class 9</option>
                <option value="Class 10">Class 10</option>
                <option value="Class 11 (Science)">Class 11 (Science)</option>
                <option value="Class 11 (Commerce)">Class 11 (Commerce)</option>
                <option value="Class 11 (Arts)">Class 11 (Arts)</option>
                <option value="Class 12 (Science)">Class 12 (Science)</option>
                <option value="Class 12 (Commerce)">Class 12 (Commerce)</option>
                <option value="Class 12 (Arts)">Class 12 (Arts)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Phone Number</label>
              <input
                type="text"
                required
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                required
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Parent / Guardian Name</label>
              <input
                type="text"
                value={formData.parentName || ''}
                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-855 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Parent Phone Number</label>
              <input
                type="text"
                value={formData.parentPhone || ''}
                onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-855 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Date of Birth</label>
              <input
                type="date"
                required
                value={formData.dateOfBirth || ''}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Profile Status *</label>
              <select
                required
                value={formData.status || 'Active'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none focus:border-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
                <option value="Graduated">Graduated</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Correspondence Address</label>
            <textarea
              rows="2"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none focus:border-blue-500"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
