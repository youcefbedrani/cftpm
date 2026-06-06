'use client';

import { useState, useMemo } from 'react';
import {
  X, LayoutDashboard, Users, GraduationCap, Inbox, ShieldAlert, BookOpen,
  Plus, Trash2, ArrowLeft, Save, Loader2, DollarSign, CheckCircle2, XCircle,
  Award, TrendingUp, UserPlus, ShieldCheck, Video, Receipt, ExternalLink, Calendar,
  MessageSquare, Send,
} from 'lucide-react';
import { COURSES, WILAYAS } from '@/data/cftmpData';
import { CATEGORIES, getCategory, formatDate, ROLE_COLORS } from '@/lib/helpers';
import * as api from '@/lib/api';
import { LessonsManager } from './FormateurPortal';

const TABS = [
  { id: 'overview',    icon: LayoutDashboard, key: 'admin_title'          },
  { id: 'users',       icon: Users,           key: 'admin_tab_users'      },
  { id: 'formateurs',  icon: GraduationCap,   key: 'admin_tab_formateurs' },
  { id: 'assignments', icon: ShieldCheck,     key: 'admin_tab_assignments'},
  { id: 'lessons',     icon: BookOpen,        key: 'admin_tab_lessons'    },
  { id: 'requests',    icon: Inbox,           key: 'admin_tab_requests'   },
  { id: 'enrollments', icon: CheckCircle2,    key: 'admin_tab_enrollments'},
  { id: 'invoices',    icon: Receipt,         key: 'admin_tab_invoices'   },
  { id: 'meetings',    icon: Calendar,        key: 'admin_tab_meetings'   },
  { id: 'messaging',   icon: MessageSquare,   key: 'admin_tab_messages'   },
];

