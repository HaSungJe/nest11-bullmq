# TypeORM Entity Rules

## Constraint Name Standards

| Type | Pattern | Example |
|------|---------|---------|
| PK | `PK_<Name>` | `PK_User` |
| UK | `Unique_<Name>_<ColumnName>` | `Unique_User_loginId` |
| UK (composite) | `Unique_<Name>_<ColA>And<ColB>` | `Unique_User_loginIdAndstateId` |
| IDX | `Index_<Name>_<ColumnName>` | `Index_Auth_order` |
| IDX (composite) | `Index_<Name>_<ColA>And<ColB>` | `Index_User_stateIdAndcreateAt` |
| FK | `<ChildName>_FK_<ParentName>` | `User_FK_Auth` |

> `<Name>` = 클래스명에서 `Entity` 제거 (`UserEntity` → `User`)

## Hard Rules

- **Unique: `@Unique()` 데코레이터 필수** — `@Column({unique: true})` 금지
- **컬럼 옵션 한 줄** — `name/length/nullable/comment` 한눈에 보이도록
- **`@Entity({name, comment})`** 항상 명시
- **Timestamp: `@BeforeInsert`/`@BeforeUpdate`** — `@CreateDateColumn`/`@UpdateDateColumn` 금지

## Full Entity Template

Unique, Index, FK, Timestamp 모두 포함한 종합 예제:

```ts
import { BeforeInsert, BeforeUpdate, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, Unique } from 'typeorm';
import { AuthEntity } from './auth.entity';

@Entity({name: 't_user', comment: '회원 정보'})
@Unique('Unique_User_loginId', ['login_id'])
@Unique('Unique_User_loginIdAndstateId', ['login_id', 'state_id'])  // composite UK
@Index('Index_User_stateIdAndcreateAt', ['state_id', 'create_at'])  // composite IDX
export class UserEntity {
    @PrimaryColumn({name: 'user_id', length: 32, comment: '회원 ID', primaryKeyConstraintName: 'PK_User'})
    user_id: string;

    @ManyToOne(() => AuthEntity, {nullable: false, onUpdate: 'CASCADE', onDelete: 'CASCADE'})
    @JoinColumn({name: 'auth_id', referencedColumnName: 'auth_id', foreignKeyConstraintName: 'User_FK_Auth'})
    auth_id: string;

    @Column({name: 'login_id', length: 30, nullable: false, comment: '로그인 ID'})
    login_id: string;

    @Column({name: 'state_id', length: 32, nullable: false, comment: '상태 ID'})
    state_id: string;

    @Column({name: 'create_at', type: 'timestamp', nullable: false, comment: '생성일'})
    create_at: Date;

    @Column({name: 'update_at', type: 'timestamp', nullable: false, comment: '수정일'})
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
```
