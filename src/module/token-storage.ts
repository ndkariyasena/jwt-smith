import { TokenStorage } from '../lib/custom';

interface tokenEntity {
	refreshTokens: string[];
	tokens?: string[];
}

export default class DefaultTokenStorage implements TokenStorage {
	private tokens = new Map<string, tokenEntity>();
	private defectedTokens = new Map<string, Record<string, unknown>>();

	async saveOrUpdateToken(userId: string, tokenOrRefreshToken: string, token?: string): Promise<void> {
		const existingData = this.tokens.get(userId) || { refreshTokens: [], tokens: [] };
		let update: tokenEntity = { refreshTokens: [] };

		update = {
			...existingData,
			refreshTokens: [...(existingData.refreshTokens || []), tokenOrRefreshToken],
		};

		if (token) {
			update = {
				...update,
				tokens: [...(existingData.tokens || []), token],
			};
		}

		this.tokens.set(userId, update);
	}

	async getRefreshTokenHolder(refreshToken: string): Promise<Record<string, unknown> | null> {
		let holder = null;

		this.tokens.forEach((data, userId) => {
			if (data.refreshTokens?.includes(refreshToken)) {
				holder = { id: userId, ...this.tokens.get(userId) };

				return;
			}
		});

		return holder;
	}

	async getRefreshToken(userId: string): Promise<string[] | null> {
		return this.tokens.get(userId)?.refreshTokens || null;
	}

	async deleteToken(userId: string): Promise<void> {
		this.tokens.delete(userId);
	}

	async getToken?(userId: string): Promise<string[] | null> {
		return this.tokens.get(userId)?.tokens || null;
	}

	async blackListRefreshToken(token: string, relatedData?: Record<string, unknown>): Promise<void> {
		this.defectedTokens.set(token, relatedData || {});
	}

	async checkBlackListedRefreshToken(token: string): Promise<Record<string, unknown> | undefined> {
		return this.defectedTokens.get(token);
	}
}
