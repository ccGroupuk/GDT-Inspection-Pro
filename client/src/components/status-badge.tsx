import { Badge } from "@/components/ui/badge";
import { PIPELINE_STAGES } from "@shared/schema";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const stage = PIPELINE_STAGES.find(s => s.value === status);
  
  if (!stage) {
    return (
      <Badge variant="outline" className={className}>
        {status}
      </Badge>
    );
  }

  const colorClasses: Record<string, string> = {
    "bg-blue-500": "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    "bg-sky-500": "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
    "bg-cyan-500": "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20",
    "bg-teal-500": "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",
    "bg-emerald-500": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    "bg-yellow-500": "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
    "bg-green-500": "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    "bg-green-600": "bg-green-600/10 text-green-700 dark:text-green-400 border-green-600/20",
    "bg-lime-500": "bg-lime-500/10 text-lime-700 dark:text-lime-400 border-lime-500/20",
    "bg-indigo-500": "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
    "bg-purple-500": "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
    "bg-violet-500": "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
    "bg-pink-500": "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20",
    "bg-rose-500": "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
    "bg-gray-500": "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
    "bg-red-500": "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  };

  return (
    <Badge 
      variant="outline" 
      className={`${colorClasses[stage.color] || ""} ${className || ""}`}
    >
      {stage.label}
    </Badge>
  );
}
