import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class ProctoringService {
    private readonly supabase: SupabaseClient | null;
    private readonly bucketName = 'proctoring-videos';

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

        if (!supabaseUrl || !supabaseKey) {
            console.warn('Supabase credentials not configured. Proctoring features will be disabled.');
            this.supabase = null;
        } else {
            this.supabase = createClient(supabaseUrl, supabaseKey);
        }
    }

    /**
     * Upload a video chunk to Supabase Storage
     * @param examId - ID of the exam (optional, will be fetched from attempt if empty)
     * @param attemptId - ID of the attempt
     * @param sequence - Sequence number of the chunk (1, 2, 3, ...)
     * @param file - The video blob file
     */
    async uploadChunk(
        examId: string,
        attemptId: string,
        sequence: number,
        file: Express.Multer.File,
    ): Promise<{ success: boolean; path: string }> {
        if (!this.supabase) {
            throw new BadRequestException('Supabase not configured. Proctoring features are disabled.');
        }

        // Verify the attempt exists
        const attempt = await this.prisma.attempt.findUnique({
            where: { id: attemptId },
            include: { exam: true },
        });

        if (!attempt) {
            throw new NotFoundException(`Attempt with ID ${attemptId} not found`);
        }

        // Use examId from attempt if not provided
        const actualExamId = examId || attempt.examId;

        // Define the storage path: {examId}/{attemptId}/{sequence}.webm
        const storagePath = `${actualExamId}/${attemptId}/${sequence}.webm`;

        // Upload to Supabase Storage
        const { data, error } = await this.supabase.storage
            .from(this.bucketName)
            .upload(storagePath, file.buffer, {
                contentType: 'video/webm',
                upsert: true, // Allow overwriting in case of retry
            });

        if (error) {
            console.error('Supabase upload error:', error);
            throw new BadRequestException(`Failed to upload video chunk: ${error.message}`);
        }

        // Update the attempt with the proctoring video path (folder path)
        const folderPath = `${actualExamId}/${attemptId}/`;
        if (!attempt.proctoringVideoPath) {
            await this.prisma.attempt.update({
                where: { id: attemptId },
                data: { proctoringVideoPath: folderPath },
            });
        }

        return {
            success: true,
            path: data.path,
        };
    }

    /**
     * Get all video chunks for an attempt, sorted by sequence number
     * @param attemptId - ID of the attempt
     */
    async getAttemptVideos(attemptId: string): Promise<{ videos: string[]; totalChunks: number }> {
        if (!this.supabase) {
            throw new BadRequestException('Supabase not configured. Proctoring features are disabled.');
        }

        // Get the attempt to find the video path
        const attempt = await this.prisma.attempt.findUnique({
            where: { id: attemptId },
            include: { exam: true },
        });

        if (!attempt) {
            throw new NotFoundException(`Attempt with ID ${attemptId} not found`);
        }

        if (!attempt.proctoringVideoPath) {
            return { videos: [], totalChunks: 0 };
        }

        // List all files in the attempt's folder
        const { data: files, error } = await this.supabase.storage
            .from(this.bucketName)
            .list(attempt.proctoringVideoPath);

        if (error) {
            console.error('Supabase list error:', error);
            throw new BadRequestException(`Failed to list video chunks: ${error.message}`);
        }

        if (!files || files.length === 0) {
            return { videos: [], totalChunks: 0 };
        }

        // Sort files by sequence number (filename is {sequence}.webm)
        const sortedFiles = files
            .filter(file => file.name.endsWith('.webm'))
            .sort((a, b) => {
                const seqA = Number.parseInt(a.name.replace('.webm', ''), 10);
                const seqB = Number.parseInt(b.name.replace('.webm', ''), 10);
                return seqA - seqB;
            });

        // Generate signed URLs for each file (valid for 1 hour)
        const videoUrls: string[] = [];
        for (const file of sortedFiles) {
            const filePath = `${attempt.proctoringVideoPath}${file.name}`;
            const { data: signedUrlData, error: signedUrlError } = await this.supabase.storage
                .from(this.bucketName)
                .createSignedUrl(filePath, 3600); // 1 hour expiry

            if (signedUrlError) {
                console.error(`Error creating signed URL for ${filePath}:`, signedUrlError);
                continue;
            }

            if (signedUrlData?.signedUrl) {
                videoUrls.push(signedUrlData.signedUrl);
            }
        }

        return {
            videos: videoUrls,
            totalChunks: videoUrls.length,
        };
    }

    /**
     * Delete all proctoring videos for an attempt
     * @param attemptId - ID of the attempt
     */
    async deleteAttemptVideos(attemptId: string): Promise<{ success: boolean; deletedCount: number }> {
        if (!this.supabase) {
            throw new BadRequestException('Supabase not configured. Proctoring features are disabled.');
        }

        const attempt = await this.prisma.attempt.findUnique({
            where: { id: attemptId },
        });

        if (!attempt) {
            throw new NotFoundException(`Attempt with ID ${attemptId} not found`);
        }

        if (!attempt.proctoringVideoPath) {
            return { success: true, deletedCount: 0 };
        }

        // List all files in the folder
        const { data: files, error: listError } = await this.supabase.storage
            .from(this.bucketName)
            .list(attempt.proctoringVideoPath);

        if (listError) {
            console.error('Supabase list error:', listError);
            throw new BadRequestException(`Failed to list video chunks: ${listError.message}`);
        }

        if (!files || files.length === 0) {
            return { success: true, deletedCount: 0 };
        }

        // Delete all files
        const filePaths = files.map(file => `${attempt.proctoringVideoPath}${file.name}`);
        const { error: deleteError } = await this.supabase.storage
            .from(this.bucketName)
            .remove(filePaths);

        if (deleteError) {
            console.error('Supabase delete error:', deleteError);
            throw new BadRequestException(`Failed to delete video chunks: ${deleteError.message}`);
        }

        // Clear the proctoring video path
        await this.prisma.attempt.update({
            where: { id: attemptId },
            data: { proctoringVideoPath: null },
        });

        return {
            success: true,
            deletedCount: files.length,
        };
    }

    /**
     * Check if proctoring is enabled (Supabase configured)
     */
    isProctoringEnabled(): boolean {
        return !!this.supabase;
    }
}
