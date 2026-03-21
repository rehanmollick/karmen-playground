interface LoadingAnimationProps {
  message?: string;
  rows?: number;
}

export default function LoadingAnimation({ message = 'Loading...', rows = 8 }: LoadingAnimationProps) {
  return (
    <div className="w-full">
      {message && (
        <p className="text-sm text-[var(--text-muted)] mb-4 animate-pulse">{message}</p>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-3 items-center">
            <div
              className="h-4 rounded bg-[var(--bg-tertiary)] shimmer"
              style={{ width: `${60 + Math.random() * 30}%`, animationDelay: `${i * 50}ms` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function GanttSkeleton() {
  return (
    <div className="w-full h-full flex flex-col gap-0">
      {/* header */}
      <div className="h-14 bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] shimmer" />
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="h-9 flex items-center px-4 border-b border-[var(--border-subtle)]">
          <div
            className="h-5 rounded bg-[var(--bg-tertiary)] shimmer"
            style={{
              width: `${20 + Math.random() * 50}%`,
              marginLeft: `${Math.random() * 30}%`,
              animationDelay: `${i * 60}ms`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
