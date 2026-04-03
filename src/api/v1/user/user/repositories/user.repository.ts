import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { FindManyOptions, Repository } from 'typeorm';
import { UserEntity } from '../../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindUserType, UserRepositoryInterface } from '../interfaces/user.repository.interface';
import { ValidationErrorDto } from '@root/common/dto/global.result.dto';
import { PutUserInfoDto } from '../dto/put.user-info.dto';
import { createValidationError } from '@root/common/utils/validation';

@Injectable()
export class UserRepository implements UserRepositoryInterface {
    constructor(
        @InjectRepository(UserEntity)
        private readonly repository: Repository<UserEntity>
    ) { }

    /**
     * 회원 수
     * 
     * @param option 
     * @returns 
     */
    async getCount(option: FindManyOptions<UserEntity>): Promise<number> {
        try {
            return await this.repository.count(option);
        } catch (error) {
            throw new InternalServerErrorException({message: '조건에 맞는 회원 검색 중 오류가 발생했습니다. 관리자에게 문의해주세요.'});
        }
    }

    /**
     * 아이디로 회원정보 조회
     * 
     * @param login_id 
     * @returns 
     */
    async findUserForLoginId(login_id: string): Promise<FindUserType | null> {
        try {
            const builder = this.repository.createQueryBuilder('u');
            builder.select(`
                  u.user_id 
                , u.login_id 
                , u.login_pw 
                , u.name 
                , u.nickname 
                , a.auth_id 
                , a.auth_name 
                , s.state_id 
                , s.state_name 
                , s.login_able_yn 
            `);
            builder.innerJoin('t_state', 's', 'u.state_id = s.state_id and s.state_id = :state_id', { state_id: 'DONE' });
            builder.innerJoin('t_auth', 'a', 'u.auth_id = a.auth_id');
            builder.where('u.login_id = :login_id', { login_id });
            return builder.getRawOne<FindUserType>();
        } catch (error) {
            throw new InternalServerErrorException({message: '회원정보 조회에 실패했습니다. 관리자에게 문의해주세요.'});
        }
    }

    /**
     * 회원가입
     * 
     * @param dto 
     * @returns 
     */
    async sign(user: UserEntity): Promise<void> {
        try {
            await this.repository.insert(user);
        } catch (error) {
            if (error.errno === 1062 && error.sqlMessage.indexOf('Unique_User_nickname') !== -1) {
                const message: string = '이미 사용중인 닉네임입니다.';
                const validationErrors: Array<ValidationErrorDto> = createValidationError('nickname', message);
                throw new BadRequestException({message, validationErrors})
            } else if (error.errno === 1062 && error.sqlMessage.indexOf('Unique_User_loginId') !== -1) {
                const message: string = '이미 사용중인 아이디입니다.';
                const validationErrors: Array<ValidationErrorDto> = createValidationError('login_id', message);
                throw new BadRequestException({message, validationErrors})
            } else {
                throw new InternalServerErrorException({message: '회원가입 처리에 실패했습니다. 관리자에게 문의해주세요.'});
            }
        }
    }

    /**
     * 회원정보 수정
     * 
     * @param user_id 
     * @param user 
     */
    async putUserInfo(user_id: string, user: UserEntity): Promise<void> {
        try {
            await this.repository.update(user_id, user);
        } catch (error) {
            if (error.errno === 1062 && error.sqlMessage.indexOf('Unique_User_nickname') !== -1) {
                const message: string = '이미 사용중인 닉네임입니다.';
                const validationErrors: Array<ValidationErrorDto> = createValidationError('nickname', message);
                throw new BadRequestException({message, validationErrors})
            } else {
                throw new InternalServerErrorException({message: '회원정보 수정 처리에 실패했습니다. 관리자에게 문의해주세요.'});
            }
        }
    }

    /**
     * 닉네임 변경
     * 
     * @param user_id 
     * @param nickname 
     */
    async patchNickname(user_id: string, nickname: string): Promise<void> {
        try {
            await this.repository.update(user_id, { nickname });
        } catch (error) {
            if (error.errno === 1062 && error.sqlMessage.indexOf('Unique_User_nickname') !== -1) {
                const message: string = '이미 사용중인 닉네임입니다.';
                const validationErrors: Array<ValidationErrorDto> = createValidationError('nickname', message);
                throw new BadRequestException({message, validationErrors})
            } else {
                throw new InternalServerErrorException({message: '닉네임 변경 처리에 실패했습니다. 관리자에게 문의해주세요.'});
            }
        }
    }

    /**
     * 회원탈퇴
     * 
     * @param user_id
     */
    async leave(user_id: string): Promise<void> {
        try {
            await this.repository.update(user_id, { state_id: 'LEAVE' });
        } catch (error) {
            throw new InternalServerErrorException({message: '회원탈퇴 처리에 실패했습니다. 관리자에게 문의해주세요.'});
        }
    }
}

