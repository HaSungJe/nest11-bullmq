import { Column, Entity, Index, PrimaryColumn, Unique } from "typeorm";

/**
 * 권한 정보 Entity
 */
@Entity({ name: 't_auth', comment: '권한 정보' })
@Index('Index_Auth_level', ['level'])
@Unique('Unique_Auth_authName', ['auth_name'])
export class AuthEntity {
    @PrimaryColumn({name: 'auth_id', length: 20, comment: '권한 ID', primaryKeyConstraintName: 'PK_Auth'})
    auth_id: string;

    @Column({name: 'auth_name', comment: '권한명', nullable: false, length: 20})
    auth_name: string;

    @Column({name: 'level', comment: '등급', nullable: false, default: 1})
    level: number;
}

/**
    insert into t_auth (
        auth_id, auth_name, level
    ) values (
        'SUPER_ADMIN', '총괄관리자', 999
    ), (
        'ADMIN', '관리자', 998
    ), (
        'USER', '일반사용자', 1
    );
 */