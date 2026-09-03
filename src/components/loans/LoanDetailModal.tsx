import React from 'react';
import {
  X,
  Share2,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Installment, Loan, SystemSettings } from '../../types';
import { formatCurrency, formatDate, getDueStatusInfo } from '../../utils/formatters';

interface LoanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  installments: Installment[];
  settings: SystemSettings;
  onReceiveInstallment: (installment: Installment) => void;
  onDeleteLoan: (loanId: number) => void;
}

export const LoanDetailModal: React.FC<LoanDetailModalProps> = ({
  isOpen,
  onClose,
  loan,
  installments,
  settings,
  onReceiveInstallment,
  onDeleteLoan,
}) => {
  if (!isOpen || !loan) return null;

  const paidCount = loan.paid_installments_count || 0;
  const totalCount = loan.installments_count;
  const progressPct = Math.round((paidCount / totalCount) * 100);

  const handleShareWhatsApp = (inst: Installment) => {
    const isOverdue = inst.status === 'overdue' || (inst.days_overdue && inst.days_overdue > 0);
    let text = `Olá, ${loan.borrower_name}!\n\n`;

    if (isOverdue) {
      text += `Lembramos que a parcela *${inst.installment_number}/${totalCount}* do seu empréstimo venceu em *${formatDate(inst.due_date)}* (${inst.days_overdue} dias de atraso).\n\n`;
      text += `📊 *Encargos contratuais de atraso (Padrão Nubank):*\n`;
      text += `• Valor Original: ${formatCurrency(inst.original_amount)}\n`;
      if (inst.late_penalty_amount) text += `• Multa (2%): ${formatCurrency(inst.late_penalty_amount)}\n`;
      if (inst.late_mora_amount) text += `• Juros de Mora (1% a.m.): ${formatCurrency(inst.late_mora_amount)}\n`;
      if (inst.late_regular_interest) text += `• Juros Diários: ${formatCurrency(inst.late_regular_interest)}\n`;
      text += `\n💰 *Total Atualizado para Quitação Hoje:* ${formatCurrency(inst.current_total_due || inst.original_amount)}\n\n`;
      text += `Por favor, faça o pagamento e envie o comprovante. Obrigado!`;
    } else {
      text += `Passando para lembrar que a parcela *${inst.installment_number}/${totalCount}* no valor de *${formatCurrency(inst.original_amount)}* vencerá em *${formatDate(inst.due_date)}*.\n\n`;
      text += `Obrigado!`;
    }

    navigator.clipboard.writeText(text);
    alert('Mensagem formatada copiada para a área de transferência!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-100 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-lg shadow-md">
              {loan.borrower_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900">{loan.borrower_name}</h2>
                <span
                  className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                    loan.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : loan.has_overdue
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-purple-50 text-purple-700 border-purple-200'
                  }`}
                >
                  {loan.status === 'completed'
                    ? 'Quitado'
                    : loan.has_overdue
                    ? 'Parcela em Atraso'
                    : 'Em Andamento'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 mt-1">
                <span>Início: {formatDate(loan.start_date)}</span>
                <span>Taxa: {loan.monthly_interest_rate}% a.m.</span>
                <span>Parcelas: {loan.installments_count}x</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm(`Tem certeza que deseja excluir o empréstimo de ${loan.borrower_name}?`)) {
                  onDeleteLoan(loan.id);
                  onClose();
                }
              }}
              className="p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
              title="Excluir este contrato"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#F4F6F9] p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[11px] text-slate-400 font-semibold uppercase block mb-0.5">Emprestado</span>
              <span className="text-lg font-black text-slate-900">{formatCurrency(loan.principal_amount)}</span>
            </div>
            <div className="bg-[#F4F6F9] p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[11px] text-slate-400 font-semibold uppercase block mb-0.5">Total c/ Juros</span>
              <span className="text-lg font-black text-purple-700">{formatCurrency(loan.total_with_interest)}</span>
            </div>
            <div className="bg-[#F4F6F9] p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[11px] text-slate-400 font-semibold uppercase block mb-0.5">Já Pago</span>
              <span className="text-lg font-black text-emerald-600">{formatCurrency(loan.total_paid)}</span>
            </div>
            <div className="bg-[#F4F6F9] p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[11px] text-slate-400 font-semibold uppercase block mb-0.5">Saldo Restante</span>
              <span className="text-lg font-black text-amber-600">{formatCurrency(loan.remaining_balance)}</span>
            </div>
          </div>

          {/* Progress Banner */}
          <div className="bg-[#F4F6F9] p-4 rounded-2xl border border-slate-200">
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-slate-700">
                Progresso: {paidCount} de {totalCount} parcelas pagas ({progressPct}%)
              </span>
              <span className="text-slate-500">
                {totalCount - paidCount} pendentes
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  loan.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-900'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Installments Table */}
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 mb-3">Cronograma de Parcelas:</h3>
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200 text-[10px]">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Vencimento</th>
                      <th className="py-3 px-4">Valor Original</th>
                      <th className="py-3 px-4">Atraso</th>
                      <th className="py-3 px-4">Total Atualizado</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {installments.map((inst) => {
                      const isPaid = inst.status === 'paid';
                      const dueInfo = getDueStatusInfo(inst.due_date, isPaid);
                      const hasCharges = inst.total_charges && inst.total_charges > 0;

                      return (
                        <tr
                          key={inst.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            inst.status === 'overdue' ? 'bg-rose-50/40' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-bold text-slate-900">
                            #{inst.installment_number}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700">
                            {formatDate(inst.due_date)}
                          </td>
                          <td className="py-3 px-4 text-slate-900 font-bold">
                            {formatCurrency(inst.original_amount)}
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {isPaid ? (
                              <span className="text-emerald-600 font-semibold text-[11px]">
                                Pago em {formatDate(inst.paid_date)}
                              </span>
                            ) : inst.days_overdue && inst.days_overdue > 0 ? (
                              <span className="text-rose-600 font-bold">
                                {inst.days_overdue} dias (+{formatCurrency(inst.total_charges)})
                              </span>
                            ) : (
                              '0 dias'
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`font-black text-sm ${
                                isPaid
                                  ? 'text-emerald-600'
                                  : hasCharges
                                  ? 'text-rose-600'
                                  : 'text-slate-900'
                              }`}
                            >
                              {formatCurrency(isPaid ? inst.paid_amount : inst.current_total_due || inst.original_amount)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                              isPaid ? 'bg-emerald-100 text-emerald-800' :
                              inst.status === 'overdue' ? 'bg-rose-100 text-rose-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {dueInfo.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isPaid && (
                                <>
                                  <button
                                    onClick={() => onReceiveInstallment(inst)}
                                    className="px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all"
                                  >
                                    Receber
                                  </button>

                                  <button
                                    onClick={() => handleShareWhatsApp(inst)}
                                    title="Cobrar via WhatsApp"
                                    className="p-1 rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 transition-all"
                                  >
                                    <Share2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                              {isPaid && (
                                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {inst.payment_method || 'Recebido'}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
