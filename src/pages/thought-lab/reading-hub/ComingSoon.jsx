export default function ComingSoon({ title, icon: Icon }) {
  return (
    <div className="pt-8 pb-12 px-8 max-w-[1440px] mx-auto">
      <div className="flex flex-col items-center justify-center text-center py-24 border border-dashed border-[var(--rh-outline-variant)] rounded-[24px]">
        {Icon && <Icon className="w-10 h-10 text-[var(--rh-on-surface-variant)] mb-4" />}
        <h2 className="text-xl font-semibold text-[var(--rh-on-surface)]">{title}</h2>
        <p className="text-sm text-[var(--rh-on-surface-variant)] mt-1.5">This section is coming soon.</p>
      </div>
    </div>
  );
}
