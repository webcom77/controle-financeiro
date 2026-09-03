/**
 * Formats a number to Brazilian Real (R$ 1.250,00)
 */
export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats a date string (YYYY-MM-DD) to Brazilian format (DD/MM/YYYY)
 */
export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR').format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Returns today's date formatted as YYYY-MM-DD
 */
export function getTodayString(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Adds months to a date string and returns YYYY-MM-DD
 */
export function addMonthsToDateString(dateStr: string, monthsToAdd: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const target = new Date(year, month - 1 + monthsToAdd, day);
  const yyyy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, '0');
  const dd = String(target.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Calculates human readable due badge info
 */
export function getDueStatusInfo(dueDateStr: string, isPaid: boolean): {
  type: 'paid' | 'overdue' | 'today' | 'upcoming' | 'normal';
  label: string;
  badgeClass: string;
  daysDiff: number;
} {
  if (isPaid) {
    return {
      type: 'paid',
      label: 'Pago',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      daysDiff: 0,
    };
  }

  const [dy, dm, dd] = dueDateStr.split('-').map(Number);
  const dueDate = new Date(dy, dm - 1, dd, 0, 0, 0);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      type: 'overdue',
      label: `Atrasada (${overdueDays}d)`,
      badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-semibold animate-pulse',
      daysDiff: diffDays,
    };
  }

  if (diffDays === 0) {
    return {
      type: 'today',
      label: 'Vence Hoje',
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold',
      daysDiff: 0,
    };
  }

  if (diffDays <= 7) {
    return {
      type: 'upcoming',
      label: `Vence em ${diffDays}d`,
      badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      daysDiff: diffDays,
    };
  }

  return {
    type: 'normal',
    label: 'Em Dia',
    badgeClass: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
    daysDiff: diffDays,
  };
}
