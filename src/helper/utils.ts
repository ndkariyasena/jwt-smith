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

export const extractAuthHeaderValue = (header: string): string | undefined => {
	let tokenValue;

	if (header && header.split(' ')[1]) {
		tokenValue = header.split(' ')[1] as string;
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

export const defaultAuthTokenPayloadVerifier: AuthTokenPayloadVerifier = async (
	tokenPayload: VerifyResponse,
): Promise<void> => {
	if (!tokenPayload) {
		throw new Error('Empty payload in the auth token.');
	}
};

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

export const defaultRefreshTokenHolderVerifier: RefreshTokenHolderVerifier = async (
	tokenHolder: Record<string, unknown>,
	tokenPayload: VerifyResponse,
): Promise<boolean> => {
	const user: Record<string, unknown> = (tokenPayload as unknown as Record<string, unknown>)?.user as Record<
		string,
		unknown
	>;
	const userId = user?.id;

	return tokenHolder.id === userId;
};

export const defaultExtractApiVersion: ExtractApiVersion = async (req: AuthedRequest): Promise<string | undefined> => {
	const version = req.headers['api-version'] as string;
	return version ?? req.baseUrl.split('/')[1];
};
