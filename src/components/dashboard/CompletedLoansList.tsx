import React from 'react';
import { CheckCircle2, Eye, Trash2, ShieldCheck, DollarSign, ArrowUpRight } from 'lucide-react';
import { Installment, Loan, PaymentRecord } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface CompletedLoansListProps {
  completedLoans: Loan[];
  allInstallments: Installment[];
  payments: PaymentRecord[];
  isDark?: boolean;
  onSelectLoan: (loanId: number) => void;
  onDeleteLoan: (loanId: number) => void;
  onOpenSimulator: () => void;
}

export const CompletedLoansList: React.FC<CompletedLoansListProps> = ({
  completedLoans,
  allInstallments,
  payments,
  isDark = false,
  onSelectLoan,
  onDeleteLoan,
  onOpenSimulator,
}) => {
  // Calculate total metrics for completed loans
  const totalPrincipal = completedLoans.reduce((sum, l) => sum + (l.principal_amount || 0), 0);
  const totalReceived = completedLoans.reduce((sum, l) => sum + (l.total_paid || 0), 0);
  const totalProfit = totalReceived - totalPrincipal;

  if (completedLoans.length === 0) {
    return (
      <div className={`rounded-[28px] p-12 text-center border border-dashed flex flex-col items-center justify-center h-full ${
        isDark ? 'bg-[#141720] border-[#2A2E3D]' : 'bg-white border-slate-200'
      } shadow-sm`}>
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3.5 ${
          isDark ? 'bg-emerald-950/40 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
        }`}>
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className={`text-lg font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Nenhum contrato finalizado ainda
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">
          Quando todas as parcelas de um contrato forem pagas, ele será movido automaticamente para esta aba.
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-[28px] border flex flex-col h-full overflow-hidden shadow-sm ${
      isDark ? 'bg-[#12151D] border-[#202533]' : 'bg-white border-slate-200/80'
    }`}>
      {/* Top Metrics Header */}
      <div className={`p-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-3 border-b shrink-0 ${
        isDark ? 'border-[#202533] bg-[#161922]' : 'border-slate-100 bg-slate-50/60'
      }`}>
        <div className={`p-3 rounded-2xl border ${
          isDark ? 'bg-[#1A1D27] border-[#292F40]' : 'bg-white border-slate-200/60'
        }`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Contratos Quitados
          </span>
          <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {completedLoans.length} {completedLoans.length === 1 ? 'contrato' : 'contratos'}
          </span>
        </div>

        <div className={`p-3 rounded-2xl border ${
          isDark ? 'bg-[#1A1D27] border-[#292F40]' : 'bg-white border-slate-200/60'
        }`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Total Recebido
          </span>
          <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {formatCurrency(totalReceived)}
          </span>
        </div>

        <div className={`p-3 rounded-2xl border ${
          isDark ? 'bg-[#13241C] border-[#1E4D38]' : 'bg-[#E8F7F0] border-[#D1F0E1]'
        }`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#047857] dark:text-[#6EE7B7] block mb-0.5">
            Lucro Líquido Realizado
          </span>
          <span className="text-xl font-black text-[#047857] dark:text-[#6EE7B7]">
            +{formatCurrency(totalProfit)}
          </span>
        </div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <table className="w-full text-left text-xs">
          <thead className={`sticky top-0 z-10 uppercase font-black text-[10px] tracking-wider border-b ${
            isDark ? 'bg-[#161922] text-slate-400 border-[#202533]' : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}>
            <tr>
              <th className="py-3.5 px-4 sm:px-6">Tomador</th>
              <th className="py-3.5 px-4">Capital Original</th>
              <th className="py-3.5 px-4">Total Pago</th>
              <th className="py-3.5 px-4">Lucro Obtido</th>
              <th className="py-3.5 px-4">Parcelas</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 sm:px-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-[#202533]' : 'divide-slate-100'}`}>
            {completedLoans.map((loan) => {
              const loanInstallments = allInstallments.filter((i) => i.loan_id === loan.id);
              const totalPaidVal = loan.total_paid || 0;
              const loanProfit = totalPaidVal - loan.principal_amount;

              return (
                <tr
                  key={loan.id}
                  onClick={() => onSelectLoan(loan.id)}
                  className={`cursor-pointer transition-colors ${
                    isDark ? 'hover:bg-[#181B26]' : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* Tomador */}
                  <td className="py-4 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        {loan.borrower_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className={`font-extrabold text-sm block leading-tight ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          {loan.borrower_name}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Iniciado em {formatDate(loan.start_date)}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Capital Original */}
                  <td className={`py-4 px-4 font-bold text-sm ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                    {formatCurrency(loan.principal_amount)}
                  </td>

                  {/* Total Pago */}
                  <td className={`py-4 px-4 font-extrabold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatCurrency(loan.total_paid)}
                  </td>

                  {/* Lucro Obtido */}
                  <td className="py-4 px-4">
                    <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 block">
                      +{formatCurrency(loanProfit)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Taxa de {loan.monthly_interest_rate}% a.m.
                    </span>
                  </td>

                  {/* Parcelas */}
                  <td className="py-4 px-4">
                    <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
                      {loan.installments_count} de {loan.installments_count} pagas
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      100% Quitado
                    </span>
                  </td>

                  {/* Ações */}
                  <td className="py-4 px-4 sm:px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectLoan(loan.id);
                        }}
                        title="Ver Parcelas e Recibos"
                        className={`p-2 rounded-full transition-all ${
                          isDark
                            ? 'bg-[#1E2332] text-slate-300 hover:text-white'
                            : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Deseja excluir o histórico do contrato de ${loan.borrower_name}?`)) {
                            onDeleteLoan(loan.id);
                          }
                        }}
                        title="Excluir Contrato"
                        className={`p-2 rounded-full transition-all ${
                          isDark
                            ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-950/40'
                            : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
