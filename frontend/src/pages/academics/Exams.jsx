import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL, useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  GraduationCap, Plus, Trash2, Printer, Save,
  Search, ChevronRight, Check, BookOpen, Users, X
} from 'lucide-react';
import toast from 'react-hot-toast';

const COMMON_SUBJECTS = [
  'Mathematics', 'Science', 'English', 'Hindi', 'Social Studies',
  'Computer Science', 'Physics', 'Chemistry', 'Biology',
  'History', 'Geography', 'Economics', 'Accountancy', 'Business Studies',
  'Physical Education', 'Art', 'Music', 'Sanskrit', 'Urdu'
];

const CLASS_LIST = [
  'Nursery','LKG','UKG',
  'Class 1','Class 2','Class 3','Class 4','Class 5',
  'Class 6','Class 7','Class 8','Class 9','Class 10',
  'Class 11 (Science)','Class 11 (Commerce)','Class 11 (Arts)',
  'Class 12 (Science)','Class 12 (Commerce)','Class 12 (Arts)'
];

const calcGrade = (obtained, max) => {
  const pct = (obtained / max) * 100;
  if (isNaN(pct)) return '';
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  if (pct >= 33) return 'E';
  return 'F';
};

const gradeColor = (g) => {
  if (!g) return 'text-slate-400';
  if (g === 'A+' || g === 'A') return 'text-emerald-600 bg-emerald-50';
  if (g === 'B') return 'text-blue-600 bg-blue-50';
  if (g === 'C' || g === 'D') return 'text-orange-500 bg-orange-50';
  if (g === 'E') return 'text-yellow-600 bg-yellow-50';
  return 'text-red-500 bg-red-50';
};

