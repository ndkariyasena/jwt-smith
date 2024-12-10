import DefaultTokenStorage from 'src/module/token-storage';
import { TokenStorage, RefreshTokenHandlerOptions, VerifyResponse } from './custom';
import { publicKey, refreshTokenKey } from 'src/lib/core';
import { log } from './logger';
import { verify } from 'src/lib/verify-token';

/* TODO: Next step is to implement the session handling. */
export class RefreshTokenHandler {
	private refreshTokenStorage: TokenStorage;
	private tokenGenerationHandler: (
		refreshTokenPayload: VerifyResponse,
	) => Promise<{ token: string; refreshToken: string }>;

	constructor(options: RefreshTokenHandlerOptions) {
		this.refreshTokenStorage = options.refreshTokenStorage || new DefaultTokenStorage();
		this.tokenGenerationHandler = options.tokenGenerationHandler;

		if (!options.refreshTokenStorage) {
			log(
				'warn',
				'[RefreshTokenHandler]: Using default in-memory token storage. This is not recommended for production.',
			);
		}
	}

	async rotateRefreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
		const isBlackListed = await this.refreshTokenStorage.checkInBlackListedToken(refreshToken);

		if (isBlackListed) {
			log('error', 'Blacklisted refresh token received!', { refreshToken });

			throw new Error('Blacklisted refresh token found!');
		}

		const decodedTokenPayload = await verify({
			token: refreshToken,
			secret: refreshTokenKey || publicKey,
		});

		if (!decodedTokenPayload) {
			throw new Error('Refresh token payload is undefined!');
		}

		const userId = decodedTokenPayload.user?.id;

		if (!userId) {
			throw new Error('Refresh token process failed. User ID not found in the refresh payload.');
		}

		const tokenHolder = await this.refreshTokenStorage.getTokenHolder(refreshToken);

		if (!tokenHolder) {
			log('warn', 'Could not find a matching token holder for the refresh token.', { refreshToken, userId });

			throw new Error('Could not found a user for the token.');
		}

		return await this.tokenGenerationHandler(decodedTokenPayload);
	}
}
