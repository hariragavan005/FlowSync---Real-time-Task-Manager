import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { showPriorityAlert } from '../../utils/priorityAlerts';
import {
  UserCircleIcon, PencilIcon, CheckIcon, XMarkIcon,
  KeyIcon, CameraIcon, EyeIcon, EyeSlashIcon
} from '@heroicons/react/24/solid';

// ── Avatar Component ──────────────────────────────────────────────────────────
const ProfileAvatar = ({ user, avatarUrl, onAvatarChange }) => {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  // We use UI-Avatars as a free hosted avatar service — no file upload server needed.
  // Users can also paste any image URL.
  const currentAvatar = avatarUrl || user?.avatarUrl || '';
  const initials = user?.name?.charAt(0).toUpperCase() || '?';

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showPriorityAlert('Please select an image file', 'high');
      return;
    }
    // Convert to base64 data URL (no upload server needed)
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      onAvatarChange(ev.target.result);
      setUploading(false);
    };
    reader.onerror = () => {
      showPriorityAlert('Failed to read image', 'high');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
      <div className="w-28 h-28 rounded-full overflow-hidden shadow-xl ring-4 ring-white">
        {currentAvatar ? (
          <img src={currentAvatar} alt={user?.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-4xl font-bold">
            {initials}
          </div>
        )}
      </div>
      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        {uploading
          ? <span className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          : <CameraIcon className="w-7 h-7 text-white" />
        }
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
};

// ── Password Input ────────────────────────────────────────────────────────────
const PasswordInput = ({ value, onChange, placeholder, id }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 pr-11 rounded-xl bg-white border-2 border-emerald-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 outline-none text-sm font-medium transition-all"
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
      >
        {show ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
      </button>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const ProfilePage = () => {
  const { user, updateUser } = useAuth();

  // Profile tab
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password tab
  const [tab, setTab] = useState('profile'); // 'profile' | 'password'
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  // ── Save profile ──────────────────────────────────────────────────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.put('/auth/profile', { name, email, avatarUrl });
      updateUser({ name: data.name, email: data.email, avatarUrl: data.avatarUrl });
      showPriorityAlert('Profile updated!', 'low');
      setEditMode(false);
    } catch (err) {
      showPriorityAlert(err.response?.data?.message || 'Update failed', 'high');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelProfile = () => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setAvatarUrl(user?.avatarUrl || '');
    setEditMode(false);
  };

  // ── Change password ───────────────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPw !== confirmPw) {
      showPriorityAlert('New passwords do not match', 'high');
      return;
    }
    if (newPw.length < 6) {
      showPriorityAlert('New password must be at least 6 characters', 'high');
      return;
    }
    setSavingPw(true);
    try {
      await api.put('/auth/change-password', { currentPassword: currentPw, newPassword: newPw });
      showPriorityAlert('Password changed successfully!', 'low');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      showPriorityAlert(err.response?.data?.message || 'Password change failed', 'high');
    } finally {
      setSavingPw(false);
    }
  };

  const displayAvatar = editMode ? avatarUrl : (user?.avatarUrl || '');

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-28 pb-16 px-4">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-emerald-100/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-1/4 h-1/3 bg-teal-100/15 rounded-full blur-[80px]" />
      </div>

      <div className="max-w-xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.05)] overflow-hidden"
        >
          {/* Top bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />

          {/* Avatar + Name Header */}
          <div className="pt-8 pb-5 px-8 flex flex-col items-center text-center border-b border-gray-100">
            <ProfileAvatar
              user={user}
              avatarUrl={displayAvatar}
              onAvatarChange={editMode ? setAvatarUrl : () => setEditMode(true)}
            />
            <h1 className="mt-4 text-2xl font-extrabold text-gray-900">{user?.name}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{user?.email}</p>
            <span className={`mt-2 inline-block text-xs font-bold px-3 py-1 rounded-full ${
              user?.role === 'Admin' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {user?.role}
            </span>
            {editMode && (
              <p className="mt-3 text-xs text-emerald-600 font-medium">
                Click avatar to change photo
              </p>
            )}
          </div>

          {/* Tab Switcher */}
          <div className="flex border-b border-gray-100">
            {[
              { id: 'profile',  label: 'Profile',  Icon: UserCircleIcon },
              { id: 'password', label: 'Security',  Icon: KeyIcon },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-colors ${
                  tab === t.id
                    ? 'text-emerald-700 border-b-2 border-emerald-500'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <t.Icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* ── Profile Tab ──────────────────────────────────────────── */}
            {tab === 'profile' && (
              <motion.form
                key="profile"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleSaveProfile}
                className="p-8 space-y-5"
              >
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={!editMode}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-all outline-none ${
                      editMode
                        ? 'bg-white border-2 border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 shadow-sm'
                        : 'bg-gray-50 border border-gray-200 text-gray-600 cursor-default'
                    }`}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={!editMode}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-all outline-none ${
                      editMode
                        ? 'bg-white border-2 border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 shadow-sm'
                        : 'bg-gray-50 border border-gray-200 text-gray-600 cursor-default'
                    }`}
                  />
                </div>

                {/* Avatar URL input (visible only in edit mode) */}
                {editMode && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Avatar URL <span className="text-gray-400 font-normal normal-case">(or click avatar to upload)</span>
                    </label>
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={e => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/photo.jpg"
                      className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-white border-2 border-emerald-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                    />
                  </div>
                )}

                {/* Read-only: Role */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Role</label>
                  <div className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-500">
                    {user?.role}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  {editMode ? (
                    <>
                      <motion.button
                        type="submit"
                        disabled={savingProfile}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 disabled:opacity-60"
                      >
                        <CheckIcon className="w-4 h-4" />
                        {savingProfile ? 'Saving…' : 'Save Changes'}
                      </motion.button>
                      <button
                        type="button"
                        onClick={handleCancelProfile}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition"
                      >
                        <XMarkIcon className="w-4 h-4" /> Cancel
                      </button>
                    </>
                  ) : (
                    <motion.button
                      type="button"
                      onClick={() => setEditMode(true)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white border-2 border-emerald-200 text-emerald-700 font-bold text-sm hover:bg-emerald-50 transition shadow-sm"
                    >
                      <PencilIcon className="w-4 h-4" /> Edit Profile
                    </motion.button>
                  )}
                </div>
              </motion.form>
            )}

            {/* ── Security / Password Tab ───────────────────────────────── */}
            {tab === 'password' && (
              <motion.form
                key="password"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleChangePassword}
                className="p-8 space-y-5"
              >
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4">
                  <KeyIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-amber-700 leading-relaxed">
                    Choose a strong password with at least 6 characters. You'll need to verify your current password first.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Current Password
                  </label>
                  <PasswordInput
                    id="current-password"
                    value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)}
                    placeholder="Enter your current password"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    New Password
                  </label>
                  <PasswordInput
                    id="new-password"
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    placeholder="At least 6 characters"
                  />
                  {/* Strength indicator */}
                  {newPw.length > 0 && (
                    <div className="mt-2 flex gap-1">
                      {[1, 2, 3, 4].map(level => (
                        <div
                          key={level}
                          className={`flex-1 h-1 rounded-full transition-all ${
                            newPw.length >= level * 3
                              ? level <= 1 ? 'bg-red-400'
                              : level <= 2 ? 'bg-amber-400'
                              : level <= 3 ? 'bg-blue-400'
                              : 'bg-emerald-500'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Confirm New Password
                  </label>
                  <PasswordInput
                    id="confirm-password"
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    placeholder="Repeat new password"
                  />
                  {confirmPw && newPw !== confirmPw && (
                    <p className="mt-1.5 text-xs text-red-500 font-medium">Passwords don't match</p>
                  )}
                </div>

                <motion.button
                  type="submit"
                  disabled={savingPw || !currentPw || !newPw || !confirmPw}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingPw ? (
                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Changing…</>
                  ) : (
                    <><KeyIcon className="w-4 h-4" /> Change Password</>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
