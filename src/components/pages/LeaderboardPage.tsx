import { FC } from "react";
import { Trophy } from "lucide-react";

interface LeaderEntry {
  rank: number;
  name: string;
  initial: string;
  color: string;
  score: number;
}

const leaders: LeaderEntry[] = [
  { rank: 1, name: "Champion", initial: "C", color: "bg-yellow-500", score: 15420 },
  { rank: 2, name: "Winner", initial: "W", color: "bg-gray-400", score: 12350 },
  { rank: 3, name: "Pro Player", initial: "P", color: "bg-amber-600", score: 9870 },
  { rank: 4, name: "GiftMaster", initial: "G", color: "bg-blue-500", score: 8540 },
  { rank: 5, name: "StarHunter", initial: "S", color: "bg-green-500", score: 7230 },
  { rank: 6, name: "LuckyOne", initial: "L", color: "bg-purple-500", score: 6120 },
  { rank: 7, name: "Collector", initial: "C", color: "bg-pink-500", score: 5010 },
  { rank: 8, name: "Beginner", initial: "B", color: "bg-teal-500", score: 3890 },
];

const getRankIcon = (rank: number) => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return rank.toString();
};

export const LeaderboardPage: FC = () => {
  return (
    <div className="flex-1 overflow-auto pb-20">
      {/* Header */}
      <div className="flex flex-col items-center pt-6 pb-4">
        <Trophy size={48} className="text-star-gold mb-2" />
        <h2 className="text-xl font-semibold text-foreground">Таблица лидеров</h2>
        <p className="text-sm text-muted-foreground">Топ игроков за неделю</p>
      </div>

      {/* Leaders List */}
      <div className="px-4">
        <div className="section-card divide-y divide-border">
          {leaders.map((leader) => (
            <div key={leader.rank} className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 text-center font-semibold">
                {leader.rank <= 3 ? (
                  <span className="text-xl">{getRankIcon(leader.rank)}</span>
                ) : (
                  <span className="text-muted-foreground">{leader.rank}</span>
                )}
              </div>
              <div className={`w-10 h-10 rounded-full ${leader.color} flex items-center justify-center`}>
                <span className="text-white font-semibold">{leader.initial}</span>
              </div>
              <div className="flex-1">
                <span className="text-foreground font-medium">{leader.name}</span>
              </div>
              <div className="text-star-gold font-semibold">
                ⭐ {leader.score.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
