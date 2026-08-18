import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const Timetable = () => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('Class 1');
  const [addModal, setAddModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    className: 'Class 1',
    day: 'Monday',
    subjectName: '',
    teacherName: '',
    startTime: '09:00',
    endTime: '09:45'
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    fetchTimetable();
  }, [selectedClass]);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/timetables`, {
        params: { className: selectedClass }
      });
      if (res.data.success) {
        setTimetable(res.data.timetable);
      }
    } catch {
      toast.error('Failed to load class timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/timetables`, formData);
      if (res.data.success) {
        toast.success('Timetable entry created');
        setAddModal(false);
        setFormData({
          className: selectedClass,
          day: 'Monday',
          subjectName: '',
          teacherName: '',
          startTime: '09:00',
          endTime: '09:45'
        });
        fetchTimetable();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Creation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this timetable entry slot?')) return;
    try {
      const res = await axios.delete(`${API_URL}/timetables/${id}`);
      if (res.data.success) {
        toast.success('Entry slot deleted');
        fetchTimetable();
      }
    } catch {
      toast.error('Deletion failed');
    }
  };

  return (
    <div className="space-y-6 text-xs sm:text-sm text-left font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Calendar className="text-blue-600" size={22} /> Class Timetable
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Design weekly schedules and slot teacher configurations.
          </p>
        </div>
        <Button variant="gradient" className="gap-1.5 cursor-pointer text-xs self-start" onClick={() => setAddModal(true)}>
          <Plus size={14} /> Add Timing Slot
        </Button>
      </div>

      {/* Class selector bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex gap-3 items-center">
        <label className="font-bold text-slate-600">Select Class Section:</label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-xs text-slate-700 outline-none focus:border-blue-500 font-bold"
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

      {/* Weekly Grid */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {daysOfWeek.map((day) => {
            const slots = timetable.filter(s => s.day === day);
            return (
              <div key={day} className="premium-card p-4 space-y-4 min-h-[300px] flex flex-col justify-start">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 text-center bg-blue-50/50 rounded p-1">
                  {day}
                </h3>
                <div className="space-y-3 grow">
                  {slots.map((slot) => (
                    <div key={slot.id} className="p-3 rounded-lg border border-slate-150 bg-slate-50/40 relative group hover:shadow-sm transition">
                      <button
                        onClick={() => handleDelete(slot.id)}
                        className="absolute top-2 right-2 text-slate-400 hover:text-red-500 hidden group-hover:block transition cursor-pointer"
                        title="Delete slot"
                      >
                        <Trash2 size={13} />
                      </button>
                      <span className="text-[10px] text-blue-600 font-bold block">{slot.startTime} - {slot.endTime}</span>
                      <span className="text-slate-805 font-bold block mt-1">{slot.subjectName}</span>
                      <span className="text-[10px] text-slate-500 font-semibold block">{slot.teacherName}</span>
                    </div>
                  ))}
                  {slots.length === 0 && (
                    <p className="text-slate-400 italic text-center py-16 text-[11px]">Free Day</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Create Weekly Class Slot" footer={
        <>
          <Button variant="secondary" onClick={() => setAddModal(false)}>Cancel</Button>
          <Button variant="gradient" type="submit" form="timetable-form">Create Slot</Button>
        </>
      }>
        <form id="timetable-form" onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Class Section *</label>
              <select value={formData.className} onChange={(e) => setFormData({ ...formData, className: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none">
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

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Day of Week *</label>
              <select value={formData.day} onChange={(e) => setFormData({ ...formData, day: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none">
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Subject Name *</label>
              <input type="text" required placeholder="e.g. Mathematics" value={formData.subjectName} onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none focus:border-blue-500" />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Teacher / Instructor Name *</label>
              <input type="text" required placeholder="e.g. Mrs. Sharma" value={formData.teacherName} onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Start Time *</label>
              <input type="time" required value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none" />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">End Time *</label>
              <input type="time" required value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none" />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
