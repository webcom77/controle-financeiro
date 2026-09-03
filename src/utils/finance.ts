import { Installment, SimulationResult, SystemSettings } from '../types';

/**
 * Default Nubank-based financial settings
 */
export const DEFAULT_SETTINGS: SystemSettings = {
  default_interest_rate: 6.8, // 6.8% ao mês padrão
  late_penalty_pct: 2.0,       // 2.0% multa fixa sobre a parcela
  late_mora_monthly_pct: 1.0,  // 1.0% ao mês pro-rata die (0.0333% ao dia)
  theme: 'dark',
  alert_days_before: 7,        // avisar 7 dias antes do vencimento
};

/**
 * Calculates fixed installment amount (PMT) using Tabela Price (Compound Interest)
 * PMT = PV * [i * (1 + i)^n] / [(1 + i)^n - 1]
 * If interest rate is 0, simply returns PV / n.
 */
export function calculatePriceInstallment(
  principal: number,
  monthlyRatePct: number,
  installmentsCount: number
): number {
  if (installmentsCount <= 0) return 0;
  if (monthlyRatePct <= 0) {
    return Math.round((principal / installmentsCount) * 100) / 100;
  }

  const i = monthlyRatePct / 100;
  const n = installmentsCount;
  const factor = Math.pow(1 + i, n);
  const pmt = (principal * (i * factor)) / (factor - 1);
  return Math.round(pmt * 100) / 100;
}

/**
 * Generates full simulation and amortization schedule
 */
export function generateSimulation(
  principal: number,
  monthlyRatePct: number,
  installmentsCount: number,
  firstDueDateStr: string
): SimulationResult {
  const pmt = calculatePriceInstallment(principal, monthlyRatePct, installmentsCount);
  const i = monthlyRatePct / 100;

  const schedule: SimulationResult['schedule'] = [];
  let remainingPrincipal = principal;
  let totalToReceive = 0;

  // Base date parsing
  const [year, month, day] = firstDueDateStr.split('-').map(Number);

  for (let step = 1; step <= installmentsCount; step++) {
    // Interest of this period based on remaining principal
    const interestPart = Math.round(remainingPrincipal * i * 100) / 100;
    
    // Principal part is the installment minus the interest
    let principalPart = Math.round((pmt - interestPart) * 100) / 100;

    // Adjust for the last installment to avoid 1-cent rounding drift
    if (step === installmentsCount || principalPart > remainingPrincipal) {
      principalPart = remainingPrincipal;
    }

    const currentInstallmentValue = Math.round((principalPart + interestPart) * 100) / 100;
    remainingPrincipal = Math.max(0, Math.round((remainingPrincipal - principalPart) * 100) / 100);
    totalToReceive += currentInstallmentValue;

    // Calculate due date for installment (adding months)
    const dueDate = new Date(year, month - 1 + (step - 1), day);
    const yyyy = dueDate.getFullYear();
    const mm = String(dueDate.getMonth() + 1).padStart(2, '0');
    const dd = String(dueDate.getDate()).padStart(2, '0');
    const formattedDueDate = `${yyyy}-${mm}-${dd}`;

    schedule.push({
      installment_number: step,
      due_date: formattedDueDate,
      installment_value: currentInstallmentValue,
      principal_part: principalPart,
      interest_part: interestPart,
      remaining_principal: remainingPrincipal,
    });
  }

  const roundedTotal = Math.round(totalToReceive * 100) / 100;
  const totalProfit = Math.round((roundedTotal - principal) * 100) / 100;

  return {
    principal_amount: principal,
    monthly_interest_rate: monthlyRatePct,
    installments_count: installmentsCount,
    first_due_date: firstDueDateStr,
    installment_value: pmt,
    total_to_receive: roundedTotal,
    total_profit: totalProfit,
    schedule,
  };
}

/**
 * Calculates days of difference between two dates (targetDate - dueDate)
 * If targetDate <= dueDate, returns 0.
 */
