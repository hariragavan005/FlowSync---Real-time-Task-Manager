import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon, ClipboardDocumentIcon, CheckIcon,
  ShareIcon, QrCodeIcon, ChevronRightIcon, ChevronLeftIcon
} from '@heroicons/react/24/solid';
import { createProject } from '../../services/projectService';
import { showPriorityAlert } from '../../utils/priorityAlerts';

const PROJECT_TYPES = [
  'Software Development', 'College Project', 'Startup Workflow',
  'Hackathon', 'Personal Productivity', 'Freelance Work'
];
const TEAM_SIZES = ['Solo', '2-5', '6-10', '10+'];
const WORKFLOWS = [
  { id: 'Kanban', label: 'Kanban Board', desc: 'Visual columns for flexible task flow' },
  { id: 'Sprint', label: 'Sprint Workflow', desc: 'Time-boxed iterations with goals' },
  { id: 'Todo', label: 'Simple Todo', desc: 'Minimal checklist for focused work' },
];

const Step = ({ n, current, label }) => (
  <div className="flex items-center gap-2">
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
      current === n ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
      : current > n ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
    }`}>{current > n ? <CheckIcon className="w-3.5 h-3.5" /> : n}</div>
    <span className={`text-xs font-semibold hidden sm:block ${current === n ? 'text-emerald-700' : 'text-gray-400'}`}>{label}</span>
  </div>
);

const CreateProjectModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', projectType: '', teamSize: '2-5', workflowType: 'Kanban' });
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleCreate = async () => {
    if (!form.name.trim() || !form.projectType) return showPriorityAlert('Please fill all required fields', 'high');
    setLoading(true);
    try {
      const { data } = await createProject(form);
      setProject(data);
      setStep(4); // success step
    } catch (err) {
      showPriorityAlert(err.response?.data?.message || 'Failed to create project', 'high');
    } finally { setLoading(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(project.inviteCode);
    setCopied(true);
    showPriorityAlert('Invite code copied!', 'low');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = () => {
    const url = `${window.location.origin}/#join-project?code=${project.inviteCode}`;
    navigator.clipboard.writeText(url);
    showPriorityAlert('Share link copied!', 'low');
  };

  const handleClose = () => {
    setStep(1); setForm({ name: '', projectType: '', teamSize: '2-5', workflowType: 'Kanban' });
    setProject(null); setCopied(false); setShowQR(false);
    onClose();
  };

  const qrUrl = project
    ? `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(project.inviteCode)}&bgcolor=f0fdf4&color=047857&margin=10`
    : '';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={handleClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden z-10"
          >
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
            <button onClick={handleClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 transition z-20">
              <XMarkIcon className="w-5 h-5" />
            </button>

            <div className="p-8">
              {/* Step tracker (only on form steps) */}
              {step < 4 && (
                <div className="flex items-center gap-3 mb-7">
                  <Step n={1} current={step} label="Basics" />
                  <div className="flex-1 h-px bg-gray-100" />
                  <Step n={2} current={step} label="Workflow" />
                  <div className="flex-1 h-px bg-gray-100" />
                  <Step n={3} current={step} label="Review" />
                </div>
              )}

              <AnimatePresence mode="wait">

                {/* STEP 1: Basics */}
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Project Basics</h2>
                    <p className="text-sm text-gray-400 mb-6">Name your project and tell us what you are building.</p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Project Name *</label>
                        <input value={form.name} onChange={e => set('name', e.target.value)}
                          placeholder="e.g. AI Sprint Dashboard"
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/15 outline-none text-sm font-medium transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Project Type *</label>
                        <div className="grid grid-cols-2 gap-2">
                          {PROJECT_TYPES.map(type => (
                            <button key={type} type="button" onClick={() => set('projectType', type)}
                              className={`px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all border ${
                                form.projectType === type
                                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm'
                                  : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-emerald-200 hover:bg-emerald-50/50'
                              }`}>
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Team Size</label>
                        <div className="flex gap-2">
                          {TEAM_SIZES.map(size => (
                            <button key={size} type="button" onClick={() => set('teamSize', size)}
                              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                                form.teamSize === size
                                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                                  : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-emerald-200'
                              }`}>
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => { if (!form.name.trim() || !form.projectType) return showPriorityAlert('Fill project name and type', 'high'); setStep(2); }}
                      className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40">
                      Continue <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {/* STEP 2: Workflow */}
                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Choose Workflow</h2>
                    <p className="text-sm text-gray-400 mb-6">How would you like to manage your tasks?</p>
                    <div className="space-y-3">
                      {WORKFLOWS.map(wf => (
                        <button key={wf.id} type="button" onClick={() => set('workflowType', wf.id)}
                          className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                            form.workflowType === wf.id
                              ? 'border-emerald-400 bg-emerald-50 shadow-sm'
                              : 'border-gray-100 bg-gray-50 hover:border-emerald-200 hover:bg-emerald-50/50'
                          }`}>
                          <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${form.workflowType === wf.id ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`}>
                            {form.workflowType === wf.id && <div className="w-full h-full rounded-full bg-white scale-50" />}
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${form.workflowType === wf.id ? 'text-emerald-700' : 'text-gray-800'}`}>{wf.label}</p>
                            <p className="text-xs text-gray-400">{wf.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button onClick={() => setStep(1)} className="flex items-center gap-1 px-5 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition">
                        <ChevronLeftIcon className="w-4 h-4" /> Back
                      </button>
                      <button onClick={() => setStep(3)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/25">
                        Continue <ChevronRightIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Review & Create */}
                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Review & Create</h2>
                    <p className="text-sm text-gray-400 mb-6">Everything looks good? Create your project.</p>
                    <div className="bg-gray-50 rounded-2xl p-5 space-y-3 mb-6 border border-gray-100">
                      {[
                        { label: 'Name', value: form.name },
                        { label: 'Type', value: form.projectType },
                        { label: 'Team Size', value: form.teamSize },
                        { label: 'Workflow', value: form.workflowType },
                      ].map(row => (
                        <div key={row.label} className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{row.label}</span>
                          <span className="text-sm font-semibold text-gray-800">{row.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setStep(2)} className="flex items-center gap-1 px-5 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition">
                        <ChevronLeftIcon className="w-4 h-4" /> Back
                      </button>
                      <motion.button onClick={handleCreate} disabled={loading}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/25 disabled:opacity-60">
                        {loading ? 'Creating...' : 'Create Project'}
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: Success + Invite */}
                {step === 4 && (
                  <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                    <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 0.5, repeat: 2 }}
                      className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                      <CheckIcon className="w-8 h-8 text-white" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Project Created</h2>
                    <p className="text-sm text-gray-400 mb-6">Share the invite code with your team to collaborate.</p>

                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 mb-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">Invite Code</p>
                      <p className="text-5xl font-extrabold text-gray-900 tracking-[0.35em] mb-4">{project?.inviteCode}</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={handleCopy}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}>
                          {copied ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                          {copied ? 'Copied' : 'Copy Code'}
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.04 }} onClick={handleShareLink}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all">
                          <ShareIcon className="w-4 h-4" /> Share Link
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.04 }} onClick={() => setShowQR(v => !v)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all">
                          <QrCodeIcon className="w-4 h-4" /> QR Code
                        </motion.button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {showQR && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden mb-4">
                          <div className="bg-white rounded-2xl p-4 border border-gray-100 flex flex-col items-center gap-2">
                            <img src={qrUrl} alt="QR Code" className="w-36 h-36 rounded-xl" />
                            <p className="text-xs text-gray-400">Scan to join with invite code</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <button onClick={handleClose} className="text-sm text-gray-400 hover:text-gray-700 underline underline-offset-2 transition">Done</button>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateProjectModal;
