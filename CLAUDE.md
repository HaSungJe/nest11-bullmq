# CLAUDE.md

## ⚠️ 주의사항

`npm run` 명령은 반드시 사용자가 직접 실행 (Claude 실행 금지)


## Architecture

NestJS 11 + TypeORM (MySQL) + JWT Passport + Swagger

```
src/
├── api/v1/<domain>/   # Feature modules — controller 있음
├── shared/            # 공유 Entity/Repository — controller 없음
├── common/            # DTO/utils only (no @Module)
├── modules/           # 인프라 @Module (TypeORM, Redis 등)
├── guards/            # Auth guards, strategies
└── main.ts
```

→ 상세: [docs/architecture.md](docs/architecture.md)

## Naming Conventions

- Entity: `*Entity` suffix. Constraint: `Entity` 제거한 짧은 이름
- DTO: `*.dto.ts` / Utils: 전역 `src/common/utils/`, 도메인 `<domain>.util.ts`
- **DTO 파일 합치기**: 같은 기능(query + result 등)의 DTO는 하나의 파일에 작성 (예: `get-blood-glucose.dto.ts`)
- API route: `/api/v1/<domain>/...`
- Path param: snake_case (`visit_round_id`), 전 레이어 통일
- **`@Param()` DTO 필수** — `@Param('key')` 방식 금지
- **컨트롤러 메서드 파라미터 한 줄** — 멀티라인 금지
- **validation error key**: 항상 `validationErrors`

## Repository 핵심 규칙

- 모든 메서드 `try/catch` + `throw error` 필수
- `findOne`/`find` 시 `loadRelationIds: true` 필수 (FK 컬럼 undefined 방지)
- WHERE/ORDER BY 조건은 메서드 내부 인라인 작성 (private 헬퍼 금지)

→ 상세: [docs/repository.md](docs/repository.md)

## Pagination

- Query 파라미터: 컨트롤러에서 `new XxxDto(query)` 생성 후 전달
- 서비스 4단계: `totalCount(null)` → `count(dto)` → `Pagination(count)` → list
- Pagination 객체명은 항상 `pagination`
- Pagination 생성 시 `all_search_yn` 반드시 포함:
  ```typescript
  const pagination = new Pagination({totalCount: count, page: dto.page, size: dto.size, pageSize: dto.pageSize, all_search_yn: dto.all_search_yn});
  ```

## Query DTO 생성자 규칙

- 생성자가 있는 Query DTO는 반드시 `constructor(data: any = {})` 형태로 선언
- `data: any` 로만 선언 시 `class-transformer`(`plainToInstance`)가 인수 없이 호출하여 런타임 에러 발생
- **`PaginationDto` extends 시** `super()` 외에 반드시 아래 4개 할당 추가 (미포함 시 `page` 등 `undefined` 발생):
  ```typescript
  this.all_search_yn = ['Y', 'N'].includes(data['all_search_yn']) ? data['all_search_yn'] : 'N';
  this.page = !isNaN(parseInt(data['page'])) ? parseInt(data['page']) : 1;
  this.size = !isNaN(parseInt(data['size'])) ? parseInt(data['size']) : 20;
  this.pageSize = !isNaN(parseInt(data['pageSize'])) ? parseInt(data['pageSize']) : 10;
  ```

→ 상세: [docs/repository.md](docs/repository.md)

## Entity Rules

- Unique: `@Unique()` 데코레이터 (`@Column({unique: true})` 금지)
- FK: `@ManyToOne` + `@JoinColumn({foreignKeyConstraintName})` 필수
- Timestamp: `@BeforeInsert`/`@BeforeUpdate` (`@CreateDateColumn` 금지)
- 컬럼 옵션 한 줄, `@Entity({name, comment})` 필수

→ 상세: [docs/entity.md](docs/entity.md)

## Error Handling

- Service throw: `const message = '...'; throw new HttpException({message, validationErrors: createValidationError(...)}, ...)`
- Repository throw (errno 1062): `{message}` 만, `validationErrors` 금지
- errno 1062 확인: `error.errno === 1062 && error.sqlMessage.indexOf('constraint명') !== -1`

→ 상세: [docs/error-handling.md](docs/error-handling.md)

## Swagger & JSDoc

- 모든 controller/service/repository 메서드에 JSDoc 필수
- 컨트롤러 메서드에 Swagger 데코레이터 필수
- 순서: `@ApiOperation` → `@ApiBody` → `@ApiOkResponse` → `@ApiBadRequestResponse` → ... → `@ApiInternalServerErrorResponse`

