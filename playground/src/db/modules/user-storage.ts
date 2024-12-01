import { Repository } from 'typeorm';

import { User } from '../entity/user.entity';
import { AppDataSource } from '../connector';

export default class UserRepository {
	private userRepository: Repository<User>;

	constructor() {
		this.userRepository = AppDataSource.getRepository(User);
	}

	async getUser(params: { userId?: string; email?: string }): Promise<User | null> {
		const { userId, email } = params;
		if (!userId && !email) {
			throw new Error('User ID or Email should pass to find the user');
		}

		const searchQuery: Record<string, unknown> = {};
		if (email) searchQuery['email'] = email;
		if (userId) searchQuery['email'] = userId;

		const user = await this.userRepository.findOne({ where: searchQuery });
		return user;
	}

	async saveUser(userData: User): Promise<User> {
		return await this.userRepository.save(userData);
	}

	async deleteUser(userId: string): Promise<void> {
		await this.userRepository.delete(userId);
	}

	async updateUser(userId: string, userData: User): Promise<void> {
		const result = await this.userRepository.update(userId, userData);

		console.log(result);
	}
}
