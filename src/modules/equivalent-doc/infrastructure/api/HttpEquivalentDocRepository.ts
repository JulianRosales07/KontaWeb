import type { AxiosInstance } from 'axios';
import type { EquivalentDocRepository } from '../../domain/ports/out/EquivalentDocRepository';
import type {
  EquivalentDocumentRequest,
  EquivalentDocumentResponse,
} from '../../domain/models/EquivalentDocument';
import { NetworkError } from '../../../../shared/domain/errors/DomainError';

export class HttpEquivalentDocRepository implements EquivalentDocRepository {
  private readonly http: AxiosInstance;
  private readonly fallbackRepo?: EquivalentDocRepository;

  constructor(http: AxiosInstance, fallbackRepo?: EquivalentDocRepository) {
    this.http = http;
    this.fallbackRepo = fallbackRepo;
  }

  public async createEquivalentDocument(
    request: EquivalentDocumentRequest
  ): Promise<EquivalentDocumentResponse> {
    try {
      const response = await this.http.post<EquivalentDocumentResponse>(
        '/billing/equivalent-documents',
        request
      );
      return response.data;
    } catch (error) {
      if (this.fallbackRepo) {
        console.warn('HttpEquivalentDocRepository: Backend offline, emitiendo con mock...', error);
        return this.fallbackRepo.createEquivalentDocument(request);
      }
      throw new NetworkError('Error al emitir el documento soporte equivalente.');
    }
  }
}
