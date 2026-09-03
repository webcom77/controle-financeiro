import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  UserPlus,
  DollarSign,
  Calendar,
  Percent,
  FileText,
  User,
  Check
} from 'lucide-react';
import { SimulationResult, SystemSettings } from '../../types';
import { generateSimulation } from '../../utils/finance';
import { formatCurrency, getTodayString, addMonthsToDateString } from '../../utils/formatters';

interface NewLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  prefilledSimulation?: SimulationResult | null;
  onSubmit: (data: {
    borrower_name: string;
    principal_amount: number;
    monthly_interest_rate: number;
    installments_count: number;
    start_date: string;
    first_due_date: string;
    notes?: string;
  }) => void;
}

export const NewLoanModal: React.FC<NewLoanModalProps> = ({
  isOpen,
  onClose,
  settings,
  prefilledSimulation,
  onSubmit,
}) => {
  const [borrowerName, setBorrowerName] = useState('');
  const [principalStr, setPrincipalStr] = useState('1000');
  const [rateStr, setRateStr] = useState(String(settings.default_interest_rate || 6.8));
  const [installmentsStr, setInstallmentsStr] = useState('3');
  const [startDate, setStartDate] = useState(getTodayString());
  const [firstDueDate, setFirstDueDate] = useState(addMonthsToDateString(getTodayString(), 1));
  const [notes, setNotes] = useState('');

  // Handle prefilled simulation if passed from simulator
  useEffect(() => {
    if (prefilledSimulation) {
      setPrincipalStr(String(prefilledSimulation.principal_amount));
      setRateStr(String(prefilledSimulation.monthly_interest_rate));
      setInstallmentsStr(String(prefilledSimulation.installments_count));
      setFirstDueDate(prefilledSimulation.first_due_date);
    } else {
      setRateStr(String(settings.default_interest_rate || 6.8));
    }
  }, [prefilledSimulation, settings]);

  const calculatedPreview = useMemo(() => {
    const principal = parseFloat(principalStr.replace(',', '.'));
    const rate = parseFloat(rateStr.replace(',', '.'));
    const count = parseInt(installmentsStr, 10);

    if (isNaN(principal) || principal <= 0 || isNaN(rate) || rate < 0 || isNaN(count) || count <= 0) {
      return null;
    }

    return generateSimulation(principal, rate, count, firstDueDate);
  }, [principalStr, rateStr, installmentsStr, firstDueDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerName.trim()) {
      alert('Por favor, informe o nome da pessoa.');
      return;
    }

    const principal = parseFloat(principalStr.replace(',', '.'));
    const rate = parseFloat(rateStr.replace(',', '.'));
    const count = parseInt(installmentsStr, 10);

    if (isNaN(principal) || principal <= 0) {
      alert('Informe um valor de empréstimo válido.');
      return;
    }

    onSubmit({
      borrower_name: borrowerName.trim(),
      principal_amount: principal,
      monthly_interest_rate: rate,
      installments_count: count,
      start_date: startDate,
      first_due_date: firstDueDate,
      notes: notes.trim() || undefined,
    });

    setBorrowerName('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-100 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Novo Empréstimo</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Digite o nome da pessoa e os valores do contrato.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">
          {/* 1. Nome da Pessoa */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-400" />
              Nome da Pessoa *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={borrowerName}
              onChange={(e) => setBorrowerName(e.target.value)}
              placeholder="Digite o nome (ex: João, Carlos, Maria...)"
              className="w-full bg-[#F4F6F9] border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-semibold"
            />
          </div>

          {/* 2. Condições Financeiras */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                Valor do Empréstimo (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-sm">
                  R$
                </span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  value={principalStr}
                  onChange={(e) => setPrincipalStr(e.target.value)}
                  placeholder="Ex: 5000"
                  className="w-full bg-[#F4F6F9] border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-slate-900 text-base font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-slate-400" />
                Taxa de Juros Mensal (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={rateStr}
                  onChange={(e) => setRateStr(e.target.value)}
                  className="w-full bg-[#F4F6F9] border border-slate-200 rounded-2xl pl-4 pr-10 py-2.5 text-slate-900 text-base font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                />
                <span className="absolute right-3.5 top-3 text-xs font-semibold text-slate-400">
                  % a.m.
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Quantidade de Parcelas
              </label>
              <select
                value={installmentsStr}
                onChange={(e) => setInstallmentsStr(e.target.value)}
                className="w-full bg-[#F4F6F9] border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 18, 24, 36, 48].map((num) => (
                  <option key={num} value={num}>
                    {num}x {num === 1 ? 'parcela única (30 dias)' : 'parcelas'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Data do 1º Vencimento
              </label>
              <input
                type="date"
                required
                value={firstDueDate}
                onChange={(e) => setFirstDueDate(e.target.value)}
                className="w-full bg-[#F4F6F9] border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-semibold"
              />
            </div>
          </div>

          {/* 3. Observações Opcionais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Data de Concessão</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#F4F6F9] border border-slate-200 rounded-2xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Observação (Opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Pagamento no PIX"
                className="w-full bg-[#F4F6F9] border border-slate-200 rounded-2xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
              />
            </div>
          </div>

          {/* Resumo do Cálculo do Empréstimo */}
          {calculatedPreview && (
            <div className="p-4 rounded-2xl bg-[#F2EDFD] border border-[#E5DBFB] grid grid-cols-2 gap-3 text-center">
              <div>
                <span className="text-[11px] text-[#6D28D9] uppercase font-bold block">
                  Valor de Cada Parcela
                </span>
                <span className="text-2xl font-black text-slate-900">
                  {formatCurrency(calculatedPreview.installment_value)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {calculatedPreview.installments_count} parcelas mensais
                </span>
              </div>

              <div>
                <span className="text-[11px] text-[#6D28D9] uppercase font-bold block">
                  Total Final a Receber
                </span>
                <span className="text-2xl font-black text-slate-900">
                  {formatCurrency(calculatedPreview.total_to_receive)}
                </span>
                <span className="text-[10px] text-emerald-700 block mt-0.5 font-bold">
                  +{formatCurrency(calculatedPreview.total_profit)} de juros ({calculatedPreview.monthly_interest_rate}%)
                </span>
              </div>
            </div>
          )}

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
              <Check className="w-4 h-4" />
              <span>Confirmar Empréstimo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
