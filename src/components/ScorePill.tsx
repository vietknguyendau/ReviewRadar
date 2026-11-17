export function ScorePill({ score }: { score: number }) {
  const cls = score >= 70 ? "bg-red-600 text-white" : score >= 50 ? "bg-orange-100 text-orange-800" : "bg-slate-100 text-slate-700";
  return <span className={`pill ${cls}`}>Score {score}</span>;
}
