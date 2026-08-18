import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { BookOpen, Plus, Search, Trash2, Calendar, CornerDownRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const Library = () => {
  const [books, setBooks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('catalog');
  const [loading, setLoading] = useState(true);

  // Modals
  const [addBookModal, setAddBookModal] = useState(false);
  const [issueModal, setIssueModal] = useState(false);

  // Form states
  const [bookData, setBookData] = useState({ title: '', author: '', isbn: '' });
  const [issueData, setIssueData] = useState({ bookId: '', studentId: '', dueDate: '' });

  useEffect(() => {
    fetchBooks();
    fetchIssues();
    fetchStudents();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/library/books`);
      if (res.data.success) {
        setBooks(res.data.books);
        const avl = res.data.books.filter(b => b.status === 'Available');
        if (avl.length > 0) setIssueData(prev => ({ ...prev, bookId: avl[0].id }));
      }
    } catch {
      toast.error('Failed to load library books');
    } finally {
      setLoading(false);
    }
  };

  const fetchIssues = async () => {
    try {
      const res = await axios.get(`${API_URL}/library/issues`);
      if (res.data.success) setIssues(res.data.issues);
    } catch {}
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_URL}/students`, { params: { limit: 500 } });
      if (res.data.success) {
        setStudents(res.data.students);
        if (res.data.students.length > 0) setIssueData(prev => ({ ...prev, studentId: res.data.students[0].id }));
      }
    } catch {}
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/library/books`, bookData);
      if (res.data.success) {
        toast.success('Book cataloged successfully');
        setAddBookModal(false);
        setBookData({ title: '', author: '', isbn: '' });
        fetchBooks();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add book');
    }
  };

  const handleDeleteBook = async (id) => {
    if (!window.confirm('Are you sure you want to remove this book from catalog?')) return;
    try {
      const res = await axios.delete(`${API_URL}/library/books/${id}`);
      if (res.data.success) {
        toast.success('Book removed');
        fetchBooks();
      }
    } catch {
      toast.error('Failed to remove book');
    }
  };

  const handleIssueBook = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/library/issues`, issueData);
      if (res.data.success) {
        toast.success('Book issued to student');
        setIssueModal(false);
        fetchBooks();
        fetchIssues();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue book');
    }
  };

  const handleReturnBook = async (issueId) => {
    try {
      const res = await axios.put(`${API_URL}/library/issues/${issueId}/return`);
      if (res.data.success) {
        toast.success(res.data.issue.fineAmount > 0 
          ? `Book returned. Overdue fine: ₹${res.data.issue.fineAmount}` 
          : 'Book returned successfully'
        );
        fetchBooks();
        fetchIssues();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to return book');
    }
  };

  return (
    <div className="space-y-6 text-xs sm:text-sm text-left font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <BookOpen className="text-blue-600" size={22} /> Library Registry
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Maintain book inventories and track borrow return cycles.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-1.5 cursor-pointer text-xs font-bold" onClick={() => setIssueModal(true)} disabled={books.filter(b => b.status === 'Available').length === 0 || students.length === 0}>
            <Plus size={14} /> Issue Book
          </Button>
          <Button variant="gradient" className="gap-1.5 cursor-pointer text-xs font-bold" onClick={() => setAddBookModal(true)}>
            <Plus size={14} /> Add Book
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-6 py-3 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
            activeTab === 'catalog' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          Book Catalog ({books.length})
        </button>
        <button
          onClick={() => setActiveTab('circulation')}
          className={`px-6 py-3 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
            activeTab === 'circulation' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          Circulation Ledger ({issues.length})
        </button>
      </div>

      {/* Catalog Listing */}
      {activeTab === 'catalog' && (
        <>
          {loading ? (
            <div className="flex h-[40vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : books.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((b) => (
                <div key={b.id} className="premium-card flex flex-col justify-between h-40 hover:shadow-md transition">
                  <div className="space-y-1 text-left">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-mono block">ISBN: {b.isbn || 'N/A'}</span>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mt-0.5">{b.title}</h3>
                      </div>
                      <button 
                        onClick={() => handleDeleteBook(b.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
                        title="Remove Book"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <p className="text-slate-500 text-xs font-semibold">Author: {b.author}</p>
                  </div>
                  <div className="pt-2 font-bold">
                    <Badge variant={b.status === 'Available' ? 'success' : 'warning'}>
                      {b.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-slate-400 mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">Empty Library Catalog</h3>
              <p className="text-xs text-slate-500 mt-1">Register book catalog profiles to initialize inventories.</p>
            </div>
          )}
        </>
      )}

      {/* Circulation Logs */}
      {activeTab === 'circulation' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200 bg-slate-50/50">
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Student Borrowing</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Issued Book</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Due Date</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Return Status</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {issues.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <span className="text-slate-800 block font-bold">{i.student?.firstName} {i.student?.lastName}</span>
                      <span className="text-[10px] text-slate-400 block font-mono font-semibold">{i.student?.rollNumber}</span>
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      <span>{i.book?.title}</span>
                      <span className="text-[10px] text-slate-400 block font-normal">{i.book?.author}</span>
                    </td>
                    <td className="p-4 font-medium text-slate-600">
                      <Calendar size={13} className="inline mr-1 text-slate-400" />
                      {new Date(i.dueDate).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <Badge variant={i.returnDate ? 'success' : 'danger'}>
                        {i.returnDate 
                          ? `Returned on ${new Date(i.returnDate).toLocaleDateString()}` 
                          : 'Issued'
                        }
                      </Badge>
                      {i.fineAmount > 0 && (
                        <span className="block text-[10px] text-rose-500 font-bold mt-1">Fine Paid: ₹{i.fineAmount}</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {!i.returnDate ? (
                        <Button variant="outline" className="text-[10px] px-2.5 py-1.5 cursor-pointer font-bold border border-slate-200" onClick={() => handleReturnBook(i.id)}>
                          Process Return
                        </Button>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
                {issues.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-slate-400 italic">No circulation history logged.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Book Modal */}
      <Modal isOpen={addBookModal} onClose={() => setAddBookModal(false)} title="Catalog Library Book" footer={
        <>
          <Button variant="secondary" onClick={() => setAddBookModal(false)}>Cancel</Button>
          <Button variant="gradient" type="submit" form="add-book-form">Save Book</Button>
        </>
      }>
        <form id="add-book-form" onSubmit={handleAddBook} className="space-y-4 text-xs font-semibold font-sans">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Book Title *</label>
            <input type="text" required placeholder="e.g. Higher Engineering Mathematics" value={bookData.title} onChange={(e) => setBookData({ ...bookData, title: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none focus:border-blue-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Author *</label>
              <input type="text" required placeholder="e.g. B.S. Grewal" value={bookData.author} onChange={(e) => setBookData({ ...bookData, author: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none focus:border-blue-500" />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">ISBN Code</label>
              <input type="text" placeholder="e.g. 978-81-7409-195-5" value={bookData.isbn} onChange={(e) => setBookData({ ...bookData, isbn: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none focus:border-blue-500" />
            </div>
          </div>
        </form>
      </Modal>

      {/* Issue Book Modal */}
      <Modal isOpen={issueModal} onClose={() => setIssueModal(false)} title="Issue Library Book" footer={
        <>
          <Button variant="secondary" onClick={() => setIssueModal(false)}>Cancel</Button>
          <Button variant="gradient" type="submit" form="issue-book-form">Issue Book</Button>
        </>
      }>
        <form id="issue-book-form" onSubmit={handleIssueBook} className="space-y-4 text-xs font-semibold font-sans">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Select Available Book *</label>
            <select value={issueData.bookId} onChange={(e) => setIssueData({ ...issueData, bookId: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none font-semibold">
              <option value="">Choose Book</option>
              {books.filter(b => b.status === 'Available').map(b => (
                <option key={b.id} value={b.id}>{b.title} (by {b.author})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Select Borrowing Student *</label>
              <select value={issueData.studentId} onChange={(e) => setIssueData({ ...issueData, studentId: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none font-semibold">
                <option value="">Choose Student</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.rollNumber})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Return Due Date *</label>
              <input type="date" required value={issueData.dueDate} onChange={(e) => setIssueData({ ...issueData, dueDate: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none" />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
