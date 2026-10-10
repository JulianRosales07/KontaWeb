export type AccountNature = 'DEBIT' | 'CREDIT';

export type AccountLevel = 1 | 2 | 3 | 4 | 5;

export interface PucAccount {
  id: string;
  code: string;
  name: string;
  level: AccountLevel;
  nature: AccountNature;
  parentId?: string | null;
  parentCode?: string | null;
  requiresThirdParty?: boolean;
  isActive: boolean; // True if selected / in "Plan de Cuentas Propio"
  isCustom?: boolean; // True if added as a custom subaccount
  balance?: number;
}

export interface PucTreeNode extends PucAccount {
  children: PucTreeNode[];
  isExpanded?: boolean;
}
