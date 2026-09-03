import React from 'react';
import { AlertCircle, Clock, Calendar, CheckCircle, ListFilter } from 'lucide-react';
import { DashboardKPIs } from '../../types';

export type FilterType = 'all' | 'overdue' | 'today' | 'upcoming' | 'active' | 'completed';

interface AlertFiltersProps {
  currentFilter: FilterType;
  onSelectFilter: (filter: FilterType) => void;
  kpis: DashboardKPIs;
  isDark?: boolean;
}

export const AlertFilters: React.FC<AlertFiltersProps> = ({
  currentFilter,
  onSelectFilter,
  kpis,
  isDark = false,
}) => {
  const tabs = [
    {
      id: 'all' as FilterType,
      label: 'Todos',
      icon: ListFilter,
      count: undefined,
    },
    {
      id: 'overdue' as FilterType,
      label: 'Em Atraso',
      icon: AlertCircle,
      count: kpis.count_overdue_installments,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'today' as FilterType,
      label: 'Vencem Hoje',
      icon: Clock,
      count: kpis.count_today_installments,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold',
    },
    {
      id: 'upcoming' as FilterType,
      label: 'Próximos 7 dias',
      icon: Calendar,
      count: kpis.count_upcoming_installments,
      badgeColor: 'bg-blue-500 text-white',
    },
    {
      id: 'completed' as FilterType,
      label: 'Quitados',
      icon: CheckCircle,
      count: undefined,
    },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentFilter === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onSelectFilter(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap border ${
              isActive
                ? isDark
                  ? 'bg-white border-white text-slate-950 shadow-md font-bold'
                  : 'bg-slate-900 border-slate-900 text-white shadow-sm'
                : isDark
                ? 'bg-[#181B22] border-[#2A2E39] text-slate-300 hover:text-white hover:border-[#3E4554]'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? (isDark ? 'text-slate-950' : 'text-white') : (isDark ? 'text-slate-400' : 'text-slate-400')}`} />
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full ml-0.5 ${
                  tab.badgeColor || (isDark ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700')
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