export const Exams = () => {
  const { user } = useAuth();

  // Data
  const [exams, setExams] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active exam selection
  const [selectedExamId, setSelectedExamId] = useState('');

  // Tabs
  const [activeTab, setActiveTab] = useState('quick'); // 'quick' | 'bulk' | 'report'

  // ─── QUICK ENTRY STATE ─────────────────────────────────────
  // Step 1: Student search
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Step 2: Subject
  const [selectedSubject, setSelectedSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');

  // Step 3: Marks
  const [marksObtained, setMarksObtained] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  // ─── BULK SHEET STATE ──────────────────────────────────────
  const [bulkClass, setBulkClass] = useState('Class 1');
  const [bulkSubject, setBulkSubject] = useState('Mathematics');
  const [bulkCustomSubject, setBulkCustomSubject] = useState('');
  const [bulkMaxMarks, setBulkMaxMarks] = useState('100');
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkLoaded, setBulkLoaded] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);

  // ─── REPORT CARD STATE ─────────────────────────────────────
  const [rcStudentId, setRcStudentId] = useState('');
  const [rcExamId, setRcExamId] = useState('');
  const [reportCard, setReportCard] = useState(null);
  const [reportCardModal, setReportCardModal] = useState(false);

  // ─── CREATE EXAM MODAL ─────────────────────────────────────
  const [addExamModal, setAddExamModal] = useState(false);
  const [examData, setExamData] = useState({ title: '', term: 'Unit Test 1', date: '' });

  // ──────────────────────────────────────────────────────────
  useEffect(() => { fetchExams(); fetchStudents(); }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/exams`);
      if (res.data.success) {
        setExams(res.data.exams);
        if (res.data.exams.length > 0) {
          setSelectedExamId(res.data.exams[0].id);
          setRcExamId(res.data.exams[0].id);
        }
      }
    } catch { toast.error('Failed to load exams'); }
    finally { setLoading(false); }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_URL}/students`, { params: { limit: 500 } });
      if (res.data.success) {
        setAllStudents(res.data.students);
        if (res.data.students.length > 0) setRcStudentId(res.data.students[0].id);
      }
    } catch {}
  };

  // Filtered students for search
  const filteredStudents = studentSearch.length >= 1
    ? allStudents.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.rollNumber?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.className?.toLowerCase().includes(studentSearch.toLowerCase())
      ).slice(0, 8)
    : [];

  const handleSelectStudent = (s) => {
    setSelectedStudent(s);
    setStudentSearch(`${s.firstName} ${s.lastName}`);
    setShowDropdown(false);
    setSelectedSubject('');
    setMarksObtained('');
    setRemarks('');
  };

  const handleClearStudent = () => {
    setSelectedStudent(null);
    setStudentSearch('');
    setSelectedSubject('');
    setMarksObtained('');
    setRemarks('');
  };

  const effectiveSubject = () =>
    selectedSubject === '__custom' ? customSubject.trim() : selectedSubject;

  const handleSaveQuick = async () => {
    const subj = effectiveSubject();
    if (!selectedExamId) { toast.error('Please select an exam session first'); return; }
    if (!selectedStudent) { toast.error('Please select a student'); return; }
    if (!subj) { toast.error('Please select a subject'); return; }
    if (marksObtained === '' || isNaN(parseFloat(marksObtained))) { toast.error('Please enter marks obtained'); return; }
    if (!maxMarks || isNaN(parseFloat(maxMarks))) { toast.error('Please enter maximum marks'); return; }
    if (parseFloat(marksObtained) > parseFloat(maxMarks)) {
      toast.error('Marks obtained cannot exceed maximum marks');
      return;
    }

    setSaving(true);
    try {
      const res = await axios.post(`${API_URL}/exams/marks`, {
        studentId: selectedStudent.id,
        examId: selectedExamId,
        subjectName: subj,
        marksObtained: parseFloat(marksObtained),
        maxMarks: parseFloat(maxMarks),
        remarks: remarks || ''
      });
      if (res.data.success) {
        toast.success(`Marks saved for ${selectedStudent.firstName} — ${subj}`);
        // Reset for next entry
        setSelectedSubject('');
        setCustomSubject('');
        setMarksObtained('');
        setMaxMarks('100');
        setRemarks('');
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  // ─── BULK SHEET ────────────────────────────────────────────
  const loadBulkSheet = async () => {
    if (!selectedExamId) { toast.error('Please select an exam session'); return; }
    setBulkLoading(true);
    setBulkLoaded(false);
    try {
      const subj = bulkSubject === '__custom' ? bulkCustomSubject.trim() : bulkSubject;
      const res = await axios.get(`${API_URL}/exams/${selectedExamId}/class/${encodeURIComponent(bulkClass)}`);
      if (res.data.success) {
        const { students, marks } = res.data;
        const rows = students.map(s => {
          const existing = marks.find(m => m.studentId === s.id && m.subjectName === subj);
          return {
            id: s.id,
            firstName: s.firstName,
            lastName: s.lastName,
            rollNumber: s.rollNumber,
            obtained: existing ? String(existing.marksObtained) : '',
            remarks: existing?.remarks || '',
            grade: existing?.grade || ''
          };
        });
        setBulkRows(rows);
        setBulkLoaded(true);
        if (students.length === 0) toast('No active students in this class', { icon: 'ℹ️' });
      }
    } catch { toast.error('Failed to load class sheet'); }
    finally { setBulkLoading(false); }
  };

  const updateBulkRow = (idx, field, value) => {
    setBulkRows(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      if (field === 'obtained') {
        updated[idx].grade = calcGrade(parseFloat(value), parseFloat(bulkMaxMarks));
      }
      return updated;
    });
  };

  const handleSaveBulk = async () => {
    const subj = bulkSubject === '__custom' ? bulkCustomSubject.trim() : bulkSubject;
    const filled = bulkRows.filter(r => r.obtained !== '' && !isNaN(parseFloat(r.obtained)));
    if (filled.length === 0) { toast.error('Enter at least one student\'s marks'); return; }

    setBulkSaving(true);
    try {
      const entries = filled.map(r => ({
        studentId: r.id,
        subjectName: subj,
        marksObtained: parseFloat(r.obtained),
        maxMarks: parseFloat(bulkMaxMarks),
        remarks: r.remarks || ''
      }));
      const res = await axios.post(`${API_URL}/exams/marks/bulk`, { examId: selectedExamId, entries });
      if (res.data.success) {
        toast.success(`${res.data.saved} marks saved!`);
        loadBulkSheet();
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setBulkSaving(false); }
  };

  // ─── REPORT CARD ────────────────────────────────────────────
  const handleGenerateReport = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.get(`${API_URL}/exams/students/${rcStudentId}/report-card/${rcExamId}`);
      if (res.data.success) { setReportCard(res.data); setReportCardModal(true); }
    } catch { toast.error('Failed to generate report card'); }
  };

  const calcTotal = (marks) => {
    if (!marks?.length) return { obtained: 0, total: 0, pct: 0 };
    const obtained = marks.reduce((a, c) => a + c.marksObtained, 0);
    const total = marks.reduce((a, c) => a + c.maxMarks, 0);
    return { obtained, total, pct: total > 0 ? (obtained / total) * 100 : 0 };
  };

  // ─── CREATE EXAM ─────────────────────────────────────────────
  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/exams`, examData);
      if (res.data.success) {
        toast.success('Exam session created!');
        setAddExamModal(false);
        setExamData({ title: '', term: 'Unit Test 1', date: '' });
        fetchExams();
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDeleteExam = async (id) => {
    if (!window.confirm('Delete this exam and all marks?')) return;
    try {
      const res = await axios.delete(`${API_URL}/exams/${id}`);
      if (res.data.success) { toast.success('Exam deleted'); fetchExams(); }
    } catch { toast.error('Delete failed'); }
  };

  const previewGrade = calcGrade(parseFloat(marksObtained), parseFloat(maxMarks));
  const previewPct = maxMarks && marksObtained ? ((parseFloat(marksObtained) / parseFloat(maxMarks)) * 100).toFixed(1) : null;

  return (
    <div className="space-y-6 text-xs sm:text-sm text-left font-sans">

      {/* ─── HEADER ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <GraduationCap className="text-blue-600" size={22} /> Exams &amp; Grading
          </h1>
          <p className="text-slate-500 text-xs mt-1">Enter student marks by name, class sheet, or generate report cards.</p>
        </div>
        <Button variant="gradient" className="gap-1.5 cursor-pointer text-xs font-bold self-start" onClick={() => setAddExamModal(true)}>
          <Plus size={14} /> Create Exam Session
        </Button>
      </div>

      {/* ─── EXAM SESSIONS ─────────────────────────────────── */}
      <div className="premium-card p-5 space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
          Exam Sessions — Select One
        </h3>
        {loading ? (
          <div className="flex h-12 items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : exams.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {exams.map(exam => (
              <div
                key={exam.id}
                onClick={() => { setSelectedExamId(exam.id); setRcExamId(exam.id); setBulkLoaded(false); }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all cursor-pointer group ${
                  selectedExamId === exam.id
                    ? 'border-blue-600 bg-blue-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
                }`}
              >
                {selectedExamId === exam.id && <Check size={13} className="text-blue-600 shrink-0" />}
                <div>
                  <span className="text-slate-800 font-bold block text-xs">{exam.title}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{exam.term} &middot; {new Date(exam.date).toLocaleDateString('en-IN')}</span>
                </div>
                <button
                  onClick={ev => { ev.stopPropagation(); handleDeleteExam(exam.id); }}
                  className="ml-1 p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 cursor-pointer transition"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 italic text-center py-4">No exam sessions yet. Create one to begin.</p>
        )}
      </div>

      {/* ─── TABS ───────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {[
          { key: 'quick', label: 'Enter by Student', icon: Search },
          { key: 'bulk',  label: 'Class Sheet (Bulk)', icon: Users },
          { key: 'report', label: 'Report Card', icon: Printer }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.key ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={13} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════
          TAB: QUICK ENTRY — Student-first flow
      ════════════════════════════════════════════════════════ */}
      {activeTab === 'quick' && (
        <div className="premium-card p-6 space-y-6 max-w-2xl">

          {!selectedExamId && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-semibold">
              ⚠️ Select an exam session above first.
            </div>
          )}

          {/* STEP 1 — Student Name */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-black">1</span>
              <h3 className="font-bold text-slate-800 text-sm">Student Name</h3>
            </div>
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Type student name or roll number..."
                    value={studentSearch}
                    onChange={e => { setStudentSearch(e.target.value); setShowDropdown(true); if (!e.target.value) handleClearStudent(); }}
                    onFocus={() => setShowDropdown(true)}
                    className="w-full rounded-xl border-2 border-slate-200 bg-white py-3 pl-9 pr-10 text-slate-800 outline-none focus:border-blue-500 font-semibold transition-colors"
                  />
                  {selectedStudent && (
                    <button onClick={handleClearStudent} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 cursor-pointer">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Search dropdown */}
              {showDropdown && filteredStudents.length > 0 && !selectedStudent && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                  {filteredStudents.map(s => (
                    <button
                      key={s.id}
                      onMouseDown={() => handleSelectStudent(s)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-blue-50 transition cursor-pointer border-b border-slate-50 last:border-0"
                    >
                      <div>
                        <span className="font-bold text-slate-800 text-xs">{s.firstName} {s.lastName}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{s.className} &middot; Roll: {s.rollNumber}</span>
                      </div>
                      <ChevronRight size={13} className="text-slate-300" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected student badge */}
            {selectedStudent && (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white font-black text-sm shrink-0">
                  {selectedStudent.firstName[0]}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-xs">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{selectedStudent.className} &middot; Roll No: {selectedStudent.rollNumber}</p>
                </div>
                <Check className="ml-auto text-emerald-600" size={16} />
              </div>
            )}
          </div>

          {/* STEP 2 — Subject (only show after student selected) */}
          {selectedStudent && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-black">2</span>
                <h3 className="font-bold text-slate-800 text-sm">Select Subject</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COMMON_SUBJECTS.map(subj => (
                  <button
                    key={subj}
                    onClick={() => { setSelectedSubject(subj); setCustomSubject(''); }}
                    className={`px-3 py-2 rounded-lg border-2 text-xs font-semibold text-left transition-all cursor-pointer ${
                      selectedSubject === subj
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'
                    }`}
                  >
                    {subj}
                  </button>
                ))}
                <button
                  onClick={() => setSelectedSubject('__custom')}
                  className={`px-3 py-2 rounded-lg border-2 text-xs font-semibold text-left transition-all cursor-pointer ${
                    selectedSubject === '__custom'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                      : 'border-dashed border-slate-300 bg-white text-slate-400 hover:border-blue-300'
                  }`}
                >
                  + Other
                </button>
              </div>
              {selectedSubject === '__custom' && (
                <input
                  type="text"
                  autoFocus
                  placeholder="Enter subject name..."
                  value={customSubject}
                  onChange={e => setCustomSubject(e.target.value)}
                  className="w-full rounded-xl border-2 border-blue-400 bg-white py-2.5 px-3 text-slate-800 outline-none font-semibold text-xs"
                />
              )}
            </div>
          )}

          {/* STEP 3 — Marks (only show after subject selected) */}
          {selectedStudent && (selectedSubject && selectedSubject !== '__custom' || (selectedSubject === '__custom' && customSubject.trim())) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-black">3</span>
                <h3 className="font-bold text-slate-800 text-sm">Enter Marks</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    Marks Obtained
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={maxMarks}
                    step="0.5"
                    autoFocus
                    placeholder="e.g. 78"
                    value={marksObtained}
                    onChange={e => setMarksObtained(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-200 bg-white py-3 px-4 text-slate-800 outline-none focus:border-blue-500 font-black text-lg text-center transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    Maximum Marks
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 100"
                    value={maxMarks}
                    onChange={e => setMaxMarks(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-200 bg-white py-3 px-4 text-slate-800 outline-none focus:border-blue-500 font-black text-lg text-center transition-colors"
                  />
                </div>
              </div>

              {/* Live Grade Preview */}
              {marksObtained && maxMarks && previewPct && (
                <div className={`flex items-center justify-between p-4 rounded-xl border-2 ${gradeColor(previewGrade)} border-current/20`}>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Live Preview</p>
                    <p className="font-bold text-sm mt-0.5">
                      {marksObtained} / {maxMarks} — {previewPct}%
                    </p>
                  </div>
                  <span className="text-3xl font-black">{previewGrade}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  Remarks (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Excellent performance..."
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white py-2.5 px-3 text-slate-700 outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <Button
                variant="gradient"
                className="w-full gap-2 cursor-pointer text-sm font-bold py-3"
                onClick={handleSaveQuick}
                disabled={saving}
              >
                {saving
                  ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Saving...</>
                  : <><Save size={15} /> Save Marks</>}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: BULK CLASS SHEET
      ════════════════════════════════════════════════════════ */}
      {activeTab === 'bulk' && (
        <div className="space-y-4">
          <div className="premium-card p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
              <Users size={14} /> Class Marks Sheet (Bulk Entry)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Class</label>
                <select value={bulkClass} onChange={e => { setBulkClass(e.target.value); setBulkLoaded(false); }}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none focus:border-blue-500 text-xs font-semibold">
                  {CLASS_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Subject</label>
                <select value={bulkSubject} onChange={e => { setBulkSubject(e.target.value); setBulkCustomSubject(''); setBulkLoaded(false); }}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none focus:border-blue-500 text-xs font-semibold">
                  {COMMON_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value="__custom">Other...</option>
                </select>
                {bulkSubject === '__custom' && (
                  <input type="text" placeholder="Subject name..." value={bulkCustomSubject}
                    onChange={e => setBulkCustomSubject(e.target.value)}
                    className="w-full rounded-lg border border-blue-400 bg-white py-2 px-3 text-slate-800 outline-none text-xs font-semibold mt-1" />
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Max Marks</label>
                <input type="number" min="1" value={bulkMaxMarks} onChange={e => setBulkMaxMarks(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none focus:border-blue-500 text-xs font-bold" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase">&nbsp;</label>
                <Button variant="primary" className="w-full gap-1.5 cursor-pointer text-xs font-bold"
                  onClick={loadBulkSheet} disabled={!selectedExamId || bulkLoading}>
                  {bulkLoading
                    ? <><div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" /> Loading...</>
                    : <><Search size={13} /> Load Sheet</>}
                </Button>
              </div>
            </div>
            {!selectedExamId && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-semibold">
                ⚠️ Select an exam session above first.
              </div>
            )}
          </div>

          {bulkLoaded && (
            <div className="premium-card overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">
                    {bulkSubject === '__custom' ? bulkCustomSubject : bulkSubject} — {bulkClass}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    {exams.find(e => e.id === selectedExamId)?.title} &middot; {bulkRows.length} students &middot; Max: {bulkMaxMarks}
                  </p>
                </div>
                <Button variant="gradient" className="gap-1.5 cursor-pointer text-xs font-bold" onClick={handleSaveBulk} disabled={bulkSaving}>
                  {bulkSaving ? <><div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" /> Saving...</> : <><Save size={13} /> Save All</>}
                </Button>
              </div>

              {bulkRows.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="mx-auto h-10 w-10 text-slate-200 mb-3" />
                  <p className="text-slate-500 text-xs font-semibold">No active students found in this class.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                        <th className="px-4 py-3 font-bold">#</th>
                        <th className="px-4 py-3 font-bold">Roll</th>
                        <th className="px-4 py-3 font-bold">Student Name</th>
                        <th className="px-4 py-3 font-bold w-36 text-center">Marks (/{bulkMaxMarks})</th>
                        <th className="px-4 py-3 font-bold w-20 text-center">Grade</th>
                        <th className="px-4 py-3 font-bold">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bulkRows.map((row, idx) => (
                        <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2.5 text-slate-400 font-semibold">{idx + 1}</td>
                          <td className="px-4 py-2.5 font-mono font-bold text-slate-600">{row.rollNumber}</td>
                          <td className="px-4 py-2.5 font-bold text-slate-800">{row.firstName} {row.lastName}</td>
                          <td className="px-4 py-2">
                            <input type="number" min="0" max={bulkMaxMarks} step="0.5" placeholder="—"
                              value={row.obtained} onChange={e => updateBulkRow(idx, 'obtained', e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-2.5 text-slate-800 outline-none focus:border-blue-500 font-bold text-center" />
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {row.grade ? (
                              <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black ${gradeColor(row.grade)}`}>
                                {row.grade}
                              </span>
                            ) : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-2">
                            <input type="text" placeholder="Remarks..." value={row.remarks}
                              onChange={e => updateBulkRow(idx, 'remarks', e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-2.5 text-slate-700 outline-none focus:border-blue-500" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200">
                    <span className="text-[10px] font-semibold text-slate-500">
                      Filled: <strong className="text-slate-700">{bulkRows.filter(r => r.obtained !== '').length}</strong> / {bulkRows.length}
                      &nbsp;&middot; Avg: <strong className="text-blue-600">
                        {(() => {
                          const f = bulkRows.filter(r => r.obtained !== '' && !isNaN(r.obtained));
                          if (!f.length) return '—';
                          const avg = f.reduce((a, c) => a + parseFloat(c.obtained), 0) / f.length;
                          return `${avg.toFixed(1)} (${((avg / bulkMaxMarks) * 100).toFixed(1)}%)`;
                        })()}
                      </strong>
                    </span>
                    <Button variant="gradient" className="gap-1.5 cursor-pointer text-xs font-bold" onClick={handleSaveBulk} disabled={bulkSaving}>
                      <Save size={13} /> Save All
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: REPORT CARD
      ════════════════════════════════════════════════════════ */}
      {activeTab === 'report' && (
        <div className="premium-card p-5 space-y-4 max-w-lg">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
            <Printer size={14} /> Generate Student Report Card
          </h3>
          <form onSubmit={handleGenerateReport} className="space-y-4 font-semibold text-xs">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold uppercase">Student</label>
              <select value={rcStudentId} onChange={e => setRcStudentId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none font-semibold">
                {allStudents.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.rollNumber}) — {s.className}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold uppercase">Exam Session</label>
              <select value={rcExamId} onChange={e => setRcExamId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none font-semibold">
                {exams.map(e => <option key={e.id} value={e.id}>{e.title} ({e.term})</option>)}
              </select>
            </div>
            <Button variant="gradient" type="submit" className="w-full gap-1.5 cursor-pointer text-xs font-bold"
              disabled={exams.length === 0 || allStudents.length === 0}>
              <Printer size={14} /> Generate Report Card
            </Button>
          </form>
        </div>
      )}

      {/* ─── CREATE EXAM MODAL ──────────────────────────────── */}
      <Modal isOpen={addExamModal} onClose={() => setAddExamModal(false)} title="Create Exam Session" footer={
        <>
          <Button variant="secondary" onClick={() => setAddExamModal(false)}>Cancel</Button>
          <Button variant="gradient" type="submit" form="exam-form">Create Session</Button>
        </>
      }>
        <form id="exam-form" onSubmit={handleCreateExam} className="space-y-4 text-xs font-semibold">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Exam Title *</label>
            <input type="text" required placeholder="e.g. Unit Test 1 — August 2026"
              value={examData.title} onChange={e => setExamData({ ...examData, title: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Exam Type *</label>
              <select value={examData.term} onChange={e => setExamData({ ...examData, term: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none">
                <option value="Unit Test 1">Unit Test 1</option>
                <option value="Unit Test 2">Unit Test 2</option>
                <option value="Unit Test 3">Unit Test 3</option>
                <option value="Class Test">Class Test</option>
                <option value="Half Yearly">Half Yearly</option>
                <option value="Pre-Board">Pre-Board</option>
                <option value="Annual">Annual / Final</option>
                <option value="Practical">Practical</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Date *</label>
              <input type="date" required value={examData.date} onChange={e => setExamData({ ...examData, date: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none" />
            </div>
          </div>
        </form>
      </Modal>

      {/* ─── PRINTABLE REPORT CARD MODAL ────────────────────── */}
      {reportCard && (
        <Modal isOpen={reportCardModal} onClose={() => setReportCardModal(false)} title="Student Report Card"
          footer={
            <>
              <Button variant="secondary" onClick={() => setReportCardModal(false)}>Close</Button>
              <Button variant="gradient" onClick={() => window.print()} className="gap-1.5 cursor-pointer font-bold">
                <Printer size={14} /> Print
              </Button>
            </>
          }
        >
          <style dangerouslySetInnerHTML={{__html:`@media print{body *{visibility:hidden!important}#printable-rc,#printable-rc *{visibility:visible!important}#printable-rc{position:absolute!important;left:0!important;top:0!important;width:100%!important;border:none!important;box-shadow:none!important;padding:0!important;margin:0!important;color:#000!important;background:#fff!important}button,.fixed.inset-0,hr,.border-t{display:none!important}}`}} />
          <div id="printable-rc" className="p-6 bg-white text-slate-800 space-y-5 text-left border border-slate-200 rounded-xl">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 uppercase">{user?.schoolName || 'School'}</h2>
                <p className="text-[10px] text-slate-500 font-semibold mt-1">{user?.schoolAddress}</p>
              </div>
              <div className="text-right">
                <h3 className="text-base font-black text-slate-900">REPORT CARD</h3>
                <span className="text-[10px] text-slate-400 block">{reportCard.exam?.title} &middot; {reportCard.exam?.term}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Student</span>
                <span className="font-extrabold text-slate-800">{reportCard.student?.firstName} {reportCard.student?.lastName}</span>
                <span className="text-[9px] text-slate-500 font-mono block">Roll: {reportCard.student?.rollNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Class</span>
                <span className="font-extrabold text-slate-800">{reportCard.student?.className}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Date</span>
                <span className="font-extrabold text-slate-800">{new Date(reportCard.exam?.date).toLocaleDateString('en-IN')}</span>
              </div>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 text-left font-bold">Subject</th>
                  <th className="py-2 text-center font-bold">Obtained</th>
                  <th className="py-2 text-center font-bold">Max</th>
                  <th className="py-2 text-center font-bold">%</th>
                  <th className="py-2 text-center font-bold">Grade</th>
                  <th className="py-2 text-right font-bold">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportCard.marks?.map(mark => (
                  <tr key={mark.id}>
                    <td className="py-2.5 font-semibold">{mark.subjectName}</td>
                    <td className="py-2.5 text-center font-bold">{mark.marksObtained}</td>
                    <td className="py-2.5 text-center">{mark.maxMarks}</td>
                    <td className="py-2.5 text-center">{((mark.marksObtained/mark.maxMarks)*100).toFixed(1)}%</td>
                    <td className="py-2.5 text-center font-black text-blue-600">{mark.grade}</td>
                    <td className="py-2.5 text-right text-slate-500 italic">{mark.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(() => {
              const r = calcTotal(reportCard.marks);
              return (
                <div className="border-t-2 border-slate-300 pt-4 flex justify-between text-xs font-bold">
                  <div className="space-y-1">
                    <p>Total: <span className="text-blue-600">{r.obtained}</span> / {r.total}</p>
                    <p>Percentage: <span className="text-emerald-600">{r.pct.toFixed(2)}%</span></p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xl font-black ${r.pct >= 33 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {r.pct >= 33 ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                </div>
              );
            })()}
            <div className="flex justify-between items-end pt-8">
              <span className="text-[10px] text-slate-400 italic">Generated: {new Date().toLocaleDateString('en-IN')}</span>
              <div className="text-right">
                {user?.signPhoto ? <img src={user.signPhoto} alt="sig" className="h-10 w-auto ml-auto" /> : <div className="h-10" />}
                <span className="text-[10px] font-bold text-slate-500 border-t border-slate-200 pt-1 block">{user?.signatoryName || 'Authorized Signatory'}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
