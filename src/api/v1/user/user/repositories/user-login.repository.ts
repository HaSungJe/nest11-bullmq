import { Repository } from "typeorm";
import { UserLoginEntity } from "../../entities/user-login.entity";
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LoginUserDataType, UserLoginRepositoryInterface } from "../interfaces/user-login.repository.interface";

@Injectable()
export class UserLoginRepository implements UserLoginRepositoryInterface {
    constructor(
        @InjectRepository(UserLoginEntity)
        private readonly repository: Repository<UserLoginEntity>
    ) { }

    /**
     * 로그인 정보 확인
     * 
     * @param refresh_token 
     * @returns 
     */
    async getLoginInfo(refresh_token: string): Promise<LoginUserDataType | null> {
        try {
            const builder = this.repository.manager
                .createQueryBuilder()
                .select(`
                      l.user_id
                    , lh.user_login_id
                    , l.access_token
                    , lh.refresh_token
                    , a.auth_id
                    , s.login_able_yn
                `)
                .from('t_user_login_history', 'lh')
                .innerJoin('t_user_login', 'l', 'lh.user_login_id = l.user_login_id AND l.use_yn = :use_yn', { use_yn: 'Y' })
                .innerJoin('t_user', 'u', 'l.user_id = u.user_id AND u.state_id = :state_id', { state_id: 'DONE' })
                .innerJoin('t_state', 's', 'u.state_id = s.state_id')
                .innerJoin('t_auth', 'a', 'u.auth_id = a.auth_id')
                .where('lh.refresh_token = :refresh_token', { refresh_token })
                .andWhere('now() < lh.refresh_token_end_dt');
            return await builder.getRawOne<LoginUserDataType>();
        } catch (error) {
            throw error;
        }
    }

    /**
     * 로그인 
     * 
     * @param login 
     */
    async login(login: UserLoginEntity): Promise<void> {
        try {
            await this.repository.insert(login);
        } catch (error) {
            throw new InternalServerErrorException({message: '로그인 처리에 실패했습니다. 관리자에게 문의해주세요.'});
        }
    }

    /**
     * 로그인키 재발급
     * 
     * @param user_login_id 
     * @param login 
     */
    async refresh(user_login_id: string, login: UserLoginEntity): Promise<void> {
        try {
            await this.repository.update(user_login_id, login);
        } catch (error) {
            throw new InternalServerErrorException({message: '로그인키 재발급에 실패했습니다. 관리자에게 문의해주세요.'});
        }
    }
}