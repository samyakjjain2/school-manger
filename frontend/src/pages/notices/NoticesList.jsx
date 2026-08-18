import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ClipboardList, Plus, Search, Calendar, User, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const NoticesList = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);

  // Search filter
  const [search, setSearch] = useState('');

  // Add form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetGroup: 'All',
    category: 'General'
  });

  useEffect(() => {
    fetchNotices();
  }, [search]);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/notices`, {
        params: { search }
      });
      if (res.data.success) {
        setNotices(res.data.notices);
      }
    } catch {
      toast.error('Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/notices`, formData);
      if (res.data.success) {
        toast.success('Notice published successfully');
        setAddModal(false);
        setFormData({ title: '', content: '', targetGroup: 'All', category: 'General' });
        fetchNotices();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Publication failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      const res = await axios.delete(`${API_URL}/notices/${id}`);
      if (res.data.success) {
        toast.success('Notice removed');
        fetchNotices();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete notice');
    }
  };

  return (
    <div className="space-y-6 text-xs sm:text-sm text-left font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <ClipboardList className="text-blue-600" size={22} /> Notice Board
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Broadcast emergency alerts, holiday announcements, and academic circulars.
          </p>
        </div>
        <Button variant="gradient" className="gap-1.5 cursor-pointer text-xs self-start" onClick={() => setAddModal(true)}>
          <Plus size={14} /> Publish Notice
        </Button>
      </div>

      {/* Filters bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search notice content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-4 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-blue-500 font-semibold"
          />
        </div>
        <Button variant="outline" className="w-full md:w-auto text-xs shrink-0 cursor-pointer font-bold" onClick={fetchNotices}>
          Apply Search
        </Button>
      </div>

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : notices.length > 0 ? (
        <div className="space-y-4">
          {notices.map((n) => (
            <div key={n.id} className="premium-card hover:shadow-md transition space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{n.title}</h3>
                  <div className="flex flex-wrap items-center gap-1.5 font-bold">
                    <Badge variant="primary">{n.category}</Badge>
                    <Badge variant="neutral">Target: {n.targetGroup || 'All'}</Badge>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(n.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
                  title="Remove Notice"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-line">
                {n.content}
              </p>

              <div className="flex items-center gap-4 text-[10px] font-semibold text-slate-400 pt-3 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <User size={13} className="text-blue-650" /> Author: {n.admin?.name || 'Administrator'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={13} /> {new Date(n.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <ClipboardList className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">Notice Board Empty</h3>
          <p className="text-xs text-slate-500 mt-1">Publish circular announcements for the student board log.</p>
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Publish Circular Announcement" footer={
        <>
          <Button variant="secondary" onClick={() => setAddModal(false)}>Cancel</Button>
          <Button variant="gradient" type="submit" form="notice-form">Publish Announcement</Button>
        </>
      }>
        <form id="notice-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Notice Category</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none">
                <option value="General">General</option>
                <option value="Academic">Academic</option>
                <option value="Exams">Exams</option>
                <option value="Sports">Sports</option>
                <option value="Holidays">Holidays</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Target Group Audience</label>
              <select value={formData.targetGroup} onChange={(e) => setFormData({ ...formData, targetGroup: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none">
                <option value="All">All Students & Staff</option>
                <option value="Students">All Students</option>
                <option value="Staff">All Staff</option>
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

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Announcement Title *</label>
            <input type="text" required placeholder="e.g. Greenwood High Annual Sports Meet 2026" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none focus:border-blue-500" />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Notice Contents *</label>
            <textarea rows="4" required placeholder="Write detailed notice bulletin announcement body here..." value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none focus:border-blue-500" />
          </div>
        </form>
      </Modal>
    </div>
  );
};
