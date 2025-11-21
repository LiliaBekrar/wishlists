// 📄 src/components/Profile/ProfileStats.tsx
// 🧠 Rôle : Stats du profil (nombre de listes)

interface StatItem {
  value: number;
  label: string;
}

interface ProfileStatsProps {
  stats: StatItem[];
  animationDelay?: string;
}

export default function ProfileStats({ stats, animationDelay = '0.3s' }: ProfileStatsProps) {
  if (stats.length === 0) return null;

  return (
    <div
      className="flex items-center justify-center gap-6 mb-6 animate-fade-in"
      style={{ animationDelay }}
    >
      {stats.map((stat, index) => (
        <div key={index} className="flex items-center gap-6">
          {index > 0 && <div className="w-px h-10 bg-white/40" />}
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold drop-shadow-2xl">
              {stat.value}
            </div>
            <div className="text-xs sm:text-sm text-white/90 font-medium">
              {stat.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
