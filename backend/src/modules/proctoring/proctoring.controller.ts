import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    ParseIntPipe,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ProctoringService } from './proctoring.service';

@Controller('attempts')
@UseGuards(JwtAuthGuard)
export class ProctoringController {
    constructor(private readonly proctoringService: ProctoringService) { }

    /**
     * Upload a video chunk from student during exam
     * POST /attempts/:id/proctoring/chunk
     */
    @Post(':id/proctoring/chunk')
    @UseInterceptors(
        FileInterceptor('video', {
            limits: {
                fileSize: 50 * 1024 * 1024, // 50MB max per chunk
            },
            fileFilter: (req, file, callback) => {
                if (file.mimetype === 'video/webm' || file.mimetype === 'video/mp4') {
                    callback(null, true);
                } else {
                    callback(new BadRequestException('Only webm and mp4 video formats are allowed'), false);
                }
            },
        }),
    )
    async uploadChunk(
        @Param('id') attemptId: string,
        @UploadedFile() file: Express.Multer.File,
        @GetUser('id') userId: string,
    ) {
        if (!file) {
            throw new BadRequestException('Video file is required');
        }

        // Extract sequence from the original filename or use query param
        // Expected filename format: {sequence}.webm (e.g., 1.webm, 2.webm)
        let sequence = 1;
        const filenameMatch = file.originalname?.match(/^(\d+)\.webm$/);
        if (filenameMatch) {
            sequence = parseInt(filenameMatch[1], 10);
        }

        // Get the attempt to find the examId
        const { PrismaService } = require('@/common/prisma/prisma.service');
        // We need to get examId from the attempt - the service will handle validation

        // For now, we'll pass attemptId and get examId in service
        // This is a simplification - in production, you'd want to validate ownership here
        const result = await this.proctoringService.uploadChunk(
            '', // examId will be fetched in service
            attemptId,
            sequence,
            file,
        );

        return result;
    }

    /**
     * Upload a video chunk with explicit sequence number
     * POST /attempts/:id/proctoring/chunk/:sequence
     */
    @Post(':id/proctoring/chunk/:sequence')
    @UseInterceptors(
        FileInterceptor('video', {
            limits: {
                fileSize: 50 * 1024 * 1024, // 50MB max per chunk
            },
            fileFilter: (req, file, callback) => {
                if (file.mimetype === 'video/webm' || file.mimetype === 'video/mp4') {
                    callback(null, true);
                } else {
                    callback(new BadRequestException('Only webm and mp4 video formats are allowed'), false);
                }
            },
        }),
    )
    async uploadChunkWithSequence(
        @Param('id') attemptId: string,
        @Param('sequence', ParseIntPipe) sequence: number,
        @UploadedFile() file: Express.Multer.File,
        @GetUser('id') userId: string,
    ) {
        if (!file) {
            throw new BadRequestException('Video file is required');
        }

        const result = await this.proctoringService.uploadChunk(
            '', // examId will be fetched in service
            attemptId,
            sequence,
            file,
            'webcam', // Default to webcam for backward compatibility
        );

        return result;
    }

    /**
     * Upload a screen recording chunk with explicit sequence number
     * POST /attempts/:id/proctoring/screen/:sequence
     */
    @Post(':id/proctoring/screen/:sequence')
    @UseInterceptors(
        FileInterceptor('video', {
            limits: {
                fileSize: 100 * 1024 * 1024, // 100MB max per screen chunk (larger than webcam)
            },
            fileFilter: (req, file, callback) => {
                if (file.mimetype === 'video/webm' || file.mimetype === 'video/mp4') {
                    callback(null, true);
                } else {
                    callback(new BadRequestException('Only webm and mp4 video formats are allowed'), false);
                }
            },
        }),
    )
    async uploadScreenChunk(
        @Param('id') attemptId: string,
        @Param('sequence', ParseIntPipe) sequence: number,
        @UploadedFile() file: Express.Multer.File,
        @GetUser('id') userId: string,
    ) {
        if (!file) {
            throw new BadRequestException('Video file is required');
        }

        const result = await this.proctoringService.uploadScreenChunk(
            '', // examId will be fetched in service
            attemptId,
            sequence,
            file,
        );

        return result;
    }

    /**
     * Get playlist of all webcam video chunks for an attempt (for teacher viewing)
     * GET /attempts/:id/proctoring/playlist
     */
    @Get(':id/proctoring/playlist')
    @UseGuards(RolesGuard)
    @Roles('TEACHER', 'ADMIN')
    async getAttemptPlaylist(@Param('id') attemptId: string) {
        return this.proctoringService.getAttemptVideos(attemptId, 'webcam');
    }

    /**
     * Get playlist of all screen recording chunks for an attempt (for teacher viewing)
     * GET /attempts/:id/proctoring/screen/playlist
     */
    @Get(':id/proctoring/screen/playlist')
    @UseGuards(RolesGuard)
    @Roles('TEACHER', 'ADMIN')
    async getScreenPlaylist(@Param('id') attemptId: string) {
        return this.proctoringService.getScreenVideos(attemptId);
    }

    /**
     * Get all proctoring videos (webcam + screen) for an attempt
     * GET /attempts/:id/proctoring/all
     */
    @Get(':id/proctoring/all')
    @UseGuards(RolesGuard)
    @Roles('TEACHER', 'ADMIN')
    async getAllProctoringVideos(@Param('id') attemptId: string) {
        return this.proctoringService.getAllProctoringVideos(attemptId);
    }

    /**
     * Delete all proctoring videos for an attempt
     * DELETE /attempts/:id/proctoring
     */
    @Delete(':id/proctoring')
    @UseGuards(RolesGuard)
    @Roles('TEACHER', 'ADMIN')
    async deleteAttemptVideos(@Param('id') attemptId: string) {
        return this.proctoringService.deleteAttemptVideos(attemptId);
    }

    /**
     * Check if proctoring is enabled
     * GET /proctoring/status
     */
    @Get('proctoring/status')
    getProctoringStatus() {
        return {
            enabled: this.proctoringService.isProctoringEnabled(),
        };
    }
}
