import { AppendToRequest, AppendToRequestProperties, AuthedRequest, VerifyResponse } from 'src/lib/custom';
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
			const castedPayload = decodedTokenPayload as unknown as Record<string, unknown>;

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

export const defaultTokenGenerationHandler = async (refreshTokenPayload: VerifyResponse) => {
	console.log({ refreshTokenPayload });
	return {
		token: 'new-token',
		refreshToken: 'new-refresh-token',
	};
};

export const refreshTokenPayloadVerifier = async (tokenPayload: VerifyResponse): Promise<[boolean, Error | null]> => {
	const userId = tokenPayload.user?.id;

	if (!userId) {
		return [false, new Error('Refresh token process failed. User ID not found in the refresh payload.')];
	}

	return [true, null];
};

export const refreshTokenHolderVerifier = async (
	tokenHolder: Record<string, unknown>,
	tokenPayload: VerifyResponse,
): Promise<[boolean, Error | null]> => {
	const userId = tokenPayload.user?.id;

	if (tokenHolder.id !== userId) {
		return [false, new Error('Refresh token payload and token holder data are conflicting.')];
	}

	return [true, null];
};
