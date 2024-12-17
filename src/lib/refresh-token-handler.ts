import DefaultTokenStorage from 'src/module/token-storage';
import {
	TokenStorage,
	RefreshTokenHandlerOptions,
	VerifyResponse,
	TokenExpiredError,
	ValidateResponse,
	TokenGenerationHandler,
	RefreshTokenPayloadVerifier,
	RefreshTokenHolderVerifier,
} from './custom.d';
import { publicKey, refreshTokenKey } from 'src/lib/core';
import { log } from './logger';
import { verify } from 'src/lib/verify-token';
import { refreshTokenHolderVerifier, refreshTokenPayloadVerifier } from 'src/helper/utils';

/* TODO: Next step is to implement the session handling. */
export class TokenHandler {
	private refreshTokenStorage: TokenStorage;
	private tokenGenerationHandler: TokenGenerationHandler;
	private refreshTokenPayloadVerifier: RefreshTokenPayloadVerifier;
	private refreshTokenHolderVerifier: RefreshTokenHolderVerifier;

	constructor(options: RefreshTokenHandlerOptions) {
		this.refreshTokenStorage = options.refreshTokenStorage || new DefaultTokenStorage();
		this.tokenGenerationHandler = options.tokenGenerationHandler;
		this.refreshTokenPayloadVerifier = options.refreshTokenPayloadVerifier || refreshTokenPayloadVerifier;
		this.refreshTokenHolderVerifier = options.refreshTokenHolderVerifier || refreshTokenHolderVerifier;

		if (!options.refreshTokenStorage) {
			log('warn', '[TokenHandler]: Using default in-memory token storage. This is not recommended for production.');
		}
	}

	async validateAuthToken(authToken: string, refreshToken: string | undefined): Promise<ValidateResponse> {
		let decodedToken: VerifyResponse;
		let token: string = authToken;
		let nextRefreshToken: string | undefined = refreshToken;

		await verify({
			token: authToken,
			secret: publicKey,
		})
			.then((tokenPayload) => {
				decodedToken = tokenPayload;
			})
			.catch(async (error) => {
				if (error instanceof TokenExpiredError && refreshToken) {
					const response = await this.rotateRefreshToken(refreshToken);

					token = response.token;
					nextRefreshToken = response.refreshToken;

					decodedToken = await verify({
						token,
						secret: publicKey,
					});
				} else {
					log('info', 'Refresh token not found.');
					throw error;
				}
			});

		log('info', 'Auth token validation complete!');
		return { decodedToken, nextRefreshToken, token };
	}

	async rotateRefreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
		try {
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

			await this.refreshTokenPayloadVerifier(decodedTokenPayload);

			const tokenHolder = await this.refreshTokenStorage.getTokenHolder(refreshToken);

			if (!tokenHolder) {
				throw new Error('Could not find a matching token holder for the refresh token.');
			}

			const isHolderVerified = await this.refreshTokenHolderVerifier(tokenHolder, decodedTokenPayload);

			if (!isHolderVerified) {
				await this.refreshTokenStorage.blackListToken(refreshToken);

				throw new Error('Refresh token holder verification failed.');
			}

			const response = await this.tokenGenerationHandler(decodedTokenPayload, tokenHolder);

			const userId = tokenHolder.id || decodedTokenPayload.user?.id;

			await this.refreshTokenStorage.saveOrUpdateToken(userId, response.refreshToken);

			return response;
		} catch (error) {
			await this.cleanupInvalidRefreshToken(refreshToken);

			throw error;
		}
	}

	async cleanupInvalidRefreshToken(refreshToken: string): Promise<void> {
		const tokenHolder = await this.refreshTokenStorage.getTokenHolder(refreshToken);

		if (tokenHolder && Object.hasOwn(tokenHolder, 'id')) {
			const userId: string = tokenHolder.id as string;
			await this.refreshTokenStorage.deleteToken(userId, undefined, refreshToken);
		}
	}
}
