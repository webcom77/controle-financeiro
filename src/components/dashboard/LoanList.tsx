import React, { useState } from 'react';
import {
  Share2,
  Trash2,
  CheckCircle2,
  Sparkles,
  DollarSign,
  Eye,
  AlertTriangle,
  Clock,
  MessageSquare
} from 'lucide-react';
import { Installment, Loan, SystemSettings } from '../../types';
import { formatCurrency, formatDate, getDueStatusInfo } from '../../utils/formatters';

interface LoanListProps {
  loans: Loan[];
  allInstallments: Installment[];
  settings: SystemSettings;
  isDark?: boolean;
  onSelectLoan: (loanId: number) => void;
  onReceiveInstallment: (installment: Installment) => void;
  onDeleteLoan: (loanId: number) => void;
  onCreateNew: () => void;
}

export const LoanList: React.FC<LoanListProps> = ({
  loans,
  allInstallments,
  isDark = false,
  onSelectLoan,
  onReceiveInstallment,
  onDeleteLoan,
  onCreateNew,
}) => {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopyWhatsAppMessage = (loan: Loan, e: React.MouseEvent) => {
    e.stopPropagation();
    const loanInstallments = allInstallments.filter((i) => i.loan_id === loan.id);
    const pending = loanInstallments.filter((i) => i.status !== 'paid');

    if (pending.length === 0) return;

    const nextInst = pending[0];
    const isOverdue = nextInst.status === 'overdue' || (nextInst.days_overdue && nextInst.days_overdue > 0);

    let text = `Olá, ${loan.borrower_name}! Tudo bem?\n\n`;
    if (isOverdue) {
      text += `Passando para lembrar da parcela *${nextInst.installment_number}/${loan.installments_count}* do seu empréstimo, que venceu em *${formatDate(nextInst.due_date)}* (há ${nextInst.days_overdue} dias).\n\n`;
      text += `📌 *Detalhamento da cobrança (Regras Padrão Nubank):*\n`;
      text += `• Valor Original: ${formatCurrency(nextInst.original_amount)}\n`;
      if (nextInst.late_penalty_amount) text += `• Multa (2%): ${formatCurrency(nextInst.late_penalty_amount)}\n`;
      if (nextInst.late_mora_amount) text += `• Juros de Mora (1% a.m.): ${formatCurrency(nextInst.late_mora_amount)}\n`;
      if (nextInst.late_regular_interest) text += `• Juros Diários: ${formatCurrency(nextInst.late_regular_interest)}\n`;
      text += `💰 *Valor Total Atualizado para Hoje:* ${formatCurrency(nextInst.current_total_due || nextInst.original_amount)}\n\n`;
      text += `Por favor, nos confirme o envio do comprovante assim que realizar o pagamento. Obrigado!`;
    } else {
      text += `Passando para lembrar que a parcela *${nextInst.installment_number}/${loan.installments_count}* no valor de *${formatCurrency(nextInst.original_amount)}* tem vencimento programado para *${formatDate(nextInst.due_date)}*.\n\n`;
      text += `Qualquer dúvida estamos à disposição!`;
    }

    navigator.clipboard.writeText(text);
    setCopiedId(loan.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  if (loans.length === 0) {
    return (
      <div className={`rounded-3xl p-12 text-center border border-dashed flex flex-col items-center justify-center h-full ${
        isDark ? 'bg-[#141720] border-[#2A2E3D]' : 'bg-white border-slate-200'
      } shadow-sm`}>
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3.5 ${
          isDark ? 'bg-[#1E2332] text-slate-300' : 'bg-slate-100 text-slate-700'
        }`}>
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className={`text-lg font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Nenhum contrato ativo encontrado
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">
          Todos os contratos estão em dia, filtrados ou você ainda não cadastrou nenhum empréstimo.
        </p>
        <button
          onClick={onCreateNew}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold transition-all shadow-md hover:scale-105 ${
            isDark ? 'bg-white text-slate-950 hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Cadastrar Novo Empréstimo</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`rounded-[28px] border flex flex-col h-full overflow-hidden shadow-sm ${
      isDark ? 'bg-[#12151D] border-[#202533]' : 'bg-white border-slate-200/80'
    }`}>
      {/* Table Header / Summary */}
      <div className={`p-4 sm:px-6 flex items-center justify-between border-b shrink-0 ${
        isDark ? 'border-[#202533] bg-[#161922]' : 'border-slate-100 bg-slate-50/60'
      }`}>
        <div className="flex items-center gap-2.5">
          <h3 className={`text-sm font-extrabold uppercase tracking-wider ${
            isDark ? 'text-slate-200' : 'text-slate-900'
          }`}>
            Lista de Contratos Ativos
          </h3>
          <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full ${
            isDark ? 'bg-[#252A3B] text-slate-300' : 'bg-slate-200/80 text-slate-700'
          }`}>
            {loans.length} {loans.length === 1 ? 'ativo' : 'ativos'}
          </span>
        </div>

        <span className="text-xs font-medium text-slate-400 hidden sm:inline">
          Ordenados do vencimento mais próximo ao mais distante
        </span>
      </div>

      {/* Table Body (Fills full height with smooth scrolling) */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <table className="w-full text-left text-xs">
          <thead className={`sticky top-0 z-10 uppercase font-black text-[10px] tracking-wider border-b ${
            isDark ? 'bg-[#161922] text-slate-400 border-[#202533]' : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}>
            <tr>
              <th className="py-3.5 px-4 sm:px-6">Tomador</th>
              <th className="py-3.5 px-4">Valor Emprestado</th>
              <th className="py-3.5 px-4">Total c/ Juros</th>
              <th className="py-3.5 px-4">Próx. Parcela / Vencimento</th>
              <th className="py-3.5 px-4">Valor da Parcela</th>
              <th className="py-3.5 px-4">Progresso</th>
              <th className="py-3.5 px-4 sm:px-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-[#202533]' : 'divide-slate-100'}`}>
            {loans.map((loan) => {
              const loanInstallments = allInstallments.filter((i) => i.loan_id === loan.id);
              const pending = loanInstallments
                .filter((i) => i.status !== 'paid')
                .sort((a, b) => a.due_date.localeCompare(b.due_date));

              const nextInst = pending[0];
              const dueInfo = nextInst ? getDueStatusInfo(nextInst.due_date, false) : null;
              const paidCount = loan.paid_installments_count || 0;
              const totalCount = loan.installments_count;
              const progressPct = Math.round((paidCount / totalCount) * 100);

              const currentVal = nextInst
                ? (nextInst.current_total_due || nextInst.original_amount)
                : (loan.principal_amount / totalCount);

              const isOverdue = nextInst?.status === 'overdue' || (nextInst?.days_overdue && nextInst.days_overdue > 0);

              return (
                <tr
                  key={loan.id}
                  onClick={() => onSelectLoan(loan.id)}
                  className={`cursor-pointer transition-colors group ${
                    isDark
                      ? isOverdue
                        ? 'bg-[#241417]/40 hover:bg-[#2B171B]'
                        : 'hover:bg-[#181B26]'
                      : isOverdue
                      ? 'bg-rose-50/40 hover:bg-rose-50/80'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* 1. Tomador */}
                  <td className="py-4 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm transition-transform group-hover:scale-105 ${
                        isDark ? 'bg-[#252A3B] text-white' : 'bg-slate-900 text-white'
                      }`}>
                        {loan.borrower_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className={`font-extrabold text-sm block leading-tight ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          {loan.borrower_name}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {loan.installments_count}x de {loan.monthly_interest_rate}% a.m.
                          {loan.notes ? ` • ${loan.notes}` : ''}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* 2. Valor Emprestado */}
                  <td className={`py-4 px-4 font-bold text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {formatCurrency(loan.principal_amount)}
                  </td>

                  {/* 3. Total c/ Juros */}
                  <td className="py-4 px-4">
                    <span className="font-extrabold text-sm text-purple-600 dark:text-purple-400 block">
                      {formatCurrency(loan.total_with_interest || loan.principal_amount)}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      +{formatCurrency((loan.total_with_interest || loan.principal_amount) - loan.principal_amount)} lucro
                    </span>
                  </td>

                  {/* 4. Próxima Parcela / Vencimento */}
                  <td className="py-4 px-4">
                    {nextInst ? (
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                            Parcela {nextInst.installment_number}/{loan.installments_count}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                            {formatDate(nextInst.due_date)}
                          </span>
                        </div>
                        {dueInfo && (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                            dueInfo.type === 'overdue'
                              ? 'bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/30'
                              : dueInfo.type === 'today'
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                              : isDark
                              ? 'bg-slate-800 text-slate-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {dueInfo.type === 'overdue' && <AlertTriangle className="w-3 h-3" />}
                            {dueInfo.type === 'today' && <Clock className="w-3 h-3" />}
                            {dueInfo.label}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-emerald-500 font-bold text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Quitado
                      </span>
                    )}
                  </td>

                  {/* 5. Valor da Parcela Atualizado */}
                  <td className="py-4 px-4">
                    <span className={`font-black text-sm block ${
                      isOverdue ? 'text-rose-500' : isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {formatCurrency(currentVal)}
                    </span>
                    {nextInst && nextInst.total_charges && nextInst.total_charges > 0 ? (
                      <span className="text-[10px] font-bold text-rose-500 block">
                        +{formatCurrency(nextInst.total_charges)} encargos
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 block">
                        Original: {formatCurrency(nextInst ? nextInst.original_amount : currentVal)}
                      </span>
                    )}
                  </td>

                  {/* 6. Progresso */}
                  <td className="py-4 px-4 min-w-[120px]">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                      <span>{paidCount}/{totalCount} pagas</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${
                      isDark ? 'bg-[#202533]' : 'bg-slate-200'
                    }`}>
                      <div
                        className="h-full bg-slate-900 dark:bg-purple-500 rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </td>

                  {/* 7. Ações */}
                  <td className="py-4 px-4 sm:px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {nextInst && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onReceiveInstallment(nextInst);
                          }}
                          className={`px-3.5 py-1.5 rounded-full font-extrabold text-xs shadow-sm transition-all hover:scale-105 ${
                            isDark
                              ? 'bg-white text-slate-950 hover:bg-slate-200'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          Receber
                        </button>
                      )}

                      {nextInst && (
                        <button
                          onClick={(e) => handleCopyWhatsAppMessage(loan, e)}
                          title="Copiar cobrança WhatsApp"
                          className={`p-2 rounded-full transition-all ${
                            isDark
                              ? 'bg-[#1E2332] text-slate-300 hover:text-emerald-400 hover:bg-[#283042]'
                              : 'bg-slate-100 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {copiedId === loan.id ? (
                            <span className="text-[10px] font-bold text-emerald-500 px-0.5">OK!</span>
                          ) : (
                            <Share2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectLoan(loan.id);
                        }}
                        title="Ver Parcelas e Detalhes"
                        className={`p-2 rounded-full transition-all ${
                          isDark
                            ? 'bg-[#1E2332] text-slate-400 hover:text-white'
                            : 'bg-slate-100 text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Deseja realmente excluir o contrato de ${loan.borrower_name}?`)) {
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
