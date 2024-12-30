import { sign, VerifyResponse } from 'jwt-smith';
import { COOKIE_TOKEN_EXPIRES_DEFAULT as Default_Expires } from '../common/constants';

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
			expiresIn: parseInt(process.env.ACCESS_TOKEN_EXPIRES || Default_Expires, 10),
		},
	};

	const token = await sign(tokenPayload);

	let prevId = undefined;
	if (decodedRefreshToken && typeof decodedRefreshToken !== 'string') {
		prevId = (decodedRefreshToken as unknown as Record<string, unknown>).id;
	}

	const refreshTokenPayload = {
		payload: {
			user: {
				id: user.id,
			},
			prevId,
			id: new Date().getTime(),
		},
		secret: process.env.REFRESH_TOKEN_SECRET || '',
		options: {
			expiresIn: parseInt(process.env.REFRESH_TOKEN_EXPIRES || Default_Expires, 10),
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
