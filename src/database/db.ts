import {
  Borrower,
  DashboardKPIs,
  Installment,
  Loan,
  PaymentMethod,
  PaymentRecord,
  SystemSettings
} from '../types';
import { DEFAULT_SETTINGS, enrichInstallmentWithCharges, generateSimulation, getDaysDifference } from '../utils/finance';
import { getTodayString } from '../utils/formatters';

const STORAGE_KEY_SETTINGS = 'df_settings_v1';
const STORAGE_KEY_BORROWERS = 'df_borrowers_v1';
const STORAGE_KEY_LOANS = 'df_loans_v1';
const STORAGE_KEY_INSTALLMENTS = 'df_installments_v1';
const STORAGE_KEY_PAYMENTS = 'df_payments_v1';
const STORAGE_KEY_MIGRATION = 'df_real_data_imported_v1';

// Dados reais extraídos do aplicativo desktop do usuário
const INITIAL_SETTINGS: SystemSettings = {
  default_interest_rate: 6.8,
  late_penalty_pct: 2,
  late_mora_monthly_pct: 1,
  theme: 'dark',
  alert_days_before: 7,
};

const INITIAL_BORROWERS: Borrower[] = [
  {
    id: 1788021201398,
    name: 'Danubia',
    created_at: '2026-08-29T16:33:20.403Z',
  },
];

const INITIAL_LOANS: Loan[] = [
  {
    id: 1788021200920,
    borrower_id: 1788021201398,
    principal_amount: 5000,
    monthly_interest_rate: 6.8,
    installments_count: 3,
    start_date: '2026-08-29',
    first_due_date: '2026-09-29',
    status: 'active',
    created_at: '2026-08-29T16:33:20.403Z',
  },
  {
    id: 1788048975012,
    borrower_id: 1788021201398,
    principal_amount: 2500,
    monthly_interest_rate: 7,
    installments_count: 2,
    start_date: '2026-08-29',
    first_due_date: '2026-09-11',
    status: 'active',
    created_at: '2026-08-30T00:16:14.059Z',
  },
  {
    id: 1788049248495,
    borrower_id: 1788021201398,
    principal_amount: 2000,
    monthly_interest_rate: 10.3,
    installments_count: 1,
    start_date: '2026-08-29',
    first_due_date: '2026-09-07',
    status: 'active',
    created_at: '2026-08-30T00:20:47.889Z',
  },
  {
    id: 1788049324775,
    borrower_id: 1788021201398,
    principal_amount: 2500,
    monthly_interest_rate: 6.9,
    installments_count: 2,
    start_date: '2026-08-29',
    first_due_date: '2026-08-11',
    status: 'active',
    created_at: '2026-08-30T00:22:04.345Z',
  },
  {
    id: 1788049435995,
    borrower_id: 1788021201398,
    principal_amount: 3000,
    monthly_interest_rate: 6.9,
    installments_count: 2,
    start_date: '2026-08-29',
    first_due_date: '2026-08-08',
    status: 'active',
    created_at: '2026-08-30T00:23:55.788Z',
  },
];

const INITIAL_INSTALLMENTS: Installment[] = [
  {
    id: 178802120092001,
    loan_id: 1788021200920,
    installment_number: 1,
    due_date: '2026-09-29',
    original_amount: 1898.3,
    principal_part: 1558.3,
    interest_part: 340,
    status: 'pending',
  },
  {
    id: 178802120092002,
    loan_id: 1788021200920,
    installment_number: 2,
    due_date: '2026-10-29',
    original_amount: 1898.3,
    principal_part: 1664.26,
    interest_part: 234.04,
    status: 'pending',
  },
  {
    id: 178802120092003,
    loan_id: 1788021200920,
    installment_number: 3,
    due_date: '2026-11-29',
    original_amount: 1898.31,
    principal_part: 1777.44,
    interest_part: 120.87,
    status: 'pending',
  },
  {
    id: 178804897501201,
    loan_id: 1788048975012,
    installment_number: 1,
    due_date: '2026-09-11',
    original_amount: 1382.73,
    principal_part: 1207.73,
    interest_part: 175,
    status: 'pending',
  },
  {
    id: 178804897501202,
    loan_id: 1788048975012,
    installment_number: 2,
    due_date: '2026-10-11',
    original_amount: 1382.73,
    principal_part: 1292.27,
    interest_part: 90.46,
    status: 'pending',
  },
  {
    id: 178804924849501,
    loan_id: 1788049248495,
    installment_number: 1,
    due_date: '2026-09-07',
    original_amount: 2206,
    principal_part: 2000,
    interest_part: 206,
    status: 'pending',
  },
  {
    id: 178804932477501,
    loan_id: 1788049324775,
    installment_number: 1,
    due_date: '2026-08-11',
    original_amount: 1380.81,
    principal_part: 1208.31,
    interest_part: 172.5,
    status: 'paid',
    paid_amount: 1380.81,
    paid_date: '2026-08-11',
    payment_method: 'PIX',
  },
  {
    id: 178804932477502,
    loan_id: 1788049324775,
    installment_number: 2,
    due_date: '2026-09-11',
    original_amount: 1380.82,
    principal_part: 1291.69,
    interest_part: 89.13,
    status: 'pending',
  },
  {
    id: 178804943599501,
    loan_id: 1788049435995,
    installment_number: 1,
    due_date: '2026-08-08',
    original_amount: 1656.98,
    principal_part: 1449.98,
    interest_part: 207,
    status: 'paid',
    paid_amount: 1656.98,
    paid_date: '2026-08-08',
    payment_method: 'PIX',
  },
  {
    id: 178804943599502,
    loan_id: 1788049435995,
    installment_number: 2,
    due_date: '2026-09-08',
    original_amount: 1656.97,
    principal_part: 1550.02,
    interest_part: 106.95,
    status: 'pending',
  },
];

