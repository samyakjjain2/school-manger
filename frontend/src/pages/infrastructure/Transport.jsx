import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Bus, Plus, Search, Trash2, Phone, MapPin, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export const Transport = () => {
  const [routes, setRoutes] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [addRouteModal, setAddRouteModal] = useState(false);
  const [allocModal, setAllocModal] = useState(false);

  // Form states
  const [routeData, setRouteData] = useState({ vehicleNumber: '', routeName: '', driverName: '', driverPhone: '', monthlyCharge: 1500 });
  const [allocData, setAllocData] = useState({ studentId: '', routeId: '' });

  useEffect(() => {
    fetchRoutes();
    fetchStudents();
  }, []);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/transport`);
      if (res.data.success) {
        setRoutes(res.data.routes);
        if (res.data.routes.length > 0) {
          setAllocData(prev => ({ ...prev, routeId: res.data.routes[0].id }));
        }
      }
    } catch {
      toast.error('Failed to load transport routes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_URL}/students`, { params: { limit: 500 } });
      if (res.data.success) {
        setStudents(res.data.students);
        if (res.data.students.length > 0) {
          setAllocData(prev => ({ ...prev, studentId: res.data.students[0].id }));
        }
      }
    } catch {}
  };

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/transport`, routeData);
      if (res.data.success) {
        toast.success('Transport route published');
        setAddRouteModal(false);
        setRouteData({ vehicleNumber: '', routeName: '', driverName: '', driverPhone: '', monthlyCharge: 1500 });
        fetchRoutes();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Route creation failed');
    }
  };

  const handleDeleteRoute = async (id) => {
    if (!window.confirm('Are you sure you want to delete this route? Students mapped will be deallocated.')) return;
    try {
      const res = await axios.delete(`${API_URL}/transport/${id}`);
      if (res.data.success) {
        toast.success('Route deleted successfully');
        fetchRoutes();
        fetchStudents();
      }
    } catch {
      toast.error('Failed to delete route');
    }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${API_URL}/transport/allocate`, allocData);
      if (res.data.success) {
        toast.success('Student transport route assigned');
        setAllocModal(false);
        fetchRoutes();
        fetchStudents();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Allocation failed');
    }
  };

  return (
    <div className="space-y-6 text-xs sm:text-sm text-left font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Bus className="text-blue-600" size={22} /> Transport Routes
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Configure bus fleet routes, driver payroll records, and allocate students.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-1.5 cursor-pointer text-xs font-bold" onClick={() => setAllocModal(true)} disabled={routes.length === 0 || students.length === 0}>
            <UserPlus size={14} /> Map Student Route
          </Button>
          <Button variant="gradient" className="gap-1.5 cursor-pointer text-xs font-bold" onClick={() => setAddRouteModal(true)}>
            <Plus size={14} /> Create Route
          </Button>
        </div>
      </div>

      {/* Routes Directory List */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : routes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routes.map((route) => (
            <div key={route.id} className="premium-card flex flex-col justify-between h-48 hover:shadow-md transition">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block">Bus: {route.vehicleNumber}</span>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mt-0.5">{route.routeName}</h3>
                  </div>
                  <button 
                    onClick={() => handleDeleteRoute(route.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
                    title="Remove Route"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="space-y-2 mt-4 text-xs text-slate-500 font-semibold">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-400" />
                    <span>Driver: {route.driverName} ({route.driverPhone})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400" />
                    <span>Monthly Rate: ₹{route.monthlyCharge}/mo</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>Allocated Students</span>
                <Badge variant="primary">{route.students?.length || 0} Students</Badge>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Bus className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No Transport Routes</h3>
          <p className="text-xs text-slate-500 mt-1">Register school bus routes and vehicles to map students transport.</p>
        </div>
      )}

      {/* Create Route Modal */}
      <Modal isOpen={addRouteModal} onClose={() => setAddRouteModal(false)} title="Register School Bus Route" footer={
        <>
          <Button variant="secondary" onClick={() => setAddRouteModal(false)}>Cancel</Button>
          <Button variant="gradient" type="submit" form="route-form">Save Route</Button>
        </>
      }>
        <form id="route-form" onSubmit={handleCreateRoute} className="space-y-4 text-xs font-semibold font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Vehicle / Bus Plate Number *</label>
              <input type="text" required placeholder="e.g. DL 1C AB 1234" value={routeData.vehicleNumber} onChange={(e) => setRouteData({ ...routeData, vehicleNumber: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none focus:border-blue-500" />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Route Name Description *</label>
              <input type="text" required placeholder="e.g. Route A (Janakpuri - Vikaspuri)" value={routeData.routeName} onChange={(e) => setRouteData({ ...routeData, routeName: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Driver Name *</label>
              <input type="text" required placeholder="e.g. Hari Singh" value={routeData.driverName} onChange={(e) => setRouteData({ ...routeData, driverName: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none" />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Driver Phone Number *</label>
              <input type="text" required placeholder="e.g. +91 98765 43219" value={routeData.driverPhone} onChange={(e) => setRouteData({ ...routeData, driverPhone: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none" />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Monthly Route Fee (₹) *</label>
              <input type="number" required min="0" value={routeData.monthlyCharge} onChange={(e) => setRouteData({ ...routeData, monthlyCharge: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none font-bold" />
            </div>
          </div>
        </form>
      </Modal>

      {/* Allocate Student to Route Modal */}
      <Modal isOpen={allocModal} onClose={() => setAllocModal(false)} title="Assign Student Transport Route" footer={
        <>
          <Button variant="secondary" onClick={() => setAllocModal(false)}>Cancel</Button>
          <Button variant="gradient" type="submit" form="alloc-form">Allocate Route</Button>
        </>
      }>
        <form id="alloc-form" onSubmit={handleAllocate} className="space-y-4 text-xs font-semibold font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Select Student *</label>
              <select value={allocData.studentId} onChange={(e) => setAllocData({ ...allocData, studentId: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none font-semibold">
                <option value="">Choose Student</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.rollNumber})</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Select Transport Route</label>
              <select value={allocData.routeId} onChange={(e) => setAllocData({ ...allocData, routeId: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none font-semibold">
                <option value="">No Transport (Deallocate)</option>
                {routes.map(r => <option key={r.id} value={r.id}>{r.routeName} (₹{r.monthlyCharge})</option>)}
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
