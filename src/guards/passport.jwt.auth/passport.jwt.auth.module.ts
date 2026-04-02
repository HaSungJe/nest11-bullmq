import { Module } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { PassportJwtAuthStrategy } from './passport.jwt.auth.strategy';
import { PassportModule as NestPassportModule} from '@nestjs/passport';
import { PassPortJwtAuthService } from './passport.jwt.auth.service';
import { TypeORMModule } from '@root/modules/typeorm/typeorm.module';
import * as path from 'path';
require('dotenv').config({path: path.resolve(__dirname, '../../.env')});

@Module({
    imports: [
        TypeORMModule,
        NestJwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '1h' },
        }),
        NestPassportModule
    ],
    exports: [NestJwtModule, PassPortJwtAuthService],
    providers: [PassportJwtAuthStrategy, PassPortJwtAuthService]
})

export class PassportJwtAuthModule {}
