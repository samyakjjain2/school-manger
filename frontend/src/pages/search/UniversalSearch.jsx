import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Search, User, ClipboardList, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const UniversalSearch = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState({ students: [], notices: [], staff: [], complaints: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query.trim() !== '') {
      fetchSearchResults();
    }
  }, [query]);

  const fetchSearchResults = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/search`, {
        params: { q: query }
      });
      if (res.data.success) {
        setResults(res.data.results);
      }
    } catch {
      toast.error('Search query execution failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-xs sm:text-sm text-left font-sans">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Search className="text-blue-600" size={22} /> Universal Search Engine
        </h1>
        <p className="text-slate-500 text-xs mt-1">
          Search results matching query keyword: <strong className="text-blue-600">"{query}"</strong>
        </p>
      </div>

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Students Results */}
          <div className="premium-card space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5 font-sans">
              <User size={15} className="text-blue-600" /> Matching Students ({results.students?.length || 0})
            </h3>
            
            {results.students?.length > 0 ? (
              <div className="space-y-3.5">
                {results.students.map((student) => (
                  <div key={student.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <span className="text-slate-800 font-bold block">{student.firstName} {student.lastName}</span>
                      <span className="text-[10px] text-slate-400 block font-mono font-semibold mt-0.5">{student.rollNumber} &middot; {student.className}</span>
                    </div>
                    <Link to={`/students/${student.id}`}>
                      <Button variant="outline" className="text-[10px] px-2.5 py-1.5 cursor-pointer font-bold gap-1 border border-slate-200">
                        View Card <ArrowRight size={12} />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic py-4">No matching students found.</p>
            )}
          </div>

          {/* Notices Results */}
          <div className="premium-card space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5 font-sans">
              <ClipboardList size={15} className="text-blue-600" /> Notice Board Announcements ({results.notices?.length || 0})
            </h3>

            {results.notices?.length > 0 ? (
              <div className="space-y-3.5">
                {results.notices.map((notice) => (
                  <div key={notice.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <span className="text-slate-800 font-bold block">{notice.title}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{notice.category} &middot; Target: {notice.targetGroup}</span>
                    </div>
                    <Link to="/notices">
                      <Button variant="outline" className="text-[10px] px-2.5 py-1.5 cursor-pointer font-bold gap-1 border border-slate-200">
                        Notice Board <ArrowRight size={12} />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic py-4">No matching announcements found.</p>
            )}
          </div>

          {/* Staff Results */}
          <div className="premium-card space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5 font-sans">
              <ShieldCheck size={15} className="text-blue-600" /> Staff & Teachers ({results.staff?.length || 0})
            </h3>
            
            {results.staff?.length > 0 ? (
              <div className="space-y-3.5">
                {results.staff.map((s) => (
                  <div key={s.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <span className="text-slate-800 font-bold block">{s.name}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{s.role} &middot; {s.phone}</span>
                    </div>
                    <Link to="/staff">
                      <Button variant="outline" className="text-[10px] px-2.5 py-1.5 cursor-pointer font-bold gap-1 border border-slate-200">
                        View Directory <ArrowRight size={12} />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic py-4">No matching staff members found.</p>
            )}
          </div>

          {/* Complaints Results */}
          <div className="premium-card space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5 font-sans">
              <AlertCircle size={15} className="text-blue-600" /> Support Tickets ({results.complaints?.length || 0})
            </h3>
            
            {results.complaints?.length > 0 ? (
              <div className="space-y-3.5">
                {results.complaints.map((c) => (
                  <div key={c.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <span className="text-slate-800 font-bold block">{c.title}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">By: {c.student?.firstName} {c.student?.lastName} &middot; Priority: {c.priority}</span>
                    </div>
                    <Link to="/complaints">
                      <Button variant="outline" className="text-[10px] px-2.5 py-1.5 cursor-pointer font-bold gap-1 border border-slate-200">
                        Resolve Ticket <ArrowRight size={12} />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic py-4">No matching support tickets found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
