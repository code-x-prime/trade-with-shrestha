'use client';

export default function SectionContainer({ title, children, className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {title && (
        <h2 className="text-2xl font-bold tracking-tight dark:text-white">{title}</h2>
      )}
      {children}
    </div>
  );
}

