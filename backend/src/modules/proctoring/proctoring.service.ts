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
     * @param type - Type of recording ('webcam' | 'screen')
     */
    async uploadChunk(
        examId: string,
        attemptId: string,
        sequence: number,
        file: Express.Multer.File,
        type: 'webcam' | 'screen' = 'webcam',
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

        // Define the storage path: {examId}/{attemptId}/{type}/{sequence}.webm
        // Webcam: {examId}/{attemptId}/webcam/{sequence}.webm
        // Screen: {examId}/{attemptId}/screen/{sequence}.webm
        const storagePath = `${actualExamId}/${attemptId}/${type}/${sequence}.webm`;

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
     * Upload a screen recording chunk to Supabase Storage
     * @param examId - ID of the exam (optional, will be fetched from attempt if empty)
     * @param attemptId - ID of the attempt
     * @param sequence - Sequence number of the chunk (1, 2, 3, ...)
     * @param file - The video blob file
     */
    async uploadScreenChunk(
        examId: string,
        attemptId: string,
        sequence: number,
        file: Express.Multer.File,
    ): Promise<{ success: boolean; path: string }> {
        return this.uploadChunk(examId, attemptId, sequence, file, 'screen');
    }

    /**
     * Get all video chunks for an attempt, sorted by sequence number
     * @param attemptId - ID of the attempt
     * @param type - Type of recording ('webcam' | 'screen' | 'all')
     */
    async getAttemptVideos(attemptId: string, type: 'webcam' | 'screen' | 'all' = 'webcam'): Promise<{ videos: string[]; totalChunks: number; type: string }> {
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
            return { videos: [], totalChunks: 0, type };
        }

        // Build the folder path based on type
        // For 'all', we return webcam by default (for backwards compatibility)
        const typeFolderPath = type === 'all' 
            ? attempt.proctoringVideoPath 
            : `${attempt.proctoringVideoPath}${type}/`;

        // List all files in the attempt's folder
        const { data: files, error } = await this.supabase.storage
            .from(this.bucketName)
            .list(typeFolderPath);

        if (error) {
            console.error('Supabase list error:', error);
            // If folder doesn't exist, return empty array instead of throwing
            if (error.message.includes('not found') || error.message.includes('does not exist')) {
                return { videos: [], totalChunks: 0, type };
            }
            throw new BadRequestException(`Failed to list video chunks: ${error.message}`);
        }

        if (!files || files.length === 0) {
            return { videos: [], totalChunks: 0, type };
        }

        // Minimum file size (1KB) - files smaller than this are likely incomplete/corrupt
        const MIN_VIDEO_SIZE = 1024;

        // Sort files by sequence number (filename is {sequence}.webm)
        // Filter out empty files, too small files, and non-webm files
        const sortedFiles = files
            .filter(file => {
                // Only include .webm files with actual content
                if (!file.name.endsWith('.webm')) return false;
                
                const fileSize = file.metadata?.size ?? 0;
                
                // Check if file has sufficient size
                if (fileSize < MIN_VIDEO_SIZE) {
                    console.warn(`[Proctoring] Skipping small/empty file: ${file.name} (${fileSize} bytes)`);
                    return false;
                }
                return true;
            })
            .sort((a, b) => {
                const seqA = Number.parseInt(a.name.replace('.webm', ''), 10);
                const seqB = Number.parseInt(b.name.replace('.webm', ''), 10);
                return seqA - seqB;
            });

        console.log(`[Proctoring] Found ${sortedFiles.length} ${type} video files for attempt ${attemptId}:`, 
            sortedFiles.map(f => ({ name: f.name, size: f.metadata?.size })));

        // Generate signed URLs for each file (valid for 1 hour)
        const videoUrls: string[] = [];
        for (const file of sortedFiles) {
            const filePath = `${typeFolderPath}${file.name}`;
            
            // First verify the file exists and is accessible
            const { data: signedUrlData, error: signedUrlError } = await this.supabase.storage
                .from(this.bucketName)
                .createSignedUrl(filePath, 3600); // 1 hour expiry

            if (signedUrlError) {
                console.error(`Error creating signed URL for ${filePath}:`, signedUrlError);
                continue;
            }

            if (signedUrlData?.signedUrl) {
                console.log(`[Proctoring] Generated signed URL for ${file.name}`);
                videoUrls.push(signedUrlData.signedUrl);
            }
        }

        console.log(`[Proctoring] Returning ${videoUrls.length} signed URLs for ${type}`);
        return {
            videos: videoUrls,
            totalChunks: videoUrls.length,
            type,
        };
    }

    /**
     * Get screen recording videos for an attempt
     * @param attemptId - ID of the attempt
     */
    async getScreenVideos(attemptId: string): Promise<{ videos: string[]; totalChunks: number; type: string }> {
        return this.getAttemptVideos(attemptId, 'screen');
    }

    /**
     * Get all proctoring videos (webcam + screen) for an attempt
     * @param attemptId - ID of the attempt
     */
    async getAllProctoringVideos(attemptId: string): Promise<{
        webcam: { videos: string[]; totalChunks: number };
        screen: { videos: string[]; totalChunks: number };
    }> {
        const [webcamResult, screenResult] = await Promise.all([
            this.getAttemptVideos(attemptId, 'webcam'),
            this.getAttemptVideos(attemptId, 'screen'),
        ]);

        return {
            webcam: { videos: webcamResult.videos, totalChunks: webcamResult.totalChunks },
            screen: { videos: screenResult.videos, totalChunks: screenResult.totalChunks },
        };
    }

    /**
     * Delete all proctoring videos for an attempt (both webcam and screen)
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

        let totalDeleted = 0;

        // Delete webcam files
        const webcamPath = `${attempt.proctoringVideoPath}webcam/`;
        try {
            const { data: webcamFiles } = await this.supabase.storage
                .from(this.bucketName)
                .list(webcamPath);

            if (webcamFiles && webcamFiles.length > 0) {
                const webcamFilePaths = webcamFiles.map(file => `${webcamPath}${file.name}`);
                await this.supabase.storage.from(this.bucketName).remove(webcamFilePaths);
                totalDeleted += webcamFiles.length;
            }
        } catch (err) {
            console.log('No webcam files to delete or error:', err);
        }

        // Delete screen files
        const screenPath = `${attempt.proctoringVideoPath}screen/`;
        try {
            const { data: screenFiles } = await this.supabase.storage
                .from(this.bucketName)
                .list(screenPath);

            if (screenFiles && screenFiles.length > 0) {
                const screenFilePaths = screenFiles.map(file => `${screenPath}${file.name}`);
                await this.supabase.storage.from(this.bucketName).remove(screenFilePaths);
                totalDeleted += screenFiles.length;
            }
        } catch (err) {
            console.log('No screen files to delete or error:', err);
        }

        // Clear the proctoring video path
        await this.prisma.attempt.update({
            where: { id: attemptId },
            data: { proctoringVideoPath: null },
        });

        return {
            success: true,
            deletedCount: totalDeleted,
        };
    }

    /**
     * Check if proctoring is enabled (Supabase configured)
     */
    isProctoringEnabled(): boolean {
        return !!this.supabase;
    }
}
