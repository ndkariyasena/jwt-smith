import { ArrayContains, Repository } from 'typeorm';
import { TokenStorage } from 'jwt-smith';

import { Token } from '../entity/token.entity';
import { AppDataSource } from '../connector';

export default class TokenRepository implements TokenStorage {
	private tokenRepository: Repository<Token>;

	constructor() {
		this.tokenRepository = AppDataSource.getRepository(Token);
	}

	async saveOrUpdateToken(userId: string, tokenOrRefreshToken: string, refreshToken?: string): Promise<void> {
		let tokenEntity = await this.tokenRepository.findOne({ where: { userId } });

		if (!tokenEntity) {
			tokenEntity = this.tokenRepository.create({ userId, tokens: [], refreshTokens: [] });
		}

		if (refreshToken) {
			tokenEntity.tokens = [...tokenEntity.tokens, tokenOrRefreshToken];
			tokenEntity.refreshTokens = [...tokenEntity.refreshTokens, refreshToken];
		} else if (tokenEntity.refreshTokens.includes(tokenOrRefreshToken)) {
			tokenEntity.refreshTokens = [...tokenEntity.refreshTokens, tokenOrRefreshToken];
		} else {
			tokenEntity.tokens = [...tokenEntity.tokens, tokenOrRefreshToken];
		}

		await this.tokenRepository.save(tokenEntity);
	}

	async getRefreshTokenHolder(refreshToken: string): Promise<Record<string, unknown> | null> {
		const tokenEntity = await this.tokenRepository.findOne({
			where: { refreshTokens: ArrayContains([refreshToken]) },
			relations: ['user'],
		});
		return tokenEntity ? { id: tokenEntity.userId, name: tokenEntity.user.name, role: tokenEntity.user.role } : null;
	}

	async getToken?(userId: string): Promise<string[] | null> {
		const tokenEntity = await this.tokenRepository.findOne({ where: { userId } });
		return tokenEntity?.tokens || null;
	}

	async getRefreshToken(userId: string): Promise<string[] | null> {
		const tokenEntity = await this.tokenRepository.findOne({ where: { userId } });
		return tokenEntity?.refreshTokens || null;
	}

	async deleteToken(userId: string): Promise<void> {
		await this.tokenRepository.delete({ userId });
	}

	async blackListToken(token: string, relatedData?: Record<string, unknown>): Promise<void> {
		console.debug(`Blacklisting token: ${token} : ${JSON.stringify(relatedData)}`);
	}

	async checkInBlackListedToken(token: string): Promise<Record<string, unknown> | undefined> {
		console.debug(`Checking token in blacklist: ${token}`);
		return undefined;
	}
}
