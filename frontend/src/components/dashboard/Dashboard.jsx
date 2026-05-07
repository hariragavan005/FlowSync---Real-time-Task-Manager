import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { getProjects, deleteProject, updateProject, removeMember, toggleProjectLock } from '../../services/projectService';
import { showPriorityAlert } from '../../utils/priorityAlerts';
import {
  FolderOpenIcon, UsersIcon, ClipboardDocumentIcon, CheckIcon,
  PencilIcon, TrashIcon, EyeIcon, XMarkIcon, PlusIcon,
  LockClosedIcon, LockOpenIcon, ChartBarIcon
} from '@heroicons/react/24/outline';
import CreateProjectModal from '../projects/CreateProjectModal';
import ProjectStatsModal from '../projects/ProjectStatsModal';
import DailySummaryCard from './DailySummaryCard';
import ActivityFeed from './ActivityFeed';
import PresenceBar from './PresenceBar';

// ---- Confirm Modal ----
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, danger = true }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onCancel} />
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full z-10">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-6">{message}</p>
          <div className="flex gap-3">
            <button onClick={onConfirm}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition ${danger ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}>
              Confirm
            </button>
            <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ---- Members Modal ----
const MembersModal = ({ project, isOpen, onClose, onRemove, isOwner }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md z-10 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
          <div className="p-6">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{project?.name}</h3>
                <p className="text-xs text-gray-500">{project?.members?.length} members</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {project?.members?.map(member => (
                <div key={member._id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {member.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{member.name}</p>
                    <p className="text-xs text-gray-500 truncate">{member.email}</p>
                  </div>
                  {isOwner && member._id !== project.owner?._id && member._id !== project.owner && (
                    <button onClick={() => onRemove(project._id, member._id)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition flex-shrink-0">
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ---- Edit Modal ----
const EditModal = ({ project, isOpen, onClose, onSave }) => {
  const [name, setName] = useState(project?.name || '');
  useEffect(() => setName(project?.name || ''), [project]);
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm z-10 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-5">Edit Project</h3>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-medium mb-5 transition-all"
                placeholder="Project name" />
              <div className="flex gap-3">
                <button onClick={() => onSave(project._id, name)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-white">Save</button>
                <button onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition">Cancel</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ---- Project Card ----
const ProjectCard = ({ project, user, onDelete, onEdit, onViewMembers, onCopy, copiedId, onToggleLock, onViewStats }) => {
  const isOwner = project.owner?._id === user?._id || project.owner === user?._id;
  const isAdmin = user?.role === 'Admin';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(16,185,129,0.08)' }}
      className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col transition-all duration-300"
    >
      <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-2 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold text-gray-900 leading-tight">{project.name}</h3>
            {project.isLocked && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                <LockClosedIcon className="w-3 h-3" /> Locked
              </span>
            )}
          </div>
          <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${isOwner ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
            {isOwner ? 'Owner' : 'Member'}
          </span>
        </div>

        {/* Invite Code */}
        {(isOwner || isAdmin) && (
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 mb-4 border border-gray-100">
            <span className="text-xs text-gray-400 font-medium">Code:</span>
            <span className="text-sm font-extrabold tracking-[0.2em] text-gray-700 flex-1">{project.inviteCode}</span>
            <button onClick={() => onCopy(project._id, project.inviteCode)}
              className="p-1 rounded-lg hover:bg-emerald-100 text-gray-400 hover:text-emerald-600 transition">
              {copiedId === project._id ? <CheckIcon className="w-4 h-4 text-emerald-500" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-400 mb-5">
          <UsersIcon className="w-4 h-4" />
          <span>{project.members?.length} member{project.members?.length !== 1 ? 's' : ''}</span>
          <span className="text-gray-200">•</span>
          <span>{new Date(project.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto flex-wrap">
          <Link to={`/projects/${project._id}/tasks`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition">
            <FolderOpenIcon className="w-4 h-4" /> Open
          </Link>
          <button onClick={() => onViewMembers(project)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition">
            <EyeIcon className="w-4 h-4" /> Members
          </button>
          <button onClick={() => onViewStats(project)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-50 text-violet-700 text-xs font-bold hover:bg-violet-100 transition">
            <ChartBarIcon className="w-4 h-4" /> Stats
          </button>
          {isOwner && (
            <>
              <button
                onClick={() => onToggleLock(project._id)}
                title={project.isLocked ? 'Unlock project (allow new members)' : 'Lock project (block new joins)'}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                  project.isLocked
                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}>
                {project.isLocked
                  ? <><LockClosedIcon className="w-4 h-4" /> Unlock</>
                  : <><LockOpenIcon className="w-4 h-4" /> Lock</>}
              </button>
              <button onClick={() => onEdit(project)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100 transition">
                <PencilIcon className="w-4 h-4" /> Edit
              </button>
              <button onClick={() => onDelete(project)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition">
                <TrashIcon className="w-4 h-4" /> Delete
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ---- Main Dashboard ----
const Dashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [membersProject, setMembersProject] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [statsProject, setStatsProject] = useState(null);

  const fetchProjects = useCallback(async () => {
    try {
      const { data } = await getProjects();
      setProjects(data);
    } catch { showPriorityAlert('Failed to load projects', 'high'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleCopy = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async () => {
    try {
      await deleteProject(confirm.project._id);
      showPriorityAlert('Project deleted', 'low');
      fetchProjects();
    } catch (err) { showPriorityAlert(err.response?.data?.message || 'Delete failed', 'high'); }
    finally { setConfirm(null); }
  };

  const handleEdit = async (id, name) => {
    try {
      await updateProject(id, { name });
      showPriorityAlert('Project updated!', 'low');
      setEditProject(null);
      fetchProjects();
    } catch (err) { showPriorityAlert(err.response?.data?.message || 'Update failed', 'high'); }
  };

  const handleRemoveMember = async (projectId, memberId) => {
    setConfirm({ type: 'member', projectId, memberId });
  };

  const handleToggleLock = async (projectId) => {
    try {
      await toggleProjectLock(projectId);
      fetchProjects();
    } catch (err) {
      showPriorityAlert(err.response?.data?.message || 'Failed to toggle lock', 'high');
    }
  };

  const handleConfirmRemoveMember = async () => {
    try {
      const { data } = await removeMember(confirm.projectId, confirm.memberId);
      showPriorityAlert('Member removed', 'low');
      setMembersProject(data.project);
      fetchProjects();
    } catch (err) { showPriorityAlert(err.response?.data?.message || 'Remove failed', 'high'); }
    finally { setConfirm(null); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-28 pb-16">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[40%] h-[50%] bg-emerald-100/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[30%] h-[40%] bg-teal-100/20 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 mb-8 overflow-hidden shadow-xl shadow-emerald-500/20"
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }} />
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 8, repeat: Infinity }}
            className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-emerald-100 text-sm font-medium mb-1">Welcome back</p>
              <h1 className="text-3xl font-extrabold text-white">{user?.name?.split(' ')[0]}'s Workspace</h1>
              <p className="text-emerald-100 text-sm mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
            <motion.button onClick={() => setCreateOpen(true)}
              whileHover={{ scale: 1.05, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-emerald-700 font-bold text-sm shadow-lg flex-shrink-0">
              <PlusIcon className="w-5 h-5" /> New Project
            </motion.button>
          </div>
        </motion.div>

        {/* Smart Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Projects', value: projects.length, bgIcon: 'from-emerald-400 to-teal-500', Icon: FolderOpenIcon },
            { label: 'Owned Projects', value: projects.filter(p => p.owner?._id === user?._id || p.owner === user?._id).length, bgIcon: 'from-blue-400 to-indigo-500', Icon: PlusIcon },
            { label: 'Team Members', value: [...new Set(projects.flatMap(p => p.members?.map(m => m._id || m)))].length, bgIcon: 'from-violet-400 to-purple-500', Icon: UsersIcon },
            { label: 'Joined Projects', value: projects.filter(p => (p.owner?._id || p.owner) !== user?._id).length, bgIcon: 'from-teal-400 to-cyan-500', Icon: EyeIcon },
          ].map((stat, i) => (
            <motion.div key={stat.label}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -2, boxShadow: '0 12px 28px rgba(0,0,0,0.06)' }}
              className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-5 flex flex-col gap-2 transition-all">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.bgIcon} flex items-center justify-center shadow-sm`}>
                <stat.Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{stat.value}</p>
              <p className="text-xs font-semibold text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Active Team Members Preview */}
        {projects.some(p => p.members?.length > 1) && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-5 mb-8 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-bold text-gray-700">Team Members</span>
            </div>
            <div className="flex -space-x-2">
              {[...new Map(
                projects.flatMap(p => p.members || []).map(m => [m._id || m, m])
              ).values()].slice(0, 8).map((member, i) => (
                <div key={member._id || i} title={member.name}
                  className="w-9 h-9 rounded-full border-2 border-white bg-gradient-to-br from-emerald-300 to-teal-400 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {(member.name || '?').charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            <span className="text-xs text-gray-400 font-medium">
              {[...new Set(projects.flatMap(p => p.members?.map(m => m._id || m)))].length} collaborators across {projects.length} project{projects.length !== 1 ? 's' : ''}
            </span>
          </motion.div>
        )}

        {/* Projects Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold text-gray-900">Your Projects</h2>
          <span className="text-sm text-gray-400 font-medium">{projects.length} total</span>
        </div>

        {/* Main layout: Projects + Sidebar */}
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Projects Grid */}
          <div className="flex-1 min-w-0">
            {projects.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-24 bg-white/60 backdrop-blur-xl rounded-3xl border border-white/60 shadow-sm">
                <FolderOpenIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">No projects yet</h3>
                  <p className="text-gray-400 text-sm max-w-xs mx-auto">
                    Create your first project or join one using an invite code.
                  </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map((project) => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    user={user}
                    onDelete={(p) => setConfirm({ type: 'project', project: p })}
                    onEdit={setEditProject}
                    onViewMembers={setMembersProject}
                    onCopy={handleCopy}
                    copiedId={copiedId}
                    onToggleLock={handleToggleLock}
                    onViewStats={setStatsProject}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Widgets */}
          <div className="xl:w-72 flex-shrink-0 flex flex-col gap-4">
            <DailySummaryCard projects={projects} />
            <ActivityFeed projectId={projects[0]?._id} />
          </div>
        </div>
      </div>


      {/* Modals */}
      <CreateProjectModal isOpen={createOpen} onClose={() => { setCreateOpen(false); fetchProjects(); }} />
      <EditModal project={editProject} isOpen={!!editProject} onClose={() => setEditProject(null)} onSave={handleEdit} />
      <MembersModal
        project={membersProject}
        isOpen={!!membersProject}
        onClose={() => setMembersProject(null)}
        onRemove={handleRemoveMember}
        isOwner={membersProject?.owner?._id === user?._id || membersProject?.owner === user?._id}
      />
      <ConfirmModal
        isOpen={!!confirm}
        title={confirm?.type === 'project' ? 'Delete Project?' : 'Remove Member?'}
        message={confirm?.type === 'project'
          ? `"${confirm?.project?.name}" and all its data will be permanently deleted.`
          : 'This member will be removed from the project.'}
        onConfirm={confirm?.type === 'project' ? handleDelete : handleConfirmRemoveMember}
        onCancel={() => setConfirm(null)}
      />
      <ProjectStatsModal
        projectId={statsProject?._id}
        projectName={statsProject?.name}
        isOpen={!!statsProject}
        onClose={() => setStatsProject(null)}
      />
    </div>
  );
};

export default Dashboard;
