'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  X, BookOpen, Bell, MessageSquare, UserCircle2, LayoutDashboard, ChevronRight,
  ChevronLeft, Check, PlayCircle, Loader2, Send, Megaphone, Clock, Save, ArrowLeft,
  GraduationCap, Award, TrendingUp, Receipt, Calendar, ExternalLink,
} from 'lucide-react';
import { COURSES, WILAYAS } from '@/data/cftmpData';
import { CATEGORIES, getCategory, formatDate, toEmbedUrl, formatPhone } from '@/lib/helpers';
import * as api from '@/lib/api';

const TABS = [
  { id: 'dashboard', icon: LayoutDashboard, key: 'sp_dashboard' },
  { id: 'courses',   icon: BookOpen,         key: 'sp_my_courses' },
  { id: 'announce',  icon: Megaphone,        key: 'sp_announcements' },
  { id: 'messages',  icon: MessageSquare,    key: 'sp_messages' },
  { id: 'invoices',  icon: Receipt,          key: 'sp_invoices' },
  { id: 'meetings',  icon: Calendar,         key: 'sp_meetings' },
  { id: 'profile',   icon: UserCircle2,      key: 'sp_profile' },
];

export default function StudentPortal({ ctx, onClose }) {
  const { t, language, currentUser } = ctx;
  const [tab, setTab] = useState('dashboard');
  const [openCourseId, setOpenCourseId] = useState(null);

  const enrolledCourses = useMemo(
    () => (currentUser.enrolledIds || []).map(id => COURSES.find(c => c.id === id)).filter(Boolean),
    [currentUser.enrolledIds]
  );

  const myEnrollments = ctx.enrollments.filter(e => e.userEmail === currentUser.email);

  return (
    <div className="fixed inset-0 z-[70] bg-slate-50 overflow-y-auto">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900">{t('portal_student')}</div>
              <div className="text-xs text-slate-500">{t('sp_welcome_back')}, {currentUser.name}</div>
            </div>
          </div>
          <button onClick={onClose} className="px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-lg flex items-center gap-2 text-sm">
            <X className="w-4 h-4" /> Close
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {openCourseId ? (
          <CoursePlayer
            ctx={ctx}
            course={COURSES.find(c => c.id === openCourseId)}
            onBack={() => setOpenCourseId(null)}
          />
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto">
              {TABS.map(tt => {
                const Icon = tt.icon;
                return (
                  <button key={tt.id} onClick={() => setTab(tt.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${tab === tt.id ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                    <Icon className="w-4 h-4" /> {t(tt.key)}
                  </button>
                );
              })}
            </div>

            {tab === 'dashboard'  && <Dashboard ctx={ctx} enrolledCourses={enrolledCourses} myEnrollments={myEnrollments} onOpen={setOpenCourseId} />}
            {tab === 'courses'    && <MyCourses ctx={ctx} enrolledCourses={enrolledCourses} onOpen={setOpenCourseId} />}
            {tab === 'announce'   && <AnnouncementsTab ctx={ctx} enrolledCourses={enrolledCourses} />}
            {tab === 'messages'   && <MessagesTab ctx={ctx} enrolledCourses={enrolledCourses} />}
            {tab === 'invoices'   && <InvoicesTab ctx={ctx} enrolledCourses={enrolledCourses} />}
            {tab === 'meetings'   && <MeetingsTab ctx={ctx} enrolledCourses={enrolledCourses} />}
            {tab === 'profile'    && <ProfileTab ctx={ctx} />}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
function Dashboard({ ctx, enrolledCourses, myEnrollments, onOpen }) {
  const { t, currentUser, lessons, lessonProgress } = ctx;
  const totalSpent = myEnrollments.reduce((s, e) => s + e.amount, 0);
  const myProgress = lessonProgress.filter(p => p.userEmail === currentUser.email);
  return (
    <div>
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard t={t} icon={BookOpen}  label={t('sp_total_enrolled')} value={enrolledCourses.length} color="indigo" />
        <StatCard t={t} icon={Award}     label={t('sp_total_lessons')}  value={myProgress.length} color="emerald" />
        <StatCard t={t} icon={TrendingUp} label={t('sp_total_spent')}    value={`${totalSpent.toLocaleString()} DZD`} color="amber" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4">{t('sp_continue')}</h3>
        {enrolledCourses.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <div className="mb-3">{t('sp_no_enrollment')}</div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {enrolledCourses.map(c => {
              const courseLessons = lessons.filter(l => l.courseId === c.id);
              const done = myProgress.filter(p => p.courseId === c.id).length;
              const total = courseLessons.length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const cat = getCategory(c.category);
              const Icon = cat.icon;
              return (
                <button key={c.id} onClick={() => onOpen(c.id)} className="text-start bg-slate-50 rounded-xl p-4 hover:shadow-md transition border border-slate-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cat.gradient} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{c.title}</div>
                      <div className="text-xs text-slate-500">{t('sp_lessons_count', { done, total })}</div>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-xs text-slate-500 mt-1.5">{pct}% — {pct === 100 ? t('sp_completed') : pct === 0 ? t('sp_not_started') : t('sp_in_progress')}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color = 'indigo' }) {
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
function MyCourses({ ctx, enrolledCourses, onOpen }) {
  const { t, currentUser, lessons, lessonProgress } = ctx;
  if (enrolledCourses.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
        <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <div className="text-slate-500">{t('sp_no_enrollment')}</div>
      </div>
    );
  }
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {enrolledCourses.map(c => {
        const courseLessons = lessons.filter(l => l.courseId === c.id);
        const done = lessonProgress.filter(p => p.userEmail === currentUser.email && p.courseId === c.id).length;
        const total = courseLessons.length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        const cat = getCategory(c.category);
        const Icon = cat.icon;
        return (
          <button key={c.id} onClick={() => onOpen(c.id)} className="text-start bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl transition">
            <div className={`h-24 bg-gradient-to-br ${cat.gradient} flex items-center justify-center`}>
              <Icon className="w-8 h-8 text-white opacity-90" />
            </div>
            <div className="p-4">
              <div className="font-semibold text-slate-900 mb-2 line-clamp-2">{c.title}</div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-1.5">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-xs text-slate-500 flex justify-between">
                <span>{t('sp_lessons_count', { done, total })}</span>
                <span className="font-semibold">{pct}%</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
function CoursePlayer({ ctx, course, onBack }) {
  const { t, currentUser, lessons, lessonProgress, setLessonProgress, courseInstructors, users } = ctx;
  const courseLessons = useMemo(
    () => lessons.filter(l => l.courseId === course.id).sort((a, b) => a.order - b.order),
    [lessons, course.id]
  );
  const [activeLessonId, setActiveLessonId] = useState(courseLessons[0]?.id || null);
  useEffect(() => {
    if (!activeLessonId && courseLessons.length > 0) setActiveLessonId(courseLessons[0].id);
  }, [courseLessons, activeLessonId]);

  const activeLesson = courseLessons.find(l => l.id === activeLessonId);
  const myProgress = lessonProgress.filter(p => p.userEmail === currentUser.email);
  const isDone = (lessonId) => myProgress.some(p => p.lessonId === lessonId);

  const toggleDone = async (lesson) => {
    if (isDone(lesson.id)) {
      await api.unmarkLessonComplete({ userEmail: currentUser.email, lessonId: lesson.id });
      setLessonProgress(prev => prev.filter(p => !(p.userEmail === currentUser.email && p.lessonId === lesson.id)));
    } else {
      const res = await api.markLessonComplete({ userEmail: currentUser.email, lessonId: lesson.id, courseId: course.id });
      if (res.progress) setLessonProgress(prev => [...prev, res.progress]);
    }
  };

  const goPrev = () => {
    const idx = courseLessons.findIndex(l => l.id === activeLessonId);
    if (idx > 0) setActiveLessonId(courseLessons[idx - 1].id);
  };
  const goNext = () => {
    const idx = courseLessons.findIndex(l => l.id === activeLessonId);
    if (idx >= 0 && idx < courseLessons.length - 1) setActiveLessonId(courseLessons[idx + 1].id);
  };

  const instructorEmails = courseInstructors.filter(ci => ci.courseId === course.id).map(ci => ci.instructorEmail);
  const instructors = users.filter(u => instructorEmails.includes(u.email));

  return (
    <div>
      <button onClick={onBack} className="text-sm text-slate-600 hover:text-indigo-600 mb-4 flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> {t('lp_back_to_courses')}
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-4">
        <div className={`h-28 bg-gradient-to-br ${getCategory(course.category).gradient} p-5 flex items-end`}>
          <div className="text-white">
            <div className="text-xs font-semibold opacity-90 mb-1">{t(`cat_${course.category}`)} · {course.duration}</div>
            <h2 className="text-xl font-extrabold">{course.title}</h2>
          </div>
        </div>
        {instructors.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 text-sm">
            <span className="text-slate-500">{t('lp_instructor')}: </span>
            <span className="font-semibold text-slate-700">{instructors.map(i => i.name).join(', ')}</span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        {/* Player */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          {!activeLesson ? (
            <div className="py-12 text-center text-slate-500">
              <PlayCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              {t('lp_no_lessons')}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
                    {t('lp_lesson')} {activeLesson.order} {activeLesson.durationMin > 0 && `· ${activeLesson.durationMin} ${t('minutes')}`}
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-900">{activeLesson.title}</h3>
                </div>
                <button onClick={() => toggleDone(activeLesson)} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 ${isDone(activeLesson.id) ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                  <Check className="w-4 h-4" /> {isDone(activeLesson.id) ? t('lp_done') : t('lp_mark_done')}
                </button>
              </div>

              {activeLesson.videoUrl ? (
                <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4">
                  <iframe src={toEmbedUrl(activeLesson.videoUrl)} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
              ) : (
                <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 mb-4">
                  <div className="text-center"><PlayCircle className="w-10 h-10 mx-auto mb-1" /><div className="text-xs">{t('lp_no_video')}</div></div>
                </div>
              )}

              <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap min-h-[80px]">
                {activeLesson.content || <span className="text-slate-400 italic">{t('lp_no_content')}</span>}
              </div>

              <div className="flex justify-between mt-6 pt-4 border-t border-slate-100">
                <button onClick={goPrev} disabled={courseLessons.findIndex(l => l.id === activeLessonId) <= 0}
                  className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1">
                  <ChevronLeft className="w-4 h-4" /> {t('lp_prev')}
                </button>
                <button onClick={goNext} disabled={courseLessons.findIndex(l => l.id === activeLessonId) >= courseLessons.length - 1}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1">
                  {t('lp_next')} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Curriculum */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 max-h-[600px] overflow-y-auto">
          <div className="font-bold text-slate-900 mb-3 px-1">{t('lp_curriculum')} ({courseLessons.length})</div>
          {courseLessons.length === 0 ? (
            <div className="text-sm text-slate-500 px-2">{t('lp_no_lessons')}</div>
          ) : (
            <div className="space-y-1">
              {courseLessons.map(l => {
                const done = isDone(l.id);
                const active = l.id === activeLessonId;
                return (
                  <button key={l.id} onClick={() => setActiveLessonId(l.id)}
                    className={`w-full text-start p-2.5 rounded-lg flex items-start gap-2 text-sm transition ${active ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${done ? 'bg-emerald-600 text-white' : active ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {done ? <Check className="w-3.5 h-3.5" /> : l.order}
                    </div>
                    <div className="min-w-0">
                      <div className={`${active ? 'font-semibold text-indigo-700' : 'text-slate-700'} line-clamp-2`}>{l.title}</div>
                      {l.durationMin > 0 && <div className="text-xs text-slate-500"><Clock className="w-3 h-3 inline" /> {l.durationMin} {t('minutes')}</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
function AnnouncementsTab({ ctx, enrolledCourses }) {
  const { t, language, announcements } = ctx;
  const myAnnouncements = announcements
    .filter(a => enrolledCourses.some(c => c.id === a.courseId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (myAnnouncements.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
        <Megaphone className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <div className="text-slate-500">{t('ann_none')}</div>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {myAnnouncements.map(a => {
        const course = COURSES.find(c => c.id === a.courseId);
        return (
          <div key={a.id} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-1.5 text-xs">
              <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">{course?.title}</span>
              <span className="text-slate-500">{formatDate(a.createdAt, language)}</span>
            </div>
            <h3 className="font-bold text-slate-900 mb-1">{a.title}</h3>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{a.body}</p>
            <div className="text-xs text-slate-500 mt-2">{t('ann_by')}: {a.authorName}</div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
function MessagesTab({ ctx, enrolledCourses }) {
  const { t, language, currentUser, messages, setMessages, courseInstructors, users, showToast } = ctx;
  const [selectedCourseId, setSelectedCourseId] = useState(enrolledCourses[0]?.id || null);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  if (enrolledCourses.length === 0) {
    return <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500">{t('sp_no_enrollment')}</div>;
  }

  const instructorEmail = courseInstructors.find(ci => ci.courseId === selectedCourseId)?.instructorEmail;
  const instructor = users.find(u => u.email === instructorEmail);

  const thread = messages
    .filter(m => m.courseId === selectedCourseId &&
      ((m.fromEmail === currentUser.email && m.toEmail === instructorEmail) ||
       (m.toEmail === currentUser.email && m.fromEmail === instructorEmail)))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const send = async () => {
    if (!body.trim() || !instructorEmail) return;
    setSending(true);
    const res = await api.sendMessage({ courseId: selectedCourseId, from: currentUser, toEmail: instructorEmail, body: body.trim() });
    setSending(false);
    if (res.error) { showToast('Failed', 'error'); return; }
    setMessages(prev => [...prev, res.message]);
    setBody('');
  };

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-4 bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="border-e border-slate-100 p-3 max-h-[600px] overflow-y-auto">
        <div className="font-bold text-slate-900 mb-2 px-2">{t('msg_about_course')}</div>
        <div className="space-y-1">
          {enrolledCourses.map(c => (
            <button key={c.id} onClick={() => setSelectedCourseId(c.id)}
              className={`w-full text-start p-2 rounded-lg text-sm ${selectedCourseId === c.id ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'}`}>
              <div className="line-clamp-2">{c.title}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col h-[600px]">
        <div className="p-4 border-b border-slate-100 text-sm">
          {instructor ? (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center">{instructor.name.charAt(0)}</div>
              <div>
                <div className="font-semibold text-slate-900">{instructor.name}</div>
                <div className="text-xs text-slate-500">{t('lp_instructor')}</div>
              </div>
            </div>
          ) : (
            <div className="text-slate-500">{t('msg_no_instructor')}</div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {thread.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-12">{t('msg_pick_thread')}</div>
          ) : thread.map(m => {
            const mine = m.fromEmail === currentUser.email;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${mine ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-800'}`}>
                  <div className="whitespace-pre-wrap">{m.body}</div>
                  <div className={`text-xs mt-1 ${mine ? 'text-indigo-200' : 'text-slate-400'}`}>{formatDate(m.createdAt, language)}</div>
                </div>
              </div>
            );
          })}
        </div>
        {instructor && (
          <div className="p-3 border-t border-slate-100 flex gap-2">
            <input type="text" value={body} onChange={e => setBody(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
              placeholder={t('msg_type_here')} className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <button onClick={send} disabled={sending || !body.trim()} className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-1">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {t('msg_send')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
function InvoicesTab({ ctx }) {
  const { t, language, payments } = ctx;
  const myInvoices = payments
    .filter(p => p.userEmail === ctx.currentUser.email)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (myInvoices.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
        <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <div className="text-slate-500">No invoices yet</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs text-slate-600 uppercase tracking-wide">
          <tr>
            <th className="text-start p-3">Invoice #</th>
            <th className="text-start p-3">Course</th>
            <th className="text-start p-3">Amount</th>
            <th className="text-start p-3">Status</th>
            <th className="text-start p-3">Date</th>
          </tr>
        </thead>
        <tbody>
          {myInvoices.map(p => (
            <tr key={p.id} className="border-t border-slate-100">
              <td className="p-3 font-mono text-xs font-semibold text-slate-900">{p.invoiceNumber}</td>
              <td className="p-3 text-slate-700">{p.courseTitle}</td>
              <td className="p-3 font-semibold text-emerald-600">{p.amount.toLocaleString()} DZD</td>
              <td className="p-3">
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${
                  p.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                  p.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                  p.status === 'failed' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {p.status === 'completed' && <Check className="w-3 h-3" />}
                  {p.status}
                </span>
              </td>
              <td className="p-3 text-xs text-slate-500">{formatDate(p.paidAt || p.createdAt, language)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
function MeetingsTab({ ctx, enrolledCourses }) {
  const { t, language, meetingInvitations } = ctx;
  const enrolledIds = enrolledCourses.map(c => c.id);
  const myMeetings = meetingInvitations
    .filter(m => enrolledIds.includes(m.courseId))
    .sort((a, b) => new Date(b.meetingDate) - new Date(a.meetingDate));

  if (myMeetings.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
        <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <div className="text-slate-500">{t('no_meetings')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {myMeetings.map(inv => {
        const course = enrolledCourses.find(c => c.id === inv.courseId);
        const date = new Date(inv.meetingDate);
        return (
          <div key={inv.id} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-slate-900">{inv.title}</h3>
                </div>
                {course && <div className="text-xs text-indigo-700 font-semibold mb-2">{course.title}</div>}
                {inv.description && <p className="text-sm text-slate-600 mb-2">{inv.description}</p>}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>{date.toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {date.toLocaleTimeString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>By: {inv.createdByName || inv.createdByEmail}</span>
                </div>
              </div>
              <a href={inv.meetingLink} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-indigo-700 shrink-0">
                <ExternalLink className="w-3 h-3" /> Join
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
function ProfileTab({ ctx }) {
  const { t, currentUser, setCurrentUser, setUsers, showToast } = ctx;
  const [form, setForm] = useState({
    name: currentUser.name, phone: currentUser.phone || '', wilaya: currentUser.wilaya || '',
    bio: currentUser.bio || '', password: '',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const res = await api.updateProfile(currentUser.email, form);
    setSaving(false);
    if (res.error) return showToast(res.error, 'error');
    setCurrentUser(res.user);
    setUsers(prev => prev.map(u => u.email === res.user.email ? res.user : u));
    setForm(f => ({ ...f, password: '' }));
    showToast(t('profile_saved'));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-2xl">
      <h3 className="font-bold text-slate-900 mb-4">{t('profile_title')}</h3>
      <div className="space-y-3">
        <Field label={t('auth_name')}>
          <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" />
        </Field>
        <Field label={t('auth_email')}>
          <input type="email" value={currentUser.email} disabled className="input bg-slate-100 text-slate-500" />
        </Field>
        <Field label={t('form_phone')}>
          <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: formatPhone(e.target.value) })} className="input" />
        </Field>
        <Field label={t('form_wilaya')}>
          <select value={form.wilaya} onChange={e => setForm({ ...form, wilaya: e.target.value })} className="input">
            <option value="">{t('form_wilaya_ph')}</option>
            {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </Field>
        <Field label={t('profile_bio')}>
          <textarea rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} className="input" />
        </Field>
        <Field label={`${t('auth_password')} (${t('not_set')})`}>
          <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••" className="input" />
        </Field>
        <button onClick={save} disabled={saving} className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {t('profile_save')}
        </button>
      </div>
      <style jsx>{`
        :global(.input) {
          width: 100%; padding: 0.6rem 0.9rem; border: 1px solid rgb(203 213 225);
          border-radius: 0.5rem; outline: none;
        }
        :global(.input:focus) { box-shadow: 0 0 0 2px rgb(99 102 241); border-color: transparent; }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
