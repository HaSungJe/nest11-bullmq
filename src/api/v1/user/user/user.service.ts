import type { FindUserType, UserRepositoryInterface } from './interfaces/user.repository.interface';
import type { UserLoginRepositoryInterface } from './interfaces/user-login.repository.interface';
import { UseQueue } from '@root/modules/queue/use-queue.decorator';
import { USER_REPOSITORY, USER_LOGIN_REPOSITORY } from '../user.symbols';
import { Transactional } from 'typeorm-transactional';
import { ForbiddenException, HttpException, HttpStatus, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto, LoginResultDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { UserLoginEntity } from '../entities/user-login.entity';
import { SignDto } from './dto/sign.dto';
import { UserEntity } from '../entities/user.entity';
import { CheckLoginIdDto } from './dto/check.login-id.dto';
import { CheckNicknameDto } from './dto/check.nickname.dto';
import { ApiBadRequestResultDto, ApiFailResultDto, ValidationErrorDto } from '@root/common/dto/global.result.dto';
import { RefreshDto, RefreshResultDto } from './dto/refresh.dto';
import { v4 as UUID } from 'uuid';
import { PutUserInfoDto } from './dto/put.user-info.dto';
import { createValidationError } from '@root/common/utils/validation';
import { getBcrypt, matchBcrypt } from '@root/common/utils/bcrypt';

@Injectable()
export class UserService {
    constructor(
        private readonly jwtService: JwtService,
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepositoryInterface,
        @Inject(USER_LOGIN_REPOSITORY)
        private readonly userLoginRepository: UserLoginRepositoryInterface,
    ) { }

    /**
     * 로그인
     *
     * @param dto
     * @returns
     */
    @UseQueue('user-consumer', 'user-service-login')
    @Transactional()
    async login(dto: LoginDto): Promise<LoginResultDto | ApiBadRequestResultDto | ApiFailResultDto> {
        const userLoginId: string = UUID().replaceAll('-', '');

        // 1. 아이디/비밀번호 확인
        const user: FindUserType = await this.userRepository.findUserForLoginId(dto.login_id);
        if (user) {
            const match = await matchBcrypt(dto.login_pw, user.login_pw);
            if (!match) {
                throw new UnauthorizedException({message: '아이디 또는 비밀번호가 잘못되었습니다.'});
            } else if (user.login_able_yn === 'N') {
                throw new ForbiddenException({message: '사용이 정지된 계정입니다. 관리자에게 문의해주세요.'});
            }
        } else {
            throw new UnauthorizedException({message: '아이디 또는 비밀번호가 잘못되었습니다.'});
        }

        // 2-1. Refresh Token 생성
        const refreshToken = this.jwtService.sign({
            type: 'refresh',
            id: userLoginId,
            user_id: user.user_id,
            auth_id: user.auth_id
        }, { expiresIn: '90d' });
        const refreshTokenDecode = await this.jwtService.decode(refreshToken);
        const refreshTokenIAT = new Date(refreshTokenDecode['iat'] * 1000);
        const refreshTokenEXP = new Date(refreshTokenDecode['exp'] * 1000);

        // 2-2. Access Token 생성
        const accessToken = this.jwtService.sign({
            type: 'access',
            user_id: user.user_id,
            auth_id: user.auth_id
        }, { expiresIn: '20m' })
        const accessTokenDecode = await this.jwtService.decode(accessToken);
        const accessTokenIAT = new Date(accessTokenDecode['iat'] * 1000);
        const accessTokenEXP = new Date(accessTokenDecode['exp'] * 1000);

        // 2-3. 로그인 이력 정보 생성
        const login = new UserLoginEntity();
        login.user_login_id = userLoginId;
        login.user_id = user.user_id;
        login.refresh_token = refreshToken;
        login.access_token = accessToken;
        login.refresh_token_start_dt = refreshTokenIAT;
        login.refresh_token_end_dt = refreshTokenEXP;
        login.access_token_start_dt = accessTokenIAT;
        login.access_token_end_dt = accessTokenEXP;

        // 2-2. 앱 로그인 처리
        login.ip = dto.ip;
        login.agent = dto.agent;
        login.device_type = dto.device_type;
        login.device_os = dto.device_os;
        login.device_id = dto.device_id;
        login.fcm_token = dto.fcm_token;

        // 3. 로그인
        try {
            await this.userLoginRepository.login(login);
            return {
                refresh_token: refreshToken,
                access_token: accessToken,
                refresh_token_end_dt: refreshTokenEXP,
                access_token_end_dt: accessTokenEXP
            }
        } catch (error) {
            console.log(error)
            throw new HttpException({message: '요청이 실패했습니다. 관리자에게 문의해주세요.'}, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 로그인키 재발급
     *
     * @param dto
     * @returns
     */
    @UseQueue('user-consumer', 'user-service-refresh')
    @Transactional()
    async refresh(dto: RefreshDto): Promise<RefreshResultDto | ApiBadRequestResultDto | ApiFailResultDto> {
        type LoginUserDataType = {
            user_id: string;
            user_login_id: string;
            access_token: string;
            refresh_token: string;
            auth_id: string;
            login_able_yn: string;
        }

        // 1. 로그인 정보 확인
        try {
            const refreshTokenPayload = await this.jwtService.verifyAsync(dto.refresh_token);
            if (!refreshTokenPayload || refreshTokenPayload?.type !== 'refresh') {
                throw new UnauthorizedException({message: '올바르지 않은 인증정보입니다.'});
            }

            const login: LoginUserDataType = await this.userLoginRepository.getLoginInfo(dto.refresh_token);
            if (!login) {
                throw new UnauthorizedException({message: '올바르지 않은 인증정보입니다.'});
            } else if (login.login_able_yn === 'N') {
                throw new ForbiddenException({message: '사용이 정지된 계정입니다. 관리자에게 문의해주세요.'});
            }
            
            // 2-1. Refresh Token 생성
            const refreshToken = this.jwtService.sign({
                type: 'refresh',
                id: refreshTokenPayload?.id,
                user_id: login.user_id,
                auth_id: login.auth_id
            }, { expiresIn: '90d' });
            const refreshTokenDecode = await this.jwtService.decode(refreshToken);
            const refreshTokenIAT = new Date(refreshTokenDecode['iat'] * 1000);
            const refreshTokenEXP = new Date(refreshTokenDecode['exp'] * 1000);

            // 2-2. Access Token 생성
            const accessToken = this.jwtService.sign({
                type: 'access',
                user_id: login.user_id,
                auth_id: login.auth_id
            }, { expiresIn: '20m' })
            const accessTokenDecode = await this.jwtService.decode(accessToken);
            const accessTokenIAT = new Date(accessTokenDecode['iat'] * 1000);
            const accessTokenEXP = new Date(accessTokenDecode['exp'] * 1000);

            // 3. 로그인키 재발급
            const refresh = new UserLoginEntity();
            refresh.access_token = accessToken;
            refresh.access_token_start_dt = accessTokenIAT;
            refresh.access_token_end_dt = accessTokenEXP;
            refresh.refresh_token = refreshToken;
            refresh.refresh_token_start_dt = refreshTokenIAT;
            refresh.refresh_token_end_dt = refreshTokenEXP;

            try {
                await this.userLoginRepository.refresh(login.user_login_id, refresh);
                return {
                    refresh_token: refreshToken,
                    access_token: accessToken,
                    refresh_token_end_dt: refreshTokenEXP,
                    access_token_end_dt: accessTokenEXP
                }
            } catch (error) {
                throw new HttpException({message: '요청이 실패했습니다. 관리자에게 문의해주세요.'}, HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } catch (error) {
            throw new UnauthorizedException({message: '올바르지 않은 인증정보입니다.'});
        }
    }

    /**
     * 회원가입
     *
     * @param dto
     * @returns
     */
    @UseQueue('user-consumer', 'user-service-sign')
    @Transactional()
    async sign(dto: SignDto): Promise<void | ApiBadRequestResultDto | ApiFailResultDto> {
        if (dto.login_pw !== dto.login_pw2) {
            const message: string = '비밀번호가 일치하지 않습니다.';
            const validationErrors: Array<ValidationErrorDto> = createValidationError('login_pw2', message);
            throw new HttpException({message, validationErrors}, HttpStatus.BAD_REQUEST);
        }

        try {
            const user = new UserEntity();
            user.user_id = UUID().replaceAll('-', '');
            user.login_id = dto.login_id;
            user.login_pw = await getBcrypt(dto.login_pw);
            user.name = dto.name;
            user.nickname = dto.nickname;
            user.auth_id = 'USER';
            user.state_id = 'DONE';
            await this.userRepository.sign(user);
        } catch (error) {
            throw error;
        }
    }

    /**
     * 아이디 중복 확인
     * 
     * @param dto 
     * @returns 
     */
    async checkLoginId(dto: CheckLoginIdDto): Promise<void | ApiBadRequestResultDto> {
        try {
            await this.userRepository.getCount('login_id', {where: {login_id: dto.login_id}});
        } catch (error) {
            throw error;
        }
    }

    /**
     * 닉네임 중복 확인
     * 
     * @param dto 
     * @returns 
     */
    async checkNickname(dto: CheckNicknameDto): Promise<void | ApiBadRequestResultDto> {
        try {
            await this.userRepository.getCount('nickname', {where: {nickname: dto.nickname}});
        } catch (error) {
            throw error;
        }
    }

    /**
     * 닉네임 변경
     *
     * @param user_id
     * @param nickname
     */
    @UseQueue('user-consumer', 'user-service-patch-nickname')
    @Transactional()
    async patchNickname(user_id: string, nickname: string): Promise<void | ApiBadRequestResultDto> {
        try {
            await this.userRepository.patchNickname(user_id, nickname);
        } catch (error) {
            throw error;
        }
    }

    /**
     * 회원정보 수정
     *
     * @param user_id
     * @param dto
     */
    @UseQueue('user-consumer', 'user-service-put-info')
    @Transactional()
    async putUserInfo(user_id: string, dto: PutUserInfoDto): Promise<void | ApiBadRequestResultDto> {
        if (dto.login_pw !== dto.login_pw2) {
            const message: string = '비밀번호가 일치하지 않습니다.';
            const validationErrors: Array<ValidationErrorDto> = createValidationError('login_pw2', message);
            throw new HttpException({message, validationErrors}, HttpStatus.BAD_REQUEST);
        }

        try {
            const user = new UserEntity();
            user.login_pw = await getBcrypt(dto.login_pw);
            user.name = dto.name;
            user.nickname = dto.nickname;
            await this.userRepository.putUserInfo(user_id, dto);
        } catch (error) {
            throw error;
        }
    }

    /**
     * 회원탈퇴
     *
     * @param user_id
     * @returns
     */
    @UseQueue('user-consumer', 'user-service-leave')
    @Transactional()
    async leave(user_id: string): Promise<void | ApiFailResultDto> {
        try {
            await this.userRepository.leave(user_id);
        } catch (error) {
            throw new HttpException({message: '요청이 실패했습니다. 관리자에게 문의해주세요.'}, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
