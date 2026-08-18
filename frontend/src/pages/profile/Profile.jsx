import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { User, Phone, Mail, Key, Building2, IndianRupee } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const inputCls = "w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3.5 text-slate-805 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs sm:text-sm font-semibold";
const labelCls = "block font-bold text-slate-600 mb-1 text-xs text-left";
const cardCls = "premium-card p-5 space-y-4";
const sectionHeaderCls = "text-sm font-bold text-slate-805 mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2 text-left";

export const Profile = () => {
  const { user, updateProfile } = useAuth();

  // --- Account info state ---
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });

  // --- School & Invoice settings state ---
  const [settings, setSettings] = useState({
    schoolName: user?.schoolName || '',
    schoolAddress: user?.schoolAddress || '',
    schoolPhone: user?.schoolPhone || '',
    signatoryName: user?.signatoryName || '',
    defaultMonthlyAmount: user?.defaultMonthlyAmount ?? 5000,
    signPhoto: user?.signPhoto || ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({ name: user.name || '', phone: user.phone || '' });
      setSettings({
        schoolName: user.schoolName || '',
        schoolAddress: user.schoolAddress || '',
        schoolPhone: user.schoolPhone || '',
        signatoryName: user.signatoryName || '',
        defaultMonthlyAmount: user.defaultMonthlyAmount ?? 5000,
        signPhoto: user.signPhoto || ''
      });
    }
  }, [user]);

  // --- Password state ---
  const [pwData, setPwData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await updateProfile(profileData);
      if (res.success) toast.success('Account profile saved');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSignatureChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Original file is too large. Please select a smaller photo (under 2MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 100;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/png', 0.7);
        let finalSignPhoto = compressedBase64;
        const base64SizeInBytes = Math.round((compressedBase64.length * 3) / 4);
        if (base64SizeInBytes > 50 * 1024) {
          finalSignPhoto = canvas.toDataURL('image/jpeg', 0.5);
        }

        updateProfile({ ...settings, signPhoto: finalSignPhoto })
          .then(res => {
            if (res.success) {
              setSettings(prev => ({ ...prev, signPhoto: finalSignPhoto }));
              toast.success('Signature photo uploaded & saved successfully');
            }
          })
          .catch(() => {
            toast.error('Failed to save signature photo');
          });
      };
      img.onerror = () => {
        toast.error('Failed to load image file');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await updateProfile(settings);
      if (res.success) toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    if (pwData.newPassword !== pwData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    setSavingPw(true);
    try {
      const res = await axios.put(`${API_URL}/auth/change-password`, {
        currentPassword: pwData.currentPassword,
        newPassword: pwData.newPassword
      });
      if (res.data.success) {
        toast.success('Password updated successfully');
        setPwData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password update failed');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="space-y-6 text-xs sm:text-sm text-left font-sans">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Profile & Settings</h1>
        <p className="text-slate-500 text-xs mt-1">Manage your administrator account, school details and branding metadata.</p>
      </div>

      {/* Row 1: Account Info + Password */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Info */}
        <div className={cardCls}>
          <h3 className={sectionHeaderCls}>
            <User size={15} className="text-blue-500" /> Account Information
          </h3>
          <form onSubmit={handleProfileSubmit} className="space-y-3">
            <div>
              <label className={labelCls}>Email Address (Read-only)</label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="email" disabled value={user?.email || ''}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-slate-400 outline-none cursor-not-allowed text-xs sm:text-sm font-semibold" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Full Name *</label>
              <div className="relative">
                <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="text" required value={profileData.name}
                  onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                  className={`${inputCls} pl-10`} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Contact Number</label>
              <div className="relative">
                <Phone className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="text" value={profileData.phone}
                  onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                  className={`${inputCls} pl-10`} />
              </div>
            </div>
            <Button variant="gradient" type="submit" disabled={savingProfile} className="w-full cursor-pointer font-bold">
              {savingProfile ? 'Saving…' : 'Save Account Profile'}
            </Button>
          </form>
        </div>

        {/* Change Password */}
        <div className={cardCls}>
          <h3 className={sectionHeaderCls}>
            <Key size={15} className="text-blue-500" /> Change Password
          </h3>
          <form onSubmit={handlePwSubmit} className="space-y-3">
            <div>
              <label className={labelCls}>Current Password *</label>
              <input type="password" required value={pwData.currentPassword}
                onChange={e => setPwData({ ...pwData, currentPassword: e.target.value })}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>New Password *</label>
              <input type="password" required value={pwData.newPassword}
                onChange={e => setPwData({ ...pwData, newPassword: e.target.value })}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Confirm New Password *</label>
              <input type="password" required value={pwData.confirmPassword}
                onChange={e => setPwData({ ...pwData, confirmPassword: e.target.value })}
                className={inputCls} />
            </div>
            <Button variant="outline" type="submit" disabled={savingPw} className="w-full cursor-pointer font-bold hover:bg-blue-600 hover:text-white hover:border-transparent">
              {savingPw ? 'Updating…' : 'Update Password'}
            </Button>
          </form>
        </div>
      </div>

      {/* Row 2: School Settings (full width) */}
      <div className={cardCls}>
        <h3 className={sectionHeaderCls}>
          <Building2 size={15} className="text-emerald-500" /> School Branding & Invoice Settings
        </h3>
        <p className="text-xs text-slate-500 -mt-2 mb-1 text-left font-semibold">These values appear on printed receipts and invoices.</p>
        <form onSubmit={handleSettingsSubmit} className="space-y-5">

          {/* School Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>School / Institution Name *</label>
              <input type="text" required value={settings.schoolName}
                onChange={e => setSettings({ ...settings, schoolName: e.target.value })}
                className={inputCls} placeholder="e.g. Greenwood High School" />
            </div>
            <div>
              <label className={labelCls}>School Contact / Phone</label>
              <input type="text" value={settings.schoolPhone}
                onChange={e => setSettings({ ...settings, schoolPhone: e.target.value })}
                className={inputCls} placeholder="e.g. +91 80 1234 5678" />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>School Address</label>
              <textarea rows={2} value={settings.schoolAddress}
                onChange={e => setSettings({ ...settings, schoolAddress: e.target.value })}
                className={`${inputCls} resize-none`} placeholder="Full address for invoice header" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-2">
              <div>
                <label className={labelCls}>Authorized Signatory Name</label>
                <input type="text" value={settings.signatoryName}
                  onChange={e => setSettings({ ...settings, signatoryName: e.target.value })}
                  className={inputCls} placeholder="Name appearing at bottom of receipt" />
              </div>
              <div>
                <label className={labelCls}>Upload Signature Photo (Max 50KB)</label>
                <div className="flex items-center gap-3 mt-1.5">
                  {settings.signPhoto ? (
                    <div className="relative border border-slate-200 rounded-lg p-1 bg-white flex items-center justify-center h-[38px] w-[120px]">
                      <img src={settings.signPhoto} alt="signature preview" className="max-h-full max-w-full object-contain" />
                      <button
                        type="button"
                        onClick={() => {
                          updateProfile({ ...settings, signPhoto: '' })
                            .then(res => {
                              if (res.success) {
                                setSettings(prev => ({ ...prev, signPhoto: '' }));
                                toast.success('Signature photo removed successfully');
                              }
                            })
                            .catch(() => {
                              toast.error('Failed to remove signature photo');
                            });
                        }}
                        className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full hover:bg-rose-600 shadow-sm cursor-pointer"
                        style={{ fontSize: '10px', width: '15px', height: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                      >
                        &times;
                      </button>
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSignatureChange}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <p className="font-semibold text-blue-700 text-xs mb-3 flex items-center gap-1.5">
              <IndianRupee size={13} /> Default Monthly Tuition Fee
            </p>
            <div>
              <label className={labelCls}>Default Monthly Tuition Fee Amount (₹)</label>
              <input type="number" min="0" value={settings.defaultMonthlyAmount}
                onChange={e => setSettings({ ...settings, defaultMonthlyAmount: +e.target.value })}
                className={inputCls} placeholder="e.g. 5000" />
              <p className="text-xs text-slate-400 mt-1">Used when generating monthly tuition bills automatically.</p>
            </div>
          </div>

          <Button variant="gradient" type="submit" disabled={savingSettings} className="w-full cursor-pointer font-bold">
            {savingSettings ? 'Saving Settings…' : 'Save School & Invoice Settings'}
          </Button>
        </form>
      </div>
    </div>
  );
};
