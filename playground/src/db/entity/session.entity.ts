import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'sessions' })
export class Session {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ nullable: false, name: 'user_id' })
	userId: string;

	@Column({ nullable: false })
	valid: boolean;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
