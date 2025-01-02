import DefaultTokenStorage from 'src/module/token-storage';
import {
	TokenStorage,
	VerifyResponse,
	TokenExpiredError,
	TokenGenerationHandler,
	RefreshTokenPayloadVerifier,
	RefreshTokenHolderVerifier,
	AuthTokenPayloadVerifier,
} from 'src/lib/custom.d';
import { RefreshTokenHandlerOptions, ValidateResponse } from './internal';
import { publicKey, refreshTokenKey } from 'src/lib/core';
import { log } from 'src/lib/logger';
import { verify } from 'src/lib/verify-token';
import {
	defaultAuthTokenPayloadVerifier,
	defaultRefreshTokenPayloadVerifier,
	defaultRefreshTokenHolderVerifier,
} from 'src/helper/utils';

/* TODO: Next step is to implement the session handling. */
export class TokenHandler {
	private refreshTokenStorage: TokenStorage;
	private tokenGenerationHandler: TokenGenerationHandler;
	private authTokenPayloadVerifier: AuthTokenPayloadVerifier;
	private refreshTokenPayloadVerifier: RefreshTokenPayloadVerifier;
	private refreshTokenHolderVerifier: RefreshTokenHolderVerifier;

	constructor(options: RefreshTokenHandlerOptions) {
		this.refreshTokenStorage = options.refreshTokenStorage || new DefaultTokenStorage();
		this.tokenGenerationHandler = options.tokenGenerationHandler;
		this.authTokenPayloadVerifier = options.authTokenPayloadVerifier || defaultAuthTokenPayloadVerifier;
		this.refreshTokenPayloadVerifier = options.refreshTokenPayloadVerifier || defaultRefreshTokenPayloadVerifier;
		this.refreshTokenHolderVerifier = options.refreshTokenHolderVerifier || defaultRefreshTokenHolderVerifier;

		if (!options.refreshTokenStorage) {
			log('warn', '[TokenHandler]: Using default in-memory token storage. This is not recommended for production.');
		}
	}

	async validateOrRefreshAuthToken(authToken: string, refreshToken: string | undefined): Promise<ValidateResponse> {
		let decodedToken: VerifyResponse;
		let token: string = authToken;
		let nextRefreshToken: string | undefined = refreshToken;

		await this.validateAuthToken(authToken)
			.then((tokenPayload) => {
				decodedToken = tokenPayload;
			})
			.catch(async (error) => {
				if (error instanceof TokenExpiredError && refreshToken) {
					const response = await this.rotateRefreshToken(refreshToken, authToken);

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

		return { decodedToken, nextRefreshToken, token };
	}

	async validateAuthToken(authToken: string): Promise<VerifyResponse> {
		const tokenPayload = await verify({
			token: authToken,
			secret: publicKey,
		});

		await this.authTokenPayloadVerifier(tokenPayload);

		log('info', 'Auth token validation complete!');
		return tokenPayload;
	}

	async rotateRefreshToken(refreshToken: string, token?: string): Promise<{ token: string; refreshToken: string }> {
		try {
			const isBlackListed = await this.refreshTokenStorage.checkBlackListedRefreshToken(refreshToken);

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

			const tokenHolder = await this.refreshTokenStorage.getRefreshTokenHolder(refreshToken);

			if (!tokenHolder) {
				throw new Error('Could not find a matching token holder for the refresh token.');
			}

			const isHolderVerified = await this.refreshTokenHolderVerifier(tokenHolder, decodedTokenPayload);

			if (!isHolderVerified) {
				await this.refreshTokenStorage.blackListRefreshToken(refreshToken);

				throw new Error('Refresh token holder verification failed.');
			}

			const response = await this.tokenGenerationHandler(decodedTokenPayload, tokenHolder);

			const userId =
				tokenHolder.id ||
				(typeof decodedTokenPayload !== 'string' && 'user' in decodedTokenPayload
					? decodedTokenPayload.user?.id
					: undefined);

			await this.refreshTokenStorage.saveOrUpdateToken(userId, response.refreshToken, response.token);

			return response;
		} catch (error) {
			await this.cleanupInvalidRefreshToken(refreshToken, token);

			throw error;
		}
	}

	async cleanupInvalidRefreshToken(refreshToken: string, token?: string): Promise<void> {
		const tokenHolder = await this.refreshTokenStorage.getRefreshTokenHolder(refreshToken);

		if (tokenHolder && Object.hasOwn(tokenHolder, 'id')) {
			const userId: string = tokenHolder.id as string;
			await this.refreshTokenStorage.deleteToken(userId, token, refreshToken);
		}
	}
}
