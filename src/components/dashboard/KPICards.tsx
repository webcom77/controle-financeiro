import React from 'react';
import { TrendingUp, AlertTriangle, Wallet, CheckCircle2, ShieldAlert } from 'lucide-react';
import { DashboardKPIs } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface KPICardsProps {
  kpis: DashboardKPIs;
}

export const KPICards: React.FC<KPICardsProps> = ({ kpis }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Emprestado Ativo */}
      <div className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/10 rounded-full blur-2xl group-hover:bg-purple-600/20 transition-all" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Capital na Rua
          </span>
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
          {formatCurrency(kpis.total_lent_active)}
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
          <span className="inline-flex items-center font-semibold text-purple-300">
            {kpis.count_active_loans} empréstimos
          </span>
          <span>em andamento</span>
        </div>
      </div>

      {/* 2. Total Previsto a Receber */}
      <div className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:border-sky-500/40 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-sky-600/10 rounded-full blur-2xl group-hover:bg-sky-600/20 transition-all" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total a Receber
          </span>
          <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl lg:text-3xl font-bold text-sky-400 tracking-tight">
          {formatCurrency(kpis.total_expected_return)}
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
          <span>Principal + Juros contratados</span>
        </div>
      </div>

      {/* 3. Lucro Realizado Já Recebido */}
      <div className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/10 rounded-full blur-2xl group-hover:bg-emerald-600/20 transition-all" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Lucro Realizado (Bolso)
          </span>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl lg:text-3xl font-bold text-emerald-400 tracking-tight">
          {formatCurrency(kpis.total_profit_realized)}
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
          <span>Total arrecadado:</span>
          <span className="font-semibold text-slate-200">
            {formatCurrency(kpis.total_already_received)}
          </span>
        </div>
      </div>

      {/* 4. Total em Atraso (Regras Nubank) */}
      <div className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:border-rose-500/40 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-600/10 rounded-full blur-2xl group-hover:bg-rose-600/20 transition-all" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-300">
            Atrasados (+ Juros Nubank)
          </span>
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl lg:text-3xl font-bold text-rose-400 tracking-tight">
          {formatCurrency(kpis.total_overdue_with_charges)}
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-rose-300/80">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>
            {kpis.count_overdue_installments} {kpis.count_overdue_installments === 1 ? 'parcela' : 'parcelas'} com multa e mora
          </span>
        </div>
      </div>
    </div>
  );
};
