# Repository & Pagination Rules

## 기본 원칙

- 모든 repository 메서드는 `try/catch` + `throw error` 필수
- `find`/`findOne`/`findAndCount` 시 `loadRelationIds: true` 필수 (`@ManyToOne` FK 컬럼 undefined 방지)
- WHERE/ORDER BY 조건은 메서드 내부 인라인 작성 — `applyFilters()` 같은 private 헬퍼 분리 금지
- `@Query()` 값은 모두 string — 타입 변환·기본값 처리는 DTO constructor에서, 컨트롤러는 `new XxxDto(query)` 생성 후 전달
- Pagination은 검색 개수(`count`)로 생성. 전체 개수(`totalCount`)로 생성 금지
- 개수 조회 메서드는 하나(getXxxCount)만. `null` 전달 → 전체 개수, `dto` 전달 → 검색 개수
- Path param: `@Param('key')` 방식 금지. DTO 클래스(`XxxParamDto`)로 수신, snake_case로 전 레이어 통일

## Repository 메서드 템플릿

```ts
async findById(visit_round_id: string): Promise<VisitRoundEntity | null> {
    try {
        return this.repository.findOne({where: {visit_round_id, is_delete: 0}, loadRelationIds: true});
    } catch (error) {
        throw error;
    }
}
```

## 검색/정렬 조건 인라인 예제

`getCount`와 `getList`는 조건이 중복되더라도 각각 인라인으로 작성:

```ts
async getVisitRoundCount(dto: VisitRoundListDto | null): Promise<number> {
    try {
        const builder = this.repository.createQueryBuilder('r').where('r.is_delete = 0');
        if (dto) {
            if (127 !== dto.weekday) {
                builder.andWhere('(1 << r.weekday) & :weekday > 0', {weekday: dto.weekday});
            }
            if ('ALL' !== dto.is_holiday_open) {
                builder.andWhere('r.is_holiday_open = :is_holiday_open', {is_holiday_open: dto.is_holiday_open});
            }
        }
        return builder.getCount();
    } catch (error) {
        throw error;
    }
}
```

---

## Pagination 사용 패턴

### Query DTO 생성자 예제

```ts
export class VisitRoundListDto extends PaginationDto {
    weekday?: number;
    is_holiday_open?: string;   // 'ALL' | '0' | '1'
    sort_weekday?: 'ASC' | 'DESC';

    constructor(data: any = {}) {
        super();
        this.weekday = !isNaN(parseInt(data['weekday'])) ? parseInt(data['weekday']) : 127;
        this.is_holiday_open = ['ALL', '0', '1'].includes(data['is_holiday_open']) ? data['is_holiday_open'] : 'ALL';
        this.sort_weekday = data['sort_weekday'] === 'DESC' ? 'DESC' : 'ASC';
    }
}

// Controller
async getVisitRoundList(@Query() query: VisitRoundListDto): Promise<VisitRoundListResultDto> {
    const dto = new VisitRoundListDto(query);
    return this.service.getVisitRoundList(dto);
}
```

### 서비스 4단계

| 단계 | 설명 | 비고 |
|------|------|------|
| 1. totalCount | 검색조건 없이 전체 수 | 응답 `totalCount` 필드 |
| 2. count | 검색조건 적용 후 개수 | Pagination 생성에 사용 |
| 3. Pagination 생성 | 2번 count로 생성 | — |
| 4. 목록 조회 | limit / offset 적용 | — |

```ts
const totalCount = await this.repository.getVisitRoundCount(null);
const count = await this.repository.getVisitRoundCount(dto);
const pagination = new Pagination({totalCount: count, page: dto.page, size: dto.size, pageSize: dto.pageSize, all_search_yn: dto.all_search_yn});
const entities = await this.repository.getVisitRoundList(dto, pagination.limit, pagination.offset);

return {list, totalCount, pagination: pagination.getPagination()};
```

### Path Parameter DTO 예제

- 파일명: `<entity>-param.dto.ts` / 클래스명: `<Entity>ParamDto`

```ts
export class VisitRoundParamDto {
    @ApiProperty({description: '면회 회차 ID', required: true, example: 'abc123'})
    @IsString({message: '면회 회차 ID는 문자열이어야합니다.'})
    @IsNotEmpty({message: '면회 회차 ID를 입력해주세요.'})
    visit_round_id: string;
}

// controller
@Delete('/visit-round/:visit_round_id')
async deleteVisitRound(@Param() param: VisitRoundParamDto): Promise<void> {
    await this.service.deleteVisitRound(param.visit_round_id);
}
```
