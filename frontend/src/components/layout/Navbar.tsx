'use client';

interface NavbarProps {
  onExport?: () => void;
  showExport?: boolean;
  onGoHome?: () => void;
}

export default function Navbar({ onExport, showExport = false, onGoHome }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[var(--border-default)] h-14 flex items-center px-6">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center gap-1">
          <span className="font-bold text-base leading-none" style={{ color: '#2DD4BF' }}>✕</span>
          <span className="font-bold text-[var(--text-primary)] text-base tracking-tight ml-1">KARMEN</span>
          <span className="font-normal text-[var(--text-primary)] text-base tracking-tight">PLAYGROUND</span>
        </div>
        {onGoHome && (
          <>
            <span className="text-[var(--border-strong)] text-sm">/</span>
            <button
              onClick={onGoHome}
              className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--blue-primary)] transition-colors"
            >
              ← Back to projects
            </button>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <a
          href="https://github.com/rehanmollick/karmen-playground"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          GitHub
        </a>
        {showExport && onExport && (
          <button
            onClick={onExport}
            className="px-4 py-1.5 text-sm font-medium text-white rounded-[var(--radius-sm)] transition-colors"
            style={{ backgroundColor: 'var(--export-red)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--export-red-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--export-red)')}
          >
            Export XML
          </button>
        )}
      </div>
    </nav>
  );
}
