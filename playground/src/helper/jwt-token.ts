import { sign, VerifyResponse } from 'jwt-smith';

export const jwtTokenGenerator = async (
	decodedRefreshToken: VerifyResponse,
	user: Record<string, unknown>,
): Promise<{ token: string; refreshToken: string }> => {
	const tokenPayload = {
		payload: {
			user: {
				name: user.name,
				role: user.role,
			},
		},
		secret: process.env.ACCESS_TOKEN_SECRET || '',
		options: {
			expiresIn: '30s',
		},
	};

	const token = await sign(tokenPayload);

	const refreshTokenPayload = {
		payload: {
			user: {
				id: user.id,
			},
			prevId: decodedRefreshToken?.id || undefined,
			id: new Date().getTime(),
		},
		secret: process.env.REFRESH_TOKEN_SECRET || '',
		options: {
			expiresIn: '2m',
		},
	};

	const refreshToken = await sign(refreshTokenPayload);

	if (!token || !refreshToken) {
		throw new Error('Token or Refresh-Token generation failed');
	} else {
		return {
			token,
			refreshToken,
		};
	}
};
