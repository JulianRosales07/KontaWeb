import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Edit2,
  Share2,
  Upload,
  Minimize2,
  Maximize2,
  Search,
  Check,
  CheckCircle2,
  Trash2,
  Sparkles,
  Info,
  X,
  Layers,
  FileSpreadsheet,
  Download,
  Settings,
  Filter,
} from 'lucide-react';
import type { PucAccount, PucTreeNode } from '../../domain/pucTypes';
import { STANDARD_PUC_CATALOG, getPucSubaccountOptions } from '../../infrastructure/pucStandardCatalog';
import { httpClient } from '../../../../shared/infrastructure/http/httpClient';
import { loanApi } from '../../../loans/api/loanApi';
import {
  QuotaTemplateConfigView,
  DEFAULT_AUDIO_TEMPLATE,
  TEMPLATE_STORAGE_KEY,
} from '../../../associates/ui/components/QuotaTemplateConfigView';
import type { QuotaTemplate } from '../../../associates/types/associate';

const STORAGE_KEY = 'konta_puc_custom_accounts_v2';

export const PlanCuentasPropio: React.FC = () => {
  // Master list of accounts (Standard catalog + custom subaccounts + active flags)
  const [accounts, setAccounts] = useState<PucAccount[]>(() => {
    try {
      const savedV2 = localStorage.getItem('konta_puc_custom_accounts_v2');
      if (savedV2) {
        const parsed: PucAccount[] = JSON.parse(savedV2);
        const codeMap = new Map(parsed.map((a) => [a.code, a]));
        const merged = [...parsed];
        STANDARD_PUC_CATALOG.forEach((std) => {
          if (!codeMap.has(std.code)) {
            merged.push(std);
          }
        });

        // Ensure loan accounts (13, 1365, 136505, 42, 4210, 421005) are ALWAYS marked isActive: true
        const loanPucCodes = new Set(['1', '13', '1365', '136505', '4', '42', '4210', '421005']);
        return merged.map((acc) => {
          if (loanPucCodes.has(acc.code) && !acc.isActive) {
            return { ...acc, isActive: true };
          }
          return acc;
        });
      }
      // Migration from v1: preserve any user-created custom accounts
      const savedV1 = localStorage.getItem('konta_puc_custom_accounts_v1');
      if (savedV1) {
        const parsedV1: PucAccount[] = JSON.parse(savedV1);
        const customAccounts = parsedV1.filter(
          (a) => a.isCustom && !STANDARD_PUC_CATALOG.some((s) => s.code === a.code)
        );
        return [...STANDARD_PUC_CATALOG, ...customAccounts];
      }
    } catch (e) {
      console.error('Error loading PUC from storage', e);
    }
    return STANDARD_PUC_CATALOG;
  });

  // Search filter inside tree
  const [treeSearch, setTreeSearch] = useState('');

  // Expand / collapse state for tree nodes (expanded on classes 1, 2, 3, 4 where configured accounts live)
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    '1': true,
    '11': true,
    '1105': true,
    '1110': true,
    '111005': true,
    '13': true,
    '1365': true,
    '136505': true,
    '2': true,
    '23': true,
    '2380': true,
    '3': true,
    '31': true,
    '3115': true,
    '4': true,
    '41': true,
    '4170': true,
    '42': true,
    '4210': true,
    '421005': true,
    '4295': true,
    '5': false,
    '6': false,
    '7': false,
    '8': false,
    '9': false,
  });

  // Quota configuration state from user's setup
  const [quotaTemplate, setQuotaTemplate] = useState<QuotaTemplate>(() => {
    try {
      const saved = localStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading quota template', e);
    }
    return DEFAULT_AUDIO_TEMPLATE;
  });

  const [isQuotaConfigModalOpen, setIsQuotaConfigModalOpen] = useState(false);
  const [filterOnlyQuotaAccounts, setFilterOnlyQuotaAccounts] = useState(false);

  // Reload template from storage
  const refreshQuotaTemplate = () => {
    try {
      const saved = localStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setQuotaTemplate(parsed);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Modals state
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isCustomSubaccountModalOpen, setIsCustomSubaccountModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Selected parent account for creating subaccount
  const [targetParentAccount, setTargetParentAccount] = useState<PucAccount | null>(null);

  // Form for custom subaccount
  const [customCode, setCustomCode] = useState('');
  const [customName, setCustomName] = useState('');
  const [customRequiresThirdParty, setCustomRequiresThirdParty] = useState(false);
  const [selectedPucOptionCode, setSelectedPucOptionCode] = useState<string>('');
  const [isManualCodeEdit, setIsManualCodeEdit] = useState<boolean>(false);
  const [pucSelectorSearch, setPucSelectorSearch] = useState<string>('');

  // Form for editing existing account
  const [editingAccount, setEditingAccount] = useState<PucAccount | null>(null);
  const [editName, setEditName] = useState('');

  // Catalog modal search & filter
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [notification, setNotification] = useState<string | null>(null);

  // Save to localStorage whenever accounts change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    } catch (e) {
      console.error('Failed to save PUC state to localStorage', e);
    }
  }, [accounts]);

  // Sync with backend if available
  useEffect(() => {
    httpClient
      .get('/accounts/active')
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          // Merge active accounts from backend
          const backendMap = new Map(res.data.map((acc: any) => [acc.code, acc]));
          setAccounts((prev) =>
            prev.map((acc) => {
              if (backendMap.has(acc.code)) {
                return { ...acc, isActive: true };
              }
              return acc;
            })
          );
        }
      })
      .catch(() => {
        // Backend offline, keep local state
      });
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Toggle single node expansion
  const toggleNode = (code: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  };

  // Collapse or Expand all nodes
  const handleCollapseAll = () => {
    const collapsed: Record<string, boolean> = {};
    accounts.forEach((acc) => {
      collapsed[acc.code] = false;
    });
    setExpandedNodes(collapsed);
    showNotification('Todas las cuentas han sido colapsadas');
  };

  const handleExpandAll = () => {
    const expanded: Record<string, boolean> = {};
    accounts.forEach((acc) => {
      expanded[acc.code] = true;
    });
    setExpandedNodes(expanded);
    showNotification('Todas las cuentas han sido expandidas');
  };

  // Map of accounts configured for quota
  const configuredAccountsMap = useMemo(() => {
    const map = new Map<string, { conceptName: string; amount: number; category: string }>();
    if (quotaTemplate && quotaTemplate.items) {
      quotaTemplate.items.forEach((item) => {
        map.set(item.accountCode, {
          conceptName: item.conceptName,
          amount: item.amount,
          category: item.category,
        });
      });
    }
    // Also include default receiving account (110505 Caja General)
    map.set('110505', {
      conceptName: 'Recepción Cuota Efectivo (Caja General)',
      amount: quotaTemplate?.totalAmount || 50000,
      category: 'RECEIVING',
    });
    return map;
  }, [quotaTemplate]);

  // Saldos de cartera por cuenta (préstamos activos registrados en el servidor)
  const [loanInfoMap, setLoanInfoMap] = useState(new Map<string, { totalBalance: number; count: number; name?: string }>());
  useEffect(() => {
    loanApi
      .list({ status: 'ACTIVE' })
      .then((loans) => {
        const map = new Map<string, { totalBalance: number; count: number; name?: string }>();
        loans.forEach((l) => {
          const code = l.loanAccountCode || '136505';
          const prev = map.get(code) || { totalBalance: 0, count: 0, name: l.loanAccountName };
          map.set(code, { totalBalance: prev.totalBalance + Number(l.outstandingPrincipal), count: prev.count + 1, name: l.loanAccountName || prev.name });
        });
        setLoanInfoMap(map);
      })
      .catch(() => setLoanInfoMap(new Map()));
  }, []);

  // Ensure all configured accounts, loan accounts and their ancestors are marked active
  useEffect(() => {
    const baseCodes = [
      '110505',
      '13',
      '1365',
      '136505',
      '42',
      '4210',
      '421005',
    ];

    if (quotaTemplate && quotaTemplate.items) {
      quotaTemplate.items.forEach((i) => baseCodes.push(i.accountCode));
    }

    const codesToActivate = new Set<string>(baseCodes);
    
    // Add all ancestor codes (handling up to 8 digits e.g. 13650501)
    const allAncestors = new Set<string>();
    codesToActivate.forEach((c) => {
      allAncestors.add(c);
      let cur = c;
      while (cur.length > 1) {
        cur =
          cur.length === 8
            ? cur.slice(0, 6)
            : cur.length === 6
            ? cur.slice(0, 4)
            : cur.length === 4
            ? cur.slice(0, 2)
            : cur.slice(0, 1);
        allAncestors.add(cur);
      }
    });

    setAccounts((prev) => {
      const existingCodes = new Set(prev.map((a) => a.code));
      let changed = false;
      const combined = [...prev];
      STANDARD_PUC_CATALOG.forEach((std) => {
        if (!existingCodes.has(std.code)) {
          combined.push(std);
          existingCodes.add(std.code);
          changed = true;
        }
      });

      const next = combined.map((acc) => {
        if (allAncestors.has(acc.code) && !acc.isActive) {
          changed = true;
          return { ...acc, isActive: true };
        }
        return acc;
      });

      if (changed) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
      }

      return changed ? next : prev;
    });

    // Ensure ancestor nodes are expanded so the user sees the badges immediately
    setExpandedNodes((prev) => {
      let changed = false;
      const next = { ...prev };
      allAncestors.forEach((anc) => {
        if (!next[anc]) {
          next[anc] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [quotaTemplate]);

  // Filter accounts belonging to "Plan de Cuentas Propio" (isActive === true)
  const activeAccounts = useMemo(() => {
    if (filterOnlyQuotaAccounts) {
      const allowedCodes = new Set<string>();
      configuredAccountsMap.forEach((_, code) => {
        allowedCodes.add(code);
        let cur = code;
        while (cur.length > 1) {
          cur = cur.length === 8 ? cur.slice(0, 6) : cur.length === 6 ? cur.slice(0, 4) : cur.length === 4 ? cur.slice(0, 2) : cur.slice(0, 1);
          allowedCodes.add(cur);
        }
      });
      // Also allow loan codes and their ancestors
      ['136505', '421005'].forEach((c) => {
        allowedCodes.add(c);
        let cur = c;
        while (cur.length > 1) {
          cur = cur.length === 8 ? cur.slice(0, 6) : cur.length === 6 ? cur.slice(0, 4) : cur.length === 4 ? cur.slice(0, 2) : cur.slice(0, 1);
          allowedCodes.add(cur);
        }
      });
      return accounts.filter((a) => allowedCodes.has(a.code));
    }
    return accounts.filter((a) => a.isActive);
  }, [accounts, filterOnlyQuotaAccounts, configuredAccountsMap]);

  // Build hierarchical tree for active accounts
  const accountTree = useMemo(() => {
    // Filter by search query if any
    let filtered = activeAccounts;
    if (treeSearch.trim()) {
      const q = treeSearch.toLowerCase();
      // Match accounts and also their ancestors
      const matchingCodes = new Set<string>();
      activeAccounts.forEach((acc) => {
        if (acc.code.toLowerCase().includes(q) || acc.name.toLowerCase().includes(q)) {
          matchingCodes.add(acc.code);
          // Add parents
          let parent = acc.parentCode;
          while (parent) {
            matchingCodes.add(parent);
            const parentAcc = activeAccounts.find((p) => p.code === parent);
            parent = parentAcc?.parentCode;
          }
        }
      });
      filtered = activeAccounts.filter((a) => matchingCodes.has(a.code));
    }

    const nodeMap = new Map<string, PucTreeNode>();
    filtered.forEach((acc) => {
      nodeMap.set(acc.code, { ...acc, children: [] });
    });

    const rootNodes: PucTreeNode[] = [];

    filtered.forEach((acc) => {
      const node = nodeMap.get(acc.code)!;
      if (acc.parentCode && nodeMap.has(acc.parentCode)) {
        nodeMap.get(acc.parentCode)!.children.push(node);
      } else if (acc.level === 1) {
        rootNodes.push(node);
      } else {
        // If parent is not active, treat as root or find closest active ancestor
        rootNodes.push(node);
      }
    });

    // Prune empty folders (level < 4 with no active leaf children)
    const pruneEmptyFolders = (nodes: PucTreeNode[]): PucTreeNode[] => {
      return nodes
        .map((n) => ({
          ...n,
          children: pruneEmptyFolders(n.children),
        }))
        .filter((n) => n.level >= 4 || n.children.length > 0);
    };

    const cleanedRoots = pruneEmptyFolders(rootNodes);

    // Sort by code
    const sortNodes = (nodes: PucTreeNode[]) => {
      nodes.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
      nodes.forEach((n) => sortNodes(n.children));
    };

    sortNodes(cleanedRoots);
    return cleanedRoots;
  }, [activeAccounts, treeSearch]);

  // Toggle account activation in Catalog
  const handleToggleAccountActive = (code: string) => {
    let willBeActive = false;
    setAccounts((prev) => {
      const target = prev.find((a) => a.code === code);
      if (!target) return prev;
      willBeActive = !target.isActive;

      // If activating, also activate all parent ancestors
      const ancestorCodes = new Set<string>();
      if (willBeActive) {
        let cur = code;
        while (cur.length > 1) {
          cur = cur.length === 6 ? cur.slice(0, 4) : cur.length === 4 ? cur.slice(0, 2) : cur.slice(0, 1);
          ancestorCodes.add(cur);
        }
      }

      return prev.map((acc) => {
        if (acc.code === code) {
          return { ...acc, isActive: willBeActive };
        }
        if (ancestorCodes.has(acc.code)) {
          return { ...acc, isActive: true };
        }
        return acc;
      });
    });

    // Auto-expand ancestor nodes if activating
    setExpandedNodes((prev) => {
      const next = { ...prev };
      let cur = code;
      while (cur.length > 1) {
        cur = cur.length === 6 ? cur.slice(0, 4) : cur.length === 4 ? cur.slice(0, 2) : cur.slice(0, 1);
        next[cur] = true;
      }
      return next;
    });

    const targetAcc = accounts.find((a) => a.code === code);
    if (targetAcc) {
      showNotification(
        targetAcc.isActive
          ? `Cuenta ${code} removida de tu Plan`
          : `Cuenta ${code} agregada a tu Plan de Cuentas`
      );
    }
  };

  // Open modal to add custom subaccount under a parent
  const handleOpenAddSubaccount = (parent: PucAccount) => {
    setTargetParentAccount(parent);
    
    // Retrieve all standard/official PUC subaccount options for this parent
    const options = getPucSubaccountOptions(parent, accounts);
    
    // Prioritize the first available PUC subaccount that isn't active yet
    const firstAvailable = options.find((opt) => !opt.isAlreadyActive) || options[0];
    
    if (firstAvailable) {
      setSelectedPucOptionCode(firstAvailable.code);
      setCustomCode(firstAvailable.code);
      setCustomName(firstAvailable.name);
      setCustomRequiresThirdParty(firstAvailable.requiresThirdParty);
    } else {
      // Fallback: auto-suggested sequential custom code
      const children = accounts.filter((a) => a.parentCode === parent.code);
      let nextSuffix = '01';
      if (children.length > 0) {
        const highestCode = children
          .map((c) => parseInt(c.code.slice(parent.code.length) || '0', 10))
          .filter((n) => !isNaN(n))
          .sort((a, b) => b - a)[0];
        if (highestCode !== undefined) {
          nextSuffix = String(highestCode + 1).padStart(2, '0');
        }
      }
      setSelectedPucOptionCode('CUSTOM');
      setCustomCode(`${parent.code}${nextSuffix}`);
      setCustomName(`${parent.name.toUpperCase()} - PRINCIPAL`);
      setCustomRequiresThirdParty(parent.requiresThirdParty || false);
    }

    setIsManualCodeEdit(false);
    setPucSelectorSearch('');
    setIsCustomSubaccountModalOpen(true);
  };

  // When user selects a subaccount option from the selector dropdown
  const handleSelectPucAccountOption = (code: string) => {
    setSelectedPucOptionCode(code);
    if (!targetParentAccount) return;

    if (code === 'CUSTOM') {
      const children = accounts.filter((a) => a.parentCode === targetParentAccount.code);
      let nextSuffix = '01';
      if (children.length > 0) {
        const highestCode = children
          .map((c) => parseInt(c.code.slice(targetParentAccount.code.length) || '0', 10))
          .filter((n) => !isNaN(n))
          .sort((a, b) => b - a)[0];
        if (highestCode !== undefined) {
          nextSuffix = String(highestCode + 1).padStart(2, '0');
        }
      }
      setCustomCode(`${targetParentAccount.code}${nextSuffix}`);
      setCustomName('');
      return;
    }

    const options = getPucSubaccountOptions(targetParentAccount, accounts);
    const chosen = options.find((o) => o.code === code);
    if (chosen) {
      setCustomCode(chosen.code);
      setCustomName(chosen.name);
      setCustomRequiresThirdParty(chosen.requiresThirdParty);
    }
  };

  // Save new or activated subaccount
  const handleSaveCustomSubaccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetParentAccount || !customCode.trim() || !customName.trim()) return;

    const trimmedCode = customCode.trim();
    const existing = accounts.find((a) => a.code === trimmedCode);

    if (existing && existing.isActive) {
      alert(`La subcuenta ${trimmedCode} ya está activa en tu Plan de Cuentas.`);
      return;
    }

    if (existing && !existing.isActive) {
      // Reactivate existing catalog account
      setAccounts((prev) =>
        prev.map((a) =>
          a.code === trimmedCode
            ? {
                ...a,
                name: customName.trim().toUpperCase(),
                isActive: true,
                requiresThirdParty: customRequiresThirdParty,
              }
            : a
        )
      );
    } else {
      // Create new subaccount
      const level = trimmedCode.length <= 4 ? 3 : trimmedCode.length <= 6 ? 4 : 5;
      const newSubaccount: PucAccount = {
        id: `acc-${trimmedCode}`,
        code: trimmedCode,
        name: customName.trim().toUpperCase(),
        level,
        nature: targetParentAccount.nature,
        parentCode: targetParentAccount.code,
        parentId: targetParentAccount.id,
        requiresThirdParty: customRequiresThirdParty,
        isActive: true,
        isCustom: true,
      };
      setAccounts((prev) => [...prev, newSubaccount]);
    }

    // Ensure parent and ancestors are expanded in the tree
    setExpandedNodes((prev) => {
      const next = { ...prev, [targetParentAccount.code]: true };
      let cur = targetParentAccount.code;
      while (cur.length > 1) {
        cur = cur.length === 6 ? cur.slice(0, 4) : cur.length === 4 ? cur.slice(0, 2) : cur.slice(0, 1);
        next[cur] = true;
      }
      return next;
    });

    setIsCustomSubaccountModalOpen(false);
    showNotification(`Subcuenta ${trimmedCode} - ${customName.trim().toUpperCase()} agregada con éxito a tu Plan`);
  };

  // Open Edit account modal
  const handleOpenEditAccount = (acc: PucAccount) => {
    setEditingAccount(acc);
    setEditName(acc.name);
    setIsEditModalOpen(true);
  };

  // Save edited account
  const handleSaveEditAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount || !editName.trim()) return;

    setAccounts((prev) =>
      prev.map((a) => {
        if (a.code === editingAccount.code) {
          return { ...a, name: editName.trim() };
        }
        return a;
      })
    );

    setIsEditModalOpen(false);
    showNotification(`Cuenta ${editingAccount.code} actualizada`);
  };

  // Delete custom subaccount or deactivate standard account
  const handleRemoveAccount = (acc: PucAccount) => {
    if (confirm(`¿Deseas remover la cuenta ${acc.code} - ${acc.name} de tu Plan de Cuentas Propio?`)) {
      if (acc.isCustom) {
        setAccounts((prev) => prev.filter((a) => a.code !== acc.code));
      } else {
        setAccounts((prev) =>
          prev.map((a) => (a.code === acc.code ? { ...a, isActive: false } : a))
        );
      }
      showNotification(`Cuenta ${acc.code} removida de tu plan`);
    }
  };

  // Catalog filtered items
  const catalogFilteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      // Class filter
      if (selectedClassFilter !== 'all') {
        if (!acc.code.startsWith(selectedClassFilter)) return false;
      }
      // Search
      if (catalogSearch.trim()) {
        const q = catalogSearch.toLowerCase();
        return acc.code.toLowerCase().includes(q) || acc.name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [accounts, selectedClassFilter, catalogSearch]);

  // Subaccount options for targetParentAccount in modal
  const currentSubaccountOptions = useMemo(() => {
    if (!targetParentAccount) return [];
    const all = getPucSubaccountOptions(targetParentAccount, accounts);
    if (!pucSelectorSearch.trim()) return all;
    const q = pucSelectorSearch.toLowerCase().trim();
    return all.filter((o) => o.code.toLowerCase().includes(q) || o.name.toLowerCase().includes(q));
  }, [targetParentAccount, accounts, pucSelectorSearch]);

  const isSelectedSubaccountAlreadyActive = useMemo(() => {
    return accounts.some((a) => a.code === customCode.trim() && a.isActive);
  }, [accounts, customCode]);


  // Bulk activate all in current catalog search
  const handleBulkActivate = (activate: boolean) => {
    const codesToUpdate = new Set(catalogFilteredAccounts.map((a) => a.code));
    const ancestors = new Set<string>();
    if (activate) {
      codesToUpdate.forEach((c) => {
        let cur = c;
        while (cur.length > 1) {
          cur = cur.length === 6 ? cur.slice(0, 4) : cur.length === 4 ? cur.slice(0, 2) : cur.slice(0, 1);
          ancestors.add(cur);
        }
      });
    }

    setAccounts((prev) =>
      prev.map((acc) => {
        if (codesToUpdate.has(acc.code)) {
          return { ...acc, isActive: activate };
        }
        if (ancestors.has(acc.code)) {
          return { ...acc, isActive: true };
        }
        return acc;
      })
    );

    if (activate) {
      setExpandedNodes((prev) => {
        const next = { ...prev };
        ancestors.forEach((anc) => {
          next[anc] = true;
        });
        return next;
      });
    }

    showNotification(
      `${catalogFilteredAccounts.length} cuentas ${activate ? 'activadas' : 'desactivadas'} en tu Plan`
    );
  };

  // Render a single tree node recursively with exact visual tree connector lines
  const renderTreeNode = (node: PucTreeNode, depth: number = 0, _isLastChild: boolean = false) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.code] ?? (node.level <= 2);

    // Font styling according to level (matching screenshot)
    const getLevelTypography = () => {
      if (node.level === 1) {
        return 'font-bold text-[14px] text-slate-900 uppercase tracking-wide';
      }
      if (node.level === 2) {
        return 'font-semibold text-[13px] text-slate-800 uppercase tracking-normal';
      }
      if (node.level === 3) {
        return 'font-medium text-[13px] text-slate-700 capitalize';
      }
      if (node.level === 4) {
        return 'font-normal text-[13px] text-slate-600';
      }
      return 'font-medium text-[13px] text-slate-800 uppercase tracking-tight';
    };

    return (
      <div key={node.code} className="relative select-none">
        {/* Row Container */}
        <div
          className={`group flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors ${
            node.level === 1 ? 'mt-2 border-b border-slate-100/80 pb-2' : ''
          }`}
          style={{ paddingLeft: `${depth * 28 + 8}px` }}
        >
          {/* Left Branch: Chevron + Code + Name */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Expand / Collapse Icon */}
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleNode(node.code)}
                className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer shrink-0 transition-transform"
                title={isExpanded ? 'Contraer' : 'Expandir'}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="w-4 h-4 inline-block shrink-0" />
            )}

            {/* Code */}
            <span
              className={`font-mono text-slate-800 shrink-0 ${
                node.level === 1 ? 'font-bold text-[14px]' : 'font-semibold text-[13px]'
              }`}
              style={{ minWidth: `${node.level === 1 ? '20px' : '65px'}` }}
            >
              {node.code}
            </span>

            {/* Name */}
            <span className={`truncate ${getLevelTypography()}`} title={node.name}>
              {node.name}
            </span>

            {/* Subcuenta Propia Tag */}
            {node.isCustom && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 rounded border border-indigo-200 shrink-0">
                A la medida
              </span>
            )}

            {/* Third party required pill */}
            {node.requiresThirdParty && (
              <span className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-semibold bg-slate-100 text-slate-500 rounded border border-slate-200 shrink-0">
                Tercero
              </span>
            )}

            {/* Tag / Badge for Configured Quota Account */}
            {configuredAccountsMap.has(node.code) && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                  configuredAccountsMap.get(node.code)!.category === 'RECEIVING'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : configuredAccountsMap.get(node.code)!.category === 'EQUITY_SAVING'
                    ? 'bg-purple-50 text-purple-800 border border-purple-300'
                    : configuredAccountsMap.get(node.code)!.category === 'INCOME'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-sky-50 text-sky-800 border border-sky-300'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span>
                  {configuredAccountsMap.get(node.code)!.category === 'RECEIVING' ? 'Recepción' : 'Cuota'}: ${configuredAccountsMap.get(node.code)!.amount.toLocaleString('es-CO')} · {configuredAccountsMap.get(node.code)!.conceptName}
                </span>
              </span>
            )}

            {/* Tag / Badge for Loan Portfolio Principal */}
            {(node.code === '136505' || loanInfoMap.has(node.code)) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-300 shrink-0 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                <span>
                  {loanInfoMap.has(node.code) && loanInfoMap.get(node.code)!.count > 0
                    ? `Cartera Préstamos: $${loanInfoMap.get(node.code)!.totalBalance.toLocaleString('es-CO')} (${loanInfoMap.get(node.code)!.count} crédito${loanInfoMap.get(node.code)!.count > 1 ? 's' : ''})`
                    : 'Cartera de Préstamos a Asociados'}
                </span>
              </span>
            )}

            {/* Tag / Badge for Loan Interest Account */}
            {node.code === '421005' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 shrink-0 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                <span>Ingresos por Intereses de Préstamos</span>
              </span>
            )}
          </div>

          {/* Right Actions: Appears on Hover */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-opacity shrink-0 pr-1">
            {/* Add Subaccount Button */}
            {node.level >= 3 && node.level < 5 && (
              <button
                type="button"
                onClick={() => handleOpenAddSubaccount(node)}
                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                title={`Agregar subcuenta bajo ${node.code} ${node.name}`}
              >
                <Plus size={14} />
              </button>
            )}

            {/* Edit Name Button */}
            <button
              type="button"
              onClick={() => handleOpenEditAccount(node)}
              className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 rounded transition-colors cursor-pointer"
              title="Editar nombre de la cuenta"
            >
              <Edit2 size={13} />
            </button>

            {/* Delete / Deactivate */}
            {node.level >= 4 && (
              <button
                type="button"
                onClick={() => handleRemoveAccount(node)}
                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                title="Remover de mi Plan de Cuentas"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Children Rows with Connecting Line */}
        {hasChildren && isExpanded && (
          <div className="relative">
            {/* Vertical Guide Line */}
            <div
              className="absolute left-0 top-0 bottom-3 w-px bg-slate-200/80"
              style={{ left: `${depth * 28 + 15}px` }}
            />
            {node.children.map((child, idx) =>
              renderTreeNode(child, depth + 1, idx === node.children.length - 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 text-white rounded-xl shadow-xl text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP HEADER & MAIN ACTION BUTTON (MATCHING SCREENSHOT)                  */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Plan de Cuentas Propio
          </h1>
          <p className="text-xs text-slate-500 max-w-3xl mt-1 leading-relaxed">
            Aunque el Plan Único de Cuentas (PUC) ya está configurado, la contabilidad normalmente debe
            ser parametrizada con subcuentas hechas a la medida para cada empresa.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Button: Configurar Cuentas de Cuota */}
          <button
            type="button"
            onClick={() => setIsQuotaConfigModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-medium text-xs transition-colors shadow-2xs hover:shadow cursor-pointer"
            title="Configurar cuentas contables asignadas a la cuota"
          >
            <Settings size={15} className="text-slate-600" />
            <span>Configurar Cuota</span>
          </button>

          {/* Button: + Agregar del PUC estándar */}
          <button
            onClick={() => setIsCatalogModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium text-xs transition-colors shadow-2xs cursor-pointer"
          >
            <Plus size={16} />
            <span>Agregar del PUC estándar</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CARD WITH ACTIONS AND TREE VIEW                                        */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
        {/* Card Header Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-5 mb-4 border-b border-slate-100">
          {/* Search Input for Tree */}
          <div className="relative max-w-sm flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={treeSearch}
              onChange={(e) => setTreeSearch(e.target.value)}
              placeholder="Buscar en mis cuentas por código o nombre..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            {treeSearch && (
              <button
                onClick={() => setTreeSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Right Toolbar Actions */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-600 sm:justify-end">
            {/* Toggle: Filtrar solo cuentas de cuota */}
            <button
              type="button"
              onClick={() => setFilterOnlyQuotaAccounts(!filterOnlyQuotaAccounts)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                filterOnlyQuotaAccounts
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
              }`}
              title="Aislar solo las cuentas vinculadas a la cuota en el árbol"
            >
              <Filter size={13} className={filterOnlyQuotaAccounts ? 'text-indigo-600' : 'text-slate-400'} />
              <span>{filterOnlyQuotaAccounts ? 'Solo Cuentas Cuota' : 'Filtrar Cuentas Cuota'}</span>
            </button>
            {/* Compartir PUC */}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer py-1"
            >
              <Share2 size={14} className="text-slate-400" />
              <span>Compartir PUC</span>
            </button>

            {/* Importar PUC */}
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer py-1"
            >
              <Upload size={14} className="text-slate-400" />
              <span>Importar PUC</span>
            </button>

            {/* Colapsar / Expandir Todo */}
            <div className="flex items-center gap-1 pl-1 border-l border-slate-200">
              <button
                type="button"
                onClick={handleCollapseAll}
                className="inline-flex items-center gap-1 px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                title="Colapsar todas las carpetas"
              >
                <Minimize2 size={13} className="text-slate-400" />
                <span>Colapsar todo</span>
              </button>
              <button
                type="button"
                onClick={handleExpandAll}
                className="inline-flex items-center gap-1 px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                title="Expandir todas las carpetas"
              >
                <Maximize2 size={13} className="text-slate-400" />
                <span>Expandir</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tree Container */}
        <div className="py-2 min-h-[450px]">
          {accountTree.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Layers size={36} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold text-slate-700">No hay cuentas que coincidan</p>
              <p className="text-xs text-slate-500 mt-1">
                Puedes agregar nuevas cuentas desde el catálogo haciendo clic en "+ Agregar del PUC estándar".
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {accountTree.map((rootNode) => renderTreeNode(rootNode, 0))}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            Mostrando <strong>{activeAccounts.length}</strong> cuentas activas en tu Plan Propio
          </span>
          <span className="text-slate-400">
            Formato: 1 Clase · 2 Grupo · 4 Cuenta · 6 Subcuenta · 8 Auxiliar
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODAL: AGREGAR DEL PUC ESTÁNDAR (SELECTOR DESDE LA BASE DE DATOS)       */}
      {/* ========================================================================= */}
      {isCatalogModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
            onClick={() => setIsCatalogModalOpen(false)}
          >
            <div
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        Agregar Cuentas del PUC Estándar
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        Catálogo NIIF
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Selecciona las cuentas del catálogo oficial que deseas activar en tu Plan de Cuentas Propio.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCatalogModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Cerrar modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Filter Tabs & Search Bar */}
              <div className="p-4 bg-slate-50/80 border-b border-slate-100 space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1 w-full">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      placeholder="Buscar por código (ej: 1105) o por nombre (ej: Caja, Proveedores, IVA)..."
                      className="w-full pl-10 pr-9 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 shadow-xs"
                      autoFocus
                    />
                    {catalogSearch && (
                      <button
                        type="button"
                        onClick={() => setCatalogSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Bulk Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleBulkActivate(true)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
                    >
                      Activar visibles
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkActivate(false)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
                    >
                      Desactivar visibles
                    </button>
                  </div>
                </div>

                {/* Class Pills (no scrollbar) */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {[
                    { id: 'all', label: 'Todas' },
                    { id: '1', label: '1 Activo' },
                    { id: '2', label: '2 Pasivo' },
                    { id: '3', label: '3 Patrimonio' },
                    { id: '4', label: '4 Ingresos' },
                    { id: '5', label: '5 Gastos' },
                    { id: '6', label: '6 Costos de Ventas' },
                    { id: '7', label: '7 Costos de Operación' },
                    { id: '8', label: '8 Cuentas de Orden D.' },
                    { id: '9', label: '9 Cuentas de Orden A.' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedClassFilter(tab.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                        selectedClassFilter === tab.id
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Catalog List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {catalogFilteredAccounts.length === 0 ? (
                  <div className="py-16 text-center text-slate-400">
                    <p className="text-sm font-semibold">No se encontraron cuentas en el catálogo</p>
                    <p className="text-xs text-slate-500 mt-1">Intenta con otro código o término de búsqueda.</p>
                  </div>
                ) : (
                  catalogFilteredAccounts.map((account) => {
                    return (
                      <div
                        key={account.code}
                        onClick={() => handleToggleAccountActive(account.code)}
                        className={`flex items-center justify-between py-2.5 px-6 transition-colors cursor-pointer ${
                          account.isActive ? 'bg-slate-50/70 hover:bg-slate-100/80' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Single Clean Checkbox */}
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                              account.isActive
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'border border-slate-300 bg-white'
                            }`}
                          >
                            {account.isActive && <Check size={12} strokeWidth={2.5} />}
                          </div>

                          {/* Code */}
                          <span className="font-mono font-bold text-xs text-slate-900 w-16 shrink-0">
                            {account.code}
                          </span>

                          {/* Name */}
                          <div className="min-w-0 truncate">
                            <span className="text-xs font-semibold text-slate-800">
                              {account.name}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-2 font-normal">
                              {account.nature === 'DEBIT' ? 'Débito' : 'Crédito'} · Nivel {account.level}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0 ml-3">
                          {account.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              <Check size={11} strokeWidth={2.5} />
                              <span>En mi Plan</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors">
                              + Agregar
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/90 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Seleccionadas <strong className="text-slate-800 font-semibold">{activeAccounts.length}</strong> de <strong className="text-slate-800 font-semibold">{accounts.length}</strong> cuentas disponibles
                </span>
                <button
                  type="button"
                  onClick={() => setIsCatalogModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition-colors cursor-pointer shadow-xs"
                >
                  Listo, volver a mi Plan
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* 4. MODAL: CREAR SUBCUENTA A LA MEDIDA (EJ: 11100501 BANCOLOMBIA)          */}
      {/* ========================================================================= */}
      {isCustomSubaccountModalOpen &&
        targetParentAccount &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
            onClick={() => setIsCustomSubaccountModalOpen(false)}
          >
            <div
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 flex items-center justify-center">
                    <Layers size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        Seleccionar Subcuenta PUC
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Catálogo Oficial PUC
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Selecciona una subcuenta oficial del PUC o personalízala bajo la cuenta mayor.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomSubaccountModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Cerrar modal"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveCustomSubaccount}>
                <div className="p-6 space-y-4">
                  {/* Cuenta Padre Info Card */}
                  <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                        Cuenta Padre (Mayor)
                      </label>
                      <div className="text-xs font-bold text-slate-800">
                        {targetParentAccount.code} — {targetParentAccount.name}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200 shrink-0">
                      Nivel {targetParentAccount.level} • {targetParentAccount.nature === 'DEBIT' ? 'Débito' : 'Crédito'}
                    </span>
                  </div>

                  {/* Selector con las Cuentas PUC */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles size={13} className="text-indigo-600" />
                        <span>Subcuenta del Catálogo PUC *</span>
                      </label>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {currentSubaccountOptions.length} opción(es) disponibles
                      </span>
                    </div>

                    {/* Filter search if multiple options */}
                    {getPucSubaccountOptions(targetParentAccount, accounts).length > 4 && (
                      <div className="relative mb-2">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={pucSelectorSearch}
                          onChange={(e) => setPucSelectorSearch(e.target.value)}
                          placeholder="Filtrar por código o nombre..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white placeholder:text-slate-400"
                        />
                        {pucSelectorSearch && (
                          <button
                            type="button"
                            onClick={() => setPucSelectorSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    )}

                    {/* Dropdown Selector */}
                    <div className="relative">
                      <select
                        value={selectedPucOptionCode}
                        onChange={(e) => handleSelectPucAccountOption(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs cursor-pointer appearance-none pr-10"
                      >
                        <optgroup label="Cuentas Oficiales del Catálogo PUC">
                          {currentSubaccountOptions.map((opt) => (
                            <option key={opt.code} value={opt.code}>
                              {opt.code} — {opt.name} {opt.isAlreadyActive ? '✓ (Ya activa en tu Plan)' : ''}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Opciones Adicionales">
                          <option value="CUSTOM">➕ Subcuenta Personalizada (Generar código automático)</option>
                        </optgroup>
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </div>

                  {/* Código Asignado - Carga Automática */}
                  <div>
                    <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                          Código Asignado por el Selector
                        </span>
                        <span className="text-sm font-mono font-bold text-indigo-950">
                          {customCode || '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-100/80 text-indigo-800 border border-indigo-200">
                          <CheckCircle2 size={11} className="text-indigo-600" />
                          {selectedPucOptionCode === 'CUSTOM' ? 'Código Automático' : 'Oficial PUC'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsManualCodeEdit(!isManualCodeEdit)}
                          className="text-[10px] text-slate-500 hover:text-slate-800 underline px-1 cursor-pointer"
                        >
                          {isManualCodeEdit ? 'Bloquear código' : 'Editar código'}
                        </button>
                      </div>
                    </div>

                    {isManualCodeEdit && (
                      <div className="mt-2 animate-in fade-in duration-100">
                        <input
                          type="text"
                          required
                          value={customCode}
                          onChange={(e) => setCustomCode(e.target.value)}
                          placeholder="Ej: 11050501"
                          className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Modo manual activado: escribe el código numérico deseado.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Nombre de la Subcuenta */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nombre de la Subcuenta *
                    </label>
                    <input
                      type="text"
                      required
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Ej: CAJA GENERAL PRINCIPAL"
                      className="w-full px-3.5 py-2.5 text-xs uppercase font-medium bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Cargado automáticamente desde el PUC. Puedes personalizarlo si lo requieres.
                    </p>
                  </div>

                  {/* Exige movimiento a nivel de Tercero */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="requiresThirdPartyCheck"
                      checked={customRequiresThirdParty}
                      onChange={(e) => setCustomRequiresThirdParty(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-400 accent-indigo-600 cursor-pointer"
                    />
                    <label htmlFor="requiresThirdPartyCheck" className="text-xs text-slate-700 cursor-pointer select-none">
                      Exige movimiento a nivel de Tercero (NIT / Cédula)
                    </label>
                  </div>

                  {/* Banner si ya está activa */}
                  {isSelectedSubaccountAlreadyActive && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-800 text-xs font-medium animate-in fade-in">
                      <Info size={15} className="shrink-0 text-amber-600" />
                      <span>
                        La subcuenta <strong>{customCode}</strong> ya se encuentra activa en tu Plan de Cuentas.
                      </span>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50/90">
                  <button
                    type="button"
                    onClick={() => setIsCustomSubaccountModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSelectedSubaccountAlreadyActive || !customName.trim()}
                    className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 ${
                      isSelectedSubaccountAlreadyActive || !customName.trim()
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25'
                    }`}
                  >
                    <Plus size={14} />
                    <span>{isSelectedSubaccountAlreadyActive ? 'Subcuenta ya activa' : 'Agregar Subcuenta al Plan'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* 5. MODAL: EDITAR NOMBRE DE CUENTA                                          */}
      {/* ========================================================================= */}
      {isEditModalOpen &&
        editingAccount &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
            onClick={() => setIsEditModalOpen(false)}
          >
            <div
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                    <Edit2 size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        Editar Cuenta Contable
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        Nivel {editingAccount.level}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Actualiza la denominación de la cuenta seleccionada.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Cerrar modal"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEditAccount}>
                <div className="p-6 space-y-4">
                  <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5">
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Código PUC
                    </label>
                    <div className="font-mono text-xs font-bold text-slate-800">
                      {editingAccount.code}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Nombre de la Cuenta *
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50/90">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition-colors shadow-xs cursor-pointer"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* 6. MODAL: COMPARTIR / EXPORTAR PUC                                        */}
      {/* ========================================================================= */}
      {isShareModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
            onClick={() => setIsShareModalOpen(false)}
          >
            <div
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                    <Share2 size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        Exportar o Compartir
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        Plan de Cuentas
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Descarga tu catálogo en formato CSV o copia la estructura.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Cerrar modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    const csv = [
                      'Código,Nombre,Nivel,Naturaleza,Activa',
                      ...activeAccounts.map(
                        (a) => `"${a.code}","${a.name}",${a.level},"${a.nature}","${a.isActive}"`
                      ),
                    ].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', 'Plan_Cuentas_Propio_Konta.csv');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    setIsShareModalOpen(false);
                    showNotification('Archivo CSV exportado exitosamente');
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                      <Download size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Exportar archivo CSV / Excel</span>
                      <span className="text-[11px] text-slate-500">Compatible con Excel y software contables</span>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const data = JSON.stringify(activeAccounts, null, 2);
                    navigator.clipboard.writeText(data);
                    setIsShareModalOpen(false);
                    showNotification('Estructura copiada al portapapeles');
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                      <FileSpreadsheet size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Copiar JSON al portapapeles</span>
                      <span className="text-[11px] text-slate-500">Para importar en otra sede o entorno</span>
                    </div>
                  </div>
                </button>
              </div>

              <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 bg-slate-50/90">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* 7. MODAL: IMPORTAR PUC                                                    */}
      {/* ========================================================================= */}
      {isImportModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
            onClick={() => setIsImportModalOpen(false)}
          >
            <div
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                    <Upload size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        Importar Plan de Cuentas
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        Catálogo Oficial
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cargar catálogo oficial colombiano o sincronizar desde el servidor.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Cerrar modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Info size={14} className="text-slate-600" />
                    <span>Catálogo Oficial Colombiano</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    El sistema incluye el catálogo oficial completo del PUC Comerciantes y Sector Solidario (con más de 2,500 cuentas pre-clasificadas).
                  </p>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAccounts(STANDARD_PUC_CATALOG);
                      setIsImportModalOpen(false);
                      showNotification('Catálogo oficial restablecido');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition-colors shadow-xs cursor-pointer"
                  >
                    <Sparkles size={14} />
                    <span>Restablecer Catálogo Oficial Recomendado</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      httpClient
                        .post('/accounts/import-default-puc')
                        .then((res) => {
                          showNotification(`Backend sincronizado: ${res.data?.totalImported || 'Éxito'}`);
                          setIsImportModalOpen(false);
                        })
                        .catch(() => {
                          alert('El backend Spring Boot no está disponible en este momento. Se utilizará el almacenamiento local.');
                        });
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet size={14} />
                    <span>Sincronizar con Archivo Excel del Servidor</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 bg-slate-50/90">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIGURAR CUOTAS Y CUENTAS P.U.C.                                 */}
      {/* ========================================================================= */}
      {isQuotaConfigModalOpen && (
        <QuotaTemplateConfigView
          isModal
          onClose={() => setIsQuotaConfigModalOpen(false)}
          onSaved={() => {
            setIsQuotaConfigModalOpen(false);
            refreshQuotaTemplate();
            showNotification('Configuración de cuentas P.U.C. actualizada');
          }}
        />
      )}
    </div>
  );
};
