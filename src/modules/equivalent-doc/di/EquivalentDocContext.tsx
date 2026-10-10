import React, { createContext, useContext, useMemo } from 'react';
import type { EquivalentDocRepository } from '../domain/ports/out/EquivalentDocRepository';
import { HttpEquivalentDocRepository } from '../infrastructure/api/HttpEquivalentDocRepository';
import { MockEquivalentDocRepository } from '../infrastructure/mock/MockEquivalentDocRepository';
import { httpClient } from '../../../shared/infrastructure/http/httpClient';
import { CreateEquivalentDocUseCase } from '../application/usecases/CreateEquivalentDocUseCase';

export interface EquivalentDocDependencies {
  repository: EquivalentDocRepository;
  createEquivalentDocUseCase: CreateEquivalentDocUseCase;
}

const EquivalentDocContext = createContext<EquivalentDocDependencies | null>(null);

export interface EquivalentDocProviderProps {
  children: React.ReactNode;
  repositoryOverride?: EquivalentDocRepository;
}

export const EquivalentDocProvider: React.FC<EquivalentDocProviderProps> = ({
  children,
  repositoryOverride,
}) => {
  const dependencies = useMemo<EquivalentDocDependencies>(() => {
    const mockRepo = new MockEquivalentDocRepository();
    const repository =
      repositoryOverride || new HttpEquivalentDocRepository(httpClient, mockRepo);

    return {
      repository,
      createEquivalentDocUseCase: new CreateEquivalentDocUseCase(repository),
    };
  }, [repositoryOverride]);

  return (
    <EquivalentDocContext.Provider value={dependencies}>
      {children}
    </EquivalentDocContext.Provider>
  );
};

export const useEquivalentDocDependencies = (): EquivalentDocDependencies => {
  const context = useContext(EquivalentDocContext);
  if (!context) {
    throw new Error(
      'useEquivalentDocDependencies debe usarse dentro de un <EquivalentDocProvider>'
    );
  }
  return context;
};