export default function AdminDashboard({ ctx, onClose }) {
  const { t } = ctx;
  const [tab, setTab] = useState('overview');

  return (
    <div className="fixed inset-0 z-[70] bg-slate-50 overflow-y-auto">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900">{t('portal_admin')}</div>
              <div className="text-xs text-slate-500">{t('admin_subtitle')}</div>
            </div>
          </div>
          <button onClick={onClose} className="px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-lg flex items-center gap-2 text-sm">
            <X className="w-4 h-4" /> Close
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-1 mb-6 bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto">
          {TABS.map(tt => {
            const Icon = tt.icon;
            return (
              <button key={tt.id} onClick={() => setTab(tt.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${tab === tt.id ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                <Icon className="w-4 h-4" /> {t(tt.key)}
              </button>
            );
          })}
        </div>

        {tab === 'overview'    && <Overview ctx={ctx} />}
        {tab === 'users'       && <UsersTab ctx={ctx} />}
        {tab === 'formateurs'  && <FormateursTab ctx={ctx} />}
        {tab === 'assignments' && <AssignmentsTab ctx={ctx} />}
        {tab === 'lessons'     && <LessonsTab ctx={ctx} />}
        {tab === 'requests'    && <RequestsTab ctx={ctx} />}
        {tab === 'enrollments' && <EnrollmentsTab ctx={ctx} />}
        {tab === 'invoices'    && <InvoicesTab ctx={ctx} />}
        {tab === 'meetings'    && <MeetingInvitationsTab ctx={ctx} />}
        {tab === 'messaging'   && <MessagesTab ctx={ctx} />}
      </div>
    </div>
  );
}

// ============================================================================
function Overview({ ctx }) {
  const { t, language, users, enrollments, requests, lessons } = ctx;
  const students = users.filter(u => u.role === 'student');
  const formateurs = users.filter(u => u.role === 'formateur');
  const revenue = enrollments.reduce((s, e) => s + e.amount, 0);
  return (
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat icon={Users} label={t('admin_stat_users')} value={students.length} color="indigo" />
        <Stat icon={GraduationCap} label={t('role_formateur')} value={formateurs.length} color="emerald" />
        <Stat icon={CheckCircle2} label={t('admin_stat_enrollments')} value={enrollments.length} color="purple" />
        <Stat icon={TrendingUp} label={t('admin_stat_revenue')} value={`${revenue.toLocaleString()} DZD`} color="amber" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-3">Latest enrollments</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {enrollments.slice(0, 8).map(e => (
              <div key={e.id} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2 last:border-0">
                <div>
                  <div className="font-semibold text-slate-900">{e.userName}</div>
                  <div className="text-xs text-slate-500 line-clamp-1">{e.courseTitle}</div>
                </div>
                <div className="text-end">
                  <div className="font-semibold text-emerald-600">{e.amount.toLocaleString()} DZD</div>
                  <div className="text-xs text-slate-500">{formatDate(e.paidAt, language)}</div>
                </div>
              </div>
            ))}
            {enrollments.length === 0 && <div className="text-sm text-slate-500 text-center py-6">{t('admin_no_enrollments')}</div>}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-3">Pending requests</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {requests.filter(r => r.status === 'pending').slice(0, 8).map(r => (
              <div key={r.id} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2 last:border-0">
                <div>
                  <div className="font-semibold text-slate-900">{r.topic}</div>
                  <div className="text-xs text-slate-500">{r.userName} · {r.level}</div>
                </div>
                <div className="text-xs text-slate-500">{formatDate(r.createdAt, language)}</div>
              </div>
            ))}
            {requests.filter(r => r.status === 'pending').length === 0 && <div className="text-sm text-slate-500 text-center py-6">{t('admin_no_requests')}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color = 'indigo' }) {
  const colors = {
    indigo: 'from-indigo-500 to-purple-500',
    emerald: 'from-emerald-500 to-teal-500',
    amber: 'from-amber-500 to-orange-500',
    purple: 'from-fuchsia-500 to-purple-500',
  };
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide">{label}</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{value}</div>
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
function UsersTab({ ctx }) {
  const { t, language, users, setUsers, showToast } = ctx;
  const [filter, setFilter] = useState('all');

  const changeRole = async (user, role) => {
    const res = await api.setUserRole(user.email, role);
    if (res.error) return showToast(res.error, 'error');
    setUsers(prev => prev.map(u => u.email === res.user.email ? res.user : u));
    showToast('Role updated');
  };

  const removeUser = async (user) => {
    if (!confirm(t('admin_confirm_delete_user'))) return;
    const res = await api.deleteUser(user.email);
    if (res.error) return showToast(res.error, 'error');
    setUsers(prev => prev.filter(u => u.email !== user.email));
    showToast('Deleted');
  };

  const filtered = filter === 'all' ? users : users.filter(u => u.role === filter);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {['all', 'student', 'formateur'].map(r => (
          <button key={r} onClick={() => setFilter(r)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${filter === r ? 'bg-amber-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
            {r === 'all' ? `All (${users.length})` : `${t(`role_${r}`)}s (${users.filter(u => u.role === r).length})`}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">{t('admin_no_users')}</div>
        ) : (
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-slate-50 text-xs text-slate-600 uppercase tracking-wide">
              <tr>
                <th className="text-start p-3">{t('auth_name')}</th>
                <th className="text-start p-3">{t('auth_email')}</th>
                <th className="text-start p-3">Role</th>
                <th className="text-start p-3">Courses</th>
                <th className="text-start p-3">Joined</th>
                <th className="text-start p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.email} className="border-t border-slate-100">
                  <td className="p-3 font-semibold text-slate-900">{u.name}</td>
                  <td className="p-3 text-slate-600">{u.email}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${ROLE_COLORS[u.role] || ROLE_COLORS.student}`}>
                      {t(`role_${u.role}`)}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">{u.enrolledIds?.length || 0}</td>
                  <td className="p-3 text-xs text-slate-500">{formatDate(u.createdAt, language)}</td>
                  <td className="p-3">
                    <div className="flex gap-1.5">
                      {u.role === 'student' && (
                        <button onClick={() => changeRole(u, 'formateur')} className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded font-semibold hover:bg-emerald-200">
                          {t('admin_promote_user')}
                        </button>
                      )}
                      {u.role === 'formateur' && (
                        <button onClick={() => changeRole(u, 'student')} className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded font-semibold hover:bg-slate-200">
                          {t('admin_demote_user')}
                        </button>
                      )}
                      <button onClick={() => removeUser(u)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ============================================================================
function FormateursTab({ ctx }) {
  const { t, language, users, setUsers, courseInstructors, enrollments, lessons, showToast } = ctx;
  const formateurs = users.filter(u => u.role === 'formateur');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', expertise: '', bio: '' });

  const save = async () => {
    if (!form.name || !form.email || !form.password) return showToast(t('auth_error_fields'), 'error');
    if (form.password.length < 6) return showToast(t('auth_error_password'), 'error');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return showToast(t('auth_error_email'), 'error');
    const res = await api.createUserAsAdmin({ ...form, role: 'formateur' });
    if (res.error === 'exists') return showToast(t('auth_error_exists'), 'error');
    if (res.error) return showToast(res.error, 'error');
    setUsers(prev => [res.user, ...prev]);
    setCreating(false);
    setForm({ name: '', email: '', password: '', expertise: '', bio: '' });
    showToast('Created');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-slate-600">{formateurs.length} {t('role_formateur')}{formateurs.length !== 1 && 's'}</div>
        <button onClick={() => setCreating(!creating)} className="px-3 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold flex items-center gap-1">
          <UserPlus className="w-4 h-4" /> {t('admin_create_formateur')}
        </button>
      </div>

      {creating && (
        <div className="bg-white rounded-2xl border border-amber-300 p-5 mb-4">
          <h3 className="font-bold text-slate-900 mb-3">{t('admin_create_formateur')}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <FieldA label={t('auth_name')}>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="inputA" />
            </FieldA>
            <FieldA label={t('auth_email')}>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="inputA" />
            </FieldA>
            <FieldA label={t('auth_password')}>
              <input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="inputA" />
            </FieldA>
            <FieldA label={t('profile_expertise')}>
              <input type="text" value={form.expertise} onChange={e => setForm({ ...form, expertise: e.target.value })} placeholder="e.g. Python, DevOps, AI" className="inputA" />
            </FieldA>
            <div className="sm:col-span-2">
              <FieldA label={t('profile_bio')}>
                <textarea rows={2} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} className="inputA" />
              </FieldA>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setCreating(false)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold">{t('fp_cancel')}</button>
            <button onClick={save} className="px-3 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold flex items-center gap-1"><Save className="w-4 h-4" /> {t('fp_save')}</button>
          </div>
        </div>
      )}

      {formateurs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500">{t('admin_no_formateurs')}</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {formateurs.map(f => {
            const courseCount = courseInstructors.filter(ci => ci.instructorEmail === f.email).length;
            const myCourseIds = courseInstructors.filter(ci => ci.instructorEmail === f.email).map(ci => ci.courseId);
            const studentCount = enrollments.filter(e => myCourseIds.includes(e.courseId)).length;
            const lessonCount  = lessons.filter(l => myCourseIds.includes(l.courseId)).length;
            return (
              <div key={f.email} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center text-lg">{f.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{f.name}</div>
                    <div className="text-xs text-slate-500 truncate">{f.email}</div>
                  </div>
                </div>
                {f.expertise && <div className="text-xs text-emerald-700 mb-2 font-semibold">{f.expertise}</div>}
                {f.bio && <p className="text-xs text-slate-600 line-clamp-2 mb-3">{f.bio}</p>}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-50 rounded p-2"><div className="font-bold text-slate-900">{courseCount}</div><div className="text-slate-500">Courses</div></div>
                  <div className="bg-slate-50 rounded p-2"><div className="font-bold text-slate-900">{studentCount}</div><div className="text-slate-500">Students</div></div>
                  <div className="bg-slate-50 rounded p-2"><div className="font-bold text-slate-900">{lessonCount}</div><div className="text-slate-500">Lessons</div></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        :global(.inputA) {
          width: 100%; padding: 0.6rem 0.9rem; border: 1px solid rgb(203 213 225);
          border-radius: 0.5rem; outline: none; font-size: 0.875rem;
        }
        :global(.inputA:focus) { box-shadow: 0 0 0 2px rgb(245 158 11); border-color: transparent; }
      `}</style>
    </div>
  );
}

function FieldA({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

// ============================================================================
function AssignmentsTab({ ctx }) {
  const { t, users, courseInstructors, setCourseInstructors, showToast } = ctx;
  const formateurs = users.filter(u => u.role === 'formateur');
  const [selectedEmail, setSelectedEmail] = useState(formateurs[0]?.email || null);
  const selected = formateurs.find(f => f.email === selectedEmail);
  const myCourses = courseInstructors.filter(ci => ci.instructorEmail === selectedEmail);
  const myCourseIds = myCourses.map(ci => ci.courseId);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const assign = async (courseId) => {
    const res = await api.assignInstructor(courseId, selectedEmail);
    if (res.error) return showToast(res.error, 'error');
    setCourseInstructors(prev => [...prev, res.row]);
    showToast('Assigned');
  };
  const unassign = async (courseId) => {
    const res = await api.unassignInstructor(courseId, selectedEmail);
    if (res.error) return showToast(res.error, 'error');
    setCourseInstructors(prev => prev.filter(ci => !(ci.courseId === courseId && ci.instructorEmail === selectedEmail)));
    showToast('Unassigned');
  };

  if (formateurs.length === 0) {
    return <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500">{t('admin_no_formateurs')}</div>;
  }

  const visible = COURSES.filter(c => categoryFilter === 'all' || c.category === categoryFilter);

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-3 max-h-[600px] overflow-y-auto">
        <div className="font-bold text-slate-900 mb-2 px-2">{t('role_formateur')}s</div>
        {formateurs.map(f => {
          const count = courseInstructors.filter(ci => ci.instructorEmail === f.email).length;
          return (
            <button key={f.email} onClick={() => setSelectedEmail(f.email)}
              className={`w-full text-start p-2.5 rounded-lg mb-1 ${selectedEmail === f.email ? 'bg-amber-50' : 'hover:bg-slate-50'}`}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center text-xs">{f.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 text-sm truncate">{f.name}</div>
                  <div className="text-xs text-slate-500">{count} {t('admin_assigned_courses')}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        {!selected ? (
          <div className="text-center text-slate-500 py-12">{t('admin_select_formateur')}</div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-slate-900">{selected.name}</h3>
                <div className="text-xs text-slate-500">{myCourses.length} {t('admin_assigned_courses')}</div>
              </div>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm">
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{t(`cat_${c.id}`)}</option>)}
              </select>
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {visible.map(c => {
                const assigned = myCourseIds.includes(c.id);
                const cat = getCategory(c.category);
                const Icon = cat.icon;
                return (
                  <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${cat.gradient} flex items-center justify-center shrink-0`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">{c.title}</div>
                      <div className="text-xs text-slate-500">{t(`level_${c.level.toLowerCase()}`)} · {c.duration}</div>
                    </div>
                    {assigned ? (
                      <button onClick={() => unassign(c.id)} className="px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded font-semibold hover:bg-red-100 hover:text-red-700">
                        {t('admin_unassign')}
                      </button>
                    ) : (
                      <button onClick={() => assign(c.id)} className="px-3 py-1 text-xs bg-amber-600 text-white rounded font-semibold hover:bg-amber-700">
                        {t('admin_assign_courses')}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
function LessonsTab({ ctx }) {
  const { t, lessons } = ctx;
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const visible = COURSES.filter(c => categoryFilter === 'all' || c.category === categoryFilter);

  if (selectedCourseId) {
    const course = COURSES.find(c => c.id === selectedCourseId);
    return (
      <div>
        <button onClick={() => setSelectedCourseId(null)} className="text-sm text-slate-600 hover:text-amber-700 mb-4 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> All courses
        </button>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-4">
          <div className={`h-20 bg-gradient-to-br ${getCategory(course.category).gradient} p-4 flex items-end`}>
            <h2 className="text-xl font-extrabold text-white">{t('admin_lessons_for')} {course.title}</h2>
          </div>
        </div>
        <LessonsManager ctx={{ ...ctx, currentUser: { ...ctx.currentUser, email: ctx.currentUser.email || 'admin@cftmp.com' } }} course={course} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-slate-600">{t('admin_pick_course')}</div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm">
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{t(`cat_${c.id}`)}</option>)}
        </select>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {visible.map(c => {
          const cat = getCategory(c.category);
          const Icon = cat.icon;
          const count = lessons.filter(l => l.courseId === c.id).length;
          return (
            <button key={c.id} onClick={() => setSelectedCourseId(c.id)} className="text-start bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition">
              <div className={`h-20 bg-gradient-to-br ${cat.gradient} flex items-center justify-center`}>
                <Icon className="w-7 h-7 text-white opacity-90" />
              </div>
              <div className="p-3">
                <div className="font-semibold text-slate-900 text-sm line-clamp-2 min-h-[2.5rem]">{c.title}</div>
                <div className="text-xs text-slate-500 mt-1">{count} {t('fp_lessons')}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
function RequestsTab({ ctx }) {
  const { t, language, requests, setRequests, showToast } = ctx;
  const [filter, setFilter] = useState('all');

  const setStatus = async (req, status) => {
    const res = await api.updateRequestStatus(req.id, status);
    if (res.error) return showToast(res.error, 'error');
    setRequests(prev => prev.map(r => r.id === req.id ? res.request : r));
    showToast('Updated');
  };

  const visible = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {['all', 'pending', 'accepted', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${filter === s ? 'bg-amber-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
            {s === 'all' ? `All (${requests.length})` : `${s} (${requests.filter(r => r.status === s).length})`}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500">{t('admin_no_requests')}</div>
      ) : (
        <div className="space-y-3">
          {visible.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900">{r.topic}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.status === 'pending' ? 'bg-amber-100 text-amber-700' : r.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {r.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">{r.userName} · {r.userEmail} · {r.level} · {formatDate(r.createdAt, language)}</div>
                </div>
                {r.status === 'pending' && (
                  <div className="flex gap-1.5">
                    <button onClick={() => setStatus(r, 'accepted')} className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded font-semibold hover:bg-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {t('admin_request_accept')}
                    </button>
                    <button onClick={() => setStatus(r, 'rejected')} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded font-semibold hover:bg-red-200 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> {t('admin_request_reject')}
                    </button>
                  </div>
                )}
              </div>
              {r.message ? <p className="text-sm text-slate-700 whitespace-pre-wrap">{r.message}</p>
                         : <p className="text-sm text-slate-400 italic">{t('admin_no_message')}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ============================================================================
function InvoicesTab({ ctx }) {
  const { t, language, payments, enrollments } = ctx;
  const [filter, setFilter] = useState('all');
  const visible = filter === 'all' ? payments : payments.filter(p => p.status === filter);
  const total = visible.reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="text-sm text-slate-600">{visible.length} invoices · <span className="font-bold text-emerald-600">{total.toLocaleString()} DZD</span></div>
        <div className="flex gap-2">
          {['all', 'completed', 'pending', 'processing', 'failed'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${filter === s ? 'bg-amber-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
              {s === 'all' ? `All (${payments.length})` : `${s} (${payments.filter(p => p.status === s).length})`}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        {visible.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">No invoices found</div>
        ) : (
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-slate-50 text-xs text-slate-600 uppercase tracking-wide">
              <tr>
                <th className="text-start p-3">Invoice #</th>
                <th className="text-start p-3">Student</th>
                <th className="text-start p-3">Course</th>
                <th className="text-start p-3">Amount</th>
                <th className="text-start p-3">Status</th>
                <th className="text-start p-3">Method</th>
                <th className="text-start p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(p => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="p-3 font-mono text-xs font-semibold text-slate-900">{p.invoiceNumber}</td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-900">{p.userName}</div>
                    <div className="text-xs text-slate-500">{p.userEmail}</div>
                  </td>
                  <td className="p-3 text-slate-700">{p.courseTitle}</td>
                  <td className="p-3 font-semibold text-emerald-600">{p.amount.toLocaleString()} DZD</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${
                      p.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      p.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                      p.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {p.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">{p.paymentMethod}</td>
                  <td className="p-3 text-xs text-slate-500">{formatDate(p.paidAt || p.createdAt, language)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ============================================================================
function MeetingInvitationsTab({ ctx }) {
  const { t, language, meetingInvitations, setMeetingInvitations, showToast } = ctx;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ courseId: '', title: '', description: '', meetingDate: '', meetingLink: '' });
  const [creating, setCreating] = useState(false);

  const createMeeting = async () => {
    if (!form.courseId || !form.title || !form.meetingDate || !form.meetingLink) return showToast('All fields required', 'error');
    setCreating(true);
    const res = await api.createMeetingInvitation({
      courseId: Number(form.courseId), title: form.title, description: form.description,
      meetingDate: form.meetingDate, meetingLink: form.meetingLink,
    });
    setCreating(false);
    if (res.error) return showToast(res.error, 'error');
    setMeetingInvitations(prev => [res.invitation, ...prev]);
    setForm({ courseId: '', title: '', description: '', meetingDate: '', meetingLink: '' });
    setShowForm(false);
    showToast('Meeting created');
  };

  const deleteMeeting = async (inv) => {
    if (!confirm('Delete this meeting invitation?')) return;
    const res = await api.deleteMeetingInvitation(inv.id);
    if (res.error) return showToast(res.error, 'error');
    setMeetingInvitations(prev => prev.filter(m => m.id !== inv.id));
    showToast('Deleted');
  };

  const sorted = [...meetingInvitations].sort((a, b) => new Date(b.meetingDate) - new Date(a.meetingDate));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-slate-600">{sorted.length} meeting invitation{sorted.length !== 1 && 's'}</div>
        <button onClick={() => setShowForm(!showForm)} className="px-3 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold flex items-center gap-1">
          <Video className="w-4 h-4" /> New Meeting
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-amber-300 p-5 mb-4">
          <h3 className="font-bold text-slate-900 mb-3">Create Meeting Invitation</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <FieldA label="Course *">
                <select value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value })} className="inputA">
                  <option value="">Select course...</option>
                  {COURSES.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </FieldA>
            </div>
            <FieldA label="Title *">
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="inputA" />
            </FieldA>
            <FieldA label="Meeting Link *">
              <input type="url" value={form.meetingLink} onChange={e => setForm({ ...form, meetingLink: e.target.value })} placeholder="https://meet.google.com/..." className="inputA" />
            </FieldA>
            <div className="sm:col-span-2">
              <FieldA label="Meeting Date & Time *">
                <input type="datetime-local" value={form.meetingDate} onChange={e => setForm({ ...form, meetingDate: e.target.value })} className="inputA" />
              </FieldA>
            </div>
            <div className="sm:col-span-2">
              <FieldA label="Description">
                <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="inputA" />
              </FieldA>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setShowForm(false)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold">Cancel</button>
            <button onClick={createMeeting} disabled={creating} className="px-3 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold flex items-center gap-1">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />} Create
            </button>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500">No meeting invitations yet</div>
      ) : (
        <div className="space-y-3">
          {sorted.map(inv => {
            const course = COURSES.find(c => c.id === inv.courseId);
            const date = new Date(inv.meetingDate);
            return (
              <div key={inv.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-amber-600" />
                      <h3 className="font-bold text-slate-900">{inv.title}</h3>
                    </div>
                    {course && <div className="text-xs text-amber-700 font-semibold mb-2">{course.title}</div>}
                    {inv.description && <p className="text-sm text-slate-600 mb-2">{inv.description}</p>}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>{date.toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {date.toLocaleTimeString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>By: {inv.createdByName || inv.createdByEmail}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <a href={inv.meetingLink} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-indigo-700">
                      <ExternalLink className="w-3 h-3" /> Join
                    </a>
                    <button onClick={() => deleteMeeting(inv)} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
function MessagesTab({ ctx }) {
  const { t, language, currentUser, messages, setMessages, users, enrollments, showToast } = ctx;
  const [selectedKey, setSelectedKey] = useState(null);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const threads = useMemo(() => {
    const groups = {};
    messages.forEach(m => {
      if (m.fromEmail === currentUser.email || m.toEmail === currentUser.email) {
        const other = m.fromEmail === currentUser.email ? m.toEmail : m.fromEmail;
        const key = `${m.courseId}::${other}`;
        if (!groups[key]) groups[key] = { courseId: m.courseId, otherEmail: other, otherName: '', messages: [] };
        groups[key].messages.push(m);
      }
    });
    Object.values(groups).forEach(g => {
      g.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const lastFrom = g.messages.findLast(m => m.fromEmail !== currentUser.email);
      g.otherName = lastFrom?.fromName || users.find(u => u.email === g.otherEmail)?.name || g.otherEmail;
    });
    return Object.values(groups).sort((a, b) => new Date(b.messages.at(-1).createdAt) - new Date(a.messages.at(-1).createdAt));
  }, [messages, currentUser.email, users]);

  const selected = threads.find(t => `${t.courseId}::${t.otherEmail}` === selectedKey);

  const send = async () => {
    if (!body.trim() || !selected) return;
    setSending(true);
    const res = await api.sendMessage({ courseId: selected.courseId, from: currentUser, toEmail: selected.otherEmail, body: body.trim() });
    setSending(false);
    if (res.error) return showToast(res.error, 'error');
    setMessages(prev => [...prev, res.message]);
    setBody('');
  };

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-4 bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="border-e border-slate-100 p-3 max-h-[600px] overflow-y-auto">
        <div className="font-bold text-slate-900 mb-2 px-2">Messages ({threads.length})</div>
        {threads.length === 0 ? (
          <div className="text-sm text-slate-500 px-2 py-6 text-center">No conversations yet</div>
        ) : threads.map(thr => {
          const k = `${thr.courseId}::${thr.otherEmail}`;
          const course = COURSES.find(c => c.id === thr.courseId);
          const last = thr.messages.at(-1);
          return (
            <button key={k} onClick={() => setSelectedKey(k)}
              className={`w-full text-start p-2.5 rounded-lg mb-1 ${selectedKey === k ? 'bg-amber-50' : 'hover:bg-slate-50'}`}>
              <div className="font-semibold text-slate-900 text-sm">{thr.otherName}</div>
              <div className="text-xs text-amber-700 mb-1 line-clamp-1">{course?.title}</div>
              <div className="text-xs text-slate-500 line-clamp-1">{last.body}</div>
            </button>
          );
        })}
      </div>
      <div className="flex flex-col h-[600px]">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Select a conversation</div>
        ) : (
          <>
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 text-sm">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold flex items-center justify-center">{selected.otherName.charAt(0)}</div>
              <div>
                <div className="font-semibold text-slate-900">{selected.otherName}</div>
                <div className="text-xs text-amber-700">{COURSES.find(c => c.id === selected.courseId)?.title}</div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {selected.messages.map(m => {
                const mine = m.fromEmail === currentUser.email;
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${mine ? 'bg-amber-600 text-white' : 'bg-white border border-slate-200 text-slate-800'}`}>
                      <div className="whitespace-pre-wrap">{m.body}</div>
                      <div className={`text-xs mt-1 ${mine ? 'text-amber-200' : 'text-slate-400'}`}>{formatDate(m.createdAt, language)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-3 border-t border-slate-100 flex gap-2">
              <input type="text" value={body} onChange={e => setBody(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Write a message..." className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
              <button onClick={send} disabled={sending || !body.trim()} className="px-4 py-2.5 bg-amber-600 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-1">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
function EnrollmentsTab({ ctx }) {
  const { t, language, enrollments } = ctx;
  const [categoryFilter, setCategoryFilter] = useState('all');
  const visible = categoryFilter === 'all'
    ? enrollments
    : enrollments.filter(e => {
        const c = COURSES.find(co => co.id === e.courseId);
        return c?.category === categoryFilter;
      });
  const revenue = visible.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="text-sm text-slate-600">{visible.length} enrollments · <span className="font-bold text-emerald-600">{revenue.toLocaleString()} DZD</span></div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm">
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{t(`cat_${c.id}`)}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        {visible.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">{t('admin_no_enrollments')}</div>
        ) : (
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-slate-50 text-xs text-slate-600 uppercase tracking-wide">
              <tr>
                <th className="text-start p-3">{t('auth_name')}</th>
                <th className="text-start p-3">{t('auth_email')}</th>
                <th className="text-start p-3">Course</th>
                <th className="text-start p-3">{t('admin_phone')}</th>
                <th className="text-start p-3">{t('admin_wilaya')}</th>
                <th className="text-start p-3">Amount</th>
                <th className="text-start p-3">Paid</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(e => (
                <tr key={e.id} className="border-t border-slate-100">
                  <td className="p-3 font-semibold text-slate-900">{e.userName}</td>
                  <td className="p-3 text-slate-600">{e.userEmail}</td>
                  <td className="p-3 text-slate-700">{e.courseTitle}</td>
                  <td className="p-3 text-slate-600">{e.phone || '-'}</td>
                  <td className="p-3 text-slate-600">{e.wilaya || '-'}</td>
                  <td className="p-3 font-semibold text-emerald-600">{e.amount.toLocaleString()} DZD</td>
                  <td className="p-3 text-xs text-slate-500">{formatDate(e.paidAt, language)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
