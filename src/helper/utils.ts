import {
	AppendToRequest,
	AppendToRequestProperties,
	AuthedRequest,
	AuthTokenPayloadVerifier,
	AuthUser,
	ExtractApiVersion,
	RefreshTokenHolderVerifier,
	RefreshTokenPayloadVerifier,
	RequestAppends,
	TokenGenerationHandler,
	VerifyResponse,
} from '../lib/custom';
import { log } from '../lib/logger';

/**
 * Extracts the token value from the Authorization header.
 * The token value is the second part of the header, separated by a space.
 * The token value is returned as a string.
 * If the header is empty or the token value is not found, it returns `undefined`.
 *
 * @param {string} header
 * @return {*}  {(string | undefined)}
 */
export const extractAuthHeaderValue = (header: string): string | undefined => {
	let tokenValue;

	if (header && header.split(' ')[1]) {
		tokenValue = header.split(' ')[1] as string;
	}

	return tokenValue;
};

/**
 * Appends the token payload to the request.
 * If the token payload is a string, it appends it to the request as `tokenPayload`.
 * If the token payload is an object, it appends the properties to the request as specified in the `appendToRequest` array.
 *
 * @param {AuthedRequest} req
 * @param {AppendToRequest} appendToRequest
 * @param {VerifyResponse} decodedTokenPayload
 */
export const appendTokenPayloadToRequest = (
	req: AuthedRequest,
	appendToRequest: AppendToRequest,
	decodedTokenPayload: VerifyResponse,
) => {
	if (
		Array.isArray(appendToRequest) &&
		appendToRequest?.length > 0 &&
		decodedTokenPayload &&
		typeof decodedTokenPayload !== 'string'
	) {
		log('debug', `Properties to append to the request: ${appendToRequest}`);

		try {
			const castedPayload: RequestAppends = decodedTokenPayload as RequestAppends;

			appendToRequest.forEach((item: AppendToRequestProperties) => {
				if (Object.hasOwn(castedPayload, item)) {
					req[item] = castedPayload[item] as unknown as (AuthUser & (string | (string & string[]))) | undefined;
				}
			});
		} catch (error) {
			log('error', 'Token payload appending to the request failed!', error);
		}
	} else if (typeof appendToRequest === 'boolean' && typeof decodedTokenPayload === 'string') {
		log('debug', `Token payload appending to the request: ${decodedTokenPayload}`);

		req.tokenPayload = decodedTokenPayload;
	}
};

/**
 * Default token generation handler.
 * This function is used when the token generation handler is not implemented.
 *
 * @param {VerifyResponse} refreshTokenPayload
 * @return {*}  {Promise<{ token: string; refreshToken: string }>}
 */
export const defaultTokenGenerationHandler: TokenGenerationHandler = async (refreshTokenPayload: VerifyResponse) => {
	if (process.env.NODE_ENV === 'production') {
		throw new Error('Token generation handler not implemented.');
	} else {
		log('warn', 'Token generation handler not implemented. Using default handler.');
		console.debug({ refreshTokenPayload });
	}

	return {
		token: 'new-token',
		refreshToken: 'new-refresh-token',
	};
};

/**
 * Default auth token payload verifier.
 * This function is used when the auth token payload verifier is not implemented.
 * It checks if the token payload is empty.
 * If the token payload is empty, it throws an error.
 * Otherwise, it returns `void`.
 *
 * @param {VerifyResponse} tokenPayload
 * @return {*}  {Promise<void>}
 */
export const defaultAuthTokenPayloadVerifier: AuthTokenPayloadVerifier = async (
	tokenPayload: VerifyResponse,
): Promise<void> => {
	if (!tokenPayload) {
		throw new Error('Empty payload in the auth token.');
	}
};

/**
 * Default refresh token payload verifier.
 * This function is used when the refresh token payload verifier is not implemented.
 * It checks if the user ID is present in the token payload.
 * If the user ID is not found, it throws an error.
 * Otherwise, it returns `void`.
 *
 * @param {VerifyResponse} tokenPayload
 * @return {*}  {Promise<void>}
 */
export const defaultRefreshTokenPayloadVerifier: RefreshTokenPayloadVerifier = async (
	tokenPayload: VerifyResponse,
): Promise<void> => {
	const user: Record<string, unknown> = (tokenPayload as unknown as Record<string, unknown>)?.user as Record<
		string,
		unknown
	>;
	const userId = user?.id;

	if (!userId) {
		throw new Error('Refresh token process failed. User ID not found in the refresh payload.');
	}
};

/**
 * Default refresh token holder verifier.
 * This function is used when the refresh token holder verifier is not implemented.
 * It checks if the user ID in the token holder matches the user ID in the token payload.
 * If the user IDs do not match, it returns `false`.
 * Otherwise, it returns `true`.
 *
 * @param {Record<string, unknown>} tokenHolder
 * @param {VerifyResponse} tokenPayload
 * @return {*}  {Promise<boolean>}
 */
export const defaultRefreshTokenHolderVerifier: RefreshTokenHolderVerifier = async (
	tokenHolder: Record<string, unknown>,
	tokenPayload: VerifyResponse,
): Promise<boolean> => {
	const user: Record<string, unknown> = (tokenPayload as unknown as Record<string, unknown>)?.user as Record<
		string,
		unknown
	>;
	const userId = user?.id || user?.userId;
	const tokenHolderId = tokenHolder?.id || tokenHolder?.userId;

	return tokenHolderId === userId;
};

/**
 * Default extract API version.
 * This function is used when the extract API version is not implemented.
 * It checks the `api-version` header in the request.
 * If the header is not found, it returns the first part of the base URL.
 * Otherwise, it returns `undefined`.
 * The API version is returned as a string.
 * If the API version is not found, it returns `undefined`.
 *
 * @param {AuthedRequest} req
 * @return {*}  {(Promise<string | undefined>)}
 */
export const defaultExtractApiVersion: ExtractApiVersion = async (req: AuthedRequest): Promise<string | undefined> => {
	const version = req.headers['api-version'] as string;
	return version ?? req.baseUrl.split('/')[1];
};
