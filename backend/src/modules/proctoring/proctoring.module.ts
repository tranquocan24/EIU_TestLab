import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProctoringController } from './proctoring.controller';
import { ProctoringService } from './proctoring.service';
import { ProctoringDebugController } from './proctoring-debug.controller';
import { ProctoringDebugService } from './proctoring-debug.service';

@Module({
    imports: [
        MulterModule.register({
            storage: memoryStorage(),
        }),
    ],
    controllers: [ProctoringController, ProctoringDebugController],
    providers: [ProctoringService, ProctoringDebugService],
    exports: [ProctoringService],
})
export class ProctoringModule { }
