import type {
  EquivalentDocumentRequest,
  EquivalentDocumentResponse,
} from '../../models/EquivalentDocument';

export interface EquivalentDocRepository {
  createEquivalentDocument(
    request: EquivalentDocumentRequest
  ): Promise<EquivalentDocumentResponse>;
}
