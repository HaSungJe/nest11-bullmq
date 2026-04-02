# Architecture

## Directory Layout

```
src/
├── api/v1/<domain>/          # Feature modules (versioned API) — controller 있음
│   ├── <domain>.module.ts    # NestJS module with @SetMetadata for Swagger grouping
│   ├── <domain>.symbols.ts   # DI injection tokens (Symbol constants)
│   ├── entities/             # TypeORM entities
│   ├── dto/                  # Request/response DTOs
│   ├── interfaces/           # Repository interface contracts
│   └── repositories/         # Repository implementations
├── shared/                   # 여러 도메인이 공유하는 Entity/Repository
│   └── <name>/
│       ├── <name>.entity.ts
│       ├── <name>.repository.interface.ts
│       └── <name>.repository.ts
├── common/                   # DTO/utils only (no NestJS modules)
│   ├── dto/                  # global.result.dto.ts, pagination.dto.ts
│   └── utils/                # bcrypt.ts, validation.ts, pagination.ts
├── modules/                  # 인프라 @Module (TypeORM, Redis 등)
├── guards/
│   ├── auth/                 # Role-based AuthGuard + @Auths() decorator
│   └── passport.jwt.auth/    # JWT Passport strategy + guard
├── exception/exception.ts    # Global exception filter (CustomErrorFilter)
├── config/typeorm.config.ts
└── main.ts
```

**디렉토리 역할**:
- `api/v1/` — 외부 HTTP 요청 도메인 (controller 있음)
- `shared/` — 여러 도메인 공유 모듈 (controller 없음)
- `modules/` — 인프라 `@Module()`
- `common/` — DTO 스키마와 유틸 함수. `@Module()` 없음

## shared/ 사용 패턴

두 개 이상의 도메인이 같은 Entity/Repository를 사용할 때:

```ts
// shared/hospital/hospital.module.ts
@Module({
    imports: [TypeOrmModule.forFeature([HospitalEntity])],
    providers: [{provide: HOSPITAL_REPOSITORY, useClass: HospitalRepository}],
    exports: [HOSPITAL_REPOSITORY],
})
export class HospitalModule {}

// api/v1/visit/visit.module.ts
import { HospitalModule } from '@root/shared/hospital/hospital.module';

@Module({
    imports: [..., HospitalModule],
})
export class VisitModule {}
```

## New Domain Minimum File Structure

```
src/api/v1/<domain>/
├── <domain>.module.ts
├── <domain>.controller.ts
├── <domain>.service.ts
├── <domain>.symbols.ts
├── entities/*.entity.ts
├── dto/*.dto.ts
├── interfaces/*.interface.ts   # (if needed)
└── repositories/<domain>.repository.ts
```

## Adding a New Domain

1. Create `src/api/v1/<domain>/` with the standard structure
2. Add `@SetMetadata` to the module class
3. Import the module in `src/app.module.ts`
4. Bind repositories via Symbol tokens in module providers

## Key Patterns

### Module Registration (Swagger tabs)

```ts
@SetMetadata('type', 'API')
@SetMetadata('description', '회원')
@SetMetadata('path', 'user')
@Module({...})
export class UserModule {}
```

### Repository DI via Symbols

```ts
// symbols.ts
export const USER_REPOSITORY = Symbol('UserRepositoryInterface');

// module.ts
{ provide: USER_REPOSITORY, useClass: UserRepository }

// service.ts
@Inject(USER_REPOSITORY) private readonly repo: UserRepositoryInterface
```

### Transactions

```ts
// service method
@Transactional()
async createSomething(...): Promise<void> { ... }
```

`addTransactionalDataSource` registered in `main.ts`.

### Schedulers

```ts
// visit.scheduler.ts
@Injectable()
export class VisitScheduler {
    constructor(
        @Inject(VISIT_RESERVE_REPOSITORY)
        private readonly repo: VisitReserveRepositoryInterface,
    ) {}

    @Cron(CronExpression.EVERY_MINUTE)
    async completeExpiredReserves(): Promise<void> {
        await this.repo.completeExpiredReserves();
    }
}

// visit.module.ts
providers: [VisitService, VisitScheduler, ...]
```

- Plain provider (Symbol 불필요)
- `ScheduleModule.forRoot()` 는 `app.module.ts`에만 — 중복 등록 금지

### Authentication

- `PassportJwtAuthGuard` (`@UseGuards(PassportJwtAuthGuard)`) — JWT 검증, `req.user` = `PassportUserResultVo`
- `AuthGuard` + `@Auths('ADMIN')` — 역할 검사 (`user.auth_id` 기준)

### Import Alias

```ts
import { ValidationErrorDto } from '@root/common/dto/global.result.dto';
import { createValidationError } from '@root/common/utils/validation';
```

## Utils 위치 규칙

| 범위 | 위치 | 파일명 |
|------|------|--------|
| 전역 (여러 도메인) | `src/common/utils/` | `bcrypt.ts`, `validation.ts` |
| 도메인 내부 | `src/api/v1/<domain>/` | `<domain>.util.ts` |

- Service private 헬퍼 메서드 금지 — 도메인 내 `<domain>.util.ts` 단일 파일로 관리
