import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Calculator,
  DollarSign,
  Calendar,
  Percent,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { SimulationResult, SystemSettings } from '../../types';
import { generateSimulation } from '../../utils/finance';
import { formatCurrency, formatDate, getTodayString, addMonthsToDateString } from '../../utils/formatters';

interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  onApplyToNewLoan: (simulation: SimulationResult) => void;
}

export const SimulatorModal: React.FC<SimulatorModalProps> = ({
  isOpen,
  onClose,
  settings,
  onApplyToNewLoan,
}) => {
  const [principalStr, setPrincipalStr] = useState('5000');
  const [rateStr, setRateStr] = useState(String(settings.default_interest_rate || 6.8));
  const [installmentsStr, setInstallmentsStr] = useState('4');
  const [firstDueDate, setFirstDueDate] = useState(addMonthsToDateString(getTodayString(), 1));

  useEffect(() => {
    if (settings.default_interest_rate) {
      setRateStr(String(settings.default_interest_rate));
    }
  }, [settings.default_interest_rate]);

  const simulation = useMemo<SimulationResult | null>(() => {
    const principal = parseFloat(principalStr.replace(',', '.'));
    const rate = parseFloat(rateStr.replace(',', '.'));
    const count = parseInt(installmentsStr, 10);

    if (isNaN(principal) || principal <= 0 || isNaN(rate) || rate < 0 || isNaN(count) || count <= 0) {
      return null;
    }

    return generateSimulation(principal, rate, count, firstDueDate);
  }, [principalStr, rateStr, installmentsStr, firstDueDate]);

  if (!isOpen) return null;

  const quickPresets = [
    { label: 'R$ 1.000 em 3x', amount: '1000', count: '3' },
    { label: 'R$ 2.000 em 4x', amount: '2000', count: '4' },
    { label: 'R$ 5.000 em 6x', amount: '5000', count: '6' },
    { label: 'R$ 10.000 em 10x', amount: '10000', count: '10' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[32px] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                Simulador Financeiro
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Simule parcelas e retorno com qualquer valor.
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800">
          {/* Quick Presets */}
          <div>
            <span className="text-xs font-semibold text-slate-400 mb-2 block">
              Atalhos Rápidos:
            </span>
            <div className="flex flex-wrap gap-2">
              {quickPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrincipalStr(preset.amount);
                    setInstallmentsStr(preset.count);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 text-xs font-bold transition-all"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Valor Emprestado */}
            <div className="bg-[#F4F6F9] p-3.5 rounded-2xl border border-slate-200">
              <label className="text-xs font-semibold text-slate-600 block mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                Valor (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-bold text-sm">
                  R$
                </span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  value={principalStr}
                  onChange={(e) => setPrincipalStr(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all text-sm"
                  placeholder="Ex: 5000"
                />
              </div>
            </div>

            {/* Taxa de Juros Mensal */}
            <div className="bg-[#F4F6F9] p-3.5 rounded-2xl border border-slate-200">
              <label className="text-xs font-semibold text-slate-600 block mb-1 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-slate-400" />
                Taxa (% a.m.)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={rateStr}
                  onChange={(e) => setRateStr(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all text-sm"
                  placeholder="6.8"
                />
                <span className="absolute right-3 top-2 text-slate-400 text-xs font-semibold">
                  %
                </span>
              </div>
            </div>

            {/* Número de Parcelas */}
            <div className="bg-[#F4F6F9] p-3.5 rounded-2xl border border-slate-200">
              <label className="text-xs font-semibold text-slate-600 block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Nº de Parcelas
              </label>
              <select
                value={installmentsStr}
                onChange={(e) => setInstallmentsStr(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all text-sm"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 18, 24, 36].map((num) => (
                  <option key={num} value={num}>
                    {num}x {num === 1 ? 'mês (à vista)' : 'meses'}
                  </option>
                ))}
              </select>
            </div>

            {/* 1º Vencimento */}
            <div className="bg-[#F4F6F9] p-3.5 rounded-2xl border border-slate-200">
              <label className="text-xs font-semibold text-slate-600 block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                1º Vencimento
              </label>
              <input
                type="date"
                value={firstDueDate}
                onChange={(e) => setFirstDueDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
              />
            </div>
          </div>

          {/* Results Summary Box */}
          {simulation && (
            <div className="p-5 rounded-2xl bg-[#F2EDFD] border border-[#E5DBFB] grid grid-cols-2 gap-4 text-center">
              <div>
                <span className="text-xs text-[#6D28D9] font-bold uppercase tracking-wider block">
                  Valor da Parcela
                </span>
                <span className="text-3xl font-black text-slate-900 mt-1 block">
                  {formatCurrency(simulation.installment_value)}
                </span>
                <span className="text-xs text-slate-500">
                  {simulation.installments_count} parcelas mensais
                </span>
              </div>

              <div>
                <span className="text-xs text-[#6D28D9] font-bold uppercase tracking-wider block">
                  Total Final a Receber
                </span>
                <span className="text-3xl font-black text-slate-900 mt-1 block">
                  {formatCurrency(simulation.total_to_receive)}
                </span>
                <span className="text-xs text-emerald-700 font-bold">
                  +{formatCurrency(simulation.total_profit)} de juros ({simulation.monthly_interest_rate}%)
                </span>
              </div>
            </div>
          )}

          {/* Schedule Breakdown Table */}
          {simulation && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Cronograma de Parcelas:
              </h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200 text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Parcela</th>
                      <th className="py-3 px-4">Data Vencimento</th>
                      <th className="py-3 px-4">Valor da Parcela</th>
                      <th className="py-3 px-4">Saldo Restante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {simulation.schedule.map((item) => (
                      <tr key={item.installment_number} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-purple-700">
                          #{item.installment_number}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {formatDate(item.due_date)}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {formatCurrency(item.installment_value)}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono">
                          {formatCurrency(item.remaining_principal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-slate-600" />
            <span>Juros compostos padrão Nubank</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-slate-600 hover:bg-slate-200 text-sm font-semibold transition-all"
            >
              Fechar
            </button>
            {simulation && (
              <button
                onClick={() => {
                  onApplyToNewLoan(simulation);
                  onClose();
                }}
                className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center gap-2 shadow-md transition-all hover:scale-[1.02]"
              >
                <span>Criar com Esta Simulação</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