const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 1788049338687,
    installment_id: 178804932477501,
    loan_id: 1788049324775,
    borrower_name: 'Danubia',
    installment_number: 1,
    total_installments: 2,
    due_date: '2026-08-11',
    paid_date: '2026-08-11',
    original_amount: 1380.81,
    paid_amount: 1380.81,
    principal_recovered: 1208.31,
    interest_realized: 172.5,
    charges_paid: 0,
    payment_method: 'PIX',
  },
  {
    id: 1788049443277,
    installment_id: 178804943599501,
    loan_id: 1788049435995,
    borrower_name: 'Danubia',
    installment_number: 1,
    total_installments: 2,
    due_date: '2026-08-08',
    paid_date: '2026-08-08',
    original_amount: 1656.98,
    paid_amount: 1656.98,
    principal_recovered: 1449.98,
    interest_realized: 207,
    charges_paid: 0,
    payment_method: 'PIX',
  },
];

class DatabaseService {
  private settings: SystemSettings = { ...INITIAL_SETTINGS };
  private borrowers: Borrower[] = [];
  private loans: Loan[] = [];
  private installments: Installment[] = [];
  private payments: PaymentRecord[] = [];
  private isInitialized = false;

  public async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load Settings
      const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (savedSettings) {
        this.settings = { ...INITIAL_SETTINGS, ...JSON.parse(savedSettings) };
      } else {
        this.saveSettings(this.settings);
      }

      // Load Borrowers
      const savedBorrowers = localStorage.getItem(STORAGE_KEY_BORROWERS);
      if (savedBorrowers) {
        this.borrowers = JSON.parse(savedBorrowers);
      }

      // Load Loans
      const savedLoans = localStorage.getItem(STORAGE_KEY_LOANS);
      if (savedLoans) {
        this.loans = JSON.parse(savedLoans);
      }

      // Load Installments
      const savedInstallments = localStorage.getItem(STORAGE_KEY_INSTALLMENTS);
      if (savedInstallments) {
        this.installments = JSON.parse(savedInstallments);
      }

      // Load Payments
      const savedPayments = localStorage.getItem(STORAGE_KEY_PAYMENTS);
      if (savedPayments) {
        this.payments = JSON.parse(savedPayments);
      }

      // Verifica se precisa migrar para os dados reais do usuário (substitui os de teste antigos)
      const migrationDone = localStorage.getItem(STORAGE_KEY_MIGRATION);
      const hasOldDemoData = this.borrowers.some(
        (b) => b.name.includes('Carlos Eduardo') || b.name.includes('Mariana Oliveira')
      );

      if (!migrationDone || hasOldDemoData || (this.borrowers.length === 0 && this.loans.length === 0)) {
        this.loadRealUserData();
        localStorage.setItem(STORAGE_KEY_MIGRATION, 'true');
      }

