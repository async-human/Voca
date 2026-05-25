export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="studio-bg min-h-screen">
      {/* Warm ambient glow radiating from top-center */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[65vh]"
        style={{
          background:
            'radial-gradient(ellipse 85% 55% at 50% -8%, rgba(191,59,42,0.08) 0%, transparent 70%)',
        }}
      />
      {children}
    </div>
  );
}
