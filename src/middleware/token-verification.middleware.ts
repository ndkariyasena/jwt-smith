import { NextFunction, Request, Response } from "express";
import { publicKey } from "src/lib/core";

import { log } from "src/lib/logger";
import { verify } from "src/lib/verify-token";


const authenticateJwtMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = (req.headers.authorization || req.headers.Authorization) as unknown as string;
    const { accessToken, refreshToken } = req.cookies;

    if (
      (!authHeader || authHeader.startsWith('Bearer ')) &&
      !accessToken &&
      !refreshToken
    ) {
      return res.sendStatus(401);
    }

    let tokenDecoded;

    if (authHeader && authHeader.split(' ')[1]) {
      const token = authHeader.split(' ')[1] as string;

      tokenDecoded = await verify({
        token,
        secret: publicKey,
      });

      console.log(tokenDecoded)
    }

    return next()
  } catch (error) {
    log('error', 'Error occurred when authenticating the JST token.', error);
    return res.sendStatus(401);
  }
};

export default authenticateJwtMiddleware;
