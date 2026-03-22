export default function Footer() {
  return (
    <footer className="bg-white border-t border-[var(--border-default)] py-6 px-6 mt-auto">
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
          <span>Built by <a href="https://www.linkedin.com/in/rehanmollick/" target="_blank" rel="noopener noreferrer" className="text-[var(--text-link)] hover:underline">Rehan Mollick</a></span>
          <span>·</span>
          <a href="https://github.com/rehanmollick/karmen-playground" target="_blank" rel="noopener noreferrer" className="text-[var(--text-link)] hover:underline">GitHub</a>
        </div>
        <p className="text-xs text-[var(--text-muted)] text-center sm:text-right max-w-md">
          Demo portfolio project. Not affiliated with Karmen. AI-generated schedules are for demonstration purposes only.
        </p>
      </div>
    </footer>
  );
}
