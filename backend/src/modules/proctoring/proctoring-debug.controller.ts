import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ProctoringDebugService } from './proctoring-debug.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('proctoring-debug')
@UseGuards(JwtAuthGuard)
export class ProctoringDebugController {
    constructor(private readonly debugService: ProctoringDebugService) {}

    /**
     * GET /proctoring-debug/attempts
     * Liệt kê tất cả attempts có video proctoring
     */
    @Get('attempts')
    async listAttemptsWithVideos() {
        return this.debugService.listAllAttemptsWithVideos();
    }

    /**
     * GET /proctoring-debug/attempts/:id
     * Debug chi tiết videos của một attempt
     */
    @Get('attempts/:id')
    async debugAttemptVideos(@Param('id') attemptId: string) {
        return this.debugService.debugAttemptVideos(attemptId);
    }

    /**
     * GET /proctoring-debug/attempts/:id/verify
     * Verify một video file cụ thể
     * Query params: type (webcam|screen), sequence (1, 2, 3...)
     */
    @Get('attempts/:id/verify')
    async verifyVideoFile(
        @Param('id') attemptId: string,
        @Query('type') type: 'webcam' | 'screen' = 'webcam',
        @Query('sequence') sequence: string = '1',
    ) {
        return this.debugService.verifyVideoFile(attemptId, type, parseInt(sequence, 10));
    }
}
