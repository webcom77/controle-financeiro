import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  DollarSign,
  Calendar,
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import { Installment, PaymentMethod, SystemSettings } from '../../types';
import { calculateLateCharges, getDaysDifference } from '../../utils/finance';
import { formatCurrency, formatDate, getTodayString } from '../../utils/formatters';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  installment: Installment | null;
  settings: SystemSettings;
  monthlyInterestRate?: number;
  onConfirmPayment: (data: {
    installment_id: number;
    paid_amount: number;
    paid_date: string;
    payment_method: PaymentMethod;
  }) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  installment,
  settings,
  monthlyInterestRate = 6.8,
  onConfirmPayment,
}) => {
  const [paymentDate, setPaymentDate] = useState(getTodayString());
  const [paidAmountStr, setPaidAmountStr] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');

  const [calculatedCharges, setCalculatedCharges] = useState<{
    daysOverdue: number;
    latePenaltyAmount: number;
    lateMoraAmount: number;
    lateRegularInterest: number;
    totalCharges: number;
    currentTotalDue: number;
  }>({
    daysOverdue: 0,
    latePenaltyAmount: 0,
    lateMoraAmount: 0,
    lateRegularInterest: 0,
    totalCharges: 0,
    currentTotalDue: installment?.original_amount || 0,
  });

  useEffect(() => {
    if (installment) {
      const days = getDaysDifference(installment.due_date, paymentDate);
      const charges = calculateLateCharges(
        installment.original_amount,
        monthlyInterestRate,
        days,
        settings
      );
      setCalculatedCharges(charges);
      setPaidAmountStr(charges.currentTotalDue.toFixed(2));
    }
  }, [installment, paymentDate, monthlyInterestRate, settings]);

  if (!isOpen || !installment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paidAmountStr.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      alert('Informe um valor de pagamento válido.');
      return;
    }

    onConfirmPayment({
      installment_id: installment.id,
      paid_amount: amount,
      paid_date: paymentDate,
      payment_method: paymentMethod,
    });

    onClose();
  };

  const isOverdueOnPaymentDate = calculatedCharges.daysOverdue > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden flex flex-col border border-slate-100 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Receber Parcela #{installment.installment_number}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tomador: <strong className="text-slate-700">{installment.borrower_name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-slate-800">
          {/* Info Card */}
          <div className="bg-[#F4F6F9] p-4 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Vencimento Original:</span>
              <span className="font-bold text-slate-800">{formatDate(installment.due_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Valor Original da Parcela:</span>
              <span className="font-bold text-slate-900">{formatCurrency(installment.original_amount)}</span>
            </div>
          </div>

          {/* Late Fees Breakdown if overdue on selected date */}
          {isOverdueOnPaymentDate && (
            <div className="p-4 rounded-2xl bg-[#FEECEE] border border-[#FACDD2] space-y-2 text-xs text-[#991B1B]">
              <div className="flex items-center gap-1.5 font-bold text-[#991B1B]">
                <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                <span>Encargos por Atraso ({calculatedCharges.daysOverdue} dias):</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-rose-200 text-[11px]">
                <div>• Multa (2%): <strong>{formatCurrency(calculatedCharges.latePenaltyAmount)}</strong></div>
                <div>• Mora (1% a.m.): <strong>{formatCurrency(calculatedCharges.lateMoraAmount)}</strong></div>
                <div className="col-span-2">• Juros Diários: <strong>{formatCurrency(calculatedCharges.lateRegularInterest)}</strong></div>
              </div>
              <div className="pt-1.5 border-t border-rose-200 flex justify-between font-black text-sm text-[#991B1B]">
                <span>Total com Encargos:</span>
                <span>{formatCurrency(calculatedCharges.currentTotalDue)}</span>
              </div>
            </div>
          )}

          {/* Payment Date & Method Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Data do Pagamento
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full bg-[#F4F6F9] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-[#F4F6F9] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
              >
                <option value="PIX">PIX</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Transferência">Transferência</option>
                <option value="Cartão">Cartão</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          {/* Amount Paid Field */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                Valor Recebido (R$) *
              </label>
              {isOverdueOnPaymentDate && (
                <button
                  type="button"
                  onClick={() => setPaidAmountStr(installment.original_amount.toFixed(2))}
                  className="text-[11px] text-purple-700 hover:text-purple-900 underline font-bold"
                >
                  Isentar juros de atraso
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">
                R$
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={paidAmountStr}
                onChange={(e) => setPaidAmountStr(e.target.value)}
                className="w-full bg-[#F4F6F9] border border-slate-200 rounded-2xl pl-10 pr-3 py-2.5 text-slate-900 font-black text-lg focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-extrabold flex items-center gap-2 shadow-md transition-all hover:scale-[1.02]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar Baixa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
