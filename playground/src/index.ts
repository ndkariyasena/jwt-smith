import 'dotenv/config';
import { envValidate } from './helper/validator';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { JwtManager } from 'jwt-smith';

import { AppDataSource, TokenRepository } from './db';
import userRouters from './routes/user';
import authRouters from './routes/auth';
import { jwtTokenGenerator } from './helper/jwt-token';

envValidate();

const PORT = parseInt(process.env.APP_PORT || '3000', 10);
const HOST = process.env.APP_HOST || 'localhost';

const app = express();

app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

JwtManager({
	signOptions: {
		algorithm: 'HS256',
	},
	publicKey: process.env.ACCESS_TOKEN_SECRET,
	refreshTokenKey: process.env.REFRESH_TOKEN_SECRET,
	middlewareConfigs: {
		tokenStorage: new TokenRepository(),
		appendToRequest: ['user'],
		tokenGenerationHandler: jwtTokenGenerator,
		cookieSettings: {
			refreshTokenCookieName: 'refreshToken',
		},
	},
});

app.get('/', (req, res) => {
	res.send('Welcome to the Playground!');
});
app.use('/auth', authRouters);
app.use('/users', userRouters);
/* Routes END */

/* Server start */
AppDataSource.initialize()
	.then(async () => {
		const server = app.listen(PORT, HOST);

		server.on('listening', (error: unknown): void => {
			if (error) console.error('*** Server start failed! *** ', error);
			else console.info(`\n/------------/\nServer start running on http://${HOST}:${PORT}\n/------------/\n`);
		});

		server.on('error', (error: unknown): void => console.error('*** Server failing! *** ', error));
	})
	.catch((error) => {
		console.error('Could not initialize the database connection!');
		console.error(error);
	});
