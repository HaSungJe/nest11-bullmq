import { UserLoginHistoryEntity } from "../../entities/user-login-history.entity";

export interface UserLoginHistoryRepositoryInterface {
    /**
     * 로그인 이력 저장
     *
     * @param login
     */
    insert(login: UserLoginHistoryEntity): Promise<void>;

    /**
     * 기존 로그인 이력의 refresh_token_end_dt 단축
     *
     * @param refresh_token
     * @param minute
     */
    updateRefreshTokenEndDt(refresh_token: string, minute: number): Promise<void>;
}
