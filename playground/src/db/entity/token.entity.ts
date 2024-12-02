import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	Index,
	JoinColumn,
	ManyToOne,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'tokens' })
export class Token {
	@PrimaryGeneratedColumn()
	id: number;

	@Index()
	@Column()
	userId: string;

	@Column('text', { array: true, default: [] })
	tokens: string[];

	@Column('text', { array: true, default: [] })
	refreshTokens: string[];

	@ManyToOne(() => User)
	@JoinColumn({ name: 'userId' })
	user: User;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
