import {
	AppendToRequest,
	AppendToRequestProperties,
	AuthedRequest,
	AuthTokenPayloadVerifier,
	ExtractApiVersion,
	RefreshTokenHolderVerifier,
	RefreshTokenPayloadVerifier,
	TokenGenerationHandler,
	VerifyResponse,
} from 'src/lib/custom';
import { log } from 'src/lib/logger';

export const extractAuthHeaderValue = (header: string): string => {
	let tokenValue;

	if (header && header.split(' ')[1]) {
		tokenValue = header.split(' ')[1] as string;
	} else {
		tokenValue = header;
	}

	return tokenValue;
};

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
		try {
			const castedPayload = decodedTokenPayload;

			appendToRequest.forEach((item: AppendToRequestProperties) => {
				if (Object.hasOwn(castedPayload, item)) {
					req[item] = castedPayload[item];
				}
			});
		} catch (error) {
			log('error', 'Token payload appending to the request failed!', error);
		}
	} else if (typeof appendToRequest === 'boolean' && typeof decodedTokenPayload === 'string') {
		req.tokenPayload = decodedTokenPayload;
	}
};

export const defaultTokenGenerationHandler: TokenGenerationHandler = async (refreshTokenPayload: VerifyResponse) => {
	console.debug({ refreshTokenPayload });
	return {
		token: 'new-token',
		refreshToken: 'new-refresh-token',
	};
};

export const authTokenPayloadVerifier: AuthTokenPayloadVerifier = async (
	tokenPayload: VerifyResponse,
): Promise<void> => {
	if (!tokenPayload) {
		throw new Error('Empty payload in the auth token.');
	}
};

export const refreshTokenPayloadVerifier: RefreshTokenPayloadVerifier = async (
	tokenPayload: VerifyResponse,
): Promise<void> => {
	const userId = tokenPayload.user?.id;

	if (!userId) {
		throw new Error('Refresh token process failed. User ID not found in the refresh payload.');
	}
};

export const refreshTokenHolderVerifier: RefreshTokenHolderVerifier = async (
	tokenHolder: Record<string, unknown>,
	tokenPayload: VerifyResponse,
): Promise<boolean> => {
	const userId = tokenPayload.user?.id;

	return tokenHolder.id === userId;
};

export const extractApiVersion: ExtractApiVersion = async (req: AuthedRequest): Promise<string | undefined> => {
	const version = req.headers['api-version'] as string;
	return version ?? req.baseUrl.split('/')[1];
};
