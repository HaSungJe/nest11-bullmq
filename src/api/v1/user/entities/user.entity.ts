import { BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Unique } from "typeorm";
import { AuthEntity } from "./auth.entity";
import { StateEntity } from "./state.entity";

/**
 * 회원 정보 Entity
 */
@Entity({ name: 't_user', comment: '회원 정보' })
@Unique('Unique_User_loginId', ['login_id'])
@Unique('Unique_User_nickname', ['nickname'])
export class UserEntity {
    @PrimaryColumn({ name: 'user_id', length: 32, comment: '회원 ID', primaryKeyConstraintName: 'PK_User' })
    user_id: string;

    @ManyToOne(() => StateEntity, { nullable: false, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
    @JoinColumn({ name: 'state_id', referencedColumnName: 'state_id', foreignKeyConstraintName: 'FK_User_State' })
    state_id: string;

    @ManyToOne(() => AuthEntity, { nullable: false, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
    @JoinColumn({ name: 'auth_id', referencedColumnName: 'auth_id', foreignKeyConstraintName: 'FK_User_Auth' })
    auth_id: string;

    @Column({ name: 'login_id', length: 30, nullable: false, comment: '로그인 ID' })
    login_id: string;

    @Column({ name: 'login_pw', length: 100, nullable: false, comment: '로그인 PW' })
    login_pw: string;

    @Column({ name: 'name', length: 30, nullable: false, comment: '이름' })
    name: string;

    @Column({ name: 'nickname', length: 30, nullable: false, comment: '닉네임' })
    nickname: string;

    @Column({ name: 'create_at', type: 'timestamp', nullable: false, comment: '생성일' })
    create_at: Date;

    @Column({ name: 'update_at', type: 'timestamp', nullable: false, comment: '수정일' })
    update_at: Date;

    @BeforeInsert()
    insertTimestamp() {
        const now = new Date();
        this.create_at = now;
        this.update_at = now;
    }

    @BeforeUpdate()
    updateTimestamp() {
        this.update_at = new Date();
    }
}