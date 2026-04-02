import { UserLoginEntity } from "../../entities/user-login.entity";

export type LoginUserDataType = {
    user_id: string;
    user_login_id: string;
    access_token: string;
    refresh_token: string;
    auth_id: string;
    login_able_yn: string;
}

export interface UserLoginRepositoryInterface {
    /**
     * 로그인 정보 확인
     * 
     * @param refresh_token 
     */
    getLoginInfo(refresh_token: string): Promise<LoginUserDataType | null>;

    /**
     * 로그인 이력 저장
     * 
     * @param login 
     */
    login(login: UserLoginEntity): Promise<void>;

    /**
     * 로그인키 재발급
     * 
     * @param user_login_id 
     * @param login 
     */
    refresh(user_login_id: string, login: UserLoginEntity): Promise<void>;
}
