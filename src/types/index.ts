export type LoanStatus = 'active' | 'completed' | 'canceled';
export type InstallmentStatus = 'pending' | 'paid' | 'overdue';
export type PaymentMethod = 'PIX' | 'Dinheiro' | 'Transferência' | 'Cartão' | 'Outro';

export interface SystemSettings {
  id?: number;
  default_interest_rate: number; // e.g. 5.5% ao mês
  late_penalty_pct: number;      // e.g. 2.0% fixa
  late_mora_monthly_pct: number; // e.g. 1.0% ao mês
  theme: 'dark' | 'light';
  alert_days_before: number;     // e.g. 7 dias de antecedência para aviso
}

export interface Borrower {
  id: number;
  name: string;
  phone?: string;
  document?: string;
  notes?: string;
  created_at: string;
}

export interface Loan {
  id: number;
  borrower_id: number;
  borrower_name?: string;
  borrower_phone?: string;
  borrower_document?: string;
  principal_amount: number;
  monthly_interest_rate: number; // % ao mês
  installments_count: number;
  start_date: string;            // YYYY-MM-DD
  first_due_date: string;        // YYYY-MM-DD
  status: LoanStatus;
  notes?: string;
  created_at: string;
  
  // Computed fields
  total_with_interest?: number;
  total_paid?: number;
  remaining_balance?: number;
  paid_installments_count?: number;
  next_due_date?: string;
  has_overdue?: boolean;
}

export interface Installment {
  id: number;
  loan_id: number;
  borrower_name?: string;
  borrower_phone?: string;
  installment_number: number;
  due_date: string;              // YYYY-MM-DD
  original_amount: number;
  principal_part: number;
  interest_part: number;
  paid_amount?: number;
  paid_date?: string;            // YYYY-MM-DD
  payment_method?: PaymentMethod;
  status: InstallmentStatus;

  // Real-time calculation fields for overdue/today
  days_overdue?: number;
  late_penalty_amount?: number;      // 2% Multa
  late_mora_amount?: number;         // 1% a.m. pro-rata
  late_regular_interest?: number;    // taxa contratada pro-rata
  total_charges?: number;            // Soma multas e juros
  current_total_due?: number;        // original_amount + total_charges
}

export interface PaymentRecord {
  id: number;
  installment_id: number;
  loan_id: number;
  borrower_name: string;
  installment_number: number;
  total_installments: number;
  due_date: string;
  paid_date: string;
  original_amount: number;
  paid_amount: number;
  principal_recovered: number;
  interest_realized: number;
  charges_paid: number;
  payment_method: PaymentMethod;
}

export interface SimulationResult {
  principal_amount: number;
  monthly_interest_rate: number;
  installments_count: number;
  first_due_date: string;
  installment_value: number;
  total_to_receive: number;
  total_profit: number;
  schedule: Array<{
    installment_number: number;
    due_date: string;
    installment_value: number;
    principal_part: number;
    interest_part: number;
    remaining_principal: number;
  }>;
}

export interface DashboardKPIs {
  total_lent_active: number;
  total_expected_return: number;
  total_already_received: number;
  total_profit_realized: number;
  total_overdue_with_charges: number;
  count_active_loans: number;
  count_overdue_installments: number;
  count_today_installments: number;
  count_upcoming_installments: number;
}
