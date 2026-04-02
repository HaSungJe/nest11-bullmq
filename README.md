# nest11-bullmq

NestJS 11 기반 백엔드 보일러플레이트.
**BullMQ 커스텀 데코레이터(`@UseQueue`)를 활용한 Write FIFO 큐** 패턴을 포함합니다.

---

## Stack

| 분류 | 기술 |
|------|------|
| Framework | NestJS 11 |
| ORM | TypeORM 0.3 (MySQL) |
| Auth | JWT + Passport |
| Queue | BullMQ + Redis |
| Docs | Swagger |
| Runtime | Node.js + TypeScript 5 |

---

## 시작하기

### 1. 환경변수 설정

`.env` 파일을 프로젝트 루트에 생성합니다.

```env
# Server
NODE_ENV=development
SERVER_NAME=Nest11
SERVER=DEV
SERVER_PORT=3001

# Swagger
SWAGGER_URL=http://localhost:3001
SWAGGER_PATH=api-docs

# MySQL
TYPEORM_SYNC=T
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DB=test_db
MYSQL_ID=root
MYSQL_PW=1234

# JWT
JWT_SECRET=your_jwt_secret

# Redis (BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 2. Redis 실행 (Docker)

```bash
npm run docker:up
```

### 3. 패키지 설치 및 앱 실행

```bash
npm install
npm run dev
```

### Redis 종료

```bash
npm run docker:down
```

---

## 프로젝트 구조

```
src/
├── api/v1/<domain>/       # Feature 모듈 — controller/service/repository
├── shared/                # 공유 Entity/Repository (controller 없음)
├── common/                # DTO, 유틸리티 (no @Module)
├── modules/
│   ├── queue/             # BullMQ 인프라
│   │   ├── queue.module.ts
│   │   ├── write-queue.registry.ts
│   │   ├── queue-processing.context.ts
│   │   └── use-queue.decorator.ts
│   ├── typeorm/
│   └── firebase-cloud-message/
├── guards/                # JWT Auth, Roles
└── main.ts
```

---

## BullMQ Write Queue

Write API(INSERT/UPDATE/DELETE)의 동시성 문제를 해결하기 위해
**커스텀 데코레이터 `@UseQueue`** 를 사용합니다.

### 동작 방식

```
일반 API 호출:
  Controller → service.sign(dto)
    → @UseQueue 가로챔 → BullMQ enqueue → waitUntilFinished
    → Worker 실행 → @Transactional() → DB → 결과 반환
    → HTTP 응답 (동기 유지)
```

- **컨슈머(consumerKey)** 단위로 Worker 1개, concurrency 1 → FIFO 직렬 처리
- 다른 consumerKey 간에는 **병렬** 처리
- 컨트롤러·서비스 호출 코드 **변경 없음** — 데코레이터만 추가

### 사용법

```typescript
// @UseQueue를 반드시 @Transactional() 위에 배치
@UseQueue('user-consumer', 'user-service-sign')
@Transactional()
async sign(dto: SignDto): Promise<void> {
    // 기존 로직 그대로
}
```

| 파라미터 | 설명 |
|----------|------|
| `consumerKey` | 큐/Worker 식별자. 같은 키는 하나의 Worker가 직렬 처리 |
| `jobKey` | 작업 식별자. Worker가 올바른 handler를 찾는 데 사용 |

### 컨슈머 구성 예시

| consumerKey | jobKey | 비고 |
|-------------|--------|------|
| `user-consumer` | `user-service-sign` | 회원 write 직렬 처리 |
| `user-consumer` | `user-service-leave` | |
| `board-consumer` | `board-insert` | 게시판 write 직렬 처리 |
| `board-consumer` | `board-update` | |

> 별도 설정 불필요 — `@UseQueue` 데코레이터가 붙은 메서드가 **처음 호출될 때** Worker가 자동 생성됩니다.

---

## API 문서

앱 실행 후 Swagger UI 접속:

```
http://localhost:3001/api-docs
```

---

## 주요 npm 스크립트

```bash
npm run dev          # 개발 서버 (watch)
npm run build        # 빌드
npm run docker:up    # Redis 컨테이너 시작
npm run docker:down  # Redis 컨테이너 종료
```
