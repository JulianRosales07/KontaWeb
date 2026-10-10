import type { AuthRepository, LoginCredentials } from '../../domain/ports/out/AuthRepository';
import type { AuthSession } from '../../domain/models/AuthUser';
import { ValidationError } from '../../../../shared/domain/errors/DomainError';

export class LoginUseCase {
  private readonly authRepository: AuthRepository;

  constructor(authRepository: AuthRepository) {
    this.authRepository = authRepository;
  }

  public async execute(credentials: LoginCredentials): Promise<AuthSession> {
    if (!credentials.username?.trim()) {
      throw new ValidationError('El nombre de usuario es requerido.');
    }
    if (!credentials.password?.trim()) {
      throw new ValidationError('La contraseña es requerida.');
    }

    return this.authRepository.login(credentials);
  }
}
