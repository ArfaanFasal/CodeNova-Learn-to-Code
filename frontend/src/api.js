const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('token');
}

function getAdminToken() {
  return localStorage.getItem('adminToken');
}

export async function api(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  const adminToken = getAdminToken();
  const isAdmin = endpoint.includes('/admin') || endpoint.includes('admin/');
  if (isAdmin && adminToken) headers.Authorization = `Bearer ${adminToken}`;
  else if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || res.statusText);
  return data;
}

export const auth = {
  register: (email, password, name) => api('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) }),
  login: (email, password) => api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  adminLogin: (emailOrUsername, password) => api('/auth/admin/login', { method: 'POST', body: JSON.stringify({ email: emailOrUsername, username: emailOrUsername, password }) }),
  me: () => api('/auth/me'),
};

export const user = {
  selectLanguage: (language) => api('/user/select-language', { method: 'POST', body: JSON.stringify({ language }) }),
  submitPlacement: (placementQuizId, answers) => api('/user/submit-placement', { method: 'POST', body: JSON.stringify({ placementQuizId, answers }) }),
  profile: (data) => api('/user/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  dashboard: () => api('/user/dashboard'),
  module: (moduleId) => api(`/user/modules/${moduleId}`),
  completeModule: (moduleId) => api(`/user/modules/${moduleId}/complete`, { method: 'POST' }),
  quiz: (quizId) => api(`/user/quizzes/${quizId}`),
  submitQuiz: (quizId, answers) => api(`/user/quizzes/${quizId}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),
};

export const courses = {
  languages: () => api('/courses/languages'),
  levels: (courseSlug) => api(`/courses/${courseSlug}/levels`),
  levelWithModules: (courseSlug, levelSlug) => api(`/courses/${courseSlug}/levels/${levelSlug}`),
};

export const coding = {
  run: (code, language, stdin) => api('/coding/run', { method: 'POST', body: JSON.stringify({ code, language, stdin }) }),
  problem: (problemId) => api(`/coding/problems/${problemId}`),
  submit: (problemId, code, language) => api(`/coding/problems/${problemId}/submit`, { method: 'POST', body: JSON.stringify({ code, language }) }),
};

export const admin = {
  dashboard: () => api('/admin/dashboard'),
  users: (params) => api(`/admin/users?${new URLSearchParams(params || {}).toString()}`),
  user: (id) => api(`/admin/users/${id}`),
  updateUser: (id, data) => api(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  blockUser: (id) => api(`/admin/users/${id}/block`, { method: 'PATCH' }),
  unblockUser: (id) => api(`/admin/users/${id}/unblock`, { method: 'PATCH' }),
  deleteUser: (id) => api(`/admin/users/${id}`, { method: 'DELETE' }),
  resetPassword: (id, newPassword) => api(`/admin/users/${id}/reset-password`, { method: 'PATCH', body: JSON.stringify({ newPassword }) }),
  reports: () => api('/admin/reports/users'),
  reportStats: () => api('/admin/reports/stats'),
  courseList: () => api('/courses/admin/list'),
  createCourse: (data) => api('/courses/admin/courses', { method: 'POST', body: JSON.stringify(data) }),
  updateCourse: (id, data) => api(`/courses/admin/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  createLevel: (courseId, data) => api(`/courses/admin/courses/${courseId}/levels`, { method: 'POST', body: JSON.stringify(data) }),
  updateLevel: (id, data) => api(`/courses/admin/levels/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  createModule: (levelId, data) => api(`/courses/admin/levels/${levelId}/modules`, { method: 'POST', body: JSON.stringify(data) }),
  updateModule: (id, data) => api(`/courses/admin/modules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteModule: (id) => api(`/courses/admin/modules/${id}`, { method: 'DELETE' }),
  quizzes: () => api('/assessments/admin/quizzes'),
  createQuiz: (data) => api('/assessments/admin/quizzes', { method: 'POST', body: JSON.stringify(data) }),
  updateQuiz: (id, data) => api(`/assessments/admin/quizzes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteQuiz: (id) => api(`/assessments/admin/quizzes/${id}`, { method: 'DELETE' }),
  problems: () => api('/coding/admin/problems'),
  createProblem: (data) => api('/coding/admin/problems', { method: 'POST', body: JSON.stringify(data) }),
  updateProblem: (id, data) => api(`/coding/admin/problems/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProblem: (id) => api(`/coding/admin/problems/${id}`, { method: 'DELETE' }),
};
