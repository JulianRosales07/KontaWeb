import type { ReceivableAgingReport } from '../models/ReceivableAgingReport';
import type { CustomerAging } from '../models/CustomerAging';

export type DelinquencyRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export class CarteraDomainService {
  public static calculateCriticalDelinquency(report: ReceivableAgingReport | null): number {
    if (!report) return 0;
    return (report.total61To90 || 0) + (report.totalOver90 || 0);
  }

  public static calculatePercentage(amount: number, total: number): number {
    if (!total || total <= 0) return 0;
    return Math.round(((amount / total) * 100 + Number.EPSILON) * 10) / 10;
  }

  public static evaluateCustomerRisk(customer: CustomerAging): DelinquencyRiskLevel {
    if (customer.balanceOver90 > 0) return 'CRITICAL';
    if (customer.balance61To90 > 0) return 'HIGH';
    if (customer.balance31To60 > 0 || customer.balance1To30 > 0) return 'MEDIUM';
    return 'LOW';
  }

  public static formatCOP(value: number | undefined): string {
    if (value === undefined || isNaN(value)) return '$ 0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
