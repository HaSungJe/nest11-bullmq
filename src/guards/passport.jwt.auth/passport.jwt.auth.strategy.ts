import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassPortJwtAuthService } from './passport.jwt.auth.service';
import { Request } from 'express';
import { PassportUserResultVo } from './passport.jwt.auth.dto';

@Injectable()
export class PassportJwtAuthStrategy extends PassportStrategy(Strategy, 'jwt-user') {
    constructor(
        private readonly service: PassPortJwtAuthService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_SECRET || '',
            ignoreExpiration: process.env.NODE_ENV === 'development' ? true : false,
            passReqToCallback: true
        });
    }

    /**
     * 로그인 확인
     * 
     * @param req 
     * @param payload 
     * @returns 
     */
    async validate(req: Request, payload: any): Promise<PassportUserResultVo> {
        if (payload && 'access' === payload?.type) {
            const user = await this.service.getLoginUser(payload?.user_id || '');
            if (user) {
                return user;
            } else {
                throw new UnauthorizedException();
            }
        } else {
            throw new UnauthorizedException();
        }
    }
}