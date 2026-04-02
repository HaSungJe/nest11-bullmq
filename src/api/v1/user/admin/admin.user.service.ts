import type { AdminUserRepositoryInterface } from "./interfaces/admin.user.repository.interface";
import { ADMIN_USER_REPOSITORY } from "../user.symbols";
import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { Not } from "typeorm";
import { AdminUserListDto, AdminUserListResultDto } from "./dto/list.dto";
import { ApiFailResultDto } from "@root/common/dto/global.result.dto";

@Injectable()
export class AdminUserService {
    constructor(
        @Inject(ADMIN_USER_REPOSITORY)
        private readonly adminUserRepository: AdminUserRepositoryInterface
    ) {}

    /**
     * 회원 목록
     * 
     * @param dto 
     * @returns 
     */
    async list(dto: AdminUserListDto): Promise<AdminUserListResultDto | ApiFailResultDto> {
        try {
            // 1. 총 개수
            const total_count: number = await this.adminUserRepository.getCount({where: {state_id: Not('DELETE')}});

            // 2. 목록, 페이징정보
            const {list, pagination} = await this.adminUserRepository.getUserList(dto);

            return { list, total_count, pagination };
        } catch (error) {
            throw new HttpException({message: '요청이 실패했습니다. 관리자에게 문의해주세요.'}, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}