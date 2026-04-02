import { Module } from '@nestjs/common';
import { FirebaseCloudeMessageService } from './firebase-cloud-message.service';

@Module({ 
    providers: [FirebaseCloudeMessageService],
    exports: [FirebaseCloudeMessageService], 
})

export class FirebaseCloudMessageModule {}
