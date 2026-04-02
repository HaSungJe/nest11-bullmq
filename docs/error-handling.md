# Error Handling

## 기본 원칙

- `validationErrors` key — `ValidationPipe.exceptionFactory` 및 **service 수동 throw 시**에만 사용
- `createValidationError(property, message)` — **service에서만** 사용. repository 금지
- errno 1062 (MySQL duplicate key) — repository catch 블록에서 처리. `{message}` 만, `validationErrors` 없음
- Service throw 시 1줄로 작성 (멀티라인 금지). message가 두 번 이상 사용되면 `const message` 먼저 선언

## Service throw 패턴

```ts
const message = '운영 요일을 선택해주세요.';
throw new HttpException({message, validationErrors: createValidationError('weekdays', message)}, HttpStatus.BAD_REQUEST);
```

## Duplicate Key (errno 1062) 처리

`error.errno === 1062 && error.sqlMessage.indexOf('constraint명') !== -1` 조합으로 확인:

```ts
} catch (error) {
    if (error.errno === 1062 && error.sqlMessage.indexOf('Unique_User_loginId') !== -1) {
        throw new HttpException({message: '이미 사용중인 아이디입니다.'}, HttpStatus.BAD_REQUEST);
    } else if (error.errno === 1062 && error.sqlMessage.indexOf('Unique_VisitReserve_duplicateKey') !== -1) {
        throw new HttpException({message: '이미 신청한 내역이 존재합니다.'}, HttpStatus.CONFLICT);
    } else {
        throw error;
    }
}
```

### 메시지 규칙

| Unique 종류 | 상태코드 | 메시지 형식 |
|------------|---------|------------|
| 단일 컬럼 (입력값 중복) | 400 BAD_REQUEST | `이미 사용중인 {컬럼 comment}입니다.` |
| 복합 컬럼 (비즈니스 중복) | 409 CONFLICT | `이미 등록된 {테이블 comment}입니다.` 또는 업무 맥락 메시지 |

- 매핑 안 된 Unique 오류: `else { throw error; }` 로 재던짐

## 파일 명명 규칙 (작업 계획)

- request 파일: `plan-N-request.md` (예: `plan-3-request.md`)
- work 파일: `plan-N-work.md` (request 번호와 동일)
- 구두 요청 시 work 파일만 생성 가능
