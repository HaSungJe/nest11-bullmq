# Swagger & DTO Rules

## Swagger 데코레이터 순서 (컨트롤러 메서드)

```ts
@ApiOperation({ summary: '한줄 설명' })
@ApiBody({ type: RequestDto })                                       // POST·PUT·PATCH 에만
@ApiOkResponse({ type: ResultDto })                                  // 200 반환 있을 때
@ApiNoContentResponse()                                              // void 반환 (204)
@ApiBadRequestResponse({ type: ApiBadRequestResultDto })             // 항상
@ApiUnauthorizedResponse({ type: ApiFailResultDto })                 // JWT 가드 있을 때
@ApiForbiddenResponse({ type: ApiFailResultDto })                    // 권한 가드 있을 때
@ApiNotFoundResponse({ type: ApiFailResultDto })                     // NotFoundException 가능할 때
@ApiConflictResponse({ type: ApiFailResultDto })                     // errno 1062 → CONFLICT 가능할 때
@ApiInternalServerErrorResponse({ type: ApiFailResultDto })          // 항상
```

반환될 수 있는 **모든** 에러 코드를 빠짐없이 정의.

## import 경로

```ts
import {
    ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiConflictResponse, ApiForbiddenResponse,
    ApiInternalServerErrorResponse, ApiNoContentResponse, ApiNotFoundResponse,
    ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiBadRequestResultDto, ApiFailResultDto } from '@root/common/dto/global.result.dto';
```

## JSDoc 규칙

Repository interface/implementation, Service, Controller 메서드 전부 필수:

```ts
/**
 * 설명
 *
 * @param param1 설명
 * @param param2 설명
 * @returns 설명 (void면 생략 가능)
 */
async methodName(param1: Type, param2: Type): Promise<ReturnType> { ... }
```

## DTO 객체 배열 필드

인라인 객체 타입(`{key: string}[]`) 사용 시 Swagger에서 `["string"]`으로 잘못 표시됨. 반드시 별도 클래스로 선언하고 `type: [ClassName]`으로 지정.

`type: 'json'` 컬럼에 사용하는 타입 클래스는 **엔티티 파일 상단**에 선언하고, DTO에서 import:

```ts
// entities/visit-round.entity.ts
export class VisitRoundTimeSlotDto {
    @ApiProperty({description: '시작 시간 (HH:MM)', example: '09:00'})
    start_time: string;

    @ApiProperty({description: '종료 시간 (HH:MM)', example: '09:30'})
    end_time: string;
}

@Entity({name: 't_visit_round', ...})
export class VisitRoundEntity {
    @Column({name: 'times', type: 'json', comment: '면회 시간 슬롯 목록', nullable: false})
    times: VisitRoundTimeSlotDto[];
}

// dto/visit-round-list.dto.ts
import { VisitRoundTimeSlotDto } from '../entities/visit-round.entity';

@ApiProperty({description: '시간 슬롯 목록', type: [VisitRoundTimeSlotDto]})
times: VisitRoundTimeSlotDto[];
```
