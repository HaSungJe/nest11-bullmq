import { AdminUserListDto } from "../dto/list.dto";
import { AdminUserListVO } from "../vo/list.vo";
import { FindManyOptions } from "typeorm";
import { UserEntity } from "../../entities/user.entity";
import { PaginationResultDto } from "@root/common/dto/pagination.dto";

export interface AdminUserRepositoryInterface {
    /**
     * 회원 수
     * 
     * @param option 
     * @returns 
     */
    getCount(option: FindManyOptions<UserEntity>): Promise<number>;

    /**
     * 회원 목록
     * 
     * @param dto 
     * @returns 
     */
    getUserList(dto: AdminUserListDto): Promise<{ list: Array<AdminUserListVO>, count: number, pagination: PaginationResultDto }>;
}
