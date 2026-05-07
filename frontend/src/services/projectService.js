import api from './api';

export const createProject = (form) => api.post('/projects', form);
export const joinProject = (inviteCode) => api.post('/projects/join', { inviteCode });
export const getProjects = () => api.get('/projects');
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);
export const removeMember = (id, memberId) => api.post(`/projects/${id}/remove-member`, { memberId });
export const toggleProjectLock = (id) => api.put(`/projects/${id}/lock`);
