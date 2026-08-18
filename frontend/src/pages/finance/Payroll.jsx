import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Receipt, Search, Plus, Edit2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const Payroll = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editSalaryModal, setEditSalaryModal] = useState(false);
  const [payoutModal, setPayoutModal] = useState(false);

  const [selectedStaff, setSelectedStaff] = useState(null);

  // Form states
  const [salaryForm, setSalaryForm] = useState({ salary: '' });
  const [payoutForm, setPayoutForm] = useState({ staffId: '', amount: '', paymentMode: 'Bank Transfer', month: new Date().getMonth() + 1, year: new Date().getFullYear() });

  useEffect(() => {
    fetchPayroll();
  }, []);

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/payroll`);
      if (res.data.success) {
        setStaffList(res.data.staff);
        if (res.data.staff.length > 0) {
          setPayoutForm(prev => ({ 
            ...prev, 
            staffId: res.data.staff[0].id,
            amount: res.data.staff[0].salary || 0
          }));
        }
      }
    } catch {
      toast.error('Failed to load payroll catalog');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSalary = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${API_URL}/payroll/salary/${selectedStaff.id}`, salaryForm);
      if (res.data.success) {
        toast.success('Staff basic salary updated');
        setEditSalaryModal(false);
        fetchPayroll();
      }
    } catch {
      toast.error('Failed to update salary');
    }
  };

  const handleDisburse = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/payroll/payout`, payoutForm);
      if (res.data.success) {
        toast.success('Salary disbursement recorded successfully');
        setPayoutModal(false);
        fetchPayroll();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payout failed');
    }
  };

  const openEditSalary = (s) => {
    setSelectedStaff(s);
    setSalaryForm({ salary: s.salary || 0 });
    setEditSalaryModal(true);
  };

  const openPayout = () => {
    if (staffList.length === 0) {
      toast.error('Please register staff profiles first');
      return;
    }
    setPayoutForm({
      staffId: staffList[0].id,
      amount: staffList[0].salary || 0,
      paymentMode: 'Bank Transfer',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    });
    setPayoutModal(true);
  };

  const onStaffChange = (e) => {
    const sId = e.target.value;
    const target = staffList.find(s => s.id === sId);
    setPayoutForm({
      ...payoutForm,
      staffId: sId,
      amount: target ? target.salary : 0
    });
  };

  return (
    <div className="space-y-6 text-xs sm:text-sm text-left font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Receipt className="text-blue-600" size={22} /> Staff Payroll Ledger
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Configure basic salaries, disburse monthly wages, and view payout logs.
          </p>
        </div>
        <Button variant="gradient" className="gap-1.5 cursor-pointer text-xs self-start" onClick={openPayout}>
          <Plus size={14} /> Disburse Wages
        </Button>
      </div>

      {/* Staff directory grid with basic salary tags */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : staffList.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200 bg-slate-50/50">
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Staff Member</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Role / designation</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Basic Salary (₹)</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Payouts Recorded</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {staffList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <span className="text-slate-800 block font-bold">{s.name}</span>
                      <span className="text-[10px] text-slate-400 block">{s.phone}</span>
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      <Badge variant="primary">{s.role || s.designation}</Badge>
                    </td>
                    <td className="p-4 font-extrabold text-slate-800">₹{s.salary?.toLocaleString('en-IN') || 0}/mo</td>
                    <td className="p-4 font-bold">
                      <Badge variant="success">
                        {s.salaryPayouts?.length || 0} Payouts
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="outline" className="text-[10px] px-2.5 py-1.5 cursor-pointer font-bold gap-1 border border-slate-200" onClick={() => openEditSalary(s)}>
                        <Edit2 size={12} /> Set Rate
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Receipt className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No Staff Directory</h3>
          <p className="text-xs text-slate-500 mt-1">Register staff members under the Main tab to manage payrolls.</p>
        </div>
      )}

      {/* Edit Salary Modal */}
      <Modal isOpen={editSalaryModal} onClose={() => setEditSalaryModal(false)} title="Update Staff Wages Rate" footer={
        <>
          <Button variant="secondary" onClick={() => setEditSalaryModal(false)}>Cancel</Button>
          <Button variant="gradient" type="submit" form="salary-form">Update Base</Button>
        </>
      }>
        <form id="salary-form" onSubmit={handleEditSalary} className="space-y-4 text-xs font-semibold">
          {selectedStaff && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-150 text-xs">
              Staff Member: <span className="font-bold text-slate-800">{selectedStaff.name}</span>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Monthly Base Salary (₹) *</label>
            <input type="number" required min="0" value={salaryForm.salary} onChange={(e) => setSalaryForm({ salary: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none font-bold" />
          </div>
        </form>
      </Modal>

      {/* Disburse Wage Modal */}
      <Modal isOpen={payoutModal} onClose={() => setPayoutModal(false)} title="Disburse Monthly Wage" footer={
        <>
          <Button variant="secondary" onClick={() => setPayoutModal(false)}>Cancel</Button>
          <Button variant="gradient" type="submit" form="payout-form">Process Payout</Button>
        </>
      }>
        <form id="payout-form" onSubmit={handleDisburse} className="space-y-4 text-xs font-semibold">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Select Staff Member *</label>
              <select value={payoutForm.staffId} onChange={onStaffChange} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none font-semibold">
                {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.designation})</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Payment Mode *</label>
              <select value={payoutForm.paymentMode} onChange={(e) => setPayoutForm({ ...payoutForm, paymentMode: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none">
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Salary Month *</label>
              <select value={payoutForm.month} onChange={(e) => setPayoutForm({ ...payoutForm, month: parseInt(e.target.value) || 1 })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none">
                {Array.from({ length: 12 }, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Salary Year *</label>
              <input type="number" required value={payoutForm.year} onChange={(e) => setPayoutForm({ ...payoutForm, year: parseInt(e.target.value) || 2026 })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Payout Amount (₹) *</label>
            <input type="number" required min="1" value={payoutForm.amount} onChange={(e) => setPayoutForm({ ...payoutForm, amount: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none font-bold" />
          </div>
        </form>
      </Modal>
    </div>
  );
};
