import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Percent,
  Shield,
  Download,
  Upload,
  Bell,
  Check,
  Cloud,
  Database,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { SystemSettings } from '../../types';
import { db } from '../../database/db';
import {
  getSupabaseCredentials,
  saveCustomSupabaseCredentials,
  testSupabaseConnection,
} from '../../database/supabaseClient';

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

  // Supabase Cloud State
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [credSource, setCredSource] = useState<'env' | 'default' | 'custom' | 'none'>('none');
  const [cloudTesting, setCloudTesting] = useState(false);
  const [cloudStatusMsg, setCloudStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setSupabaseUrl(creds.url);
      setSupabaseKey(creds.key);
      setCredSource(creds.source);
      setCloudStatusMsg(null);
    }
  }, [isOpen]);

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

  const handleSaveCloudCredentials = async () => {
    setCloudTesting(true);
    setCloudStatusMsg(null);

    saveCustomSupabaseCredentials(supabaseUrl, supabaseKey);

    const result = await testSupabaseConnection();
    setCloudTesting(false);

    if (result.success) {
      setCloudStatusMsg({ type: 'success', text: 'Conexão com Supabase validada com sucesso!' });
      await db.syncFromSupabase();
      onDataRestored();
    } else {
      setCloudStatusMsg({
        type: 'error',
        text: result.error || 'Falha ao conectar ao Supabase. Verifique a URL e a Chave.',
      });
    }
  };

  const handleMigrateToCloud = async () => {
    if (!confirm('Deseja enviar todos os dados locais atuais (clientes, empréstimos, parcelas) para o banco na nuvem Supabase?')) {
      return;
    }

    setIsMigrating(true);
    const result = await db.migrateLocalDataToSupabase();
    setIsMigrating(false);

    if (result.success) {
      setCloudStatusMsg({ type: 'success', text: 'Dados enviados para a nuvem com sucesso!' });
      onDataRestored();
    } else {
      setCloudStatusMsg({ type: 'error', text: result.message });
    }
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

  const isConnectedToCloud = db.isCloudConnected();

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
                Ajuste taxas, sincronização em nuvem e cópias de segurança.
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
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* BANCO DE DADOS EM NUVEM (SUPABASE) */}
          <div className="bg-gradient-to-br from-purple-50 to-slate-50 p-5 rounded-2xl border border-purple-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Banco de Dados em Nuvem (Supabase)</h3>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${
                  isConnectedToCloud
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnectedToCloud ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                {isConnectedToCloud ? 'Nuvem Conectada' : 'Modo Local (Offline)'}
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Conecte com o Supabase para que todos que acessarem o site vejam e alterem os mesmos dados compartilhados em tempo real.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Project URL do Supabase
                  {credSource === 'env' && (
                    <span className="text-[10px] text-purple-600 ml-1 font-normal">(Configurado via Vercel / .env)</span>
                  )}
                  {credSource === 'default' && (
                    <span className="text-[10px] text-emerald-600 ml-1 font-normal">(Conectado Automaticamente)</span>
                  )}
                </label>
                <input
                  type="text"
                  placeholder="https://seu-projeto.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  disabled={credSource === 'env' || credSource === 'default'}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Anon / Public API Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOi..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  disabled={credSource === 'env' || credSource === 'default'}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:opacity-60"
                />
              </div>

              {cloudStatusMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                    cloudStatusMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{cloudStatusMsg.text}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {credSource !== 'env' && credSource !== 'default' && (
                  <button
                    type="button"
                    onClick={handleSaveCloudCredentials}
                    disabled={cloudTesting || !supabaseUrl || !supabaseKey}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    {cloudTesting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Database className="w-3.5 h-3.5" />
                    )}
                    <span>Salvar e Conectar Nuvem</span>
                  </button>
                )}

                {isConnectedToCloud && (
                  <button
                    type="button"
                    onClick={handleMigrateToCloud}
                    disabled={isMigrating}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    {isMigrating ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>Enviar Dados Locais para Nuvem</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
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
                <span className="text-xs font-bold text-slate-900 block">Cópia de Segurança Local</span>
                <span className="text-[11px] text-slate-400">Exportar ou restaurar arquivo JSON</span>
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
                  Taxas salvas com sucesso!
                </span>
              ) : <div />}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-full text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-all"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-extrabold flex items-center gap-2 shadow-md transition-all hover:scale-[1.02]"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Regras</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
