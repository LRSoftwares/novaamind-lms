import { BookOpen } from 'lucide-react';

export default function BookCover({ title, author, palette, imageUrl, className = '' }) {
  if (imageUrl) {
    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`}>
        <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
      </div>
    );
  }

  const [start, end] = [palette?.[0] || '#0058be', palette?.[1] || '#2170e4'];
  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center text-center p-4 overflow-hidden ${className}`}
      style={{ background: `linear-gradient(155deg, ${start} 0%, ${end} 100%)` }}
    >
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
      <BookOpen className="w-7 h-7 text-white/70 mb-3 relative" />
      <p className="relative font-semibold text-white leading-snug line-clamp-3 text-sm">{title}</p>
      <p className="relative text-[11px] text-white/70 mt-1.5 line-clamp-1">{author}</p>
    </div>
  );
}
