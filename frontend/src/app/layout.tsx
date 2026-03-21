import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Karmen Playground — AI Construction Scheduling',
  description:
    'Interactive demo of AI-powered CPM scheduling, change order analysis, and Monte Carlo risk simulation for construction projects.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-[var(--bg-primary)] text-[var(--text-primary)]">
        {children}
      </body>
    </html>
  );
}
