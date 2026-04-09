import { MasteryInfo, MasteryLevel } from '@/types';

const MASTERY_THRESHOLDS: Array<{
  level: MasteryLevel;
  label: string;
  emoji: string;
  minHours: number;
  maxHours: number | null;
  color: string;
  glowColor: string;
}> = [
  { level: 'bronze',   label: 'Bronze',   emoji: '🥉', minHours: 0,    maxHours: 25,   color: '#cd7f32', glowColor: 'rgba(205, 127, 50, 0.3)' },
  { level: 'silver',   label: 'Silver',   emoji: '🥈', minHours: 25,   maxHours: 100,  color: '#c0c0c0', glowColor: 'rgba(192, 192, 192, 0.3)' },
  { level: 'gold',     label: 'Gold',     emoji: '🥇', minHours: 100,  maxHours: 300,  color: '#ffd700', glowColor: 'rgba(255, 215, 0, 0.3)'   },
  { level: 'platinum', label: 'Platinum', emoji: '🏅', minHours: 300,  maxHours: 600,  color: '#e8e5ff', glowColor: 'rgba(232, 229, 255, 0.3)' },
  { level: 'diamond',  label: 'Diamond',  emoji: '💎', minHours: 600,  maxHours: 1000, color: '#85e4ff', glowColor: 'rgba(133, 228, 255, 0.3)' },
  { level: 'emerald',  label: 'Emerald',  emoji: '💚', minHours: 1000, maxHours: null, color: '#50c878', glowColor: 'rgba(80, 200, 120, 0.3)'  },
];

export function getMasteryInfo(totalMinutes: number): MasteryInfo {
  const totalHours = totalMinutes / 60;

  let currentIndex = 0;
  for (let i = 0; i < MASTERY_THRESHOLDS.length; i++) {
    if (totalHours >= MASTERY_THRESHOLDS[i].minHours) {
      currentIndex = i;
    }
  }

  const current = MASTERY_THRESHOLDS[currentIndex];
  const next = MASTERY_THRESHOLDS[currentIndex + 1];

  let progress = 100;
  let hoursToNext: number | undefined;

  if (next) {
    const hoursInRange = totalHours - current.minHours;
    const rangeSize = next.minHours - current.minHours;
    progress = Math.min(100, Math.max(0, (hoursInRange / rangeSize) * 100));
    hoursToNext = Math.ceil(next.minHours - totalHours);
  }

  return {
    ...current,
    nextLevel: next?.label,
    hoursToNext,
    progress,
    totalHours: Math.round(totalHours * 10) / 10,
  };
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function getMasteryThresholds() {
  return MASTERY_THRESHOLDS;
}
