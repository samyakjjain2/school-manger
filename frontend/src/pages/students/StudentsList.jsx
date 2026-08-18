import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Search, Plus, Eye, Phone, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export const StudentsList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);

  // Search & Pagination
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Add form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    rollNumber: '',
    className: '',
    dateOfBirth: '',
    gender: 'Male',
    parentName: '',
    parentPhone: '',
    address: ''
  });

  useEffect(() => {
    fetchStudents();
  }, [page, search, selectedStatus, selectedClass]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/students`, {
        params: {
          search,
          status: selectedStatus,
          className: selectedClass,
          page,
          limit: 10
        }
      });
      if (res.data.success) {
        setStudents(res.data.students);
        setTotalPages(res.data.pages);
      }
    } catch {
      toast.error('Failed to load students directory');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/students`, formData);
      if (res.data.success) {
        toast.success('Student registered successfully');
        setAddModal(false);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          rollNumber: '',
          className: '',
          dateOfBirth: '',
          gender: 'Male',
          parentName: '',
          parentPhone: '',
          address: ''
        });
        fetchStudents();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="space-y-6 text-xs sm:text-sm text-left font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            Student Management
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Maintain enrollment databases, class distributions, guardian contacts, and status logs.
          </p>
        </div>
        <Button variant="gradient" className="gap-1.5 cursor-pointer text-xs self-start" onClick={() => setAddModal(true)}>
          <Plus size={14} /> Register Student
        </Button>
      </div>

      {/* Filter panel */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-4 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={selectedClass}
          onChange={(e) => { setSelectedClass(e.target.value); setPage(1); }}
          className="w-full md:w-44 rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-xs text-slate-700 outline-none focus:border-blue-500 font-semibold"
        >
          <option value="">All Classes</option>
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

        <select
          value={selectedStatus}
          onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
          className="w-full md:w-44 rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-xs text-slate-700 outline-none focus:border-blue-500 font-semibold"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Suspended">Suspended</option>
          <option value="Graduated">Graduated</option>
        </select>

        <Button variant="outline" className="w-full md:w-auto text-xs shrink-0 cursor-pointer font-bold" onClick={fetchStudents}>
          Filter Directory
        </Button>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : students.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200 bg-slate-50/50">
                  <th className="p-4 font-bold">Student Name</th>
                  <th className="p-4 font-bold">Class / Section</th>
                  <th className="p-4 font-bold">Roll Number</th>
                  <th className="p-4 font-bold">Mobile Number</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-650 flex items-center justify-center font-bold text-xs uppercase">
                          {student.firstName.charAt(0)}
                        </div>
                        <div>
                          <span className="block font-bold">{student.firstName} {student.lastName}</span>
                          <span className="text-[10px] text-slate-400 block font-normal">{student.email || 'No Email'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-bold">
                      <span className="inline-flex items-center gap-1">
                        <GraduationCap size={14} className="text-blue-600" />
                        {student.className}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-600">{student.rollNumber}</td>
                    <td className="p-4 font-medium text-slate-605">{student.phone || 'N/A'}</td>
                    <td className="p-4">
                      <Badge 
                        variant={
                          student.status === 'Active' 
                            ? 'success' 
                            : student.status === 'Graduated' 
                            ? 'primary' 
                            : student.status === 'Suspended'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {student.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Link to={`/students/${student.id}`}>
                        <Button variant="outline" className="text-[10px] px-2.5 py-1.5 cursor-pointer font-bold gap-1">
                          <Eye size={12} /> Profile Card
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Search className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No Students Found</h3>
          <p className="text-xs text-slate-500 mt-1">Register student profiles to initialize database worksheets.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 text-xs font-semibold">
          <span className="text-slate-400">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)} className="cursor-pointer">Previous</Button>
            <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)} className="cursor-pointer">Next</Button>
          </div>
        </div>
      )}

      {/* Register Student Modal */}
      <Modal
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        title="Register Student Profile"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddModal(false)}>Cancel</Button>
            <Button variant="gradient" type="submit" form="student-form">Save Registry</Button>
          </>
        }
      >
        <form id="student-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">First Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Alice"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Last Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Smith"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Roll Number / Registration ID *</label>
              <input
                type="text"
                required
                placeholder="e.g. A001"
                value={formData.rollNumber}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Class / Grade *</label>
              <select
                required
                value={formData.className}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none focus:border-blue-500"
              >
                <option value="">Select Class</option>
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
              <label className="font-semibold text-slate-700">Email Address *</label>
              <input
                type="email"
                required
                placeholder="e.g. alice@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Contact Phone Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. 555-0101"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Date of Birth *</label>
              <input
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Gender *</label>
              <select
                required
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-855 outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Parent / Guardian Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Robert Smith"
                value={formData.parentName}
                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Parent Phone Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. 555-0199"
                value={formData.parentPhone}
                onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Correspondence Address</label>
            <textarea
              rows="2"
              placeholder="e.g. 456 Maple St"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none focus:border-blue-500"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
