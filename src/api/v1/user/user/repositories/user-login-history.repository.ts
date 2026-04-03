import { Repository } from "typeorm";
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UserLoginHistoryRepositoryInterface } from "../interfaces/user-login-history.repository.interface";
import { UserLoginHistoryEntity } from "../../entities/user-login-history.entity";

@Injectable()
export class UserLoginHistoryRepository implements UserLoginHistoryRepositoryInterface {
    constructor(
        @InjectRepository(UserLoginHistoryEntity)
        private readonly repository: Repository<UserLoginHistoryEntity>
    ) { }

    /**
     * 로그인 이력 저장
     * 
     * @param login 
     */
    async insert(login: UserLoginHistoryEntity): Promise<void> {
        try {
            await this.repository.insert(login);
        } catch (error) {
            throw new InternalServerErrorException({message: '로그인 이력 저장에 실패했습니다. 관리자에게 문의해주세요.'});
        }
    }

    /**
     * 기존 로그인 이력의 refresh_token_end_dt 단축
     *
     * @param refresh_token
     */
    async updateRefreshTokenEndDt(refresh_token: string, minute: number): Promise<void> {
        try {
            await this.repository
                .createQueryBuilder()
                .update(UserLoginHistoryEntity)
                .set({ refresh_token_end_dt: () => `DATE_ADD(NOW(), INTERVAL ${minute} MINUTE)` })
                .where('refresh_token = :refresh_token', { refresh_token })
                .execute();
        } catch (error) {
            throw new InternalServerErrorException({message: '로그인 이력 갱신에 실패했습니다. 관리자에게 문의해주세요.'});
        }
    }
}