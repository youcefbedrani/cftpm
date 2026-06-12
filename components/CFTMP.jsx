'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Code2, Server, Bot, Brain, Search, GraduationCap, Clock, BookOpen, Users, Award,
  ArrowRight, Mail, Phone, MapPin, Star, CheckCircle2, Sparkles, TrendingUp, Globe2,
  Menu, X, LogOut, ChevronDown, Lock, CreditCard, ShieldCheck, Loader2, Check,
  AlertCircle, MessageSquarePlus, Languages, LayoutDashboard, ShieldAlert,
  UserCircle2, PlayCircle, ChevronLeft, Target, GraduationCap as CapIcon
} from 'lucide-react';
import { WILAYAS, TRANSLATIONS, COURSES } from '@/data/cftmpData';
import * as api from '@/lib/api';
import {
  CATEGORIES, INCLUDES, LEVEL_COLORS, getCategory,
  formatDate, formatPhone, formatCard, formatExpiry, isValidAlgerianPhone,
} from '@/lib/helpers';
import StudentPortal from './StudentPortal';
import FormateurPortal from './FormateurPortal';
import AdminDashboard from './AdminDashboard';
import ChatBot from './ChatBot';

const CFTMP = () => {
  // ============ STATE ============
  const [language, setLanguage] = useState('en');
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [courseInstructors, setCourseInstructors] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [lessonProgress, setLessonProgress] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [messages, setMessages] = useState([]);
  const [payments, setPayments] = useState([]);
  const [meetingInvitations, setMeetingInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Session lives in an HttpOnly cookie set by /api/auth/login.
  // We rehydrate currentUser from /api/auth/me on mount.
  const [currentUser, setCurrentUser] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [authModal, setAuthModal] = useState(null); // 'login' | 'signup' | null
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');

  // Enrollment flow
  const [activeCourse, setActiveCourse] = useState(null);
  const [flowStep, setFlowStep] = useState(null); // 'details' | 'form' | 'payment' | 'processing' | 'success'
  const [enrollForm, setEnrollForm] = useState({ phone: '', wilaya: '', motivation: '', terms: false });
  const [paymentForm, setPaymentForm] = useState({ card: '', expiry: '', cvc: '', name: '' });
  const [enrollError, setEnrollError] = useState('');

  // Custom course request
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({ topic: '', level: 'Beginner', message: '' });
  const [requestSent, setRequestSent] = useState(false);

  // Active portal: 'student' | 'formateur' | 'admin' | null
  const [activePortal, setActivePortal] = useState(null);

  // Catalog filters
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  // ============ DERIVED ============
  const t = useCallback((key, vars = {}) => {
    let s = TRANSLATIONS[language][key] || key;
    Object.entries(vars).forEach(([k, v]) => { s = s.replace(`{${k}}`, v); });
    return s;
  }, [language]);
  const isRTL = language === 'ar';
  const isAdmin     = currentUser?.role === 'admin';
  const isFormateur = currentUser?.role === 'formateur';
  const isStudent   = currentUser?.role === 'student';

  // ============ EFFECTS ============
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [isRTL, language]);

  const refreshAll = useCallback(async () => {
    const all = await api.fetchAll();
    setUsers(all.profiles);
    setRequests(all.requests);
    setEnrollments(all.enrollments);
    setCourseInstructors(all.courseInstructors);
    setLessons(all.lessons);
    setLessonProgress(all.lessonProgress);
    setAnnouncements(all.announcements);
    setMessages(all.messages);
    setPayments(all.payments || []);
    setMeetingInvitations(all.meetingInvitations || []);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const me = await api.fetchMe();
        if (me) {
          setCurrentUser(me);
          if (me.role === 'admin') setActivePortal('admin');
          if (me.role === 'formateur') setActivePortal('formateur');
        }
        await refreshAll();
      } catch (e) { console.error('init error', e); }
      setLoading(false);
    })();
  }, [refreshAll]);


  // Keep currentUser fresh from the profiles list (e.g. role changed by admin)
  useEffect(() => {
    if (!currentUser || currentUser.role === 'admin') return;
    const match = users.find(u => u.email === currentUser.email);
    if (!match) return;
    if (JSON.stringify(match) !== JSON.stringify(currentUser)) {
      setCurrentUser(match);
    }
  }, [users]); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ============ AUTH ============
  const closeAuth = () => { setAuthModal(null); setAuthForm({ name: '', email: '', password: '' }); setAuthError(''); };

  const handleAuth = async () => {
    setAuthError('');
    const { name, email, password } = authForm;

    if (authModal === 'signup' && !name) return setAuthError(t('auth_error_fields'));
    if (!email || !password) return setAuthError(t('auth_error_fields'));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setAuthError(t('auth_error_email'));
    if (password.length < 6) return setAuthError(t('auth_error_password'));

    if (authModal === 'signup') {
      const res = await api.signupStudent({ name, email, password });
      if (res.error === 'exists') return setAuthError(t('auth_error_exists'));
      if (res.error) return setAuthError(t('auth_error_fields'));
      setCurrentUser(res.user);
      await refreshAll();
      showToast(`${t('welcome')}, ${name}!`);
    } else {
      const res = await api.loginUser({ email, password });
      if (res.error === 'notfound') return setAuthError(t('auth_error_notfound'));
      if (res.error) return setAuthError(t('auth_error_fields'));
      const user = res.user;
      setCurrentUser(user);
      await refreshAll();
      showToast(`${t('welcome')}, ${user.name}!`);
      if (user.role === 'formateur') setActivePortal('formateur');
      if (user.role === 'admin') setActivePortal('admin');
    }
    closeAuth();
  };

  const logout = async () => {
    await api.logoutUser();
    setCurrentUser(null);
    setActivePortal(null);
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    setUsers([]); setRequests([]); setEnrollments([]); setCourseInstructors([]);
    setLessons([]); setLessonProgress([]); setAnnouncements([]); setMessages([]);
    setPayments([]); setMeetingInvitations([]);
    await refreshAll();
  };

  // ============ ENROLLMENT FLOW ============
  const openCourseDetails = (course) => { setActiveCourse(course); setFlowStep('details'); };

  const continueToForm = () => {
    if (!currentUser) {
      setActiveCourse(null); setFlowStep(null);
      setAuthModal('signup');
      showToast(t('details_login_first'), 'error');
      return;
    }
    if (isAdmin || isFormateur) {
      showToast(t('admin_logout_hint'), 'error');
      return;
    }
    if (currentUser.enrolledIds?.includes(activeCourse.id)) {
      setActiveCourse(null); setFlowStep(null);
      setActivePortal('student');
      return;
    }
    setEnrollForm({ phone: currentUser.phone || '', wilaya: currentUser.wilaya || '', motivation: '', terms: false });
    setEnrollError('');
    setFlowStep('form');
  };

  const continueToPayment = () => {
    setEnrollError('');
    if (!enrollForm.phone.trim()) return setEnrollError(t('form_error_required'));
    if (!isValidAlgerianPhone(enrollForm.phone)) return setEnrollError(t('form_error_phone'));
    if (!enrollForm.wilaya) return setEnrollError(t('form_error_required'));
    if (!enrollForm.terms) return setEnrollError(t('form_error_required'));
    setFlowStep('payment');
  };

  const handlePayment = async () => {
    setFlowStep('processing');
    const res = await api.createSlickPayInvoice({
      courseId: activeCourse.id, courseTitle: activeCourse.title,
      amount: activeCourse.price, name: currentUser.name,
      phone: enrollForm.phone, wilaya: enrollForm.wilaya, motivation: enrollForm.motivation,
    });
    if (res.error || !res.paymentUrl) {
      setFlowStep('form'); setEnrollError('Payment service error. Please try again.');
      return;
    }
    window.location.href = res.paymentUrl;
  };

  // Handle SlickPay callback after payment
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      const courseId = params.get('courseId');
      const courseTitle = params.get('courseTitle');
      const amount = params.get('amount');
      const phone = params.get('phone') || '';
      const wilaya = params.get('wilaya') || '';
      const motivation = params.get('motivation') || '';
      if (courseId && courseTitle && amount) {
        (async () => {
          const res = await api.createEnrollment({ course: { id: Number(courseId), title: courseTitle, price: Number(amount) }, user: currentUser, phone, wilaya, motivation });
          if (!res.error) {
            setEnrollments(prev => [res.enrollment, ...prev]);
            setPayments(prev => [res.payment, ...prev]);
            setUsers(prev => prev.map(u => u.email === res.user.email ? res.user : u));
            setCurrentUser(res.user);
            setFlowStep('success');
          }
          window.history.replaceState({}, '', window.location.pathname);
        })();
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const closeCourseFlow = () => {
    setActiveCourse(null); setFlowStep(null);
    setEnrollForm({ phone: '', wilaya: '', motivation: '', terms: false });
    setPaymentForm({ card: '', expiry: '', cvc: '', name: '' });
    setEnrollError('');
  };

  // ============ CUSTOM REQUEST ============
  const handleRequestSubmit = async () => {
    if (!requestForm.topic) return;
    if (!currentUser || isAdmin || isFormateur) {
      showToast(t('request_login_required'), 'error');
      setRequestModalOpen(false);
      setAuthModal('signup');
      return;
    }
    const res = await api.createRequest({ user: currentUser, ...requestForm });
    if (res.error) return showToast('Error submitting request', 'error');
    setRequests(prev => [res.request, ...prev]);
    setRequestSent(true);
    setTimeout(() => {
      setRequestSent(false); setRequestModalOpen(false);
      setRequestForm({ topic: '', level: 'Beginner', message: '' });
    }, 2500);
  };

  // ============ CATALOG ============
  const filteredCourses = useMemo(() => COURSES.filter(c => {
    const mc = selectedCategory === 'all' || c.category === selectedCategory;
    const ml = selectedLevel === 'all' || c.level === selectedLevel;
    const ms = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
               c.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return mc && ml && ms;
  }), [selectedCategory, selectedLevel, searchQuery]);

  const isEnrolled = (cid) => currentUser?.enrolledIds?.includes(cid);

  // ============ CONTEXT PASSED TO PORTALS ============
  const ctx = {
    t, language, isRTL, currentUser, setCurrentUser, showToast,
    users, setUsers, requests, setRequests, enrollments, setEnrollments,
    courseInstructors, setCourseInstructors, lessons, setLessons,
    lessonProgress, setLessonProgress, announcements, setAnnouncements,
    messages, setMessages, payments, setPayments,
    meetingInvitations, setMeetingInvitations, openCourseDetails,
  };

  // ============ NAV ============
  const langs = [
    { code: 'en', label: 'English', flag: 'EN' },
    { code: 'fr', label: 'Français', flag: 'FR' },
    { code: 'ar', label: 'العربية', flag: 'AR' },
  ];
  const currentLang = langs.find(l => l.code === language);

  const myPortal = () => {
    if (isAdmin) return 'admin';
    if (isFormateur) return 'formateur';
    if (isStudent) return 'student';
    return null;
  };
  const portalLabel = () => {
    const p = myPortal();
    if (p === 'admin') return t('portal_admin');
    if (p === 'formateur') return t('portal_formateur');
    if (p === 'student') return t('portal_student');
    return '';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Tahoma' }}>
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100]">
          <div className={`px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-white font-medium ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {toast.msg}
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 z-[70] bg-white flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-medium">Loading...</p>
          </div>
        </div>
      )}

      {/* ============ NAV ============ */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-lg bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href="#top" onClick={() => setActivePortal(null)} className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">CFTMP</span>
            </a>

            <div className="hidden md:flex items-center gap-6">
              <a href="#courses" className="text-slate-700 hover:text-indigo-600 font-medium transition">{t('nav_courses')}</a>
              <a href="#about" className="text-slate-700 hover:text-indigo-600 font-medium transition">{t('nav_about')}</a>
              <a href="#contact" className="text-slate-700 hover:text-indigo-600 font-medium transition">{t('nav_contact')}</a>

              {/* Language switcher */}
              <div className="relative">
                <button onClick={() => setLangMenuOpen(!langMenuOpen)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 font-medium text-sm transition">
                  <Languages className="w-4 h-4" />
                  <span>{currentLang.label}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {langMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setLangMenuOpen(false)} />
                    <div className="absolute end-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                      {langs.map(l => (
                        <button key={l.code} onClick={() => { setLanguage(l.code); setLangMenuOpen(false); }}
                          className={`w-full text-start px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-2 ${language === l.code ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700'}`}>
                          {l.label}
                          {language === l.code && <Check className="w-4 h-4 ms-auto" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {currentUser ? (
                <div className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition ${isAdmin ? 'bg-amber-50' : isFormateur ? 'bg-emerald-50' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${isAdmin ? 'bg-gradient-to-br from-amber-500 to-orange-600' : isFormateur ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-indigo-500 to-purple-500'}`}>
                      {isAdmin ? <ShieldAlert className="w-4 h-4" /> : isFormateur ? <CapIcon className="w-4 h-4" /> : currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-slate-700 text-sm">{currentUser.name.split(' ')[0]}</span>
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  </button>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute end-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100">
                          <div className="text-xs text-slate-500">{t('signed_in_as')}</div>
                          <div className="font-semibold text-slate-900 truncate">{currentUser.email}</div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isAdmin ? 'bg-amber-100 text-amber-800' : isFormateur ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                              {isAdmin ? t('role_admin') : isFormateur ? t('role_formateur') : t('role_student')}
                            </span>
                          </div>
                        </div>
                        <button onClick={() => { setActivePortal(myPortal()); setUserMenuOpen(false); }} className="w-full text-start px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700">
                          <LayoutDashboard className="w-4 h-4" /> {portalLabel()}
                        </button>
                        <button onClick={logout} className="w-full text-start px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2 text-red-600 border-t border-slate-100">
                          <LogOut className="w-4 h-4" /> {t('nav_logout')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => setAuthModal('login')} className="px-4 py-1.5 text-slate-700 hover:text-indigo-600 font-medium transition text-sm">{t('nav_login')}</button>
                  <button onClick={() => setAuthModal('signup')} className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition text-sm">
                    {t('nav_signup')}
                  </button>
                </div>
              )}
            </div>

            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-200 space-y-2">
              <a href="#courses" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-700 font-medium">{t('nav_courses')}</a>
              <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-700 font-medium">{t('nav_about')}</a>
              <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-700 font-medium">{t('nav_contact')}</a>
              <div className="flex gap-2 pt-2">
                {langs.map(l => (
                  <button key={l.code} onClick={() => setLanguage(l.code)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${language === l.code ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                    {l.label}
                  </button>
                ))}
              </div>
              {!currentUser ? (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button onClick={() => { setAuthModal('login'); setMobileMenuOpen(false); }} className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition">{t('nav_login')}</button>
                  <button onClick={() => { setAuthModal('signup'); setMobileMenuOpen(false); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium">{t('nav_signup')}</button>
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  <button onClick={() => { setActivePortal(myPortal()); setMobileMenuOpen(false); }} className="w-full px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium flex items-center justify-center gap-2">
                    <LayoutDashboard className="w-4 h-4" /> {portalLabel()}
                  </button>
                  <button onClick={logout} className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium flex items-center justify-center gap-2">
                    <LogOut className="w-4 h-4" /> {t('nav_logout')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <section id="top" className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 start-10 w-72 h-72 bg-indigo-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 end-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur border border-white/30 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-white/95">{t('hero_badge')}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              {t('hero_title_1')}{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">{t('hero_title_2')}</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-200 mb-8 max-w-2xl">{t('hero_subtitle')}</p>
            <div className="flex flex-wrap gap-4">
              <a href="#courses" className="px-7 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl font-semibold hover:shadow-2xl hover:shadow-indigo-500/40 transition flex items-center gap-2">
                {t('hero_cta_primary')} <ArrowRight className="w-5 h-5" />
              </a>
              <button onClick={() => setRequestModalOpen(true)} className="px-7 py-3.5 bg-white/20 backdrop-blur border border-white/30 rounded-xl font-semibold hover:bg-white/30 transition flex items-center gap-2 text-white">
                <MessageSquarePlus className="w-5 h-5 text-white" /> {t('hero_cta_secondary')}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-12 pt-12 border-t border-white/10">
              {[
                { v: COURSES.length, k: 'stats_courses' },
                { v: 4, k: 'stats_domains' },
                { v: '1300+', k: 'stats_hours' },
                { v: '24/7', k: 'stats_access' },
              ].map((s, i) => (
                <div key={i}>
                  <div className="text-3xl md:text-4xl font-extrabold text-indigo-300">{s.v}</div>
                  <div className="text-sm text-slate-200 mt-1 font-medium">{t(s.k)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ CATEGORIES ============ */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-3">{t('cats_title')}</h2>
            <p className="text-slate-800 max-w-2xl mx-auto">{t('cats_subtitle')}</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORIES.filter(c => c.id !== 'all').map(c => {
              const Icon = c.icon;
              const count = COURSES.filter(co => co.category === c.id).length;
              return (
                <button key={c.id} onClick={() => { setSelectedCategory(c.id); document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="group relative overflow-hidden rounded-2xl p-6 text-start hover:-translate-y-1 transition shadow-md hover:shadow-xl">
                  <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient}`} />
                  <div className="relative text-white">
                    <Icon className="w-9 h-9 mb-4 drop-shadow" />
                    <div className="font-bold text-lg drop-shadow">{t(`cat_${c.id}`)}</div>
                    <div className="text-sm text-white/90 mt-1 drop-shadow">{count} {t('courses_available')}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ CATALOG ============ */}
      <section id="courses" className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">{t('catalog_title')}</h2>
            <p className="text-slate-700">{t('catalog_subtitle', { count: COURSES.length })}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 mb-8 grid md:grid-cols-3 gap-3">
            <div className="relative md:col-span-1">
              <Search className="w-5 h-5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t('search_placeholder')} className="w-full ps-10 pe-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400" />
            </div>
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900">
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{t(`cat_${c.id}`)}</option>)}
            </select>
            <select value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)} className="px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900">
              <option value="all">{t('level_all')}</option>
              <option value="Beginner">{t('level_beginner')}</option>
              <option value="Intermediate">{t('level_intermediate')}</option>
              <option value="Advanced">{t('level_advanced')}</option>
            </select>
          </div>

          <div className="flex justify-between items-center mb-4 text-sm text-slate-800">
            <div>{t('showing')} <span className="font-semibold text-slate-900">{filteredCourses.length}</span> {t('of')} {COURSES.length}</div>
            {(selectedCategory !== 'all' || selectedLevel !== 'all' || searchQuery) && (
              <button onClick={() => { setSelectedCategory('all'); setSelectedLevel('all'); setSearchQuery(''); }} className="text-indigo-600 hover:underline">{t('reset')}</button>
            )}
          </div>

          {filteredCourses.length === 0 ? (
            <div className="text-center py-20 text-slate-500">{t('no_results')}</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCourses.map(c => {
                const cat = getCategory(c.category);
                const Icon = cat.icon;
                const enrolled = isEnrolled(c.id);
                return (
                  <article key={c.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition flex flex-col">
                    <div className={`h-28 bg-gradient-to-br ${cat.gradient} flex items-center justify-center`}>
                      <Icon className="w-10 h-10 text-white opacity-90" />
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${LEVEL_COLORS[c.level]}`}>{t(`level_${c.level.toLowerCase()}`)}</span>
                        <span className="text-xs text-slate-500 inline-flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /> {c.duration}</span>
                      </div>
                      <h3 className="font-bold text-slate-800 mb-1 line-clamp-2">{c.title}</h3>
                      <p className="text-sm text-slate-700 line-clamp-2 mb-4 flex-1">{c.desc}</p>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="font-extrabold text-indigo-600">{c.price.toLocaleString()} DZD</div>
                        <button onClick={() => openCourseDetails(c)} className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${enrolled ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                          {enrolled ? t('enrolled') : t('view_details')}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ============ TRUST BADGES ============ */}
      <section className="py-12 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">{t('trust_title')}</h2>
            <p className="text-slate-600">{t('trust_subtitle')}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { v: t('trust_students_v'), label: t('trust_students') },
              { v: t('trust_courses_v'), label: t('trust_courses') },
              { v: t('trust_hours_v'), label: t('trust_hours') },
              { v: t('trust_satisfaction_v'), label: t('trust_satisfaction') },
            ].map((s, i) => (
              <div key={i} className="text-center p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
                <div className="text-3xl md:text-4xl font-extrabold text-indigo-600">{s.v}</div>
                <div className="text-sm text-slate-600 mt-1 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ WHY US ============ */}
      <section id="about" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">{t('why_title')}</h2>
            <p className="text-slate-700">{t('why_subtitle')}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold mb-3">{i}</div>
                <div className="font-bold text-slate-800 mb-1">{t(`why_${i}_t`)}</div>
                <div className="text-sm text-slate-700 leading-relaxed">{t(`why_${i}_d`)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">{t('testimonials_title')}</h2>
            <p className="text-slate-600">{t('testimonials_subtitle')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: t('testimonial_1_name'), role: t('testimonial_1_role'), text: t('testimonial_1_text') },
              { name: t('testimonial_2_name'), role: t('testimonial_2_role'), text: t('testimonial_2_text') },
              { name: t('testimonial_3_name'), role: t('testimonial_3_role'), text: t('testimonial_3_text') },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-slate-700 text-sm mb-4 leading-relaxed italic">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">{t.name.charAt(0)}</div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">{t('faq_title')}</h2>
            <p className="text-slate-600">{t('faq_subtitle')}</p>
          </div>
          <div className="space-y-3">
            {[1,2,3,4,5,6].map(i => (
              <details key={i} className="group bg-slate-50 rounded-xl border border-slate-200 open:shadow-sm transition">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-sm font-semibold text-slate-900 group-open:text-indigo-700 list-none">
                  {t(`faq_${i}_q`)}
                  <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition shrink-0" />
                </summary>
                <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-200 pt-3">
                  {t(`faq_${i}_a`)}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">{t('cta_title')}</h2>
          <p className="text-lg opacity-90 mb-8">{t('cta_subtitle')}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button onClick={() => currentUser ? document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' }) : setAuthModal('signup')} className="px-7 py-3.5 bg-white text-indigo-700 rounded-xl font-bold hover:bg-slate-100 transition flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> {t('cta_primary')}
            </button>
            <button onClick={() => setRequestModalOpen(true)} className="px-7 py-3.5 bg-white/20 backdrop-blur border border-white/40 rounded-xl font-bold hover:bg-white/30 transition flex items-center gap-2">
              <MessageSquarePlus className="w-5 h-5" /> {t('cta_secondary')}
            </button>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer id="contact" className="bg-slate-900 text-slate-300 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-white" /></div>
                <span className="text-xl font-bold text-white">CFTMP</span>
              </div>
              <p className="text-sm max-w-md">{t('footer_about')}</p>
            </div>
            <div>
              <div className="font-bold text-white mb-3">{t('footer_domains')}</div>
              <ul className="space-y-2 text-sm">
                {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                  <li key={c.id}><button onClick={() => { setSelectedCategory(c.id); document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white">{t(`cat_${c.id}`)}</button></li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-bold text-white mb-3">{t('footer_contact')}</div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Rouiba, Algiers</li>
                <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> hello@cftmp.com</li>
                <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +213 555 00 00 00</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 text-center text-sm">© {new Date().getFullYear()} CFTMP. {t('footer_rights')}</div>
        </div>
      </footer>

      {/* ============ AUTH MODAL ============ */}
      {authModal && (
        <div className="fixed inset-0 z-[80] bg-slate-900/70 backdrop-blur flex items-center justify-center p-4" onClick={closeAuth}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-extrabold text-slate-900">{authModal === 'login' ? t('auth_login_title') : t('auth_signup_title')}</h3>
              <button onClick={closeAuth} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-slate-500 mb-5">{authModal === 'login' ? t('auth_login_subtitle') : t('auth_signup_subtitle')}</p>
            <div className="space-y-3">
              {authModal === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('auth_name')}</label>
                  <input type="text" value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('auth_email')}</label>
                <input type="email" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('auth_password')}</label>
                <input type="password" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} onKeyDown={e => e.key === 'Enter' && handleAuth()} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              {authError && <div className="text-sm text-red-600 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> {authError}</div>}
              <button onClick={handleAuth} className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition">
                {authModal === 'login' ? t('auth_login_btn') : t('auth_signup_btn')}
              </button>
              <button onClick={() => { setAuthModal(authModal === 'login' ? 'signup' : 'login'); setAuthError(''); }} className="w-full text-sm text-indigo-600 hover:underline">
                {authModal === 'login' ? t('auth_switch_to_signup') : t('auth_switch_to_login')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ COURSE FLOW MODALS ============ */}
      {activeCourse && flowStep === 'details' && (
        <CourseDetailsModal course={activeCourse} t={t} onClose={closeCourseFlow} onContinue={continueToForm}
          enrolled={isEnrolled(activeCourse.id)} currentUser={currentUser} courseInstructors={courseInstructors} users={users}
          lessonsForCourse={lessons.filter(l => l.courseId === activeCourse.id)} />
      )}

      {activeCourse && flowStep === 'form' && (
        <EnrollFormModal course={activeCourse} t={t} form={enrollForm} setForm={setEnrollForm} error={enrollError}
          onBack={() => setFlowStep('details')} onContinue={continueToPayment} onClose={closeCourseFlow} />
      )}

      {activeCourse && (flowStep === 'payment' || flowStep === 'processing' || flowStep === 'success') && (
        <PaymentModal course={activeCourse} t={t} form={paymentForm} setForm={setPaymentForm}
          step={flowStep} onBack={() => setFlowStep('form')} onClose={closeCourseFlow}
          onPay={handlePayment} onOpenCourse={() => { closeCourseFlow(); setActivePortal('student'); }} />
      )}

      {/* ============ REQUEST MODAL ============ */}
      {requestModalOpen && (
        <RequestModal t={t} form={requestForm} setForm={setRequestForm} sent={requestSent}
          onClose={() => { setRequestModalOpen(false); setRequestSent(false); setRequestForm({ topic: '', level: 'Beginner', message: '' }); }}
          onSubmit={handleRequestSubmit} email={currentUser?.email || ''} />
      )}

      {/* ============ PORTALS ============ */}
      {activePortal === 'student' && isStudent && (
        <StudentPortal ctx={ctx} onClose={() => setActivePortal(null)} />
      )}
      {activePortal === 'formateur' && isFormateur && (
        <FormateurPortal ctx={ctx} onClose={() => setActivePortal(null)} />
      )}
      {activePortal === 'admin' && isAdmin && (
        <AdminDashboard ctx={ctx} onClose={() => setActivePortal(null)} />
      )}

      <ChatBot t={t} />
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS for course flow + request modal
// ============================================================================

function CourseDetailsModal({ course, t, onClose, onContinue, enrolled, currentUser, courseInstructors, users, lessonsForCourse }) {
  const cat = getCategory(course.category);
  const Icon = cat.icon;
  const instructorEmails = courseInstructors.filter(ci => ci.courseId === course.id).map(ci => ci.instructorEmail);
  const instructors = users.filter(u => instructorEmails.includes(u.email));
  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/70 backdrop-blur flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className={`relative h-40 bg-gradient-to-br ${cat.gradient} p-6 flex items-end`}>
          <button onClick={onClose} className="absolute top-4 end-4 text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
          <div className="text-white">
            <Icon className="w-8 h-8 mb-2 opacity-90" />
            <div className="text-xs font-semibold opacity-90 mb-1">{t(`cat_${course.category}`)} · {t(`level_${course.level.toLowerCase()}`)} · {course.duration}</div>
            <h3 className="text-2xl font-extrabold">{course.title}</h3>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <div className="font-bold text-slate-900 mb-2">{t('details_overview')}</div>
            <p className="text-sm text-slate-600">{course.desc}</p>
          </div>
          {instructors.length > 0 && (
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
              <div className="text-xs font-semibold text-emerald-700 mb-2">{t('lp_instructor')}</div>
              <div className="flex flex-wrap gap-3">
                {instructors.map(i => (
                  <div key={i.email} className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 text-sm">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">{i.name.charAt(0)}</div>
                    <div>
                      <div className="font-semibold text-slate-900">{i.name}</div>
                      {i.expertise && <div className="text-xs text-slate-500">{i.expertise}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <div className="font-bold text-slate-900 mb-2">{t('details_outcomes')}</div>
            <ul className="space-y-1.5">
              {course.outcomes.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" /> {o}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-bold text-slate-900 mb-2">{t('details_curriculum')}</div>
            {lessonsForCourse.length > 0 ? (
              <ol className="space-y-1.5">
                {lessonsForCourse.sort((a,b) => a.order - b.order).map((l, i) => (
                  <li key={l.id} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                    <div>
                      <div className="font-medium">{l.title}</div>
                      {l.durationMin > 0 && <div className="text-xs text-slate-500">{l.durationMin} {t('minutes')}</div>}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <ol className="space-y-1.5">
                {course.modules.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="bg-slate-100 text-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                    <div>{m} <span className="text-xs text-slate-400">({t('coming_soon')})</span></div>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div>
            <div className="font-bold text-slate-900 mb-2">{t('details_includes')}</div>
            <div className="grid sm:grid-cols-2 gap-2">
              {INCLUDES.map((it, i) => {
                const I = it.icon;
                return (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                    <I className="w-4 h-4 text-indigo-600" /> {t(it.key)}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <div className="font-extrabold text-xl text-indigo-600">{course.price.toLocaleString()} DZD</div>
            <button onClick={onContinue} className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg">
              {enrolled ? t('sp_open') : currentUser ? t('details_continue') : t('details_login_first')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EnrollFormModal({ course, t, form, setForm, error, onBack, onContinue, onClose }) {
  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/70 backdrop-blur flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-extrabold text-slate-900">{t('form_title')}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
          </div>
          <p className="text-sm text-slate-500 mb-4">{t('form_subtitle')}</p>
          <div className="bg-indigo-50 rounded-lg p-3 mb-4 text-sm">
            <div className="font-semibold text-indigo-900">{course.title}</div>
            <div className="text-indigo-700 text-xs">{course.price.toLocaleString()} DZD · {course.duration}</div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('form_phone')} *</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: formatPhone(e.target.value) })}
                placeholder={t('form_phone_ph')} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('form_wilaya')} *</label>
              <select value={form.wilaya} onChange={e => setForm({ ...form, wilaya: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">{t('form_wilaya_ph')}</option>
                {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('form_motivation')}</label>
              <textarea rows={3} value={form.motivation} onChange={e => setForm({ ...form, motivation: e.target.value })}
                placeholder={t('form_motivation_ph')} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.terms} onChange={e => setForm({ ...form, terms: e.target.checked })} className="mt-1" />
              <span>{t('form_terms')}</span>
            </label>
            {error && <div className="text-sm text-red-600 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> {error}</div>}
            <div className="flex gap-2 pt-2">
              <button onClick={onBack} className="px-4 py-2.5 border border-slate-300 rounded-lg font-medium flex-1"><ChevronLeft className="w-4 h-4 inline" /> {t('form_back')}</button>
              <button onClick={onContinue} className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold flex-1">{t('form_proceed')}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({ course, t, form, setForm, step, onBack, onClose, onPay, onOpenCourse }) {
  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/70 backdrop-blur flex items-center justify-center p-4" onClick={step === 'success' ? onOpenCourse : onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        {step === 'processing' ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-slate-900">SlickPay</span>
            </div>
            <div className="font-semibold text-slate-900">{t('payment_processing')}</div>
            <div className="text-xs text-slate-500 mt-2 flex items-center justify-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Verifying card...
            </div>
            <div className="mt-4 space-y-2 text-start max-w-xs mx-auto">
              {['Connecting to SlickPay secure gateway...', 'Verifying payment details...', 'Processing transaction...', 'Generating invoice...'].map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {s}
                </div>
              ))}
            </div>
          </div>
        ) : step === 'success' ? (
          <div className="p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 mx-auto mb-3 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-1">{t('payment_success')}</h3>
              <p className="text-slate-600 text-sm">{t('payment_success_msg')}</p>
            </div>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Invoice</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Course</span><span className="font-semibold text-slate-900 text-end">{course.title}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-semibold text-emerald-700">{course.price.toLocaleString()} DZD</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Payment method</span><span className="font-semibold text-slate-900 flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-600" /> SlickPay</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold"><CheckCircle2 className="w-3 h-3" /> Paid</span></div>
              </div>
            </div>
            <button onClick={onOpenCourse} className="w-full px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2">
              <PlayCircle className="w-4 h-4" /> {t('payment_continue')}
            </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2"><Lock className="w-4 h-4" /> {t('payment_title')}</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-4 mb-4 text-sm">
              <div className="font-bold text-slate-900">{course.title}</div>
              <div className="text-indigo-600 font-bold mt-1">{course.price.toLocaleString()} DZD</div>
            </div>
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 text-sm">Secure payment via SlickPay</div>
                  <div className="text-xs text-slate-600">Visa, Mastercard, Edahabia, SATIM CIB</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Encrypted connection</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Instant confirmation</div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={onBack} className="px-4 py-2.5 border border-slate-300 rounded-lg font-medium flex-1">{t('form_back')}</button>
                <button onClick={onPay} className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold flex-1 flex items-center justify-center gap-1 hover:shadow-lg transition">
                  <ShieldCheck className="w-4 h-4" /> {t('payment_button', { amount: course.price.toLocaleString() })}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RequestModal({ t, form, setForm, sent, onClose, onSubmit, email }) {
  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/70 backdrop-blur flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        {sent ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 mx-auto mb-4 flex items-center justify-center"><CheckCircle2 className="w-8 h-8 text-emerald-600" /></div>
            <div className="text-xl font-extrabold text-slate-900 mb-1">{t('request_sent')}</div>
            <div className="text-sm text-slate-600">{t('request_sent_msg', { email })}</div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-extrabold text-slate-900">{t('request_title')}</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">{t('request_subtitle')}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('request_topic')} *</label>
                <input type="text" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} placeholder={t('request_topic_ph')} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('request_level')}</label>
                <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg">
                  <option value="Beginner">{t('level_beginner')}</option>
                  <option value="Intermediate">{t('level_intermediate')}</option>
                  <option value="Advanced">{t('level_advanced')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('request_message')}</label>
                <textarea rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder={t('request_message_ph')} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button onClick={onSubmit} className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold">{t('request_submit')}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CFTMP;
