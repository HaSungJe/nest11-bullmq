import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { UserEntity } from "./user.entity";

/**
 * 회원 로그인정보 Entity
 */
@Entity({ name: 't_user_login', comment: '회원 로그인정보' })
export class UserLoginEntity {
    @PrimaryColumn({name: 'user_login_id', length: 32, comment: '회원 ID', primaryKeyConstraintName: 'PK_UserLogin'})
    user_login_id: string;

    @ManyToOne(() => UserEntity, {nullable: false, onUpdate: 'CASCADE', onDelete: 'CASCADE'})
    @JoinColumn({name: 'user_id', referencedColumnName: 'user_id', foreignKeyConstraintName: 'FK_UserLogin_User'})
    user_id: string;

    @Column({name: 'refresh_token', type: 'text', nullable: false, comment: 'Refresh Token'})
    refresh_token: string;

    @Column({name: 'access_token', type: 'text', nullable: false, comment: 'Access Token'})
    access_token: string;

    @Column({name: 'refresh_token_start_dt', type: 'timestamp', nullable: false, comment: 'Refresh Token 생성시간'})
    refresh_token_start_dt: Date;

    @Column({name: 'refresh_token_end_dt', type: 'timestamp', nullable: false, comment: 'Refresh Token 만료시간'})
    refresh_token_end_dt: Date;

    @Column({name: 'access_token_start_dt', type: 'timestamp', nullable: false, comment: 'Access Token 생성시간'})
    access_token_start_dt: Date;

    @Column({name: 'access_token_end_dt', type: 'timestamp', nullable: false, comment: 'Access Token 만료시간'})
    access_token_end_dt: Date;

    @Column({name: 'use_yn', nullable: false, comment: '사용여부(Y/N)', default: 'Y', length: 1})
    use_yn: string;

    @Column({name: 'ip', nullable: false, comment: 'ip', length: 30})
    ip: string;

    @Column({name: 'agent', nullable: true, comment: 'Agent', length: 255})
    agent: string;

    @Column({name: 'device_type', nullable: false, default: 'W', comment: '디바이스 종류. (W: 웹, M: 모바일)', length: 1})
    device_type: string;

    @Column({name: 'device_os', nullable: true, comment: '디바이스 OS. (android: 안드로이드, ios: 아이폰, other: 그 외)', length: 10})
    device_os: string;

    @Column({name: 'device_id', nullable: true, comment: '디바이스 ID', length: 32})
    device_id: string;

    @Column({name: 'fcm_token', nullable: true, comment: 'FCM Token', length: 255})
    fcm_token: string;

    @Column({name: 'create_at', type: 'timestamp', nullable: false, comment: '생성일'})
    create_at: Date;

    @BeforeInsert()
    insertTimestamp() {
        const now = new Date();
        this.create_at = now;
    }
}