      this.isInitialized = true;
    } catch (err) {
      console.error('Error initializing database storage:', err);
    }
  }

  private loadRealUserData(): void {
    this.settings = { ...INITIAL_SETTINGS };
    this.borrowers = [...INITIAL_BORROWERS];
    this.loans = [...INITIAL_LOANS];
    this.installments = [...INITIAL_INSTALLMENTS];
    this.payments = [...INITIAL_PAYMENTS];

    this.persist(STORAGE_KEY_SETTINGS, this.settings);
    this.persist(STORAGE_KEY_BORROWERS, this.borrowers);
    this.persist(STORAGE_KEY_LOANS, this.loans);
    this.persist(STORAGE_KEY_INSTALLMENTS, this.installments);
    this.persist(STORAGE_KEY_PAYMENTS, this.payments);
  }

  private persist(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.error(`Failed to persist ${key}:`, err);
    }
  }

  // --- SETTINGS ---
  public getSettings(): SystemSettings {
    return { ...this.settings };
  }

  public saveSettings(settings: SystemSettings): void {
    this.settings = { ...settings };
    this.persist(STORAGE_KEY_SETTINGS, this.settings);
  }

  // --- BORROWERS ---
  public getBorrowers(): Borrower[] {
    return [...this.borrowers].sort((a, b) => a.name.localeCompare(b.name));
  }

  public getBorrowerById(id: number): Borrower | undefined {
    return this.borrowers.find((b) => b.id === id);
  }

  public createBorrower(name: string, phone?: string, document?: string, notes?: string): Borrower {
    const newBorrower: Borrower = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      name: name.trim(),
      phone: phone?.trim(),
      document: document?.trim(),
      notes: notes?.trim(),
      created_at: new Date().toISOString(),
    };
    this.borrowers.push(newBorrower);
    this.persist(STORAGE_KEY_BORROWERS, this.borrowers);
    return newBorrower;
  }

  // --- LOANS ---
  public getLoans(): Loan[] {
    return this.loans.map((loan) => {
      const borrower = this.borrowers.find((b) => b.id === loan.borrower_id);
      const loanInstallments = this.getInstallmentsByLoan(loan.id);

      const totalWithInterest = loanInstallments.reduce((acc, inst) => acc + inst.original_amount, 0);
      const paidInstallments = loanInstallments.filter((inst) => inst.status === 'paid');
      const totalPaid = paidInstallments.reduce((acc, inst) => acc + (inst.paid_amount || inst.original_amount), 0);
      const remainingBalance = Math.max(0, Math.round((totalWithInterest - totalPaid) * 100) / 100);

      const pendingInstallments = loanInstallments
        .filter((inst) => inst.status !== 'paid')
        .sort((a, b) => a.due_date.localeCompare(b.due_date));

      const nextDueDate = pendingInstallments.length > 0 ? pendingInstallments[0].due_date : undefined;
      const hasOverdue = pendingInstallments.some((inst) => inst.status === 'overdue');

      // Auto update loan status if all paid
      let status: Loan['status'] = loan.status;
      if (paidInstallments.length === loanInstallments.length && loanInstallments.length > 0) {
        status = 'completed';
      }

      return {
        ...loan,
        borrower_name: borrower?.name || 'Cliente não identificado',
        borrower_phone: borrower?.phone,
        borrower_document: borrower?.document,
        total_with_interest: totalWithInterest,
        total_paid: totalPaid,
        remaining_balance: remainingBalance,
        paid_installments_count: paidInstallments.length,
        next_due_date: nextDueDate,
        has_overdue: hasOverdue,
        status,
      };
    }).sort((a, b) => {
      // Empréstimos quitados vão para o fim
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;

      // Ordena da data de vencimento mais próxima para a mais distante (esquerda para direita)
      if (a.next_due_date && b.next_due_date) {
        return a.next_due_date.localeCompare(b.next_due_date);
      }
      if (a.next_due_date && !b.next_due_date) return -1;
      if (!a.next_due_date && b.next_due_date) return 1;

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  public getLoanById(id: number): Loan | undefined {
    return this.getLoans().find((l) => l.id === id);
  }

  public createLoan(params: {
    borrower_name: string;
    borrower_phone?: string;
    borrower_document?: string;
    principal_amount: number;
    monthly_interest_rate: number;
    installments_count: number;
    start_date: string;
    first_due_date: string;
    notes?: string;
  }): { loan: Loan; installments: Installment[] } {
    let borrower = this.borrowers.find(
      (b) => b.name.toLowerCase() === params.borrower_name.trim().toLowerCase()
    );

    if (!borrower) {
      borrower = this.createBorrower(
        params.borrower_name,
        params.borrower_phone,
        params.borrower_document
      );
    } else if (params.borrower_phone || params.borrower_document) {
      if (params.borrower_phone) borrower.phone = params.borrower_phone;
      if (params.borrower_document) borrower.document = params.borrower_document;
      this.persist(STORAGE_KEY_BORROWERS, this.borrowers);
    }

    const loanId = Date.now() + Math.floor(Math.random() * 1000);
    const newLoan: Loan = {
      id: loanId,
      borrower_id: borrower.id,
      principal_amount: params.principal_amount,
      monthly_interest_rate: params.monthly_interest_rate,
      installments_count: params.installments_count,
      start_date: params.start_date,
      first_due_date: params.first_due_date,
      status: 'active',
      notes: params.notes,
      created_at: new Date().toISOString(),
    };

    // Generate schedule
    const simulation = generateSimulation(
      params.principal_amount,
      params.monthly_interest_rate,
      params.installments_count,
      params.first_due_date
    );

    const generatedInstallments: Installment[] = simulation.schedule.map((item, index) => ({
      id: loanId * 100 + (index + 1),
      loan_id: loanId,
      installment_number: item.installment_number,
      due_date: item.due_date,
      original_amount: item.installment_value,
      principal_part: item.principal_part,
      interest_part: item.interest_part,
      status: 'pending',
    }));

    this.loans.push(newLoan);
    this.installments.push(...generatedInstallments);

    this.persist(STORAGE_KEY_LOANS, this.loans);
    this.persist(STORAGE_KEY_INSTALLMENTS, this.installments);

    return {
      loan: newLoan,
      installments: generatedInstallments,
    };
  }

  public deleteLoan(loanId: number): void {
    this.loans = this.loans.filter((l) => l.id !== loanId);
    this.installments = this.installments.filter((i) => i.loan_id !== loanId);
    this.payments = this.payments.filter((p) => p.loan_id !== loanId);

    this.persist(STORAGE_KEY_LOANS, this.loans);
    this.persist(STORAGE_KEY_INSTALLMENTS, this.installments);
    this.persist(STORAGE_KEY_PAYMENTS, this.payments);
  }

  // --- INSTALLMENTS & CHARGES ---
  public getInstallmentsByLoan(loanId: number): Installment[] {
    const loan = this.loans.find((l) => l.id === loanId);
    const rate = loan?.monthly_interest_rate || this.settings.default_interest_rate;
    const borrower = loan ? this.borrowers.find((b) => b.id === loan.borrower_id) : undefined;

    return this.installments
      .filter((inst) => inst.loan_id === loanId)
      .map((inst) => {
        const enriched = enrichInstallmentWithCharges(inst, rate, this.settings);
        return {
          ...enriched,
          borrower_name: borrower?.name,
          borrower_phone: borrower?.phone,
        };
      })
      .sort((a, b) => a.installment_number - b.installment_number);
  }

  public getAllInstallments(): Installment[] {
    return this.installments.map((inst) => {
      const loan = this.loans.find((l) => l.id === inst.loan_id);
      const borrower = loan ? this.borrowers.find((b) => b.id === loan.borrower_id) : undefined;
      const rate = loan?.monthly_interest_rate || this.settings.default_interest_rate;
      const enriched = enrichInstallmentWithCharges(inst, rate, this.settings);

      return {
        ...enriched,
        borrower_name: borrower?.name,
        borrower_phone: borrower?.phone,
      };
    });
  }

  // --- PAYMENTS & RECEIPT ---
  public receiveInstallmentPayment(params: {
    installment_id: number;
    paid_amount: number;
    paid_date: string;
    payment_method: PaymentMethod;
  }): { installment: Installment; paymentRecord: PaymentRecord } {
    const instIndex = this.installments.findIndex((i) => i.id === params.installment_id);
    if (instIndex === -1) {
      throw new Error('Parcela não encontrada');
    }

    const inst = this.installments[instIndex];
    const loan = this.loans.find((l) => l.id === inst.loan_id);
    const borrower = loan ? this.borrowers.find((b) => b.id === loan.borrower_id) : undefined;

    // Calculate profit vs principal split
    const principalRecovered = Math.min(params.paid_amount, inst.principal_part);
    const remainder = Math.max(0, params.paid_amount - principalRecovered);
    const interestRealized = Math.min(remainder, inst.interest_part);
    const chargesPaid = Math.max(0, remainder - interestRealized);

    // Update installment
    const updatedInst: Installment = {
      ...inst,
      status: 'paid',
      paid_amount: params.paid_amount,
      paid_date: params.paid_date,
      payment_method: params.payment_method,
    };
    this.installments[instIndex] = updatedInst;

    // Create payment history record
    const paymentRecord: PaymentRecord = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      installment_id: inst.id,
      loan_id: inst.loan_id,
      borrower_name: borrower?.name || 'Cliente',
      installment_number: inst.installment_number,
      total_installments: loan?.installments_count || 1,
      due_date: inst.due_date,
      paid_date: params.paid_date,
      original_amount: inst.original_amount,
      paid_amount: params.paid_amount,
      principal_recovered: principalRecovered,
      interest_realized: interestRealized,
      charges_paid: chargesPaid,
      payment_method: params.payment_method,
    };
    this.payments.push(paymentRecord);

    // Check if loan is now fully completed
    const loanAllInstallments = this.installments.filter((i) => i.loan_id === inst.loan_id);
    if (loanAllInstallments.every((i) => i.status === 'paid')) {
      const loanIdx = this.loans.findIndex((l) => l.id === inst.loan_id);
      if (loanIdx !== -1) {
        this.loans[loanIdx].status = 'completed';
      }
    }

    this.persist(STORAGE_KEY_INSTALLMENTS, this.installments);
    this.persist(STORAGE_KEY_PAYMENTS, this.payments);
    this.persist(STORAGE_KEY_LOANS, this.loans);

    return {
      installment: updatedInst,
      paymentRecord,
    };
  }

  public getPaymentHistory(): PaymentRecord[] {
    return [...this.payments].sort(
      (a, b) => new Date(b.paid_date).getTime() - new Date(a.paid_date).getTime()
    );
  }

  // --- KPIS & METRICS ---
  public getDashboardKPIs(): DashboardKPIs {
    const allEnrichedInstallments = this.getAllInstallments();
    const activeLoans = this.getLoans().filter((l) => l.status === 'active');
    const todayStr = getTodayString();

    let totalLentActive = 0;
    let totalExpectedReturn = 0;
    let totalOverdueWithCharges = 0;
    let countOverdueInstallments = 0;
    let countTodayInstallments = 0;
    let countUpcomingInstallments = 0;

    for (const loan of activeLoans) {
      totalLentActive += loan.principal_amount;
    }

    for (const inst of allEnrichedInstallments) {
      if (inst.status !== 'paid') {
        totalExpectedReturn += inst.original_amount;

        if (inst.due_date === todayStr) {
          countTodayInstallments++;
        } else if (inst.status === 'overdue' || (inst.days_overdue && inst.days_overdue > 0)) {
          countOverdueInstallments++;
          totalOverdueWithCharges += inst.current_total_due || inst.original_amount;
        } else {
          const daysDiff = -getDaysDifference(todayStr, inst.due_date);
          if (daysDiff <= this.settings.alert_days_before && daysDiff > 0) {
            countUpcomingInstallments++;
          }
        }
      }
    }

    let totalAlreadyReceived = 0;
    let totalProfitRealized = 0;
    for (const pay of this.payments) {
      totalAlreadyReceived += pay.paid_amount;
      totalProfitRealized += (pay.interest_realized + pay.charges_paid);
    }

    return {
      total_lent_active: Math.round(totalLentActive * 100) / 100,
      total_expected_return: Math.round(totalExpectedReturn * 100) / 100,
      total_already_received: Math.round(totalAlreadyReceived * 100) / 100,
      total_profit_realized: Math.round(totalProfitRealized * 100) / 100,
      total_overdue_with_charges: Math.round(totalOverdueWithCharges * 100) / 100,
      count_active_loans: activeLoans.length,
      count_overdue_installments: countOverdueInstallments,
      count_today_installments: countTodayInstallments,
      count_upcoming_installments: countUpcomingInstallments,
    };
  }

  // --- BACKUP & RESTORE ---
  public exportBackupJson(): string {
    const backupData = {
      app: 'Dashboard financeiro - Empréstimos Nubank',
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      settings: this.settings,
      borrowers: this.borrowers,
      loans: this.loans,
      installments: this.installments,
      payments: this.payments,
    };
    return JSON.stringify(backupData, null, 2);
  }

  public importBackupJson(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.borrowers && data.loans && data.installments) {
        this.settings = data.settings || { ...DEFAULT_SETTINGS };
        this.borrowers = data.borrowers || [];
        this.loans = data.loans || [];
        this.installments = data.installments || [];
        this.payments = data.payments || [];

        this.persist(STORAGE_KEY_SETTINGS, this.settings);
        this.persist(STORAGE_KEY_BORROWERS, this.borrowers);
        this.persist(STORAGE_KEY_LOANS, this.loans);
        this.persist(STORAGE_KEY_INSTALLMENTS, this.installments);
        this.persist(STORAGE_KEY_PAYMENTS, this.payments);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Falha ao restaurar backup:', err);
      return false;
    }
  }
}

export const db = new DatabaseService();
