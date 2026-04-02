import { PaginationResultDto } from '../dto/pagination.dto';

/**
 * 페이징
 */
export class Pagination {
    public all_search_yn: string = 'N'; // 전체검색 여부(Y/N)
    public size: number; // 페이지당 출력될 데이터 수
    public pageSize: number; // 페이지탭에 출력될 페이지의 수
    public totalCount: number; // 총 게시글 수
    public page: number; // 현재 페이지
    public maxPage: number; // 마지막 페이지
    public pageRange: any; // 페이지탭에 출력될 페이지의 시작과 끝 값
    public limit: number; // Query용 limit 값
    public offset: number; // Query용 offset 값

    constructor(data: any = {}) {
        this.all_search_yn = ['Y', 'N'].includes(data['all_search_yn']) ? data['all_search_yn'] : 'N';
        this.totalCount = !isNaN(parseInt(data['totalCount'])) ? parseInt(data['totalCount']) : 1;
        this.page = !isNaN(parseInt(data['page'])) ? parseInt(data['page']) : 1;
        this.size = !isNaN(parseInt(data['size'])) ? parseInt(data['size']) : 20;
        this.pageSize = !isNaN(parseInt(data['pageSize'])) ? parseInt(data['pageSize']) : 10;

        // 현재페이지가 1보다 작을경우, 1로 변경
        if (this.page <= 0) {
            this.page = 1;
        }

        // 최대 페이지 수
        this.maxPage = Math.floor(this.totalCount / this.size);
        if (this.totalCount % this.size > 0) {
            this.maxPage++;
        }

        // 페이지당 출력될 개수가 -1인 경우, 전체 출력
        if (this.all_search_yn === 'Y') {
            this.page = 1;
            this.maxPage = 1;
            this.size = this.totalCount;
        }

        // 총 개수가 0일 경우, 최대페이지를 기본 1로 설정.
        if (this.maxPage === 0) {
            this.maxPage = 1;
        }

        // 현재페이지가 최대페이지를 넘어설 경우, 현재페이지를 최대페이지로 변경
        if (this.page > this.maxPage) {
            this.page = this.maxPage;
        }

        // mysql 검색용 limit
        this.limit = this.size;
        this.offset = (this.page - 1) * this.size;

        // 노출할 페이지 목록 수
        this.pageRange = { start: 0, end: 0 };

        this.pageRange.end = Math.floor(this.page / this.pageSize);
        if (this.page % this.pageSize > 0) {
            this.pageRange.end++;
        }

        this.pageRange.end = this.pageRange.end * this.pageSize;
        this.pageRange.start = this.pageRange.end - (this.pageSize - 1);
        if (this.pageRange.end > this.maxPage) {
            this.pageRange.end = this.maxPage;
        }
    }

    getPagination(): PaginationResultDto {
        return {
            all_search_yn: this.all_search_yn,
            totalCount: this.totalCount,
            page: this.page,
            maxPage: this.maxPage,
            pageRange: this.pageRange,
            content_start_number: this.totalCount - (this.page - 1) * this.size,
            content_start_number_reverse: 1 + (this.page - 1) * this.size,
        };
    }
}
