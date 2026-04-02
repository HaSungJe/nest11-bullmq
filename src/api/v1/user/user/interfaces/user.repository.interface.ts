import { FindManyOptions } from "typeorm";
import { UserEntity } from "../../entities/user.entity";
import { ApiBadRequestResultDto } from "@root/common/dto/global.result.dto";
import { PutUserInfoDto } from "../dto/put.user-info.dto";

export type FindUserType = {
    user_id: string;
    login_id: string;
    login_pw: string;
    name: string;
    nickname: string;
    auth_id: string;
    auth_name: string;
    state_id: string;
    state_name: string;
    login_able_yn: string;
};

export interface UserRepositoryInterface {
    /**
     * 회원 수
     * 
     * @param type 
     * @param option 
     * @returns 
     */
    getCount(type: string, option: FindManyOptions<UserEntity>): Promise<void | ApiBadRequestResultDto>;

    /**
     * 아이디로 회원정보 조회
     * 
     * @param login_id 
     */
    findUserForLoginId(login_id: string): Promise<FindUserType | null>;

    /**
     * 회원가입
     * 
     * @param dto 
     * @returns 
     */
    sign(user: UserEntity): Promise<void>;

    /**
     * 닉네임 변경
     * 
     * @param user_id 
     * @param nickname 
     */
    patchNickname(user_id: string, nickname: string): Promise<void>;

    /**
     * 회원정보 수정
     * 
     * @param user_id 
     * @param dto 
     */
    putUserInfo(user_id: string, dto: PutUserInfoDto): Promise<void>;

    /**
     * 회원탈퇴
     * 
     * @param user_id
     */
    leave(user_id: string): Promise<void>;
}
