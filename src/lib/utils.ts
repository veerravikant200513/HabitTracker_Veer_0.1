export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function getDayName(dayIndex: number): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayIndex] ?? '';
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

export function getWeekDates(weeksBack = 0): Date[] {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() - weeksBack * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });
}

export function getPast52Weeks(): { date: string; week: number; day: number }[] {
  const result = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    result.push({
      date: d.toISOString().split('T')[0] ?? '',
      week: Math.floor(i / 7),
      day: d.getDay(),
    });
  }
  return result;
}

export function calculateStreak(logDates: string[]): { current: number; longest: number } {
  if (logDates.length === 0) return { current: 0, longest: 0 };

  const sorted = [...new Set(logDates)].sort().reverse();
  const today = getTodayDate();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0] ?? '';

  let current = 0;
  let longest = 0;
  let streak = 0;

  const firstDate = sorted[0];
  if (firstDate !== today && firstDate !== yesterdayStr) {
    current = 0;
  } else {
    let checkDate = firstDate === today ? today : yesterdayStr;
    for (const date of sorted) {
      if (date === checkDate) {
        streak++;
        const prev = new Date(checkDate);
        prev.setDate(prev.getDate() - 1);
        checkDate = prev.toISOString().split('T')[0] ?? '';
      } else {
        break;
      }
    }
    current = streak;
  }

  // Calculate longest
  let tempStreak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]!);
    const curr = new Date(sorted[i]!);
    const diff = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      tempStreak++;
      longest = Math.max(longest, tempStreak);
    } else {
      tempStreak = 1;
    }
  }
  longest = Math.max(longest, current, 1);

  return { current, longest };
}

export function getProjectCompletion(milestones: { is_completed: boolean }[]): number {
  if (milestones.length === 0) return 0;
  const completed = milestones.filter(m => m.is_completed).length;
  return Math.round((completed / milestones.length) * 100);
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
