import DefaultTokenStorage from 'src/module/token-storage';
import { TokenStorage, SessionStorage, RefreshTokenHandlerOptions } from './core.d';
import DefaultSessionStorage from 'src/module/session-storage';
import { log } from './logger';

export class RefreshTokenHandler {
  private tokenStorage: TokenStorage;
  private sessionStorage: SessionStorage;

  constructor(options: RefreshTokenHandlerOptions = {}) {
    this.tokenStorage = options.tokenStorage || new DefaultTokenStorage();
    this.sessionStorage = options.sessionStorage || new DefaultSessionStorage();

    if (!options.tokenStorage) {
      log('warn', '[RefreshTokenHandler]: Using default in-memory token storage. This is not recommended for production.');
    }
    if (!options.sessionStorage) {
      log('warn', '[RefreshTokenHandler]: Using default in-memory session storage. This is not recommended for production.');
    }
  }

  async handleTokenRefresh(userId: string): Promise<string | null> {
    const refreshToken = await this.tokenStorage.getRefreshToken(userId);
    if (!refreshToken) throw new Error('Refresh token not found.');
    // Handle refresh logic...
    return 'new-token';
  }

  async handleSession(sessionId: string): Promise<string | null> {
    const session = await this.sessionStorage.getSession(sessionId);
    if (!session) throw new Error('Session not found.');
    // Handle refresh logic...
    return 'session';
  }
}
