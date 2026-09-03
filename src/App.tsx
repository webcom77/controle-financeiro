import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutGrid,
  CheckCircle2,
  Calculator,
  History,
  Settings,
  Plus,
  Search,
  Bell,
  RefreshCw,
  Sun,
  Moon
} from 'lucide-react';
import { db } from './database/db';
import {
  DashboardKPIs,
  Installment,
  Loan,
  PaymentMethod,
  PaymentRecord,
  SimulationResult,
  SystemSettings
} from './types';
import { AlertFilters, FilterType } from './components/dashboard/AlertFilters';
import { LoanList } from './components/dashboard/LoanList';
import { CompletedLoansList } from './components/dashboard/CompletedLoansList';
import { SimulatorModal } from './components/simulator/SimulatorModal';
import { NewLoanModal } from './components/loans/NewLoanModal';
import { LoanDetailModal } from './components/loans/LoanDetailModal';
import { PaymentModal } from './components/installments/PaymentModal';
import { HistoryModal } from './components/history/HistoryModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { DEFAULT_SETTINGS } from './utils/finance';
import appIcon from './assets/app-icon.png';

export function App() {
  const [isReady, setIsReady] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [allInstallments, setAllInstallments] = useState<Installment[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [kpis, setKpis] = useState<DashboardKPIs>({
    total_lent_active: 0,
    total_expected_return: 0,
    total_already_received: 0,
    total_profit_realized: 0,
    total_overdue_with_charges: 0,
    count_active_loans: 0,
    count_overdue_installments: 0,
    count_today_installments: 0,
    count_upcoming_installments: 0,
  });

  // UI Theme, Filters and Search
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNavTab, setActiveNavTab] = useState<'dashboard' | 'completed' | 'simulator' | 'history' | 'settings'>('dashboard');

  // Modals state
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isNewLoanOpen, setIsNewLoanOpen] = useState(false);
  const [prefilledSimulation, setPrefilledSimulation] = useState<SimulationResult | null>(null);

  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null);
  const [paymentInstallment, setPaymentInstallment] = useState<Installment | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initialize and load data
  const refreshData = async () => {
    await db.init();
    const loadedSettings = db.getSettings();
    setSettings(loadedSettings);
    setCurrentTheme(loadedSettings.theme || 'light');
    setLoans(db.getLoans());
    setAllInstallments(db.getAllInstallments());
    setPayments(db.getPaymentHistory());
    setKpis(db.getDashboardKPIs());
    setIsReady(true);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const toggleTheme = () => {
    const nextTheme: 'dark' | 'light' = currentTheme === 'light' ? 'dark' : 'light';
    setCurrentTheme(nextTheme);
    const updated: SystemSettings = { ...settings, theme: nextTheme };
    setSettings(updated);
    db.saveSettings(updated);
  };

  // Active Loans (Only unpaid / in progress loans)
  const activeLoans = useMemo(() => {
    return loans.filter((loan) => loan.status !== 'completed');
  }, [loans]);

  // Completed Loans (Only 100% paid off loans)
  const completedLoans = useMemo(() => {
    return loans.filter((loan) => {
      const matchSearch =
        loan.borrower_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.notes?.toLowerCase().includes(searchQuery.toLowerCase());
      return loan.status === 'completed' && matchSearch;
    });
  }, [loans, searchQuery]);

  // Filtered Active Loans sorted from closest due date to furthest due date
  const filteredActiveLoans = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    const result = activeLoans.filter((loan) => {
      const matchesSearch =
        loan.borrower_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.notes?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (currentFilter === 'all' || currentFilter === 'active') return true;

      const loanInsts = allInstallments.filter((i) => i.loan_id === loan.id && i.status !== 'paid');

      if (currentFilter === 'overdue') {
        return loanInsts.some((i) => i.status === 'overdue' || (i.days_overdue && i.days_overdue > 0));
      }

      if (currentFilter === 'today') {
        return loanInsts.some((i) => i.due_date === todayStr);
      }

      if (currentFilter === 'upcoming') {
        return loanInsts.some((i) => {
          if (i.status === 'overdue' || i.due_date === todayStr) return false;
          const [dy, dm, dd] = i.due_date.split('-').map(Number);
          const due = new Date(dy, dm - 1, dd, 0, 0, 0);
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
          const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays > 0 && diffDays <= settings.alert_days_before;
        });
      }

      return true;
    });

    // Sort: Nearest due date first (left to right)
    return result.sort((a, b) => {
      if (a.next_due_date && b.next_due_date) {
        return a.next_due_date.localeCompare(b.next_due_date);
      }
      if (a.next_due_date && !b.next_due_date) return -1;
      if (!a.next_due_date && b.next_due_date) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [activeLoans, allInstallments, searchQuery, currentFilter, settings.alert_days_before]);

  // Selected Loan entity
  const selectedLoan = useMemo(() => {
    if (!selectedLoanId) return null;
    return loans.find((l) => l.id === selectedLoanId) || null;
  }, [selectedLoanId, loans]);

  const selectedLoanInstallments = useMemo(() => {
    if (!selectedLoanId) return [];
    return allInstallments.filter((i) => i.loan_id === selectedLoanId);
  }, [selectedLoanId, allInstallments]);

  // Action Handlers
  const handleCreateLoan = (data: {
    borrower_name: string;
    principal_amount: number;
    monthly_interest_rate: number;
    installments_count: number;
    start_date: string;
    first_due_date: string;
    notes?: string;
  }) => {
    db.createLoan(data);
    refreshData();
    setPrefilledSimulation(null);
  };

  const handleDeleteLoan = (loanId: number) => {
    db.deleteLoan(loanId);
    if (selectedLoanId === loanId) {
      setSelectedLoanId(null);
    }
    refreshData();
  };

  const handleConfirmPayment = (data: {
    installment_id: number;
    paid_amount: number;
    paid_date: string;
    payment_method: PaymentMethod;
  }) => {
    db.receiveInstallmentPayment(data);
    refreshData();
    setPaymentInstallment(null);
  };

  const handleSaveSettings = (newSettings: SystemSettings) => {
    db.saveSettings(newSettings);
    setCurrentTheme(newSettings.theme);
    refreshData();
  };

  const handleOpenSimulatorToNewLoan = (sim: SimulationResult) => {
    setPrefilledSimulation(sim);
    setIsNewLoanOpen(true);
  };

  const isDark = currentTheme === 'dark';
  const totalCompletedCount = loans.filter((l) => l.status === 'completed').length;

  if (!isReady) {
    return (
      <div className={`h-screen w-screen flex flex-col items-center justify-center gap-3 ${isDark ? 'bg-[#0B0D13] text-slate-400' : 'bg-[#E9EFF6] text-slate-500'}`}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center animate-spin ${isDark ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}`}>
          <RefreshCw className="w-6 h-6" />
        </div>
        <span className="text-sm font-semibold">Carregando painel financeiro...</span>
      </div>
    );
  }

  return (
    <div className={`h-screen w-screen p-2 sm:p-3 md:p-4 flex items-center justify-center font-sans antialiased overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-[#08090D] text-slate-100' : 'bg-[#E9EFF6] text-slate-800'
    }`}>
      {/* Main Container: 100% viewport fit without window scrollbars */}
      <div className={`w-full h-full max-w-[1440px] rounded-[30px] shadow-2xl overflow-hidden flex flex-row border transition-colors duration-300 ${
        isDark ? 'bg-[#0E1017] border-[#1F2330]' : 'bg-white border-slate-200/80'
      }`}>
        
        {/* 1. LEFT SIDEBAR */}
        <aside className="w-16 md:w-20 bg-[#131418] flex flex-col items-center justify-between py-5 px-0 shrink-0 border-r border-[#20222B]">
          {/* Top Logo */}
          <div className="w-11 h-11 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-md cursor-pointer hover:rotate-3 transition-transform overflow-hidden border border-slate-200">
            <img src={appIcon} alt="Logo" className="w-full h-full object-contain" />
          </div>

          {/* Navigation Buttons */}
          <nav className="flex flex-col items-center gap-2.5">
            {/* Contratos Ativos */}
            <button
              onClick={() => setActiveNavTab('dashboard')}
              title="Contratos Ativos"
              className={`p-3 rounded-2xl transition-all relative ${
                activeNavTab === 'dashboard'
                  ? 'bg-[#23242A] text-white shadow-inner'
                  : 'text-slate-400 hover:text-white hover:bg-[#23242A]/60'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>

            {/* Contratos Finalizados */}
            <button
              onClick={() => setActiveNavTab('completed')}
              title="Contratos Finalizados"
              className={`p-3 rounded-2xl transition-all relative ${
                activeNavTab === 'completed'
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-emerald-400 hover:bg-[#23242A]/60'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              {totalCompletedCount > 0 && (
                <span className="absolute top-1.5 right-1.5 px-1 py-0.2 text-[9px] font-black rounded-full bg-emerald-500 text-slate-950 min-w-[14px] text-center">
                  {totalCompletedCount}
                </span>
              )}
            </button>

            {/* Simulador */}
            <button
              onClick={() => setIsSimulatorOpen(true)}
              title="Simulador de Empréstimos"
              className="p-3 rounded-2xl text-slate-400 hover:text-white hover:bg-[#23242A]/60 transition-all"
            >
              <Calculator className="w-5 h-5" />
            </button>

            {/* Extrato e Lucros */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              title="Extrato de Pagamentos"
              className="p-3 rounded-2xl text-slate-400 hover:text-white hover:bg-[#23242A]/60 transition-all"
            >
              <History className="w-5 h-5" />
            </button>

            {/* Configurações */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              title="Configurações"
              className="p-3 rounded-2xl text-slate-400 hover:text-white hover:bg-[#23242A]/60 transition-all"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Alternador de Tema */}
            <button
              onClick={toggleTheme}
              title={isDark ? "Mudar para Tema Claro" : "Mudar para Tema Escuro"}
              className="p-3 rounded-2xl text-slate-400 hover:text-yellow-300 hover:bg-[#23242A]/60 transition-all"
            >
              {isDark ? <Sun className="w-5 h-5 text-yellow-300" /> : <Moon className="w-5 h-5" />}
            </button>
          </nav>

          {/* Bottom Action: Novo Empréstimo */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => {
                setPrefilledSimulation(null);
                setIsNewLoanOpen(true);
              }}
              title="Novo Empréstimo"
              className="w-10 h-10 rounded-2xl bg-white text-slate-950 flex items-center justify-center font-bold hover:scale-105 transition-all shadow-md"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </aside>

        {/* 2. MAIN CONTENT AREA (100% height, zero window scrollbar) */}
        <main className="flex-1 flex flex-col p-5 md:p-6 lg:p-7 overflow-hidden">
          {/* Top Bar */}
          <header className="flex items-center justify-between gap-4 mb-4 shrink-0">
            <div>
              <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {activeNavTab === 'completed' ? 'Contratos Finalizados' : 'Contratos Ativos'}
              </h1>
              <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                {activeNavTab === 'completed'
                  ? 'Histórico completo de empréstimos 100% quitados e lucros realizados.'
                  : 'Lista detalhada de empréstimos em andamento ordenados por vencimento.'}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Buscar tomador..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`border-none rounded-full pl-9 pr-4 py-2 text-xs font-semibold focus:outline-none w-36 sm:w-48 transition-all ${
                    isDark
                      ? 'bg-[#181B24] text-white placeholder-slate-500 focus:ring-1 focus:ring-slate-600'
                      : 'bg-[#F4F6F9] text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-slate-400'
                  }`}
                />
              </div>

              {/* Botão Novo Empréstimo */}
              <button
                onClick={() => {
                  setPrefilledSimulation(null);
                  setIsNewLoanOpen(true);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all shadow-sm ${
                  isDark
                    ? 'bg-white text-slate-950 hover:bg-slate-200'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Novo Empréstimo</span>
              </button>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                title={isDark ? "Alternar para Modo Claro" : "Alternar para Modo Escuro"}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  isDark ? 'bg-[#181B24] text-yellow-300 hover:bg-[#232734]' : 'bg-[#F4F6F9] text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Rate Badge */}
              <div className={`flex items-center gap-1.5 rounded-full py-1.5 px-3 border ${
                isDark ? 'bg-[#181B24] border-[#2A2E3D] text-slate-200' : 'bg-[#F4F6F9] border-slate-100 text-slate-900'
              }`}>
                <span className="text-xs font-black">
                  {settings.default_interest_rate}% a.m.
                </span>
              </div>
            </div>
          </header>

          {/* Quick Filter Tabs (Only shown in Active tab) */}
          {activeNavTab === 'dashboard' && (
            <div className="mb-3 shrink-0">
              <AlertFilters
                currentFilter={currentFilter}
                onSelectFilter={setCurrentFilter}
                kpis={kpis}
                isDark={isDark}
              />
            </div>
          )}

          {/* Content View: Contratos Ativos vs Contratos Finalizados */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {activeNavTab === 'completed' ? (
              <CompletedLoansList
                completedLoans={completedLoans}
                allInstallments={allInstallments}
                payments={payments}
                isDark={isDark}
                onSelectLoan={(id) => setSelectedLoanId(id)}
                onDeleteLoan={handleDeleteLoan}
                onOpenSimulator={() => setIsSimulatorOpen(true)}
              />
            ) : (
              <LoanList
                loans={filteredActiveLoans}
                allInstallments={allInstallments}
                settings={settings}
                isDark={isDark}
                onSelectLoan={(id) => setSelectedLoanId(id)}
                onReceiveInstallment={(inst) => setPaymentInstallment(inst)}
                onDeleteLoan={handleDeleteLoan}
                onCreateNew={() => setIsNewLoanOpen(true)}
              />
            )}
          </div>
        </main>
      </div>

      {/* MODALS */}
      {/* 1. Simulator Modal */}
      <SimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        settings={settings}
        onApplyToNewLoan={handleOpenSimulatorToNewLoan}
      />

      {/* 2. New Loan Modal */}
      <NewLoanModal
        isOpen={isNewLoanOpen}
        onClose={() => setIsNewLoanOpen(false)}
        settings={settings}
        prefilledSimulation={prefilledSimulation}
        onSubmit={handleCreateLoan}
      />

      {/* 3. Loan Detail Modal */}
      <LoanDetailModal
        isOpen={selectedLoanId !== null}
        onClose={() => setSelectedLoanId(null)}
        loan={selectedLoan}
        installments={selectedLoanInstallments}
        settings={settings}
        onReceiveInstallment={(inst) => setPaymentInstallment(inst)}
        onDeleteLoan={handleDeleteLoan}
      />

      {/* 4. Payment Receipt Modal */}
      <PaymentModal
        isOpen={paymentInstallment !== null}
        onClose={() => setPaymentInstallment(null)}
        installment={paymentInstallment}
        settings={settings}
        monthlyInterestRate={
          selectedLoan?.monthly_interest_rate ||
          loans.find((l) => l.id === paymentInstallment?.loan_id)?.monthly_interest_rate ||
          settings.default_interest_rate
        }
        onConfirmPayment={handleConfirmPayment}
      />

      {/* 5. History / Extrato Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        payments={payments}
      />

      {/* 6. Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onDataRestored={refreshData}
      />
    </div>
  );
}
export default App;