→ 상세: [docs/swagger-dto.md](docs/swagger-dto.md)

## Key Patterns

- Module: `@SetMetadata('type','API')` + `app.module.ts` 등록
- Repository DI: Symbol token (`<domain>.symbols.ts`) + `@Inject(TOKEN)`
- Transaction: `@Transactional()` from `typeorm-transactional`
- Scheduler: `<domain>.scheduler.ts`, plain provider (Symbol 불필요), `ScheduleModule.forRoot()` 중복 등록 금지
- Auth: `PassportJwtAuthGuard` (JWT) + `AuthGuard` + `@Auths('ADMIN')` (권한)
- Import alias: `@root/` (maps to `src/`)

## BullMQ (Write FIFO Queue)

### 인프라
- Redis: `docker-compose.yml` → `docker compose up -d`
- `.env`: `BULLMQ_REDIS_HOST`, `BULLMQ_REDIS_PORT` 필수
- 패키지: `@nestjs/bullmq`, `bullmq`
- `QueueModule` (`@Global`) → `app.module.ts` 최상단 import

### 핵심 파일
```
src/modules/queue/
├── queue.module.ts              # BullModule.forRoot() 전역 등록
├── write-queue.registry.ts      # consumerKey별 Queue/Worker/handlers 관리
├── queue-processing.context.ts  # AsyncLocalStorage — Worker 실행 컨텍스트 감지
└── use-queue.decorator.ts       # @UseQueue() 데코레이터
```

### `@UseQueue(consumerKey, jobKey)` 사용 규칙

- **적용 대상**: INSERT/UPDATE/DELETE Service 메서드만 — `@UseQueue`가 없는 메서드는 큐 미사용
- **데코레이터 순서**: `@UseQueue` 반드시 `@Transactional()` **위**에 배치
  ```typescript
  @UseQueue('user-consumer', 'user-service-sign')  // ← 위 (바깥 래퍼)
  @Transactional()                                  // ← 아래 (안쪽)
  async sign(dto: SignDto) { ... }
  ```
- **컨슈머 단위**: 같은 `consumerKey`는 Worker 1개 + concurrency:1 → FIFO 직렬 처리
- **동작 투명성**: 컨트롤러·서비스 호출 코드 변경 없음. 응답은 동기 유지(`waitUntilFinished`)

### consumerKey 명명 예시
| 도메인 | consumerKey | jobKey 예시 |
|--------|-------------|-------------|
| 회원 | `user-consumer` | `user-service-sign`, `user-service-leave` |
| 게시판 | `board-consumer` | `board-insert`, `board-update`, `board-delete` |

### 신규 도메인 적용
1. Service write 메서드에 `@UseQueue('xxx-consumer', 'xxx-job')` 추가만
2. `app.module.ts`, `QueueModule` 추가 수정 불필요 (`@Global`로 자동 적용)

## Repository update 패턴

- `repository.update(where, entity)` 호출 시 `new XxxEntity()`로 객체 생성 후 필드 할당하여 전달
- 이 방식은 `@BeforeUpdate` 훅을 트리거하므로 `update_at` 수동 주입 불필요
- 잘못된 예: `repository.update({id}, {field1, field2})` — 리터럴 객체는 `@BeforeUpdate` 미트리거
- 올바른 예:
  ```typescript
  const entity = new XxxEntity();
  entity.field1 = value1;
  entity.field2 = value2;
  await repository.update({id}, entity);
  ```

→ 상세: [docs/architecture.md](docs/architecture.md)

## 파일 명명 규칙 (작업 계획)

- request 파일: `plan-N-request.md` / work 파일: `plan-N-work.md`
- 구두 요청 시 work 파일만 생성 가능
- 경로는 request 파일은 /plan/request에 생성하고, work 파일은 /plan/work에 생성

## Checklist

- [ ] `validationErrors` key 일관 사용 (pipe + 수동 throw)
- [ ] Entity: PK/UK/IDX/FK constraint 명시, `@Unique()` 데코레이터 사용
- [ ] FK: `@ManyToOne` + `@JoinColumn({foreignKeyConstraintName})`
- [ ] Path param: `@Param() param: XxxParamDto`, snake_case 전 레이어 통일
- [ ] Repository: try/catch, `loadRelationIds: true`, 인라인 조건
- [ ] Query: `new XxxDto(query)` 인스턴스 생성, `pagination` 객체명 통일, 생성자는 `constructor(data: any = {})` 형태
- [ ] Controller 파라미터 한 줄, JSDoc + Swagger 데코레이터 완비
