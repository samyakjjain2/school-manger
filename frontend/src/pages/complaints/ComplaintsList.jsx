import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { AlertOctagon, Search, Plus, User, Wrench } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

export const ComplaintsList = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [students, setStudents] = useState([]);

  const [searchParams] = useSearchParams();

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');

  useEffect(() => {
    setSelectedStatus(searchParams.get('status') || '');
  }, [searchParams]);

  // Add form state
  const [formData, setFormData] = useState({
    studentId: '',
    title: '',
    description: '',
    priority: 'Medium'
  });

  // Action state
  const [resolveModal, setResolveModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [resolveData, setResolveData] = useState({ feedback: '' });

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [search, selectedStatus]);

  const fetchDropdowns = async () => {
    try {
      const res = await axios.get(`${API_URL}/students`, { params: { limit: 500 } });
      if (res.data.success) {
        setStudents(res.data.students);
        if (res.data.students.length > 0 && !formData.studentId) {
          setFormData(prev => ({ ...prev, studentId: res.data.students[0].id }));
        }
      }
    } catch {}
  };

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/complaints`, {
        params: {
          search,
          status: selectedStatus
        }
      });
      if (res.data.success) {
        setComplaints(res.data.complaints);
      }
    } catch {
      toast.error('Failed to load complaints log');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/complaints`, formData);
      if (res.data.success) {
        toast.success('Complaint registered successfully');
        setAddModal(false);
        setFormData({ ...formData, title: '', description: '' });
        fetchComplaints();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${API_URL}/complaints/${selectedComplaint.id}/resolve`, resolveData);
      if (res.data.success) {
        toast.success('Complaint status marked resolved');
        setResolveModal(false);
        setResolveData({ feedback: '' });
        fetchComplaints();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Resolution update failed');
    }
  };

  return (
    <div className="space-y-6 text-xs sm:text-sm text-left font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <AlertOctagon className="text-blue-600" size={22} /> Housekeeping & Complaints
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Resolve classroom complaints, student feedback, and campus maintenance tasks.
          </p>
        </div>
        <Button variant="gradient" className="gap-1.5 cursor-pointer text-xs self-start" onClick={() => setAddModal(true)}>
          <Plus size={14} /> File Complaint
        </Button>
      </div>

      {/* Filters bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-4 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-blue-500 font-semibold"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full md:w-44 rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-xs text-slate-700 outline-none font-semibold"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="InProgress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>

        <Button variant="outline" className="w-full md:w-auto text-xs shrink-0 cursor-pointer font-bold" onClick={fetchComplaints}>
          Apply Filters
        </Button>
      </div>

      {/* Data listing */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : complaints.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {complaints.map((c) => (
            <div key={c.id} className="premium-card flex flex-col justify-between hover:shadow-md transition">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block">Ticket: #{c.id.slice(-6).toUpperCase()}</span>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mt-0.5">{c.title}</h3>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 font-bold">
                    <Badge variant={c.priority === 'High' ? 'danger' : 'primary'}>{c.priority}</Badge>
                    <Badge variant={c.status === 'Resolved' ? 'success' : 'warning'}>
                      {c.status === 'InProgress' ? 'In Progress' : c.status}
                    </Badge>
                  </div>
                </div>

                <p className="text-slate-600 text-xs leading-relaxed">
                  {c.description}
                </p>

                {c.notes && (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">Resolution Feedback:</span>
                    <p className="text-[11px] text-slate-600 italic leading-relaxed">{c.notes}</p>
                  </div>
                )}

                <div className="flex items-center gap-4 text-[10px] font-semibold text-slate-400 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <User size={13} className="text-blue-650" /> {c.student ? `${c.student.firstName} ${c.student.lastName}` : 'N/A'}
                  </span>
                  <span>Registered: {new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {c.status !== 'Resolved' && (
                <div className="flex justify-end pt-4 mt-2">
                  <Button 
                    variant="outline" 
                    className="text-[10px] px-2.5 py-1.5 cursor-pointer font-bold gap-1 border border-slate-200"
                    onClick={() => { setSelectedComplaint(c); setResolveModal(true); }}
                  >
                    <Wrench size={12} /> Mark Resolve
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <AlertOctagon className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No Complaints Logged</h3>
          <p className="text-xs text-slate-500 mt-1">Submit issues to track maintenance ticket states.</p>
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="File Support Ticket" footer={
        <>
          <Button variant="secondary" onClick={() => setAddModal(false)}>Cancel</Button>
          <Button variant="gradient" type="submit" form="complaint-form" disabled={students.length === 0}>File Complaint</Button>
        </>
      }>
        {students.length === 0 && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-100 text-xs text-rose-600 font-semibold mb-4">
            Please register a Student profile first under the 'Students' tab before filing support tickets.
          </div>
        )}
        <form id="complaint-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Student Profile *</label>
              <select value={formData.studentId} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none">
                {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.rollNumber})</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Priority level</label>
              <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none">
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Brief Title / Topic *</label>
            <input type="text" required placeholder="e.g. Broken bench in Grade 10-A classroom" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none focus:border-blue-500" />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Description *</label>
            <textarea rows="3" required placeholder="Provide context of issue for the school maintenance team..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none focus:border-blue-500" />
          </div>
        </form>
      </Modal>

      {/* Resolve Modal */}
      <Modal isOpen={resolveModal} onClose={() => setResolveModal(false)} title="Close Ticket" footer={
        <>
          <Button variant="secondary" onClick={() => setResolveModal(false)}>Cancel</Button>
          <Button variant="gradient" type="submit" form="resolve-form">Submit Resolution</Button>
        </>
      }>
        <form id="resolve-form" onSubmit={handleResolve} className="space-y-4 text-xs font-semibold">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Resolution Feedback Comments *</label>
            <textarea rows="3" required placeholder="Describe what actions were performed to fix the issue..." value={resolveData.feedback} onChange={(e) => setResolveData({ ...resolveData, feedback: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none focus:border-blue-500" />
          </div>
        </form>
      </Modal>
    </div>
  );
};
