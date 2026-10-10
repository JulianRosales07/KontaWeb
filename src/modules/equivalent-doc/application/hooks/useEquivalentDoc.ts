import { useState, useCallback } from 'react';
import type {
  EquivalentDocumentRequest,
  EquivalentDocumentResponse,
} from '../../domain/models/EquivalentDocument';
import { EquivalentDocCalculator } from '../../domain/services/EquivalentDocCalculator';
import { useEquivalentDocDependencies } from '../../di/EquivalentDocContext';

export function useEquivalentDoc() {
  const { createEquivalentDocUseCase } = useEquivalentDocDependencies();

  const [formData, setFormData] = useState<EquivalentDocumentRequest>({
    documentNumber: EquivalentDocCalculator.generateDocumentNumber(),
    thirdPartyIdentification: '1020304050',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    expenseAccountCode: '513505',
    subtotal: 1500000,
    taxTemplateIds: [],
    description: 'Servicios de soporte técnico y mantenimiento correctivo de redes',
    payImmediately: true,
    cashAccountCode: '110505',
  });

  const [retentionRate, setRetentionRate] = useState<number>(0.04);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<EquivalentDocumentResponse | null>(null);
  const [history, setHistory] = useState<EquivalentDocumentResponse[]>([]);

  const calculations = EquivalentDocCalculator.calculateRetention(formData.subtotal, retentionRate);

  const submitDocument = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      setLoading(true);
      setError(null);
      try {
        const response = await createEquivalentDocUseCase.execute(formData);
        setLastResult(response);
        setHistory((prev) => [response, ...prev]);
        setFormData((prev) => ({
          ...prev,
          documentNumber: EquivalentDocCalculator.generateDocumentNumber(),
        }));
        return response;
      } catch (err: any) {
        const msg = err?.message || 'Error emitiendo el documento equivalente.';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [createEquivalentDocUseCase, formData]
  );

  return {
    formData,
    setFormData,
    retentionRate,
    setRetentionRate,
    loading,
    error,
    lastResult,
    history,
    calculations,
    submitDocument,
  };
}
