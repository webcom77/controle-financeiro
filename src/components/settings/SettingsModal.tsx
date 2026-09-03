import React, { useState } from 'react';
import {
  X,
  Settings,
  Percent,
  Shield,
  Download,
  Upload,
  Bell,
  Check
} from 'lucide-react';
import { SystemSettings } from '../../types';
import { db } from '../../database/db';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  onSaveSettings: (settings: SystemSettings) => void;
  onDataRestored: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onDataRestored,
}) => {
  const [defaultRate, setDefaultRate] = useState(String(settings.default_interest_rate || 6.8));
  const [latePenalty, setLatePenalty] = useState(String(settings.late_penalty_pct));
  const [lateMora, setLateMora] = useState(String(settings.late_mora_monthly_pct));
  const [alertDays, setAlertDays] = useState(String(settings.alert_days_before));
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(defaultRate.replace(',', '.'));
    const penalty = parseFloat(latePenalty.replace(',', '.'));
    const mora = parseFloat(lateMora.replace(',', '.'));
    const days = parseInt(alertDays, 10);

    const newSettings: SystemSettings = {
      default_interest_rate: isNaN(rate) ? 6.8 : rate,
      late_penalty_pct: isNaN(penalty) ? 2.0 : penalty,
      late_mora_monthly_pct: isNaN(mora) ? 1.0 : mora,
      alert_days_before: isNaN(days) ? 7 : days,
      theme: 'dark',
    };

    onSaveSettings(newSettings);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  const handleExportBackup = () => {
    const jsonStr = db.exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_financeiro_emprestimos_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = db.importBackupJson(content);
        if (success) {
          alert('Backup restaurado com sucesso!');
          onDataRestored();
          onClose();
        } else {
          alert('Arquivo de backup inválido.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[32px] w-full max-w-xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-100 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Configurações</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Ajuste taxas e gerencie cópias de segurança.
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
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">
          {/* Taxa Padrão */}
          <div className="bg-[#F4F6F9] p-4 rounded-2xl border border-slate-200">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-purple-600" />
              Taxa de Juros Mensal Padrão (% ao mês)
            </label>
            <div className="relative max-w-xs mt-2">
              <input
                type="number"
                step="any"
                min="0"
                required
                value={defaultRate}
                onChange={(e) => setDefaultRate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 pr-10 py-2.5 text-slate-900 text-base font-black focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
              />
              <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">
                % a.m.
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1.5 block">
              Esta taxa será pré-selecionada no simulador e ao cadastrar novos empréstimos.
            </span>
          </div>

          {/* Regras Nubank */}
          <div className="bg-[#F4F6F9] p-4 rounded-2xl border border-slate-200">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-slate-600" />
              Regras de Atraso (Padrão Nubank)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">Multa por Atraso</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={latePenalty}
                  onChange={(e) => setLatePenalty(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Padrão: 2,0%</span>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">Mora Mensal</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={lateMora}
                  onChange={(e) => setLateMora(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Padrão: 1,0% a.m.</span>
              </div>
            </div>
          </div>

          {/* Alertas */}
          <div className="bg-[#F4F6F9] p-4 rounded-2xl border border-slate-200">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-slate-600" />
              Aviso de Vencimentos
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-medium">Avisar com antecedência de:</span>
              <input
                type="number"
                min="1"
                max="30"
                value={alertDays}
                onChange={(e) => setAlertDays(e.target.value)}
                className="w-16 bg-white border border-slate-200 rounded-xl px-2 py-1 text-slate-900 text-xs font-bold text-center"
              />
              <span className="text-xs text-slate-600 font-medium">dias</span>
            </div>
          </div>

          {/* Backup */}
          <div className="bg-[#F4F6F9] p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Cópia de Segurança</span>
              <span className="text-[11px] text-slate-400">Exportar ou restaurar todos os dados</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="px-3.5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar</span>
              </button>

              <label className="px-3.5 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all">
                <Upload className="w-3.5 h-3.5" />
                <span>Restaurar</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {savedSuccess ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <Check className="w-4 h-4" />
                Salvo com sucesso!
              </span>
            ) : <div />}

            <div className="flex items-center gap-3">
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
                <span>Salvar</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
