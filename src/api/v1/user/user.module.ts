import { USER_REPOSITORY, USER_LOGIN_REPOSITORY, ADMIN_USER_REPOSITORY } from './user.symbols';
import { Module, SetMetadata } from '@nestjs/common';
import { UserService } from './user/user.service';
import { UserController } from './user/user.controller';
import { TypeORMModule } from '@root/modules/typeorm/typeorm.module';
import { PassportJwtAuthModule } from '@root/guards/passport.jwt.auth/passport.jwt.auth.module';
import { AdminUserController } from './admin/admin.user.controller';
import { AdminUserService } from './admin/admin.user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { StateEntity } from './entities/state.entity';
import { AuthEntity } from './entities/auth.entity';
import { UserLoginEntity } from './entities/user-login.entity';
import { UserRepository } from './user/repositories/user.repository';
import { UserLoginRepository } from './user/repositories/user-login.repository';
import { AdminUserRepository } from './admin/repositories/admin.user.repository';

@SetMetadata('type', 'API')
@SetMetadata('description', '회원')
@SetMetadata('path', 'user')
@Module({
    imports: [
        TypeORMModule,
        TypeOrmModule.forFeature([
            UserEntity,
            StateEntity,
            AuthEntity,
            UserLoginEntity
        ]),
        PassportJwtAuthModule
    ],
    controllers: [UserController, AdminUserController],
    providers: [
        UserService,
        AdminUserService,
        {
            provide: USER_REPOSITORY,
            useClass: UserRepository
        },
        {
            provide: USER_LOGIN_REPOSITORY,
            useClass: UserLoginRepository
        },
        {
            provide: ADMIN_USER_REPOSITORY,
            useClass: AdminUserRepository
        }
    ],
})

export class UserModule { }
