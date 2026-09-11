import {
  Borrower,
  DashboardKPIs,
  Installment,
  Loan,
  PaymentMethod,
  PaymentRecord,
  SystemSettings,
} from '../types';
import {
  DEFAULT_SETTINGS,
  enrichInstallmentWithCharges,
  generateSimulation,
  getDaysDifference,
} from '../utils/finance';
import { getTodayString } from '../utils/formatters';
import {
  getSupabaseClient,
  isSupabaseConfigured,
  getSupabaseCredentials,
  testSupabaseConnection,
} from './supabaseClient';

const STORAGE_KEY_SETTINGS = 'df_settings_v1';
const STORAGE_KEY_BORROWERS = 'df_borrowers_v1';
const STORAGE_KEY_LOANS = 'df_loans_v1';
const STORAGE_KEY_INSTALLMENTS = 'df_installments_v1';
const STORAGE_KEY_PAYMENTS = 'df_payments_v1';
const STORAGE_KEY_MIGRATION = 'df_real_data_imported_v1';

// Dados reais extraídos do aplicativo desktop do usuário (para inicialização caso banco esteja vazio)
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
    original_amount: 1897.66,
    principal_part: 1557.66,
    interest_part: 340,
    status: 'pending',
  },
  {
    id: 178802120092002,
    loan_id: 1788021200920,
    installment_number: 2,
    due_date: '2026-10-29',
    original_amount: 1897.66,
    principal_part: 1663.58,
    interest_part: 234.08,
    status: 'pending',
  },
  {
    id: 178802120092003,
    loan_id: 1788021200920,
    installment_number: 3,
    due_date: '2026-11-29',
    original_amount: 1897.66,
    principal_part: 1778.76,
    interest_part: 118.9,
    status: 'pending',
  },
  {
    id: 178804897501201,
    loan_id: 1788048975012,
    installment_number: 1,
    due_date: '2026-09-11',
    original_amount: 1383.05,
    principal_part: 1208.05,
    interest_part: 175,
    status: 'pending',
  },
  {
    id: 178804897501202,
    loan_id: 1788048975012,
    installment_number: 2,
    due_date: '2026-10-11',
    original_amount: 1383.05,
    principal_part: 1291.95,
    interest_part: 91.1,
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

type DataChangeListener = () => void;

class DatabaseService {
  private settings: SystemSettings = { ...INITIAL_SETTINGS };
  private borrowers: Borrower[] = [];
  private loans: Loan[] = [];
  private installments: Installment[] = [];
  private payments: PaymentRecord[] = [];
  private isInitialized = false;
  private isCloudActive = false;
  private realtimeSubscribed = false;
  private isMutating = false;
  private realtimeDebounceTimer: any = null;
  private listeners: Set<DataChangeListener> = new Set();

  public onDataChanged(listener: DataChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('Erro no listener de dados:', e);
      }
    });
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;

    // 1. Carrega dados do LocalStorage primeiro para inicialização rápida e fallback offline
    this.loadFromLocalStorage();

    // 2. Tenta conectar e carregar do Supabase se configurado
    if (isSupabaseConfigured()) {
      await this.syncFromSupabase();
      this.setupRealtimeSubscription();
    }

    this.isInitialized = true;
  }

  public isCloudConnected(): boolean {
    return this.isCloudActive;
  }

  public getCloudStatus(): {
    configured: boolean;
    connected: boolean;
    source: 'env' | 'default' | 'custom' | 'none';
  } {
    const creds = getSupabaseCredentials();
    return {
      configured: Boolean(creds.url && creds.key),
      connected: this.isCloudActive,
      source: creds.source,
    };
  }

  private loadFromLocalStorage(): void {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (savedSettings) {
        this.settings = { ...INITIAL_SETTINGS, ...JSON.parse(savedSettings) };
      } else {
        this.persist(STORAGE_KEY_SETTINGS, this.settings);
      }

      const savedBorrowers = localStorage.getItem(STORAGE_KEY_BORROWERS);
      if (savedBorrowers) {
        this.borrowers = JSON.parse(savedBorrowers);
      }

      const savedLoans = localStorage.getItem(STORAGE_KEY_LOANS);
      if (savedLoans) {
        this.loans = JSON.parse(savedLoans);
      }

      const savedInstallments = localStorage.getItem(STORAGE_KEY_INSTALLMENTS);
      if (savedInstallments) {
        this.installments = JSON.parse(savedInstallments);
      }

      const savedPayments = localStorage.getItem(STORAGE_KEY_PAYMENTS);
      if (savedPayments) {
        this.payments = JSON.parse(savedPayments);
      }

      const migrationDone = localStorage.getItem(STORAGE_KEY_MIGRATION);
      if (!migrationDone || (this.borrowers.length === 0 && this.loans.length === 0)) {
        this.loadDefaultInitialData();
        localStorage.setItem(STORAGE_KEY_MIGRATION, 'true');
      }
    } catch (err) {
      console.error('Erro ao ler do LocalStorage:', err);
    }
  }

  private loadDefaultInitialData(): void {
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

  public async syncFromSupabase(): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) {
      this.isCloudActive = false;
      return false;
    }

    try {
      // 1. Settings
      const { data: settingsData, error: sErr } = await client
        .from('settings')
        .select('*')
        .order('id', { ascending: true })
        .limit(1);

      if (sErr) throw sErr;

      // 2. Borrowers
      const { data: borrowersData, error: bErr } = await client
        .from('borrowers')
        .select('*')
        .order('name', { ascending: true });

      if (bErr) throw bErr;

      // 3. Loans
      const { data: loansData, error: lErr } = await client
        .from('loans')
        .select('*')
        .order('created_at', { ascending: false });

      if (lErr) throw lErr;

      // 4. Installments
      const { data: installmentsData, error: iErr } = await client
        .from('installments')
        .select('*')
        .order('installment_number', { ascending: true });

      if (iErr) throw iErr;

      // 5. Payments
      const { data: paymentsData, error: pErr } = await client
        .from('payments')
        .select('*')
        .order('paid_date', { ascending: false });

      if (pErr) throw pErr;

      // Se o banco Supabase estiver vazio, mas temos dados locais, podemos auto-migrar!
      const isCloudEmpty = (!borrowersData || borrowersData.length === 0) && (!loansData || loansData.length === 0);
      if (isCloudEmpty && (this.borrowers.length > 0 || this.loans.length > 0)) {
        console.log('Banco Supabase vazio. Migrando dados locais para a nuvem...');
        await this.migrateLocalDataToSupabase();
        this.isCloudActive = true;
        return true;
      }

      if (settingsData && settingsData.length > 0) {
        const s = settingsData[0];
        this.settings = {
          default_interest_rate: Number(s.default_interest_rate) || 6.8,
          late_penalty_pct: Number(s.late_penalty_pct) || 2,
          late_mora_monthly_pct: Number(s.late_mora_monthly_pct) || 1,
          theme: s.theme || 'dark',
          alert_days_before: Number(s.alert_days_before) || 7,
        };
        this.persist(STORAGE_KEY_SETTINGS, this.settings);
      }

      if (borrowersData) {
        this.borrowers = borrowersData.map((b: any) => ({
          id: Number(b.id),
          name: b.name,
          phone: b.phone || undefined,
          document: b.document || undefined,
          notes: b.notes || undefined,
          created_at: b.created_at,
        }));
        this.persist(STORAGE_KEY_BORROWERS, this.borrowers);
      }

      if (loansData) {
        this.loans = loansData.map((l: any) => ({
          id: Number(l.id),
          borrower_id: Number(l.borrower_id),
          principal_amount: Number(l.principal_amount),
          monthly_interest_rate: Number(l.monthly_interest_rate),
          installments_count: Number(l.installments_count),
          start_date: l.start_date,
          first_due_date: l.first_due_date,
          status: l.status,
          notes: l.notes || undefined,
          created_at: l.created_at,
        }));
        this.persist(STORAGE_KEY_LOANS, this.loans);
      }

      if (installmentsData) {
        this.installments = installmentsData.map((i: any) => ({
          id: Number(i.id),
          loan_id: Number(i.loan_id),
          installment_number: Number(i.installment_number),
          due_date: i.due_date,
          original_amount: Number(i.original_amount),
          principal_part: Number(i.principal_part),
          interest_part: Number(i.interest_part),
          paid_amount: i.paid_amount != null ? Number(i.paid_amount) : undefined,
          paid_date: i.paid_date || undefined,
          payment_method: i.payment_method || undefined,
          status: i.status,
        }));
        this.persist(STORAGE_KEY_INSTALLMENTS, this.installments);
      }

      if (paymentsData) {
        this.payments = paymentsData.map((p: any) => ({
          id: Number(p.id),
          installment_id: Number(p.installment_id),
          loan_id: Number(p.loan_id),
          borrower_name: p.borrower_name,
          installment_number: Number(p.installment_number),
          total_installments: Number(p.total_installments),
          due_date: p.due_date,
          paid_date: p.paid_date,
          original_amount: Number(p.original_amount),
          paid_amount: Number(p.paid_amount),
          principal_recovered: Number(p.principal_recovered),
          interest_realized: Number(p.interest_realized),
          charges_paid: Number(p.charges_paid || 0),
          payment_method: p.payment_method,
        }));
        this.persist(STORAGE_KEY_PAYMENTS, this.payments);
      }

      this.isCloudActive = true;
      return true;
    } catch (err) {
      console.error('Erro sincronizando do Supabase:', err);
      this.isCloudActive = false;
      return false;
    }
  }

  private setupRealtimeSubscription(): void {
    if (this.realtimeSubscribed) return;
    const client = getSupabaseClient();
    if (!client) return;

    try {
      client
        .channel('public-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          () => {
            // Se estamos executando uma mutação local (salvando empréstimo ou pagamento), ignora eco do Realtime
            if (this.isMutating) return;

            // Debounce de 600ms para aguardar todas as tabelas relacionadas terminarem de commitar
            if (this.realtimeDebounceTimer) {
              clearTimeout(this.realtimeDebounceTimer);
            }
            this.realtimeDebounceTimer = setTimeout(async () => {
              if (this.isMutating) return;
              console.log('Notificação Realtime recebida do Supabase (debounced). Sincronizando...');
              await this.syncFromSupabase();
              this.notifyListeners();
            }, 600);
          }
        )
        .subscribe((status: any) => {
          if (status === 'SUBSCRIBED') {
            this.realtimeSubscribed = true;
          }
        });
    } catch (err) {
      console.warn('Falha ao registrar Realtime do Supabase:', err);
    }
  }

  public async migrateLocalDataToSupabase(): Promise<{ success: boolean; message: string }> {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, message: 'Supabase não está configurado.' };
    }

    try {
      // 1. Settings
      await client.from('settings').upsert({
        id: 1,
        default_interest_rate: this.settings.default_interest_rate,
        late_penalty_pct: this.settings.late_penalty_pct,
        late_mora_monthly_pct: this.settings.late_mora_monthly_pct,
        theme: this.settings.theme,
        alert_days_before: this.settings.alert_days_before,
        updated_at: new Date().toISOString(),
      });

      // 2. Borrowers
      if (this.borrowers.length > 0) {
        await client.from('borrowers').upsert(
          this.borrowers.map((b) => ({
            id: b.id,
            name: b.name,
            phone: b.phone || null,
            document: b.document || null,
            notes: b.notes || null,
            created_at: b.created_at,
          }))
        );
      }

      // 3. Loans
      if (this.loans.length > 0) {
        await client.from('loans').upsert(
          this.loans.map((l) => ({
            id: l.id,
            borrower_id: l.borrower_id,
            principal_amount: l.principal_amount,
            monthly_interest_rate: l.monthly_interest_rate,
            installments_count: l.installments_count,
            start_date: l.start_date,
            first_due_date: l.first_due_date,
            status: l.status,
            notes: l.notes || null,
            created_at: l.created_at,
          }))
        );
      }

      // 4. Installments
      if (this.installments.length > 0) {
        await client.from('installments').upsert(
          this.installments.map((i) => ({
            id: i.id,
            loan_id: i.loan_id,
            installment_number: i.installment_number,
            due_date: i.due_date,
            original_amount: i.original_amount,
            principal_part: i.principal_part,
            interest_part: i.interest_part,
            paid_amount: i.paid_amount || null,
            paid_date: i.paid_date || null,
            payment_method: i.payment_method || null,
            status: i.status,
          }))
        );
      }

      // 5. Payments
      if (this.payments.length > 0) {
        await client.from('payments').upsert(
          this.payments.map((p) => ({
            id: p.id,
            installment_id: p.installment_id,
            loan_id: p.loan_id,
            borrower_name: p.borrower_name,
            installment_number: p.installment_number,
            total_installments: p.total_installments,
            due_date: p.due_date,
            paid_date: p.paid_date,
            original_amount: p.original_amount,
            paid_amount: p.paid_amount,
            principal_recovered: p.principal_recovered,
            interest_realized: p.interest_realized,
            charges_paid: p.charges_paid || 0,
            payment_method: p.payment_method,
          }))
        );
      }

      this.isCloudActive = true;
      this.setupRealtimeSubscription();
      return { success: true, message: 'Dados migrados para o Supabase com sucesso!' };
    } catch (err: any) {
      console.error('Erro na migração para o Supabase:', err);
      return { success: false, message: err?.message || 'Falha ao migrar dados para a nuvem.' };
    }
  }

  private persist(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.error(`Falha ao salvar ${key} no localStorage:`, err);
    }
  }

  // --- SETTINGS ---
  public getSettings(): SystemSettings {
    return { ...this.settings };
  }

  public async saveSettings(settings: SystemSettings): Promise<void> {
    this.settings = { ...settings };
    this.persist(STORAGE_KEY_SETTINGS, this.settings);

    const client = getSupabaseClient();
    if (client && this.isCloudActive) {
      try {
        await client
          .from('settings')
          .upsert({
            id: 1,
            default_interest_rate: settings.default_interest_rate,
            late_penalty_pct: settings.late_penalty_pct,
            late_mora_monthly_pct: settings.late_mora_monthly_pct,
            theme: settings.theme,
            alert_days_before: settings.alert_days_before,
            updated_at: new Date().toISOString(),
          });
      } catch (err) {
        console.error('Erro ao salvar settings no Supabase:', err);
      }
    }
  }

  // --- BORROWERS ---
  public getBorrowers(): Borrower[] {
    return [...this.borrowers].sort((a, b) => a.name.localeCompare(b.name));
  }

  public getBorrowerById(id: number): Borrower | undefined {
    return this.borrowers.find((b) => Number(b.id) === Number(id));
  }

  public async createBorrower(name: string, phone?: string, document?: string, notes?: string): Promise<Borrower> {
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

    const client = getSupabaseClient();
    if (client && this.isCloudActive) {
      try {
        const { error } = await client
          .from('borrowers')
          .insert([
            {
              id: newBorrower.id,
              name: newBorrower.name,
              phone: newBorrower.phone || null,
              document: newBorrower.document || null,
              notes: newBorrower.notes || null,
              created_at: newBorrower.created_at,
            },
          ]);
        if (error) console.error('Erro ao salvar borrower no Supabase:', error);
      } catch (err) {
        console.error('Exceção ao salvar borrower no Supabase:', err);
      }
    }

    return newBorrower;
  }

  // --- LOANS ---
  public getLoans(): Loan[] {
    return this.loans
      .map((loan) => {
        const borrower = this.borrowers.find((b) => Number(b.id) === Number(loan.borrower_id));
        const loanInstallments = this.getInstallmentsByLoan(loan.id);

        const totalWithInterest = loanInstallments.reduce((acc, inst) => acc + inst.original_amount, 0);
        const paidInstallments = loanInstallments.filter((inst) => inst.status === 'paid');
        const totalPaid = paidInstallments.reduce(
          (acc, inst) => acc + (inst.paid_amount || inst.original_amount),
          0
        );
        const remainingBalance = Math.max(0, Math.round((totalWithInterest - totalPaid) * 100) / 100);

        const pendingInstallments = loanInstallments
          .filter((inst) => inst.status !== 'paid')
          .sort((a, b) => a.due_date.localeCompare(b.due_date));

        const nextDueDate = pendingInstallments.length > 0 ? pendingInstallments[0].due_date : undefined;
        const hasOverdue = pendingInstallments.some((inst) => inst.status === 'overdue');

        // Auto update loan status if all paid, or self-heal to active if installments exist and not all paid
        let status: Loan['status'] = loan.status;
        if (loanInstallments.length > 0 && paidInstallments.length === loanInstallments.length) {
          status = 'completed';
        } else if (loanInstallments.length > 0 && paidInstallments.length < loanInstallments.length) {
          status = 'active';
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
      })
      .sort((a, b) => {
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (a.status !== 'completed' && b.status === 'completed') return -1;

        if (a.next_due_date && b.next_due_date) {
          return a.next_due_date.localeCompare(b.next_due_date);
        }
        if (a.next_due_date && !b.next_due_date) return -1;
        if (!a.next_due_date && b.next_due_date) return 1;

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }

  public getLoanById(id: number): Loan | undefined {
    return this.getLoans().find((l) => Number(l.id) === Number(id));
  }

  public async createLoan(params: {
    borrower_name: string;
    borrower_phone?: string;
    borrower_document?: string;
    principal_amount: number;
    monthly_interest_rate: number;
    installments_count: number;
    start_date: string;
    first_due_date: string;
    notes?: string;
  }): Promise<{ loan: Loan; installments: Installment[] }> {
    this.isMutating = true;
    try {
      let borrower = this.borrowers.find(
        (b) => b.name.toLowerCase() === params.borrower_name.trim().toLowerCase()
      );

      if (!borrower) {
        borrower = await this.createBorrower(
          params.borrower_name,
          params.borrower_phone,
          params.borrower_document
        );
      } else if (params.borrower_phone || params.borrower_document) {
        if (params.borrower_phone) borrower.phone = params.borrower_phone;
        if (params.borrower_document) borrower.document = params.borrower_document;
        this.persist(STORAGE_KEY_BORROWERS, this.borrowers);

        const client = getSupabaseClient();
        if (client && this.isCloudActive) {
          try {
            await client
              .from('borrowers')
              .update({
                phone: borrower.phone || null,
                document: borrower.document || null,
              })
              .eq('id', borrower.id);
          } catch (err) {
            console.error('Erro ao atualizar borrower no Supabase:', err);
          }
        }
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

      // Gera cronograma de parcelas
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

      // Salva em memória local imediatamente
      this.loans.push(newLoan);
      this.installments.push(...generatedInstallments);

      this.persist(STORAGE_KEY_LOANS, this.loans);
      this.persist(STORAGE_KEY_INSTALLMENTS, this.installments);

      // Salva no Supabase estritamente em sequência (loans primeiro, depois installments)
      const client = getSupabaseClient();
      if (client && this.isCloudActive) {
        const { error: loanErr } = await client
          .from('loans')
          .insert([
            {
              id: newLoan.id,
              borrower_id: newLoan.borrower_id,
              principal_amount: newLoan.principal_amount,
              monthly_interest_rate: newLoan.monthly_interest_rate,
              installments_count: newLoan.installments_count,
              start_date: newLoan.start_date,
              first_due_date: newLoan.first_due_date,
              status: newLoan.status,
              notes: newLoan.notes || null,
              created_at: newLoan.created_at,
            },
          ]);

        if (loanErr) {
          console.error('Erro ao salvar loan no Supabase:', loanErr);
          throw new Error('Falha ao salvar empréstimo no Supabase: ' + loanErr.message);
        }

        const { error: instErr } = await client
          .from('installments')
          .insert(
            generatedInstallments.map((inst) => ({
              id: inst.id,
              loan_id: inst.loan_id,
              installment_number: inst.installment_number,
              due_date: inst.due_date,
              original_amount: inst.original_amount,
              principal_part: inst.principal_part,
              interest_part: inst.interest_part,
              status: inst.status,
            }))
          );

        if (instErr) {
          console.error('Erro ao salvar installments no Supabase:', instErr);
          throw new Error('Falha ao salvar parcelas no Supabase: ' + instErr.message);
        }
      }

      return {
        loan: newLoan,
        installments: generatedInstallments,
      };
    } finally {
      setTimeout(() => {
        this.isMutating = false;
      }, 500);
    }
  }

  public async deleteLoan(loanId: number): Promise<void> {
    this.isMutating = true;
    try {
      this.loans = this.loans.filter((l) => Number(l.id) !== Number(loanId));
      this.installments = this.installments.filter((i) => Number(i.loan_id) !== Number(loanId));
      this.payments = this.payments.filter((p) => Number(p.loan_id) !== Number(loanId));

      this.persist(STORAGE_KEY_LOANS, this.loans);
      this.persist(STORAGE_KEY_INSTALLMENTS, this.installments);
      this.persist(STORAGE_KEY_PAYMENTS, this.payments);

      const client = getSupabaseClient();
      if (client && this.isCloudActive) {
        try {
          await client.from('payments').delete().eq('loan_id', loanId);
          await client.from('installments').delete().eq('loan_id', loanId);
          const { error } = await client.from('loans').delete().eq('id', loanId);
          if (error) console.error('Erro ao deletar loan no Supabase:', error);
        } catch (err) {
          console.error('Exceção ao deletar no Supabase:', err);
        }
      }
    } finally {
      setTimeout(() => {
        this.isMutating = false;
      }, 500);
    }
  }

  // --- INSTALLMENTS & CHARGES ---
  public getInstallmentsByLoan(loanId: number): Installment[] {
    const loan = this.loans.find((l) => Number(l.id) === Number(loanId));
    const rate = loan?.monthly_interest_rate || this.settings.default_interest_rate;
    const borrower = loan ? this.borrowers.find((b) => Number(b.id) === Number(loan.borrower_id)) : undefined;

    return this.installments
      .filter((inst) => Number(inst.loan_id) === Number(loanId))
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
      const loan = this.loans.find((l) => Number(l.id) === Number(inst.loan_id));
      const borrower = loan ? this.borrowers.find((b) => Number(b.id) === Number(loan.borrower_id)) : undefined;
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
  public async receiveInstallmentPayment(params: {
    installment_id: number;
    paid_amount: number;
    paid_date: string;
    payment_method: PaymentMethod;
  }): Promise<{ installment: Installment; paymentRecord: PaymentRecord }> {
    this.isMutating = true;
    try {
      const instIndex = this.installments.findIndex((i) => Number(i.id) === Number(params.installment_id));
      if (instIndex === -1) {
        throw new Error('Parcela não encontrada');
      }

      const inst = this.installments[instIndex];
      const loan = this.loans.find((l) => Number(l.id) === Number(inst.loan_id));
      const borrower = loan ? this.borrowers.find((b) => Number(b.id) === Number(loan.borrower_id)) : undefined;

      const principalRecovered = Math.min(params.paid_amount, inst.principal_part);
      const remainder = Math.max(0, params.paid_amount - principalRecovered);
      const interestRealized = Math.min(remainder, inst.interest_part);
      const chargesPaid = Math.max(0, remainder - interestRealized);

      const updatedInst: Installment = {
        ...inst,
        status: 'paid',
        paid_amount: params.paid_amount,
        paid_date: params.paid_date,
        payment_method: params.payment_method,
      };
      this.installments[instIndex] = updatedInst;

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

      // Verifica se o empréstimo foi quitado por completo
      const loanAllInstallments = this.installments.filter((i) => Number(i.loan_id) === Number(inst.loan_id));
      let loanCompleted = false;
      if (loanAllInstallments.length > 0 && loanAllInstallments.every((i) => i.status === 'paid')) {
        const loanIdx = this.loans.findIndex((l) => Number(l.id) === Number(inst.loan_id));
        if (loanIdx !== -1) {
          this.loans[loanIdx].status = 'completed';
          loanCompleted = true;
        }
      }

      this.persist(STORAGE_KEY_INSTALLMENTS, this.installments);
      this.persist(STORAGE_KEY_PAYMENTS, this.payments);
      this.persist(STORAGE_KEY_LOANS, this.loans);

      const client = getSupabaseClient();
      if (client && this.isCloudActive) {
        try {
          const { error: instErr } = await client
            .from('installments')
            .update({
              status: 'paid',
              paid_amount: params.paid_amount,
              paid_date: params.paid_date,
              payment_method: params.payment_method,
            })
            .eq('id', params.installment_id);
          if (instErr) console.error('Erro ao atualizar installment no Supabase:', instErr);

          const { error: payErr } = await client
            .from('payments')
            .insert([
              {
                id: paymentRecord.id,
                installment_id: paymentRecord.installment_id,
                loan_id: paymentRecord.loan_id,
                borrower_name: paymentRecord.borrower_name,
                installment_number: paymentRecord.installment_number,
                total_installments: paymentRecord.total_installments,
                due_date: paymentRecord.due_date,
                paid_date: paymentRecord.paid_date,
                original_amount: paymentRecord.original_amount,
                paid_amount: paymentRecord.paid_amount,
                principal_recovered: paymentRecord.principal_recovered,
                interest_realized: paymentRecord.interest_realized,
                charges_paid: paymentRecord.charges_paid,
                payment_method: paymentRecord.payment_method,
              },
            ]);
          if (payErr) console.error('Erro ao salvar payment no Supabase:', payErr);

          if (loanCompleted && loan) {
            const { error: loanErr } = await client
              .from('loans')
              .update({ status: 'completed' })
              .eq('id', loan.id);
            if (loanErr) console.error('Erro ao atualizar status do loan no Supabase:', loanErr);
          }
        } catch (err) {
          console.error('Exceção ao registrar pagamento no Supabase:', err);
        }
      }

      return {
        installment: updatedInst,
        paymentRecord,
      };
    } finally {
      setTimeout(() => {
        this.isMutating = false;
      }, 500);
    }
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
      totalProfitRealized += pay.interest_realized + pay.charges_paid;
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

        if (this.isCloudActive) {
          this.migrateLocalDataToSupabase();
        }

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
