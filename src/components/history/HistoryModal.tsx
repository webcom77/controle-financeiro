import React, { useState, useMemo } from 'react';
import {
  X,
  History,
  Search
} from 'lucide-react';
import { PaymentRecord } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  payments: PaymentRecord[];
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  payments,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'this_month' | 'last_month'>('all');

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchSearch =
        p.borrower_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.payment_method.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;
      if (periodFilter === 'all') return true;

      const pDate = new Date(p.paid_date);
      const now = new Date();

      if (periodFilter === 'this_month') {
        return (
          pDate.getFullYear() === now.getFullYear() &&
          pDate.getMonth() === now.getMonth()
        );
      }

      if (periodFilter === 'last_month') {
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return pDate.getFullYear() === year && pDate.getMonth() === lastMonth;
      }

      return true;
    });
  }, [payments, searchTerm, periodFilter]);

  const summary = useMemo(() => {
    let totalReceived = 0;
    let totalPrincipal = 0;
    let totalProfit = 0;

    for (const p of filteredPayments) {
      totalReceived += p.paid_amount;
      totalPrincipal += p.principal_recovered;
      totalProfit += (p.interest_realized + p.charges_paid);
    }

    return {
      totalReceived,
      totalPrincipal,
      totalProfit,
      count: filteredPayments.length,
    };
  }, [filteredPayments]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-100 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Extrato de Recebimentos</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Histórico de pagamentos efetuados pelos tomadores.
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#F4F6F9] p-4 rounded-2xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Total Arrecadado</span>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {formatCurrency(summary.totalReceived)}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {summary.count} pagamentos
              </span>
            </div>

            <div className="bg-[#F4F6F9] p-4 rounded-2xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Capital Recuperado</span>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {formatCurrency(summary.totalPrincipal)}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Principal amortizado</span>
            </div>

            <div className="bg-[#E8F7F0] p-4 rounded-2xl border border-[#D1F0E1]">
              <span className="text-xs font-bold text-[#047857] block mb-1">Lucro Real (Juros + Multas)</span>
              <span className="text-2xl font-black text-[#047857] tracking-tight">
                +{formatCurrency(summary.totalProfit)}
              </span>
              <span className="text-[11px] text-[#059669] font-medium block mt-0.5">Rendimento líquido</span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nome ou método..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#F4F6F9] border border-slate-200 rounded-full pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setPeriodFilter('all')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  periodFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setPeriodFilter('this_month')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  periodFilter === 'this_month'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Este Mês
              </button>
              <button
                onClick={() => setPeriodFilter('last_month')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  periodFilter === 'last_month'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Mês Passado
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            {filteredPayments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Nenhum pagamento registrado neste filtro.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200 text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Data Pagamento</th>
                      <th className="py-3 px-4">Tomador</th>
                      <th className="py-3 px-4">Parcela</th>
                      <th className="py-3 px-4">Valor Pago</th>
                      <th className="py-3 px-4">Lucro Real</th>
                      <th className="py-3 px-4">Forma</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredPayments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {formatDate(pay.paid_date)}
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-semibold">
                          {pay.borrower_name}
                        </td>
                        <td className="py-3 px-4 text-purple-700 font-bold">
                          #{pay.installment_number}/{pay.total_installments}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {formatCurrency(pay.paid_amount)}
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-600">
                          +{formatCurrency(pay.interest_realized + pay.charges_paid)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {pay.payment_method}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
