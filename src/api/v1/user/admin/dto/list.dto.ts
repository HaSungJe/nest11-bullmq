import { ApiProperty } from "@nestjs/swagger";
import { AdminUserListVO } from "../vo/list.vo";
import { PaginationDto, PaginationResultDto } from "@root/common/dto/pagination.dto";

/**
 * 회원 목록 Dto
 */
export class AdminUserListDto extends PaginationDto {
    @ApiProperty({description: '검색 종류. (ALL: 전체, ID: 아이디, NAME: 이름, NICKNAME: 닉네임)', required: false})
    search_type: 'ALL' | 'ID' | 'NAME' | 'NICKNAME';

    @ApiProperty({description: '검색 값', required: false})
    search_value: string;

    @ApiProperty({description: '상태 ID. (ALL: 전체, DONE: 정상, BLOCK: 정지, DELETE: 삭제)', required: false})
    state_id: string;

    constructor(data: any = {}) {
        super();
        this.all_search_yn = ['Y', 'N'].includes(data['all_search_yn']) ? data['all_search_yn'] : 'N';
        this.page = !isNaN(parseInt(data['page'])) ? parseInt(data['page']) : 1;
        this.size = !isNaN(parseInt(data['size'])) ? parseInt(data['size']) : 20;
        this.pageSize = !isNaN(parseInt(data['pageSize'])) ? parseInt(data['pageSize']) : 10;
        this.search_type = data['search_type'] ? data['search_type'] : 'ALL';
        this.search_value = data['search_value'] ? data['search_value'] : '';
        this.state_id = data['state_id'] ? data['state_id'] : 'ALL';
    }
}

/**
 * 회원 목록 반환 Dto
 */
export class AdminUserListResultDto {
    @ApiProperty({description: '총 개수', required: true})
    total_count: number;

    @ApiProperty({description: '페이지 정보', required: true, type: () => PaginationResultDto})
    pagination: PaginationResultDto;

    @ApiProperty({description: '회원 목록', required: true, isArray: true, type: () => AdminUserListVO})
    list: Array<AdminUserListVO>;
}