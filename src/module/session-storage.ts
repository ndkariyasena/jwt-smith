import { SessionStorage, Session } from "src/lib/custom";

export default class DefaultSessionStorage implements SessionStorage {
  private sessions = new Map<string, Session>();

  async getSession(sessionId: string): Promise<Session | null> {
    return this.sessions.get(sessionId) || null;
  }

  async saveSession(sessionId: string, session: Session): Promise<void> {
    this.sessions.set(sessionId, session);
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }
}