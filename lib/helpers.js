import { Code2, Server, Bot, Brain, BookOpen, PlayCircle, Wrench, Award, Users, Smartphone, Infinity as InfinityIcon } from 'lucide-react';

export const CATEGORIES = [
  { id: 'all', icon: BookOpen, gradient: 'from-slate-600 to-slate-800' },
  { id: 'software', icon: Code2, gradient: 'from-blue-500 to-cyan-500' },
  { id: 'devops', icon: Server, gradient: 'from-emerald-500 to-teal-500' },
  { id: 'automation', icon: Bot, gradient: 'from-orange-500 to-amber-500' },
  { id: 'ai', icon: Brain, gradient: 'from-purple-500 to-pink-500' },
];

export const INCLUDES = [
  { icon: PlayCircle, key: 'inc_videos' },
  { icon: Wrench, key: 'inc_exercises' },
  { icon: Award, key: 'inc_certificate' },
  { icon: Users, key: 'inc_mentor' },
  { icon: InfinityIcon, key: 'inc_lifetime' },
  { icon: Smartphone, key: 'inc_devices' },
];

export const LEVEL_COLORS = {
  Beginner: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Intermediate: 'bg-blue-100 text-blue-700 border-blue-200',
  Advanced: 'bg-purple-100 text-purple-700 border-purple-200',
};

export const ROLE_COLORS = {
  student:   'bg-indigo-100 text-indigo-700 border-indigo-200',
  formateur: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  admin:     'bg-amber-100 text-amber-800 border-amber-200',
};

export const getCategory = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[0];

export const formatDate = (iso, language = 'en') => {
  if (!iso) return '';
  const locale = language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-DZ' : 'en-GB';
  return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const formatPhone = (v) => v.replace(/\D/g, '').slice(0, 10).replace(/(\d{4})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4').trim();
export const formatCard  = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
export const formatExpiry = (v) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? `${d.slice(0,2)}/${d.slice(2)}` : d; };

export const isValidAlgerianPhone = (p) => {
  const s = p.replace(/\s/g, '');
  const d = s.replace(/\D/g, '');
  if (!/^(05|06|07|(\+213|00213)5|(\+213|00213)6|(\+213|00213)7)/.test(s)) return false;
  return d.length === 10 || d.length === 12;
};

// Convert a YouTube/Vimeo URL to its embeddable form.
export const toEmbedUrl = (url) => {
  if (!url) return '';
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.replace(/^\//, '').split('/')[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    return url;
  } catch {
    return url;
  }
};
