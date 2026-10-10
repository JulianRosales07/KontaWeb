export class EquivalentDocCalculator {
  /**
   * Calcula el valor de retención en la fuente y el neto a pagar.
   */
  public static calculateRetention(subtotal: number, rate: number): {
    retentionAmount: number;
    netAmount: number;
  } {
    const safeSubtotal = Math.max(0, subtotal || 0);
    const safeRate = Math.max(0, rate || 0);

    const retentionAmount = Math.round((safeSubtotal * safeRate + Number.EPSILON) * 100) / 100;
    const netAmount = Math.round((safeSubtotal - retentionAmount + Number.EPSILON) * 100) / 100;

    return {
      retentionAmount,
      netAmount,
    };
  }

  /**
   * Genera un número consecutivo de documento equivalente en borrador.
   */
  public static generateDocumentNumber(): string {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `DS-${random}`;
  }
}
