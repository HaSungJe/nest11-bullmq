import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

/**
 * 로그인 Dto
 */
export class LoginDto {
@ApiProperty({description: '아이디', required: true})
    @IsNotEmpty({message: '아이디를 입력해주세요.'})
    login_id: string;

    @ApiProperty({description: '비밀번호', required: true})
    @IsNotEmpty({message: '비밀번호를 입력해주세요.'})
    login_pw: string;

    ip: string;
    agent: string;
    device_type: string;

    @ApiProperty({description: '디바이스 OS', required: false})
    device_os: string;
    
    @ApiProperty({description: '디바이스 ID', required: false})
    device_id: string;
    
    @ApiProperty({description: 'FCM 토큰', required: false})
    fcm_token: string;

    constructor(data: any = {}) {
        // 아이디, 비밀번호
        this.login_id = data['login_id'] ? data['login_id'] : null;
        this.login_pw = data['login_pw'] ? data['login_pw'] : null;

        // headers로 모바일 정보 얻기
        this.ip = data['ip'] ? data['ip'] : null;
        this.agent = data['agent'].toLowerCase();

        if (data['mobile_yn'] && data['mobile_yn'] === 'Y') {
            this.device_type = 'M';
            this.device_os = data['device_os'] ? data['device_os'] : 'android';
            this.device_id = data['device_id'] ? data['device_id'].replaceAll('-', '') : null;
            this.fcm_token = data['fcm_token'] ? data['fcm_token'] : null;
        } else if (this.agent.indexOf('dart') !== -1) {
            this.device_type = 'M';
            this.device_os = data['device_os'] ? data['device_os'] : 'android';
            this.device_id = data['device_id'] ? data['device_id'].replaceAll('-', '') : null;
            this.fcm_token = data['fcm_token'] ? data['fcm_token'] :  null;
        } else if (this.agent.indexOf('mobile') !== -1) {
            this.device_type = 'M';

            if (this.agent.indexOf('android') !== -1) {
                this.device_os = 'android';
            } else if (this.agent.indexOf("iphone") !== -1 || this.agent.indexOf("ipad") !== -1 || this.agent.indexOf("ipod") !== -1 ) {
                this.device_os = 'ios';
            } else {
                this.device_os = 'other';
            }

            this.device_id = data['device_id'] ? data['device_id'].replaceAll('-', '') : null;
            this.fcm_token = data['fcm_token'] ? data['fcm_token'] : null;
        } else {
            this.device_type = 'W';
            this.device_os = null;
            this.fcm_token = null;
        }
    }
}

/**
 *  로그인 성공 반환 ResultDto
 */
export class LoginResultDto {
    @ApiProperty({description: '로그인 RefreshToken', required: true})
    refresh_token: string;

    @ApiProperty({description: '로그인 AccessToken', required: true})
    access_token: string;

    @ApiProperty({description: 'RefreshToken 만료기간', required: true})
    refresh_token_end_dt: Date;

    @ApiProperty({description: 'AccessToken 만료기간', required: true})
    access_token_end_dt: Date;
}