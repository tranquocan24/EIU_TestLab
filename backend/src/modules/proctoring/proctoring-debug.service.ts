'use strict';

import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '@/common/prisma/prisma.service';

interface VideoFileInfo {
    name: string;
    path: string;
    size: number | null;
    createdAt: string | null;
    updatedAt: string | null;
    signedUrl: string | null;
    isAccessible: boolean;
    error?: string;
}

interface DebugResult {
    attemptId: string;
    examId: string;
    storagePath: string;
    webcamVideos: VideoFileInfo[];
    screenVideos: VideoFileInfo[];
    summary: {
        webcam: { total: number; accessible: number; failed: number };
        screen: { total: number; accessible: number; failed: number };
    };
}

@Injectable()
export class ProctoringDebugService {
    private readonly supabase: SupabaseClient | null;
    private readonly bucketName = 'proctoring-videos';

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

        if (!supabaseUrl || !supabaseKey) {
            console.warn('Supabase credentials not configured.');
            this.supabase = null;
        } else {
            this.supabase = createClient(supabaseUrl, supabaseKey);
        }
    }

    /**
     * Debug và kiểm tra tất cả video files của một attempt
     */
    async debugAttemptVideos(attemptId: string): Promise<DebugResult> {
        if (!this.supabase) {
            throw new BadRequestException('Supabase not configured');
        }

        // Get attempt info
        const attempt = await this.prisma.attempt.findUnique({
            where: { id: attemptId },
            include: { exam: true, student: true },
        });

        if (!attempt) {
            throw new BadRequestException(`Attempt ${attemptId} not found`);
        }

        const basePath = attempt.proctoringVideoPath || `${attempt.examId}/${attemptId}/`;

        console.log('\n========================================');
        console.log(`[DEBUG] Checking videos for attempt: ${attemptId}`);
        console.log(`[DEBUG] User: ${attempt.student?.name} (${attempt.student?.email})`);
        console.log(`[DEBUG] Exam: ${attempt.exam?.title}`);
        console.log(`[DEBUG] Base storage path: ${basePath}`);
        console.log('========================================\n');

        // Check webcam videos
        const webcamVideos = await this.checkVideosInFolder(`${basePath}webcam/`);
        
        // Check screen videos
        const screenVideos = await this.checkVideosInFolder(`${basePath}screen/`);

        // Also check root folder (legacy)
        const rootVideos = await this.checkVideosInFolder(basePath);

        const result: DebugResult = {
            attemptId,
            examId: attempt.examId,
            storagePath: basePath,
            webcamVideos: [...webcamVideos, ...rootVideos.filter(v => v.name.endsWith('.webm'))],
            screenVideos,
            summary: {
                webcam: {
                    total: webcamVideos.length + rootVideos.filter(v => v.name.endsWith('.webm')).length,
                    accessible: [...webcamVideos, ...rootVideos].filter(v => v.isAccessible).length,
                    failed: [...webcamVideos, ...rootVideos].filter(v => !v.isAccessible).length,
                },
                screen: {
                    total: screenVideos.length,
                    accessible: screenVideos.filter(v => v.isAccessible).length,
                    failed: screenVideos.filter(v => !v.isAccessible).length,
                },
            },
        };

        // Print summary
        console.log('\n========================================');
        console.log('[DEBUG] SUMMARY:');
        console.log(`Webcam: ${result.summary.webcam.accessible}/${result.summary.webcam.total} accessible`);
        console.log(`Screen: ${result.summary.screen.accessible}/${result.summary.screen.total} accessible`);
        console.log('========================================\n');

        return result;
    }

    /**
     * Kiểm tra tất cả files trong một folder
     */
    private async checkVideosInFolder(folderPath: string): Promise<VideoFileInfo[]> {
        if (!this.supabase) return [];

        console.log(`\n[DEBUG] Checking folder: ${folderPath}`);

        // List files in folder
        const { data: files, error: listError } = await this.supabase.storage
            .from(this.bucketName)
            .list(folderPath);

        if (listError) {
            console.error(`[DEBUG] Error listing folder ${folderPath}:`, listError.message);
            return [];
        }

        if (!files || files.length === 0) {
            console.log(`[DEBUG] No files found in ${folderPath}`);
            return [];
        }

        console.log(`[DEBUG] Found ${files.length} items in ${folderPath}`);

        const videoFiles: VideoFileInfo[] = [];

        for (const file of files) {
            // Skip folders
            if (file.id === null && file.metadata === null) {
                console.log(`[DEBUG] Skipping folder: ${file.name}`);
                continue;
            }

            const filePath = `${folderPath}${file.name}`;
            const fileInfo: VideoFileInfo = {
                name: file.name,
                path: filePath,
                size: file.metadata?.size ?? null,
                createdAt: file.created_at ?? null,
                updatedAt: file.updated_at ?? null,
                signedUrl: null,
                isAccessible: false,
            };

            console.log(`\n[DEBUG] Checking file: ${file.name}`);
            console.log(`  - Size: ${file.metadata?.size ?? 'unknown'} bytes`);
            console.log(`  - Created: ${file.created_at ?? 'unknown'}`);

            // Try to create signed URL
            const { data: signedUrlData, error: signedUrlError } = await this.supabase.storage
                .from(this.bucketName)
                .createSignedUrl(filePath, 3600);

            if (signedUrlError) {
                fileInfo.error = `Signed URL error: ${signedUrlError.message}`;
                console.error(`  - Signed URL ERROR: ${signedUrlError.message}`);
            } else if (signedUrlData?.signedUrl) {
                fileInfo.signedUrl = signedUrlData.signedUrl;
                console.log(`  - Signed URL: OK`);

                // Test if URL is actually accessible by trying to download first byte
                try {
                    const response = await fetch(signedUrlData.signedUrl, {
                        method: 'HEAD',
                    });

                    if (response.ok) {
                        fileInfo.isAccessible = true;
                        const contentLength = response.headers.get('content-length');
                        console.log(`  - HTTP HEAD: OK (${response.status}), Content-Length: ${contentLength}`);
                    } else {
                        fileInfo.error = `HTTP ${response.status}: ${response.statusText}`;
                        console.error(`  - HTTP HEAD: FAILED (${response.status} ${response.statusText})`);
                    }
                } catch (fetchError) {
                    fileInfo.error = `Fetch error: ${fetchError instanceof Error ? fetchError.message : 'Unknown'}`;
                    console.error(`  - Fetch ERROR: ${fileInfo.error}`);
                }
            }

            videoFiles.push(fileInfo);
        }

        return videoFiles;
    }

    /**
     * Kiểm tra tất cả attempts có video proctoring
     */
    async listAllAttemptsWithVideos(): Promise<Array<{
        attemptId: string;
        examTitle: string;
        userName: string;
        videoPath: string | null;
        createdAt: Date;
    }>> {
        const attempts = await this.prisma.attempt.findMany({
            where: {
                proctoringVideoPath: { not: null },
            },
            include: {
                exam: true,
                student: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 50, // Limit to last 50
        });

        return attempts.map(a => ({
            attemptId: a.id,
            examTitle: a.exam?.title || 'Unknown',
            userName: a.student?.name || 'Unknown',
            videoPath: a.proctoringVideoPath,
            createdAt: a.createdAt,
        }));
    }

    /**
     * Verify a single video file by downloading and checking its content
     */
    async verifyVideoFile(attemptId: string, type: 'webcam' | 'screen', sequence: number): Promise<{
        exists: boolean;
        size: number;
        contentType: string | null;
        canPlay: boolean;
        signedUrl: string | null;
        error?: string;
    }> {
        if (!this.supabase) {
            throw new BadRequestException('Supabase not configured');
        }

        const attempt = await this.prisma.attempt.findUnique({
            where: { id: attemptId },
        });

        if (!attempt) {
            throw new BadRequestException(`Attempt ${attemptId} not found`);
        }

        const basePath = attempt.proctoringVideoPath || `${attempt.examId}/${attemptId}/`;
        const filePath = `${basePath}${type}/${sequence}.webm`;

        console.log(`[DEBUG] Verifying file: ${filePath}`);

        // Try to download the file
        const { data, error } = await this.supabase.storage
            .from(this.bucketName)
            .download(filePath);

        if (error) {
            return {
                exists: false,
                size: 0,
                contentType: null,
                canPlay: false,
                signedUrl: null,
                error: error.message,
            };
        }

        // Get signed URL
        const { data: signedUrlData } = await this.supabase.storage
            .from(this.bucketName)
            .createSignedUrl(filePath, 3600);

        // Check if it's a valid webm file (check magic bytes)
        const arrayBuffer = await data.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        
        // WebM files start with 0x1A 0x45 0xDF 0xA3 (EBML header)
        const isValidWebm = bytes[0] === 0x1A && 
                           bytes[1] === 0x45 && 
                           bytes[2] === 0xDF && 
                           bytes[3] === 0xA3;

        console.log(`[DEBUG] File size: ${data.size} bytes`);
        console.log(`[DEBUG] Content type: ${data.type}`);
        console.log(`[DEBUG] Valid WebM header: ${isValidWebm}`);
        console.log(`[DEBUG] First 10 bytes: ${Array.from(bytes.slice(0, 10)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);

        return {
            exists: true,
            size: data.size,
            contentType: data.type,
            canPlay: isValidWebm && data.size > 1000, // At least 1KB and valid header
            signedUrl: signedUrlData?.signedUrl ?? null,
        };
    }
}
