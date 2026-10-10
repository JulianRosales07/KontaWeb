import React from 'react';
import { FinancialReportsPage } from '../../../financial-reports/ui/pages/FinancialReportsPage';
import { PlanCuentasPropio } from '../components/PlanCuentasPropio';
import { PucIncomeConsultationView } from '../components/PucIncomeConsultationView';
import { JournalVouchersView } from '../components/JournalVouchersView';

export type ContabilidadTab = 'base' | 'ingresos' | 'asientos' | 'reportes';

interface ContabilidadPageProps {
  initialTab?: ContabilidadTab;
  onTabChange?: (tab: ContabilidadTab) => void;
}

export const ContabilidadPage: React.FC<ContabilidadPageProps> = ({ initialTab = 'base', onTabChange }) => (
  <div className="flex min-h-full min-w-0 flex-col">
    {initialTab === 'ingresos' && <PucIncomeConsultationView onNavigateToPucCatalog={() => onTabChange?.('base')} />}
    {initialTab === 'asientos' && <JournalVouchersView />}
    {initialTab === 'reportes' && <FinancialReportsPage />}
    {initialTab === 'base' && (
      <div className="mx-auto w-full max-w-7xl min-w-0">
        <PlanCuentasPropio />
      </div>
    )}
  </div>
);