export function getDaysDifference(dueDateStr: string, targetDateStr?: string): number {
  const [dy, dm, dd] = dueDateStr.split('-').map(Number);
  const dueDate = new Date(dy, dm - 1, dd, 0, 0, 0);

  let targetDate: Date;
  if (targetDateStr) {
    const [ty, tm, td] = targetDateStr.split('-').map(Number);
    targetDate = new Date(ty, tm - 1, td, 0, 0, 0);
  } else {
    const now = new Date();
    targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  }

  const diffTime = targetDate.getTime() - dueDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Calculates late fees according to Nubank Contract:
 * 1. Multa por atraso: 2% fixa sobre a parcela
 * 2. Juros de Mora: 1% ao mês pro-rata die (1% / 30 dias por dia)
 * 3. Juros Remuneratórios: Taxa mensal contratada pro-rata die (taxa% / 30 dias por dia)
 */
export function calculateLateCharges(
  originalAmount: number,
  monthlyContractRatePct: number,
  daysOverdue: number,
  settings: SystemSettings = DEFAULT_SETTINGS
): {
  daysOverdue: number;
  latePenaltyAmount: number;
  lateMoraAmount: number;
  lateRegularInterest: number;
  totalCharges: number;
  currentTotalDue: number;
} {
  if (daysOverdue <= 0) {
    return {
      daysOverdue: 0,
      latePenaltyAmount: 0,
      lateMoraAmount: 0,
      lateRegularInterest: 0,
      totalCharges: 0,
      currentTotalDue: originalAmount,
    };
  }

  // 1. Multa moratória: 2% fixa sobre a parcela
  const latePenaltyAmount = Math.round(originalAmount * (settings.late_penalty_pct / 100) * 100) / 100;

  // 2. Juros de Mora: 1% ao mês pro-rata die (0.01 / 30 * dias)
  const dailyMoraRate = (settings.late_mora_monthly_pct / 100) / 30;
  const lateMoraAmount = Math.round(originalAmount * dailyMoraRate * daysOverdue * 100) / 100;

  // 3. Juros Remuneratórios diários do contrato (taxa% / 30 * dias)
  const dailyContractRate = (monthlyContractRatePct / 100) / 30;
  const lateRegularInterest = Math.round(originalAmount * dailyContractRate * daysOverdue * 100) / 100;

  const totalCharges = Math.round((latePenaltyAmount + lateMoraAmount + lateRegularInterest) * 100) / 100;
  const currentTotalDue = Math.round((originalAmount + totalCharges) * 100) / 100;

  return {
    daysOverdue,
    latePenaltyAmount,
    lateMoraAmount,
    lateRegularInterest,
    totalCharges,
    currentTotalDue,
  };
}

/**
 * Enriches an installment with real-time overdue/Nubank charges calculation
 */
export function enrichInstallmentWithCharges(
  installment: Installment,
  monthlyContractRatePct: number,
  settings: SystemSettings = DEFAULT_SETTINGS,
  targetDateStr?: string
): Installment {
  if (installment.status === 'paid') {
    return {
      ...installment,
      days_overdue: 0,
      late_penalty_amount: 0,
      late_mora_amount: 0,
      late_regular_interest: 0,
      total_charges: 0,
      current_total_due: installment.paid_amount || installment.original_amount,
    };
  }

  const daysOverdue = getDaysDifference(installment.due_date, targetDateStr);
  const charges = calculateLateCharges(installment.original_amount, monthlyContractRatePct, daysOverdue, settings);

  const status = daysOverdue > 0 ? 'overdue' : 'pending';

  return {
    ...installment,
    status,
    days_overdue: daysOverdue,
    late_penalty_amount: charges.latePenaltyAmount,
    late_mora_amount: charges.lateMoraAmount,
    late_regular_interest: charges.lateRegularInterest,
    total_charges: charges.totalCharges,
    current_total_due: charges.currentTotalDue,
  };
}
