import { Repository } from "typeorm";
import { UserLoginEntity } from "../../entities/user-login.entity";
import { Injectable } from "@nestjs/common";
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
        const builder = this.repository.createQueryBuilder('l');
        builder.select(`
              l.user_id
            , l.user_login_id 
            , l.access_token 
            , l.refresh_token 
            , a.auth_id 
            , s.login_able_yn 
        `);
        builder.innerJoin('t_user', 'u', 'l.user_id = u.user_id and u.state_id = :state_id', { state_id: 'DONE' });
        builder.innerJoin('t_state', 's', 'u.state_id = s.state_id');
        builder.innerJoin('t_auth', 'a', 'u.auth_id = a.auth_id');
        builder.where(`l.use_yn = :use_yn`, { use_yn: 'Y' });
        builder.andWhere('l.refresh_token = :refresh_token', { refresh_token })
        builder.andWhere('now() < l.refresh_token_end_dt');
        return await builder.getRawOne<LoginUserDataType>();
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
            throw error;
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
            throw error;
        }
    }
}