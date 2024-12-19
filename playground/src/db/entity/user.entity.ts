import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'users' })
export abstract class User {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ nullable: false })
	name: string;

	@Index()
	@Column({ nullable: false, unique: true })
	email: string;

	@Column({ nullable: false })
	password: string;

	@Column({ default: 'user' })
	role: string;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
