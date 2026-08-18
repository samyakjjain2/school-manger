import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL, useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { CreditCard, Search, Plus, CheckCircle2, Printer } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const FeesList = () => {
  const { user } = useAuth();
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [statsData, setStatsData] = useState({ breakdown: { UPI: 0, Cash: 0, "Debit Card": 0, "Credit Card": 0, "Bank Transfer": 0, Cheque: 0, Other: 0 }, totalCollected: 0 });

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(searchParams.get('month') || '');
  const [selectedYear, setSelectedYear] = useState(searchParams.get('year') || '');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('');

  // Modals
  const [genModal, setGenModal] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [printFee, setPrintFee] = useState(null);

  const [selectedFee, setSelectedFee] = useState(null);

  // Form states
  const [genData, setGenData] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), dueDate: '' });
  const [addData, setAddData] = useState({ studentId: '', type: 'Tuition', amount: 5000, month: new Date().getMonth() + 1, year: new Date().getFullYear(), dueDate: '' });
  const [payData, setPayData] = useState({ paidAmount: 0, paymentMode: 'UPI', transactionId: '', notes: '' });

  const [customInvoiceDate, setCustomInvoiceDate] = useState('');
  const [isEditingDate, setIsEditingDate] = useState(false);

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  };

  useEffect(() => {
    setSelectedStatus(searchParams.get('status') || '');
    setSelectedMonth(searchParams.get('month') || '');
    setSelectedYear(searchParams.get('year') || '');
    setPage(1);

    if (searchParams.get('action') === 'generate') {
      setGenModal(true);
    } else {
      setGenModal(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (printFee) {
      const defaultDate = printFee.paidAt 
        ? new Date(printFee.paidAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      setCustomInvoiceDate(defaultDate);
      setIsEditingDate(false);
    }
  }, [printFee]);

  useEffect(() => {
    fetchDropdowns();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchFees();
  }, [page, search, selectedStatus, selectedMonth, selectedYear, selectedPaymentMode]);

  const fetchDropdowns = async () => {
    try {
      const res = await axios.get(`${API_URL}/students`, { params: { limit: 500 } });
      if (res.data.success) setStudents(res.data.students);
    } catch {}
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/fees/stats`);
      if (res.data.success) {
        setStatsData({
          breakdown: res.data.breakdown,
          totalCollected: res.data.totalCollected
        });
      }
    } catch {}
  };

  const fetchFees = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/fees`, {
        params: {
          search: search || undefined,
          status: selectedStatus || undefined,
          page,
          limit: 10,
          month: selectedMonth || undefined,
          year: selectedYear || undefined,
          paymentMode: selectedPaymentMode || undefined
        }
      });
      if (res.data.success) {
        setFees(res.data.fees);
        setTotalPages(res.data.pages);
      }
    } catch {
      toast.error('Failed to load fee ledger');
    } finally {
      setLoading(false);
    }
  };

  const handleGenInvoices = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/fees/generate`, genData);
      if (res.data.success) {
        toast.success(res.data.message);
        setGenModal(false);
        fetchFees();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed');
    }
  };

  const handleAddFee = async (e) => {
    e.preventDefault();
    if ((parseFloat(addData.amount) || 0) <= 0) {
      toast.error('Fee amount must be greater than 0');
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/fees`, addData);
      if (res.data.success) {
        toast.success('Fee record created successfully');
        setAddModal(false);
        fetchFees();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Creation failed');
    }
  };

  const handlePayFee = async (e) => {
    e.preventDefault();
    const amountToPay = parseFloat(payData.paidAmount) || 0;
    if (amountToPay <= 0) {
      toast.error('Payment amount must be greater than 0');
      return;
    }

    try {
      const payload = {
        paidAmount: amountToPay,
        discount: 0,
        fine: 0,
        paymentMode: payData.paymentMode,
        transactionId: payData.transactionId,
        notes: payData.notes
      };

      const res = await axios.put(`${API_URL}/fees/${selectedFee.id}/pay`, payload);
      if (res.data.success) {
        toast.success('Payment recorded successfully');
        setPayModal(false);
        fetchFees();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment update failed');
    }
  };

  const handleCancelPayment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this receipt? This will reset the payment on this bill back to 0.')) return;
    try {
      const res = await axios.put(`${API_URL}/fees/${id}/cancel-payment`);
      if (res.data.success) {
        toast.success('Receipt cancelled and billing reset to Pending');
        fetchFees();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel receipt');
    }
  };

  const handleDeleteFee = async (id) => {
    if (!window.confirm('Are you sure you want to DELETE this fee record? This action cannot be undone.')) return;
    try {
      const res = await axios.delete(`${API_URL}/fees/${id}`);
      if (res.data.success) {
        toast.success('Fee record deleted successfully');
        fetchFees();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete fee record');
    }
  };

  const openPay = (fee) => {
    setSelectedFee(fee);
    const balance = (fee.amount || 0) - (fee.paidAmount || 0);
      
    setPayData({
      paidAmount: Math.max(0, balance),
      paymentMode: 'UPI',
      transactionId: '',
      notes: ''
    });
    setPayModal(true);
  };

  const openAdd = () => {
    if (students.length === 0) {
      toast.error('Register student profile first');
      return;
    }
    setAddData({
      studentId: students[0]?.id || '',
      type: 'Tuition',
      amount: 5000,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      dueDate: ''
    });
    setAddModal(true);
  };

  return (
    <div className="space-y-6 text-xs sm:text-sm text-left font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <CreditCard className="text-blue-600" size={22} /> Academic Fee Ledger
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Manage fee ledgers, generate invoices and track payment collections.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-1.5 cursor-pointer text-xs font-bold" onClick={() => setGenModal(true)}>
            <Plus size={14} /> Auto-Generate Bills
          </Button>
          <Button variant="gradient" className="gap-1.5 cursor-pointer text-xs font-bold" onClick={openAdd}>
            <Plus size={14} /> Create Invoice
          </Button>
        </div>
      </div>

      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Card */}
        <div 
          onClick={() => { setSelectedPaymentMode(''); setPage(1); }}
          className={`premium-card p-4 flex items-center justify-between border-l-4 border-blue-500 cursor-pointer select-none transition-all duration-200 hover:scale-[1.02] ${
            selectedPaymentMode === '' ? 'ring-2 ring-blue-500 shadow-md scale-[1.02]' : 'hover:shadow-sm'
          }`}
        >
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Collected</p>
            <h3 className="text-lg font-black text-slate-800 mt-1">₹{statsData.totalCollected.toLocaleString('en-IN')}</h3>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">₹</div>
        </div>

        {/* UPI Card */}
        <div 
          onClick={() => { setSelectedPaymentMode(selectedPaymentMode === 'UPI' ? '' : 'UPI'); setPage(1); }}
          className={`premium-card p-4 flex items-center justify-between border-l-4 border-emerald-500 cursor-pointer select-none transition-all duration-200 hover:scale-[1.02] ${
            selectedPaymentMode === 'UPI' ? 'ring-2 ring-blue-500 shadow-md scale-[1.02]' : 'hover:shadow-sm'
          }`}
        >
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">UPI / QR Code</p>
            <h3 className="text-lg font-black text-emerald-600 mt-1">₹{statsData.breakdown.UPI.toLocaleString('en-IN')}</h3>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">UPI</div>
        </div>

        {/* Cash Card */}
        <div 
          onClick={() => { setSelectedPaymentMode(selectedPaymentMode === 'Cash' ? '' : 'Cash'); setPage(1); }}
          className={`premium-card p-4 flex items-center justify-between border-l-4 border-amber-500 cursor-pointer select-none transition-all duration-200 hover:scale-[1.02] ${
            selectedPaymentMode === 'Cash' ? 'ring-2 ring-blue-500 shadow-md scale-[1.02]' : 'hover:shadow-sm'
          }`}
        >
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cash Payments</p>
            <h3 className="text-lg font-black text-amber-600 mt-1">₹{statsData.breakdown.Cash.toLocaleString('en-IN')}</h3>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">CASH</div>
        </div>

        {/* Cards */}
        <div 
          onClick={() => { setSelectedPaymentMode(selectedPaymentMode === 'Debit Card,Credit Card' ? '' : 'Debit Card,Credit Card'); setPage(1); }}
          className={`premium-card p-4 flex items-center justify-between border-l-4 border-indigo-500 cursor-pointer select-none transition-all duration-200 hover:scale-[1.02] ${
            selectedPaymentMode === 'Debit Card,Credit Card' ? 'ring-2 ring-blue-500 shadow-md scale-[1.02]' : 'hover:shadow-sm'
          }`}
        >
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Card Payments</p>
            <h3 className="text-lg font-black text-indigo-650 mt-1">₹{(statsData.breakdown["Debit Card"] + statsData.breakdown["Credit Card"]).toLocaleString('en-IN')}</h3>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px]">CARD</div>
        </div>

        {/* Bank / Others */}
        <div 
          onClick={() => { setSelectedPaymentMode(selectedPaymentMode === 'Bank Transfer,Cheque,Other' ? '' : 'Bank Transfer,Cheque,Other'); setPage(1); }}
          className={`premium-card p-4 flex items-center justify-between border-l-4 border-slate-400 cursor-pointer select-none transition-all duration-200 hover:scale-[1.02] ${
            selectedPaymentMode === 'Bank Transfer,Cheque,Other' ? 'ring-2 ring-blue-500 shadow-md scale-[1.02]' : 'hover:shadow-sm'
          }`}
        >
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bank / Cheque / Other</p>
            <h3 className="text-lg font-black text-slate-700 mt-1">₹{(statsData.breakdown["Bank Transfer"] + statsData.breakdown.Cheque + statsData.breakdown.Other).toLocaleString('en-IN')}</h3>
          </div>
          <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">BANK</div>
        </div>
      </div>

      {/* Filter Options */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-4 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-blue-500 font-semibold"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
          className="w-full md:w-36 rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-xs text-slate-700 outline-none font-semibold"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
          <option value="Partial">Partial</option>
        </select>

        <select
          value={selectedMonth}
          onChange={(e) => { setSelectedMonth(e.target.value); setPage(1); }}
          className="w-full md:w-36 rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-xs text-slate-700 outline-none font-semibold"
        >
          <option value="">All Months</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString('default', { month: 'long' })}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Year"
          value={selectedYear}
          onChange={(e) => { setSelectedYear(e.target.value); setPage(1); }}
          className="w-full md:w-28 rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-xs text-slate-700 outline-none font-semibold"
        />

        <Button variant="outline" className="w-full md:w-auto text-xs shrink-0 cursor-pointer font-bold" onClick={fetchFees}>
          Apply Filters
        </Button>
      </div>

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : fees.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200 bg-slate-50/50">
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Student Name</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Billing Month</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Fee Type</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Bill Amount</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Amount Paid</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Balance Due</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Status</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {fees.map((fee) => {
                  const balance = Math.max(0, fee.amount - fee.paidAmount);
                  
                  return (
                    <tr key={fee.id} className="hover:bg-slate-50">
                      <td className="p-4">
                        <span className="text-slate-800 block font-bold">{fee.student?.firstName} {fee.student?.lastName}</span>
                        <span className="text-[10px] text-slate-400 block font-mono font-semibold">{fee.student?.rollNumber}</span>
                      </td>
                      <td className="p-4 font-bold text-slate-800">
                        {fee.month ? `${new Date(0, fee.month - 1).toLocaleString('default', { month: 'short' })} ${fee.year}` : 'N/A'}
                      </td>
                      <td className="p-4 font-bold text-slate-800">{fee.type}</td>
                      <td className="p-4 font-bold text-slate-800">₹{fee.amount?.toLocaleString()}</td>
                      <td className="p-4 font-bold text-emerald-600">₹{fee.paidAmount?.toLocaleString()}</td>
                      <td className="p-4 font-bold text-rose-500">₹{balance?.toLocaleString()}</td>
                      <td className="p-4">
                        <Badge variant={
                          fee.status === 'Paid' ? 'success' : fee.status === 'Partial' ? 'primary' : 'danger'
                        }>{fee.status}</Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end items-center gap-2 flex-wrap">
                          {fee.status !== 'Paid' ? (
                            <Button variant="outline" className="text-[10px] px-2.5 py-1.5 cursor-pointer font-bold gap-1" onClick={() => openPay(fee)}>
                              <CreditCard size={12} /> Pay Due
                            </Button>
                          ) : (
                            <span className="text-emerald-600 font-bold inline-flex items-center gap-1 mr-2 text-[11px]">
                              <CheckCircle2 size={12} /> Settled
                            </span>
                          )}
                          <Button variant="secondary" className="text-[10px] px-2.5 py-1.5 cursor-pointer font-bold gap-1 border border-slate-200" onClick={() => setPrintFee(fee)}>
                            <Printer size={12} /> Receipt
                          </Button>
                          {fee.paidAmount > 0 && (
                            <Button variant="danger" className="text-[10px] px-2.5 py-1.5 cursor-pointer font-bold gap-1" onClick={() => handleCancelPayment(fee.id)}>
                              Reset
                            </Button>
                          )}
                          {fee.status !== 'Paid' && (
                            <Button variant="danger" className="text-[10px] px-2.5 py-1.5 cursor-pointer font-bold gap-1" onClick={() => handleDeleteFee(fee.id)}>
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <CreditCard className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No Invoices Found</h3>
          <p className="text-xs text-slate-500 mt-1">Record individual invoices or trigger billing runs to populate the list.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 text-xs font-semibold">
          <span className="text-slate-400">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)} className="cursor-pointer font-bold">Previous</Button>
            <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)} className="cursor-pointer font-bold">Next</Button>
          </div>
        </div>
      )}

      {/* Auto-generate Modal */}
      <Modal 
        isOpen={genModal} 
        onClose={() => {
          setGenModal(false);
          if (searchParams.get('action') === 'generate') navigate('/fees');
        }} 
        title="Auto-Generate Tuition Bills" 
        footer={
          <>
            <Button variant="secondary" onClick={() => {
              setGenModal(false);
              if (searchParams.get('action') === 'generate') navigate('/fees');
            }}>Cancel</Button>
            <Button variant="gradient" type="submit" form="generate-form">Trigger Billing Run</Button>
          </>
        }
      >
        <form id="generate-form" onSubmit={handleGenInvoices} className="space-y-4 text-xs font-semibold">
          <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
            This will generate a monthly tuition fee of <strong>₹{(user?.defaultMonthlyAmount || 5000).toLocaleString('en-IN')}</strong> for all active students who don't already have a bill for this month.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Billing Month *</label>
              <select value={genData.month} onChange={(e) => setGenData({ ...genData, month: parseInt(e.target.value) || 1 })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none font-semibold">
                {Array.from({ length: 12 }, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Billing Year *</label>
              <input type="number" required value={genData.year} onChange={(e) => setGenData({ ...genData, year: parseInt(e.target.value) || 2026 })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none font-semibold" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Payment Due Date *</label>
            <input type="date" required value={genData.dueDate} onChange={(e) => setGenData({ ...genData, dueDate: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none font-semibold" />
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal isOpen={payModal} onClose={() => setPayModal(false)} title="Record Fee Payment" footer={
        <>
          <Button variant="secondary" onClick={() => setPayModal(false)}>Cancel</Button>
          <Button variant="gradient" type="submit" form="pay-form">Save Payment</Button>
        </>
      }>
        <form id="pay-form" onSubmit={handlePayFee} className="space-y-4 text-xs font-semibold">
          {selectedFee && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-150 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Student Name:</span>
                <span className="text-slate-800 font-bold">{selectedFee.student?.firstName} {selectedFee.student?.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Bill Amount:</span>
                <span className="text-slate-800 font-bold">₹{selectedFee.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Amount Already Paid:</span>
                <span className="text-emerald-600 font-bold">₹{selectedFee.paidAmount}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Payment Mode</label>
              <select value={payData.paymentMode} onChange={(e) => setPayData({ ...payData, paymentMode: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none font-semibold">
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Payment Amount (₹) *</label>
              <input 
                type="number" 
                required 
                min="1" 
                max={selectedFee ? selectedFee.amount - selectedFee.paidAmount : 10000}
                value={payData.paidAmount} 
                onChange={(e) => setPayData({ ...payData, paidAmount: parseFloat(e.target.value) || 0 })} 
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none font-bold" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Transaction ID</label>
              <input type="text" placeholder="UPI Ref / Txn ID" value={payData.transactionId} onChange={(e) => setPayData({ ...payData, transactionId: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none font-mono" />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Remarks / Notes</label>
              <input type="text" placeholder="e.g. Paid online by parent" value={payData.notes} onChange={(e) => setPayData({ ...payData, notes: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none" />
            </div>
          </div>
        </form>
      </Modal>

      {/* Add Individual Fee Modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Create Custom Invoice" footer={
        <>
          <Button variant="secondary" onClick={() => setAddModal(false)}>Cancel</Button>
          <Button variant="gradient" type="submit" form="add-fee-form">Create Invoice</Button>
        </>
      }>
        <form id="add-fee-form" onSubmit={handleAddFee} className="space-y-4 text-xs font-semibold">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Select Student *</label>
            <select value={addData.studentId} onChange={(e) => setAddData({ ...addData, studentId: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none font-semibold">
              <option value="">Choose Student</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.rollNumber})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Fee Category *</label>
              <select value={addData.type} onChange={(e) => setAddData({ ...addData, type: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none font-semibold">
                <option value="Tuition">Tuition Fee</option>
                <option value="Admission">Admission Fee</option>
                <option value="Exam">Exam Fee</option>
                <option value="Sports">Sports Fee</option>
                <option value="Library">Library Fee</option>
                <option value="Other">Other Miscellaneous</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Invoice Amount (₹) *</label>
              <input type="number" required min="1" value={addData.amount} onChange={(e) => setAddData({ ...addData, amount: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Billing Month *</label>
              <select value={addData.month} onChange={(e) => setAddData({ ...addData, month: parseInt(e.target.value) || 1 })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none font-semibold">
                {Array.from({ length: 12 }, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Billing Year *</label>
              <input type="number" required value={addData.year} onChange={(e) => setAddData({ ...addData, year: parseInt(e.target.value) || new Date().getFullYear() })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none font-semibold" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Due Date *</label>
            <input type="date" required value={addData.dueDate} onChange={(e) => setAddData({ ...addData, dueDate: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none" />
          </div>
        </form>
      </Modal>

      {/* Receipt Print Modal */}
      {printFee && (
        <Modal 
          isOpen={!!printFee} 
          onClose={() => setPrintFee(null)} 
          title="Print Invoice Receipt"
          footer={
            <>
              <Button variant="secondary" onClick={() => setPrintFee(null)}>Close</Button>
              <Button variant="gradient" onClick={() => window.print()} className="gap-1.5 cursor-pointer font-bold">
                <Printer size={14} /> Print / Save PDF
              </Button>
            </>
          }
        >
          {/* Custom style overrides for printing receipts */}
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-receipt, #printable-receipt * {
                visibility: visible !important;
              }
              #printable-receipt {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
                color: #000000 !important;
                background: #ffffff !important;
              }
              .fixed, .relative, [role="dialog"], [role="document"] {
                position: static !important;
                display: block !important;
                overflow: visible !important;
                max-height: none !important;
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                background: transparent !important;
              }
              /* Hide close buttons / backdrop inside dialog during print overlay */
              button, .fixed.inset-0, hr, .border-t {
                display: none !important;
              }
            }
          `}} />

          {/* Printable Layout Sheet */}
          <div id="printable-receipt" className="p-6 bg-white text-slate-800 space-y-6 text-left border border-slate-200 rounded-xl">
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                  {user?.schoolName || 'Greenwood High School'}
                </h2>
                <p className="text-[10px] text-slate-500 font-semibold mt-1">
                  {user?.schoolAddress || 'School Campus address'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Phone: {user?.schoolPhone || 'N/A'}
                </p>
              </div>
              <div className="text-right">
                <h3 className="text-base font-black text-slate-900">INVOICE RECEIPT</h3>
                <span className="text-[10px] font-mono text-slate-400 block mt-1">
                  Receipt No: {printFee.receiptNumber || 'REC-PENDING'}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Date: {formatDisplayDate(customInvoiceDate)}
                </span>
              </div>
            </div>

            {/* Billing Details */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Student Name</span>
                <span className="text-slate-800 font-extrabold">{printFee.student?.firstName} {printFee.student?.lastName}</span>
                <span className="text-[9px] text-slate-500 block font-mono font-semibold mt-0.5">Roll No: {printFee.student?.rollNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Bill Period</span>
                <span className="text-slate-800 font-extrabold">
                  {printFee.month ? `${new Date(0, printFee.month - 1).toLocaleString('default', { month: 'long' })} ${printFee.year}` : 'N/A'}
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5 font-bold">Category: {printFee.type}</span>
              </div>
            </div>

            {/* Accounts ledger structure */}
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs font-semibold py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Invoice Amount</span>
                <span className="text-slate-800">₹{printFee.amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Fine Charged</span>
                <span className="text-slate-800">₹{printFee.fine || 0}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Discount Concession</span>
                <span className="text-slate-800">- ₹{printFee.discount || 0}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 text-slate-900 border-t border-slate-200">
                <span>Amount Paid</span>
                <span className="text-emerald-600 font-extrabold">₹{printFee.paidAmount?.toLocaleString()}</span>
              </div>
              {printFee.amount + (printFee.fine || 0) - (printFee.discount || 0) - printFee.paidAmount > 0 && (
                <div className="flex justify-between text-sm font-bold text-slate-900">
                  <span>Balance Due</span>
                  <span className="text-rose-500 font-extrabold">
                    ₹{(printFee.amount + (printFee.fine || 0) - (printFee.discount || 0) - printFee.paidAmount).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Signature Area */}
            <div className="flex justify-between items-end pt-12">
              <div className="text-xs text-slate-500">
                <p>Payment Mode: <span className="font-bold text-slate-700">{printFee.paymentMode || 'N/A'}</span></p>
                {printFee.transactionId && <p className="font-mono text-[10px] mt-0.5">Ref ID: {printFee.transactionId}</p>}
              </div>
              <div className="text-right space-y-1.5">
                {user?.signPhoto ? (
                  <img src={user.signPhoto} alt="signature" className="h-10 w-auto object-contain ml-auto opacity-90" />
                ) : (
                  <div className="h-10" />
                )}
                <span className="text-[10px] font-bold text-slate-550 border-t border-slate-200 pt-1 block">
                  {user?.signatoryName || 'Authorized Signatory'}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
