import type { EquivalentDocRepository } from '../../domain/ports/out/EquivalentDocRepository';
import type {
  EquivalentDocumentRequest,
  EquivalentDocumentResponse,
} from '../../domain/models/EquivalentDocument';
import { ValidationError } from '../../../../shared/domain/errors/DomainError';

export class CreateEquivalentDocUseCase {
  private readonly repository: EquivalentDocRepository;

  constructor(repository: EquivalentDocRepository) {
    this.repository = repository;
  }

  public async execute(
    request: EquivalentDocumentRequest
  ): Promise<EquivalentDocumentResponse> {
    if (!request.documentNumber?.trim()) {
      throw new ValidationError('El número de documento es requerido.');
    }
    if (!request.thirdPartyIdentification?.trim()) {
      throw new ValidationError('La identificación del prestador/tercero es requerida.');
    }
    if (!request.subtotal || request.subtotal <= 0) {
      throw new ValidationError('El subtotal debe ser un valor mayor a cero.');
    }
    if (!request.expenseAccountCode?.trim()) {
      throw new ValidationError('El código de cuenta de gasto (PUC) es requerido.');
    }

    return this.repository.createEquivalentDocument(request);
  }
}
