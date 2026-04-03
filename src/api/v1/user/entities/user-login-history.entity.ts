import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserLoginEntity } from "./user-login.entity";

@Entity({ name: 't_user_login_history', comment: '회원 로그인 이력정보' })
export class UserLoginHistoryEntity {
    @PrimaryGeneratedColumn({name: 'user_login_history_id', type: 'bigint', comment: '회원 로그인 이력 ID', primaryKeyConstraintName: 'PK_UserLoginHistory'})
    user_login_history_id: number;

    @ManyToOne(() => UserLoginEntity, {nullable: false, onUpdate: 'CASCADE', onDelete: 'CASCADE'})
    @JoinColumn({name: 'user_login_id', referencedColumnName: 'user_login_id', foreignKeyConstraintName: 'FK_UserLoginHistory_UserLogin'})
    user_login_id: string;

    @Column({name: 'refresh_token', type: 'text', nullable: false, comment: 'Refresh Token'})
    refresh_token: string;

    @Column({name: 'refresh_token_start_dt', type: 'timestamp', nullable: false, comment: 'Refresh Token 생성시간'})
    refresh_token_start_dt: Date;

    @Column({name: 'refresh_token_end_dt', type: 'timestamp', nullable: false, comment: 'Refresh Token 만료시간'})
    refresh_token_end_dt: Date;

    @Column({name: 'create_at', type: 'timestamp', nullable: false, comment: '생성일'})
    create_at: Date;

    @BeforeInsert()
    insertTimestamp() {
        const now = new Date();
        this.create_at = now;
    }
}