import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';

// 환경변수 로드
config();

export const typeOrmConfig: TypeOrmModuleOptions = {
    type: 'mysql',
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    database: process.env.MYSQL_DB,
    username: process.env.MYSQL_ID,
    password: process.env.MYSQL_PW,
    autoLoadEntities: true,
    synchronize: process.env.TYPEORM_SYNC === 'T',
    logging: false,
};

export default typeOrmConfig;