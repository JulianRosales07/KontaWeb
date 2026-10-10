import React, { createContext, useContext, useMemo } from 'react';
import type { FinancialReportsRepository } from '../domain/ports/out/FinancialReportsRepository';
import { HttpFinancialReportsRepository } from '../infrastructure/api/HttpFinancialReportsRepository';
import { MockFinancialReportsRepository } from '../infrastructure/mock/MockFinancialReportsRepository';
import { httpClient } from '../../../shared/infrastructure/http/httpClient';
import { GetFinancialReportsUseCase } from '../application/usecases/GetFinancialReportsUseCase';

export interface FinancialReportsDependencies {
  repository: FinancialReportsRepository;
  reportsUseCase: GetFinancialReportsUseCase;
}

const FinancialReportsContext = createContext<FinancialReportsDependencies | null>(null);

export interface FinancialReportsProviderProps {
  children: React.ReactNode;
  repositoryOverride?: FinancialReportsRepository;
}

export const FinancialReportsProvider: React.FC<FinancialReportsProviderProps> = ({
  children,
  repositoryOverride,
}) => {
  const dependencies = useMemo<FinancialReportsDependencies>(() => {
    const mockRepo = new MockFinancialReportsRepository();
    const repository =
      repositoryOverride || new HttpFinancialReportsRepository(httpClient, mockRepo);

    return {
      repository,
      reportsUseCase: new GetFinancialReportsUseCase(repository),
    };
  }, [repositoryOverride]);

  return (
    <FinancialReportsContext.Provider value={dependencies}>
      {children}
    </FinancialReportsContext.Provider>
  );
};

export const useFinancialReportsDependencies = (): FinancialReportsDependencies => {
  const context = useContext(FinancialReportsContext);
  if (!context) {
    throw new Error(
      'useFinancialReportsDependencies debe usarse dentro de un <FinancialReportsProvider>'
    );
  }
  return context;
};
