import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

const account_path = path.resolve(__dirname, '../google-services.json');
const account = JSON.parse(fs.readFileSync(account_path, 'utf-8'));

@Injectable()
export class FirebaseCloudeMessageService {
    constructor() {
        admin.initializeApp({
            credential: admin.credential.cert(account)
        });
    }

    /**
     * Firebase Cloud Message 전송
     * 
     * @param token 
     * @param title 
     * @param body 
     * @param os 
     */
    async sendFirebaseCloudMessage(token: string, title: string, body: string, os: string): Promise<object> {
        const message: admin.messaging.Message = {
            token,
            notification: {
                title,
                body,
            },
        };

        if (os === 'android') {
            message.android = {
                notification: {
                    sound: 'default',
                },
                priority: 'high',
            };
        } else if (os === 'ios') {
            message.apns = {
                payload: {
                    aps: {
                        alert: {
                            title,
                            body,
                        },
                        sound: 'default',
                    },
                },
                headers: {
                    'apns-priority': '10',
                },
            };
        }

        try {
            await admin.messaging().send(message);
            return { statusCode: 200 }
        } catch (error) {
            return { statusCode: 400, message: '앱 푸쉬 발송 실패.', error_code: error.errorInfo.code,  error_message: error.errorInfo.message }
        }
    }
}