import { ApiProperty } from "@nestjs/swagger";

/**
 * 페이지탭에 표시될 페이지목록의 범위
 */
class PageRangeResultDto {
    @ApiProperty({description: '시작값', required: true})
    start: number;

    @ApiProperty({description: '종료값', required: true})
    end: number;
}

/**
 * 페이지 정보
 */
export class PaginationResultDto {
    @ApiProperty({description: '전체검색 여부(Y/N)', required: true})
    all_search_yn: string;

    @ApiProperty({description: '총 개수', required: true})
    totalCount: number;

    @ApiProperty({description: '현재 페이지', required: true})
    page: number;

    @ApiProperty({description: '최대 페이지', required: true})
    maxPage: number;

    @ApiProperty({description: '페이지탭에 표시될 페이지목록의 범위', type: () => PageRangeResultDto, required: true})
    pageRange: PageRangeResultDto;

    @ApiProperty({description: '컨텐츠에 표시할 번호 시작값', required: true})
    content_start_number: number;

    @ApiProperty({description: '컨텐츠에 표시할 번호 시작값 (역순)', required: true})
    content_start_number_reverse: number;
}

/**
 * 페이지정보 Dto
 */
export class PaginationDto {
    @ApiProperty({ description: '전체검색 여부(Y/N)', required: true })
    all_search_yn: string;

    @ApiProperty({description: '페이지. 기본값: 1', required: false})
    page: number;

    @ApiProperty({description: '페이지당 출력될 데이터 수. 기본값: 10', required: false})
    size: number;

    @ApiProperty({description: '페이지탭에 출력될 페이지의 수. 기본값: 10', required: false})
    pageSize: number;
}