import React from 'react';
import { QuotaTemplateConfigView } from '../../../associates/ui/components/QuotaTemplateConfigView';
import { PayablesView } from '../../../associates/ui/pages/PayablesView';
import { CollectionsView } from '../../../loans/ui/CollectionsView';
import { LoansView } from '../../../loans/ui/LoansView';
import { ReceivablesView } from '../../../loans/ui/ReceivablesView';
import { FinesView } from '../../../fines/ui/FinesView';

export type CarteraTab =
  | 'cuentas-por-cobrar'
  | 'recaudo-asociados'
  | 'prestamos-asociados'
  | 'cuentas-por-pagar'
  | 'multas'
  | 'configuracion';

interface CarteraModulePageProps {
  initialTab?: CarteraTab;
  onTabChange?: (tab: CarteraTab) => void;
}

export const CarteraModulePage: React.FC<CarteraModulePageProps> = ({ initialTab = 'recaudo-asociados' }) => (
  <div className="flex min-h-full min-w-0 flex-col">
    {initialTab === 'recaudo-asociados' && <CollectionsView />}
    {initialTab === 'prestamos-asociados' && <LoansView />}
    {initialTab === 'cuentas-por-cobrar' && <ReceivablesView />}
    {initialTab === 'cuentas-por-pagar' && <PayablesView />}
    {initialTab === 'multas' && <FinesView />}
    {initialTab === 'configuracion' && (
      <div className="mx-auto w-full max-w-7xl min-w-0">
        <QuotaTemplateConfigView />
      </div>
    )}
  </div>
);
