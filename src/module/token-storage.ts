import { TokenStorage } from 'src/lib/custom';

interface tokenEntity {
	token?: string[];
	refreshToken?: string[];
}

export default class DefaultTokenStorage implements TokenStorage {
	private tokens = new Map<string, tokenEntity>();

	async saveToken(userId: string, tokenOrRefreshToken: string, refreshToken?: string): Promise<void> {
		const existingData = this.tokens.get(userId) || { token: [], refreshToken: [] };
		let update = {};

		if (refreshToken) {
			update = {
				token: [...(existingData.token || []), tokenOrRefreshToken],
				refreshToken: [...(existingData.refreshToken || []), refreshToken],
			};
		} else if (existingData.refreshToken?.includes(tokenOrRefreshToken)) {
			update = {
				...existingData,
				refreshToken: [...(existingData.refreshToken || []), tokenOrRefreshToken],
			};
		} else {
			update = {
				...existingData,
				token: [...(existingData.token || []), tokenOrRefreshToken],
			};
		}

		this.tokens.set(userId, update);
	}

	async getRefreshToken(userId: string): Promise<string[] | null> {
		return this.tokens.get(userId)?.refreshToken || null;
	}

	async deleteToken(userId: string): Promise<void> {
		this.tokens.delete(userId);
	}

	async getToken?(userId: string): Promise<string[] | null> {
		return this.tokens.get(userId)?.token || null;
	}
}
