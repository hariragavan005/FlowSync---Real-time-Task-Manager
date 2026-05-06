import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { showPriorityAlert } from '../../utils/priorityAlerts';
import { UserCircleIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

const ProfilePage = () => {
  const { user, login } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', { name, email });
      // Update localStorage
      const stored = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const updated = { ...stored, name: data.name, email: data.email };
      localStorage.setItem('userInfo', JSON.stringify(updated));
      showPriorityAlert('Profile updated successfully!', 'low');
      setEditing(false);
    } catch (err) {
      showPriorityAlert(err.response?.data?.message || 'Update failed', 'high');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setEditing(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-28 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.05)] overflow-hidden"
        >
          {/* Header gradient bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />

          {/* Profile Header */}
          <div className="p-8 pb-0 flex flex-col items-center text-center border-b border-gray-100">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-4xl font-bold shadow-lg mb-4">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">{user?.name}</h1>
            <span className={`mt-2 mb-6 inline-block text-xs font-bold px-3 py-1 rounded-full ${
              user?.role === 'Admin' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {user?.role}
            </span>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSave} className="p-8 space-y-6">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={!editing}
                className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-all outline-none ${
                  editing
                    ? 'bg-white border-2 border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 shadow-sm'
                    : 'bg-gray-50 border border-gray-200 text-gray-600 cursor-default'
                }`}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={!editing}
                className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-all outline-none ${
                  editing
                    ? 'bg-white border-2 border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 shadow-sm'
                    : 'bg-gray-50 border border-gray-200 text-gray-600 cursor-default'
                }`}
              />
            </div>

            {/* Read-only fields */}
            {[
              { label: 'Role', value: user?.role },
              { label: 'Account Created', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
            ].map(field => (
              <div key={field.label}>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{field.label}</label>
                <div className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-500">{field.value}</div>
              </div>
            ))}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {editing ? (
                <>
                  <motion.button
                    type="submit"
                    disabled={saving}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 disabled:opacity-60"
                  >
                    <CheckIcon className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </motion.button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    Cancel
                  </button>
                </>
              ) : (
                <motion.button
                  type="button"
                  onClick={() => setEditing(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white border-2 border-emerald-200 text-emerald-700 font-bold text-sm hover:bg-emerald-50 transition shadow-sm"
                >
                  <PencilIcon className="w-4 h-4" />
                  Edit Profile
                </motion.button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
