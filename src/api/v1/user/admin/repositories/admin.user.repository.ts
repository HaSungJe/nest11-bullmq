import { Injectable } from '@nestjs/common';
import { FindManyOptions, Repository } from 'typeorm';
import { UserEntity } from '../../entities/user.entity';
import { AdminUserListDto } from '../dto/list.dto';
import { AdminUserListVO } from '../vo/list.vo';
import { Pagination } from '@root/common/utils/pagination';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminUserRepositoryInterface } from '../interfaces/admin.user.repository.interface';
import { PaginationResultDto } from '@root/common/dto/pagination.dto';

@Injectable()
export class AdminUserRepository implements AdminUserRepositoryInterface {
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
        return this.repository.count(option);
    }

    /**
     * 회원 목록
     * 
     * @param dto 
     * @returns 
     */
    async getUserList(dto: AdminUserListDto): Promise<{ list: Array<AdminUserListVO>, count: number, pagination: PaginationResultDto }> {
        try {
            // 1. 개수
            const builder = this.repository.createQueryBuilder('u');
            builder.innerJoin('t_auth', 'a', 'u.auth_id = a.auth_id');
            builder.innerJoin('t_state', 's', 'u.state_id = s.state_id');
            builder.where('s.state_id != :state_id', { state_id: 'DELETE' });

            if (dto.search_value) {
                if (dto.search_type === 'ID') {
                    builder.andWhere('u.user_id like :user_id', { user_id: `%${dto.search_value}%` });
                } else if (dto.search_type === 'NAME') {
                    builder.andWhere('u.name like :name', { name: `%${dto.search_value}%` });
                } else if (dto.search_type === 'NICKNAME') {
                    builder.andWhere('u.nickname like :nickname', { nickname: `%${dto.search_value}%` });
                } else {
                    builder.andWhere('(u.user_id like :user_id or u.name like :name or u.nickname like :nickname)', {
                        user_id: `%${dto.search_value}%`,
                        name: `%${dto.search_value}%`,
                        nickname: `%${dto.search_value}%`
                    });
                }
            }

            const count = await builder.getCount();

            // 2. 페이징
            const pagination = new Pagination({totalCount: count, page: dto.page, size: dto.size, pageSize: dto.pageSize, all_search_yn: dto.all_search_yn});

            // 3. 목록
            builder.select(`
                  u.user_id 
                , a.auth_id 
                , a.auth_name 
                , s.state_id
                , s.state_name 
                , s.login_able_yn 
                , u.name 
                , u.nickname 
                , date_format(u.create_at, '%Y-%m-%d %H:%i') as create_at
            `);
            builder.orderBy('u.create_at', 'DESC');
            builder.limit(pagination.limit);
            builder.offset(pagination.offset);
            const list: Array<AdminUserListVO> = await builder.getRawMany<AdminUserListVO>();

            return { list, count, pagination: pagination.getPagination() };
        } catch (error) {
            throw error;
        }
    }
}
