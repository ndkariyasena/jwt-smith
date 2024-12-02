import 'dotenv/config'; /* This line added to support the migration process. */
import { DataSource } from 'typeorm';

import { User } from './entity/user.entity';
import { Session } from './entity/session.entity';
import { Token } from './entity/token.entity';

const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE, NODE_ENV } = process.env;

export const AppDataSource = new DataSource({
	type: 'postgres',
	host: DB_HOST,
	port: parseInt(DB_PORT || '5432'),
	username: DB_USERNAME,
	password: DB_PASSWORD,
	database: DB_DATABASE,
	synchronize: !NODE_ENV || NODE_ENV === 'development' ? false : false,
	logging: !NODE_ENV || NODE_ENV === 'development' ? false : false,
	entities: [User, Session, Token],
	migrations: [`${__dirname}/../../migrations/*.ts`],
	migrationsTableName: 'migrations',
	migrationsRun: true,
	subscribers: [],
});
