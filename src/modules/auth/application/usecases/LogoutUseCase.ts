import type { AuthRepository } from '../../domain/ports/out/AuthRepository';

export class LogoutUseCase {
  private readonly authRepository: AuthRepository;

  constructor(authRepository: AuthRepository) {
    this.authRepository = authRepository;
  }

  public execute(): void {
    this.authRepository.logout();
  }
}
