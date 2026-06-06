import './globals.css';

export const metadata = {
  title: 'CFTMP — Build a real career in Software, DevOps & AI',
  description: 'Online tech training based in Rouiba, Algeria. Learn from a working engineer, in Arabic, French or English.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
