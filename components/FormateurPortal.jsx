'use client';

import { useState, useMemo } from 'react';
import {
  X, LayoutDashboard, BookOpen, Users, MessageSquare, Megaphone, GraduationCap,
  ArrowLeft, Plus, Edit2, Trash2, Save, Loader2, Send, Check, Award, TrendingUp,
  PlayCircle, Clock, Calendar, Video, ExternalLink,
} from 'lucide-react';
import { COURSES } from '@/data/cftmpData';
import { CATEGORIES, getCategory, formatDate, toEmbedUrl } from '@/lib/helpers';
import * as api from '@/lib/api';

const TABS = [
  { id: 'dashboard', icon: LayoutDashboard, key: 'fp_dashboard' },
  { id: 'courses',   icon: BookOpen,         key: 'fp_my_courses' },
  { id: 'announce',  icon: Megaphone,        key: 'fp_announcements' },
  { id: 'messages',  icon: MessageSquare,    key: 'fp_messages' },
  { id: 'meetings',  icon: Calendar,         key: 'fp_meetings' },
];

export default function FormateurPortal({ ctx, onClose }) {
  const { t, currentUser, courseInstructors } = ctx;
  const [tab, setTab] = useState('dashboard');
  const [openCourseId, setOpenCourseId] = useState(null);

  const myCourseIds = courseInstructors
    .filter(ci => ci.instructorEmail === currentUser.email)
    .map(ci => ci.courseId);
  const myCourses = COURSES.filter(c => myCourseIds.includes(c.id));

  return (
    <div className="fixed inset-0 z-[70] bg-slate-50 overflow-y-auto">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900">{t('portal_formateur')}</div>
              <div className="text-xs text-slate-500">{currentUser.name}</div>
            </div>
          </div>
          <button onClick={onClose} className="px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-lg flex items-center gap-2 text-sm">
            <X className="w-4 h-4" /> Close
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {openCourseId ? (
          <CourseManager ctx={ctx} course={COURSES.find(c => c.id === openCourseId)} onBack={() => setOpenCourseId(null)} />
        ) : (
          <>
            <div className="flex gap-1 mb-6 bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto">
              {TABS.map(tt => {
                const Icon = tt.icon;
                return (
                  <button key={tt.id} onClick={() => setTab(tt.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${tab === tt.id ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                    <Icon className="w-4 h-4" /> {t(tt.key)}
                  </button>
                );
              })}
            </div>

            {tab === 'dashboard' && <FpDashboard ctx={ctx} myCourses={myCourses} onOpen={setOpenCourseId} />}
            {tab === 'courses'   && <FpCourses   ctx={ctx} myCourses={myCourses} onOpen={setOpenCourseId} />}
            {tab === 'announce'  && <FpAnnouncements ctx={ctx} myCourses={myCourses} />}
            {tab === 'messages'  && <FpMessages ctx={ctx} myCourses={myCourses} />}
            {tab === 'meetings'  && <FpMeetings ctx={ctx} myCourses={myCourses} />}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
function FpDashboard({ ctx, myCourses, onOpen }) {
  const { t, enrollments, lessons } = ctx;
  const myCourseIds = myCourses.map(c => c.id);
  const myStudents = enrollments.filter(e => myCourseIds.includes(e.courseId));
  const myLessons  = lessons.filter(l => myCourseIds.includes(l.courseId));
  const totalRevenue = myStudents.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Stat icon={Users} label={t('fp_total_students')} value={myStudents.length} color="emerald" />
        <Stat icon={BookOpen} label={t('fp_total_lessons')} value={myLessons.length} color="indigo" />
        <Stat icon={TrendingUp} label={t('fp_total_revenue')} value={`${totalRevenue.toLocaleString()} DZD`} color="amber" />
      </div>

      {myCourses.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <div className="text-slate-500">{t('fp_no_assignment')}</div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4">{t('fp_my_courses')}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {myCourses.map(c => {
              const cat = getCategory(c.category);
              const Icon = cat.icon;
              const students = enrollments.filter(e => e.courseId === c.id).length;
              const lessonCount = lessons.filter(l => l.courseId === c.id).length;
              return (
                <button key={c.id} onClick={() => onOpen(c.id)} className="text-start bg-slate-50 rounded-xl p-4 border border-slate-200 hover:shadow-md transition">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cat.gradient} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="font-semibold text-slate-900 flex-1 min-w-0 truncate">{c.title}</div>
                  </div>
                  <div className="flex gap-4 text-xs text-slate-600">
                    <span><Users className="w-3 h-3 inline" /> {students}</span>
                    <span><BookOpen className="w-3 h-3 inline" /> {lessonCount} {t('fp_lessons')}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, color = 'emerald' }) {
  const colors = {
    indigo: 'from-indigo-500 to-purple-500',
    emerald: 'from-emerald-500 to-teal-500',
    amber: 'from-amber-500 to-orange-500',
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
function FpCourses({ ctx, myCourses, onOpen }) {
  const { t, enrollments, lessons } = ctx;
  if (myCourses.length === 0) {
    return <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500">{t('fp_no_assignment')}</div>;
  }
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {myCourses.map(c => {
        const cat = getCategory(c.category);
        const Icon = cat.icon;
        const students = enrollments.filter(e => e.courseId === c.id).length;
        const lessonCount = lessons.filter(l => l.courseId === c.id).length;
        return (
          <article key={c.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl transition">
            <div className={`h-24 bg-gradient-to-br ${cat.gradient} flex items-center justify-center`}>
              <Icon className="w-8 h-8 text-white opacity-90" />
            </div>
            <div className="p-4">
              <div className="font-semibold text-slate-900 mb-2 line-clamp-2 min-h-[3rem]">{c.title}</div>
              <div className="flex gap-4 text-xs text-slate-600 mb-3">
                <span><Users className="w-3 h-3 inline" /> {students}</span>
                <span><BookOpen className="w-3 h-3 inline" /> {lessonCount}</span>
              </div>
              <button onClick={() => onOpen(c.id)} className="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg font-semibold text-sm">{t('fp_manage_lessons')}</button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

// ============================================================================
function CourseManager({ ctx, course, onBack }) {
  const { t } = ctx;
  const [view, setView] = useState('lessons'); // lessons | students
  return (
    <div>
      <button onClick={onBack} className="text-sm text-slate-600 hover:text-emerald-700 mb-4 flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> {t('fp_my_courses')}
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-4">
        <div className={`h-20 bg-gradient-to-br ${getCategory(course.category).gradient} p-4 flex items-end`}>
          <h2 className="text-xl font-extrabold text-white">{course.title}</h2>
        </div>
      </div>

      <div className="flex gap-1 mb-4 bg-white p-1 rounded-xl border border-slate-200 w-fit">
        <button onClick={() => setView('lessons')} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${view === 'lessons' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
          <BookOpen className="w-4 h-4" /> {t('fp_lessons')}
        </button>
        <button onClick={() => setView('students')} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${view === 'students' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
          <Users className="w-4 h-4" /> {t('fp_students')}
        </button>
      </div>

      {view === 'lessons'   && <LessonsManager ctx={ctx} course={course} />}
      {view === 'students'  && <StudentsView ctx={ctx} course={course} />}
    </div>
  );
}

// ============================================================================
export function LessonsManager({ ctx, course }) {
  const { t, currentUser, lessons, setLessons, showToast } = ctx;
  const courseLessons = useMemo(
    () => lessons.filter(l => l.courseId === course.id).sort((a, b) => a.order - b.order),
    [lessons, course.id]
  );
  const [editing, setEditing] = useState(null); // null | 'new' | lesson object
  const [form, setForm] = useState({ title: '', content: '', videoUrl: '', durationMin: 15, order: 1 });
  const [saving, setSaving] = useState(false);

  const startNew = () => {
    setForm({ title: '', content: '', videoUrl: '', durationMin: 15, order: (courseLessons[courseLessons.length - 1]?.order || 0) + 1 });
    setEditing('new');
  };
  const startEdit = (l) => {
    setForm({ title: l.title, content: l.content, videoUrl: l.videoUrl, durationMin: l.durationMin, order: l.order });
    setEditing(l);
  };
  const cancel = () => { setEditing(null); setForm({ title: '', content: '', videoUrl: '', durationMin: 15, order: 1 }); };

  const save = async () => {
    if (!form.title.trim()) return showToast('Title required', 'error');
    setSaving(true);
    if (editing === 'new') {
      const res = await api.createLesson({
        courseId: course.id, order: Number(form.order) || 1,
        title: form.title, content: form.content, videoUrl: form.videoUrl,
        durationMin: Number(form.durationMin) || 0, createdByEmail: currentUser.email,
      });
      setSaving(false);
      if (res.error) return showToast(res.error, 'error');
      setLessons(prev => [...prev, res.lesson]);
    } else {
      const res = await api.updateLesson(editing.id, {
        order: Number(form.order) || 1, title: form.title, content: form.content,
        videoUrl: form.videoUrl, durationMin: Number(form.durationMin) || 0,
      });
      setSaving(false);
      if (res.error) return showToast(res.error, 'error');
      setLessons(prev => prev.map(l => l.id === res.lesson.id ? res.lesson : l));
    }
    cancel();
    showToast('Saved');
  };

  const remove = async (lesson) => {
    if (!confirm(t('fp_confirm_delete'))) return;
    const res = await api.deleteLesson(lesson.id);
    if (res.error) return showToast(res.error, 'error');
    setLessons(prev => prev.filter(l => l.id !== lesson.id));
    showToast('Deleted');
  };

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900">{t('fp_lessons')} ({courseLessons.length})</h3>
          <button onClick={startNew} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold flex items-center gap-1">
            <Plus className="w-4 h-4" /> {t('fp_add_lesson')}
          </button>
        </div>
        {courseLessons.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            No lessons yet — add the first one
          </div>
        ) : (
          <div className="space-y-2">
            {courseLessons.map(l => (
              <div key={l.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm shrink-0">{l.order}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900">{l.title}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    {l.durationMin > 0 && <span><Clock className="w-3 h-3 inline" /> {l.durationMin} {t('minutes')}</span>}
                    {l.videoUrl && <span><PlayCircle className="w-3 h-3 inline" /> video</span>}
                  </div>
                </div>
                <button onClick={() => startEdit(l)} className="p-1.5 text-slate-500 hover:text-emerald-600"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => remove(l)} className="p-1.5 text-slate-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 h-fit sticky top-24">
        {editing ? (
          <>
            <h3 className="font-bold text-slate-900 mb-3">{editing === 'new' ? t('fp_add_lesson') : t('fp_edit_lesson')}</h3>
            <div className="space-y-3">
              <Field2 label={t('fp_lesson_order')}>
                <input type="number" value={form.order} onChange={e => setForm({ ...form, order: e.target.value })} className="input2" />
              </Field2>
              <Field2 label={t('fp_lesson_title')}>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input2" />
              </Field2>
              <Field2 label={t('fp_lesson_video')}>
                <input type="url" value={form.videoUrl} onChange={e => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://youtube.com/watch?v=..." className="input2" />
              </Field2>
              <Field2 label={t('fp_lesson_duration')}>
                <input type="number" value={form.durationMin} onChange={e => setForm({ ...form, durationMin: e.target.value })} className="input2" />
              </Field2>
              <Field2 label={t('fp_lesson_content')}>
                <textarea rows={6} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="input2" />
              </Field2>
              <div className="flex gap-2">
                <button onClick={cancel} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold">{t('fp_cancel')}</button>
                <button onClick={save} disabled={saving} className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-1 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {t('fp_save')}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-10 text-slate-500 text-sm">
            <Edit2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            Select a lesson to edit, or add a new one.
          </div>
        )}
      </div>

      <style jsx>{`
        :global(.input2) {
          width: 100%; padding: 0.5rem 0.75rem; border: 1px solid rgb(203 213 225);
          border-radius: 0.5rem; outline: none; font-size: 0.875rem;
        }
        :global(.input2:focus) { box-shadow: 0 0 0 2px rgb(16 185 129); border-color: transparent; }
      `}</style>
    </div>
  );
}

function Field2({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

// ============================================================================
function StudentsView({ ctx, course }) {
  const { t, language, enrollments, lessonProgress, lessons } = ctx;
  const courseLessons = lessons.filter(l => l.courseId === course.id);
  const courseStudents = enrollments.filter(e => e.courseId === course.id);
  if (courseStudents.length === 0) {
    return <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500">{t('fp_no_students')}</div>;
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs text-slate-600 uppercase tracking-wide">
          <tr>
            <th className="text-start p-3">{t('auth_name')}</th>
            <th className="text-start p-3">{t('auth_email')}</th>
            <th className="text-start p-3">{t('fp_student_progress')}</th>
            <th className="text-start p-3">{t('fp_student_enrolled_on')}</th>
          </tr>
        </thead>
        <tbody>
          {courseStudents.map(e => {
            const done = lessonProgress.filter(p => p.userEmail === e.userEmail && p.courseId === course.id).length;
            const total = courseLessons.length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <tr key={e.id} className="border-t border-slate-100">
                <td className="p-3 font-semibold text-slate-900">{e.userName}</td>
                <td className="p-3 text-slate-600">{e.userEmail}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold">{done}/{total}</span>
                  </div>
                </td>
                <td className="p-3 text-slate-600 text-xs">{formatDate(e.paidAt, language)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
function FpAnnouncements({ ctx, myCourses }) {
  const { t, language, currentUser, announcements, setAnnouncements, showToast } = ctx;
  const myCourseIds = myCourses.map(c => c.id);
  const myAnnouncements = announcements
    .filter(a => myCourseIds.includes(a.courseId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const [form, setForm] = useState({ courseId: myCourses[0]?.id || '', title: '', body: '' });
  const [posting, setPosting] = useState(false);

  if (myCourses.length === 0) {
    return <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500">{t('fp_no_assignment')}</div>;
  }

  const post = async () => {
    if (!form.title.trim() || !form.body.trim() || !form.courseId) return;
    setPosting(true);
    const res = await api.createAnnouncement({
      courseId: Number(form.courseId), author: currentUser, title: form.title, body: form.body,
    });
    setPosting(false);
    if (res.error) return showToast(res.error, 'error');
    setAnnouncements(prev => [res.announcement, ...prev]);
    setForm({ courseId: form.courseId, title: '', body: '' });
    showToast('Posted');
  };

  const remove = async (a) => {
    if (!confirm('Delete?')) return;
    const res = await api.deleteAnnouncement(a.id);
    if (res.error) return showToast(res.error, 'error');
    setAnnouncements(prev => prev.filter(x => x.id !== a.id));
  };

  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-4">
      <div className="space-y-3">
        {myAnnouncements.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500">{t('ann_none')}</div>
        ) : myAnnouncements.map(a => {
          const course = COURSES.find(c => c.id === a.courseId);
          return (
            <div key={a.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">{course?.title}</span>
                <button onClick={() => remove(a)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
              <h3 className="font-bold text-slate-900 mb-1">{a.title}</h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{a.body}</p>
              <div className="text-xs text-slate-500 mt-2">{formatDate(a.createdAt, language)}</div>
            </div>
          );
        })}
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-4 h-fit sticky top-24">
        <h3 className="font-bold text-slate-900 mb-3">{t('ann_new')}</h3>
        <div className="space-y-3">
          <Field2 label={t('ann_for_course')}>
            <select value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value })} className="input2">
              {myCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </Field2>
          <Field2 label={t('ann_form_title')}>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input2" />
          </Field2>
          <Field2 label={t('ann_form_body')}>
            <textarea rows={5} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} className="input2" />
          </Field2>
          <button onClick={post} disabled={posting} className="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-1 disabled:opacity-50">
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {t('ann_post')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
function FpMeetings({ ctx, myCourses }) {
  const { t, language, meetingInvitations, setMeetingInvitations, showToast } = ctx;
  const myCourseIds = myCourses.map(c => c.id);
  const myMeetings = meetingInvitations
    .filter(m => myCourseIds.includes(m.courseId))
    .sort((a, b) => new Date(b.meetingDate) - new Date(a.meetingDate));

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ courseId: myCourses[0]?.id || '', title: '', description: '', meetingDate: '', meetingLink: '' });
  const [creating, setCreating] = useState(false);

  if (myCourses.length === 0) {
    return <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500">{t('fp_no_assignment')}</div>;
  }

  const createMeeting = async () => {
    if (!form.title || !form.meetingDate || !form.meetingLink) return showToast('All fields required', 'error');
    setCreating(true);
    const res = await api.createMeetingInvitation({
      courseId: Number(form.courseId), title: form.title, description: form.description,
      meetingDate: form.meetingDate, meetingLink: form.meetingLink,
    });
    setCreating(false);
    if (res.error) return showToast(res.error, 'error');
    setMeetingInvitations(prev => [res.invitation, ...prev]);
    setForm({ courseId: form.courseId, title: '', description: '', meetingDate: '', meetingLink: '' });
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-slate-600">{myMeetings.length} meeting invitation{myMeetings.length !== 1 && 's'}</div>
        <button onClick={() => setShowForm(!showForm)} className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold flex items-center gap-1">
          <Video className="w-4 h-4" /> New Meeting
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-emerald-300 p-5 mb-4">
          <h3 className="font-bold text-slate-900 mb-3">Create Meeting Invitation</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Field2 label={t('ann_for_course')}>
                <select value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value })} className="input2">
                  {myCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </Field2>
            </div>
            <Field2 label="Title *">
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input2" />
            </Field2>
            <Field2 label="Meeting Link *">
              <input type="url" value={form.meetingLink} onChange={e => setForm({ ...form, meetingLink: e.target.value })} placeholder="https://meet.google.com/..." className="input2" />
            </Field2>
            <div className="sm:col-span-2">
              <Field2 label="Meeting Date & Time *">
                <input type="datetime-local" value={form.meetingDate} onChange={e => setForm({ ...form, meetingDate: e.target.value })} className="input2" />
              </Field2>
            </div>
            <div className="sm:col-span-2">
              <Field2 label="Description">
                <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input2" />
              </Field2>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setShowForm(false)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold">Cancel</button>
            <button onClick={createMeeting} disabled={creating} className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold flex items-center gap-1">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />} Create
            </button>
          </div>
        </div>
      )}

      {myMeetings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500">No meeting invitations yet</div>
      ) : (
        <div className="space-y-3">
          {myMeetings.map(inv => {
            const course = myCourses.find(c => c.id === inv.courseId);
            const date = new Date(inv.meetingDate);
            return (
              <div key={inv.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <h3 className="font-bold text-slate-900">{inv.title}</h3>
                    </div>
                    {course && <div className="text-xs text-emerald-700 font-semibold mb-2">{course.title}</div>}
                    {inv.description && <p className="text-sm text-slate-600 mb-2">{inv.description}</p>}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>{date.toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {date.toLocaleTimeString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
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
function FpMessages({ ctx, myCourses }) {
  const { t, language, currentUser, messages, setMessages, enrollments, showToast } = ctx;
  const myCourseIds = myCourses.map(c => c.id);
  const myThreads = useMemo(() => {
    const groups = {};
    messages.filter(m => myCourseIds.includes(m.courseId) &&
                        (m.toEmail === currentUser.email || m.fromEmail === currentUser.email))
      .forEach(m => {
        const other = m.fromEmail === currentUser.email ? m.toEmail : m.fromEmail;
        const key = `${m.courseId}::${other}`;
        if (!groups[key]) groups[key] = { courseId: m.courseId, otherEmail: other, otherName: m.fromEmail === currentUser.email ? '' : m.fromName, messages: [] };
        if (!groups[key].otherName && m.fromEmail !== currentUser.email) groups[key].otherName = m.fromName;
        groups[key].messages.push(m);
      });
    Object.values(groups).forEach(g => {
      g.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      if (!g.otherName) {
        const enr = enrollments.find(e => e.courseId === g.courseId && e.userEmail === g.otherEmail);
        g.otherName = enr?.userName || g.otherEmail;
      }
    });
    return Object.values(groups).sort((a, b) => new Date(b.messages.at(-1).createdAt) - new Date(a.messages.at(-1).createdAt));
  }, [messages, myCourseIds, currentUser.email, enrollments]);

  const [selectedKey, setSelectedKey] = useState(null);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const selected = myThreads.find(t => `${t.courseId}::${t.otherEmail}` === selectedKey);

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
        <div className="font-bold text-slate-900 mb-2 px-2">{t('msg_inbox')} ({myThreads.length})</div>
        {myThreads.length === 0 ? (
          <div className="text-sm text-slate-500 px-2 py-6 text-center">{t('msg_no_threads')}</div>
        ) : myThreads.map(thr => {
          const k = `${thr.courseId}::${thr.otherEmail}`;
          const course = COURSES.find(c => c.id === thr.courseId);
          const last = thr.messages.at(-1);
          return (
            <button key={k} onClick={() => setSelectedKey(k)}
              className={`w-full text-start p-2.5 rounded-lg ${selectedKey === k ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}>
              <div className="font-semibold text-slate-900 text-sm">{thr.otherName}</div>
              <div className="text-xs text-emerald-700 mb-1 line-clamp-1">{course?.title}</div>
              <div className="text-xs text-slate-500 line-clamp-1">{last.body}</div>
            </button>
          );
        })}
      </div>
      <div className="flex flex-col h-[600px]">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">{t('msg_pick_thread')}</div>
        ) : (
          <>
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 text-sm">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center">{selected.otherName.charAt(0)}</div>
              <div>
                <div className="font-semibold text-slate-900">{selected.otherName}</div>
                <div className="text-xs text-emerald-700">{COURSES.find(c => c.id === selected.courseId)?.title}</div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {selected.messages.map(m => {
                const mine = m.fromEmail === currentUser.email;
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${mine ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-800'}`}>
                      <div className="whitespace-pre-wrap">{m.body}</div>
                      <div className={`text-xs mt-1 ${mine ? 'text-emerald-200' : 'text-slate-400'}`}>{formatDate(m.createdAt, language)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-3 border-t border-slate-100 flex gap-2">
              <input type="text" value={body} onChange={e => setBody(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
                placeholder={t('msg_type_here')} className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <button onClick={send} disabled={sending || !body.trim()} className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-1">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {t('msg_send')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
