import { TokenStorage } from "src/lib/custom";

export default class DefaultTokenStorage implements TokenStorage {
  private tokens = new Map<string, { token: string[]; refreshToken: string[] }>();

  async getToken(userId: string): Promise<string[] | null> {
    return this.tokens.get(userId)?.token || null;
  }

  async getRefreshToken(userId: string): Promise<string[] | null> {
    return this.tokens.get(userId)?.refreshToken || null;
  }

  async saveToken(userId: string, token?: string, refreshToken?: string): Promise<void> {
    let savedTokens: string[] = [];
    let savedRefreshTokens: string[] = [];

    if (this.tokens.has(userId)) {
      if (token) {
        savedTokens = await this.getToken(userId) ?? [];
      }
      if (refreshToken) {
        savedRefreshTokens = await this.getRefreshToken(userId) ?? [];
      }
    }

    if (token) savedTokens.push(token);
    if (refreshToken) savedRefreshTokens.push(refreshToken);

    this.tokens.set(userId, { token: savedTokens, refreshToken: savedRefreshTokens });
  }

  async deleteToken(userId: string): Promise<void> {
    this.tokens.delete(userId);
  }
}