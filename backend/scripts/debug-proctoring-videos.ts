/**
 * Script để kiểm tra videos của một attempt trong Supabase Storage
 * 
 * Cách chạy:
 * npx ts-node --project tsconfig.json scripts/debug-proctoring-videos.ts <attemptId>
 * 
 * Ví dụ:
 * npx ts-node --project tsconfig.json scripts/debug-proctoring-videos.ts 8b19508f-903a-448e-bfba-d7bbced12345
 */

import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const bucketName = 'proctoring-videos';

async function main() {
    const attemptId = process.argv[2];

    if (!attemptId) {
        console.log('Usage: npx ts-node scripts/debug-proctoring-videos.ts <attemptId>');
        console.log('\nTo list recent attempts with videos:');
        console.log('npx ts-node scripts/debug-proctoring-videos.ts --list');
        process.exit(1);
    }

    // Check Supabase config
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ SUPABASE_URL and SUPABASE_KEY must be set in .env');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // List mode
    if (attemptId === '--list') {
        console.log('\n📋 Recent attempts with proctoring videos:\n');
        const attempts = await prisma.attempt.findMany({
            where: { proctoringVideoPath: { not: null } },
            include: { exam: true, student: true },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        if (attempts.length === 0) {
            console.log('No attempts with proctoring videos found.');
            return;
        }

        for (const a of attempts) {
            console.log(`${a.id}`);
            console.log(`  User: ${a.student?.name} (${a.student?.email})`);
            console.log(`  Exam: ${a.exam?.title}`);
            console.log(`  Path: ${a.proctoringVideoPath}`);
            console.log(`  Created: ${a.createdAt.toISOString()}`);
            console.log('');
        }
        return;
    }

    // Debug specific attempt
    console.log('\n========================================');
    console.log(`🔍 Debugging attempt: ${attemptId}`);
    console.log('========================================\n');

    // Get attempt
    const attempt = await prisma.attempt.findUnique({
        where: { id: attemptId },
        include: { exam: true, student: true },
    });

    if (!attempt) {
        console.error(`❌ Attempt ${attemptId} not found`);
        process.exit(1);
    }

    console.log(`📝 Attempt Info:`);
    console.log(`  User: ${attempt.student?.name} (${attempt.student?.email})`);
    console.log(`  Exam: ${attempt.exam?.title}`);
    console.log(`  Status: ${attempt.status}`);
    console.log(`  Score: ${attempt.score ?? 'N/A'}`);
    console.log(`  Video Path: ${attempt.proctoringVideoPath || 'Not set'}`);
    console.log(`  Created: ${attempt.createdAt.toISOString()}`);
    console.log('');

    const basePath = attempt.proctoringVideoPath || `${attempt.examId}/${attemptId}/`;

    // Check folders
    const foldersToCheck = [
        { name: 'webcam', path: `${basePath}webcam/` },
        { name: 'screen', path: `${basePath}screen/` },
        { name: 'root (legacy)', path: basePath },
    ];

    for (const folder of foldersToCheck) {
        console.log(`\n📁 Checking ${folder.name}: ${folder.path}`);
        console.log('─'.repeat(60));

        const { data: files, error } = await supabase.storage
            .from(bucketName)
            .list(folder.path);

        if (error) {
            console.log(`  ❌ Error: ${error.message}`);
            continue;
        }

        if (!files || files.length === 0) {
            console.log(`  ⚪ Empty folder`);
            continue;
        }

        // Filter to webm files only
        const videoFiles = files.filter(f => f.name.endsWith('.webm'));
        
        if (videoFiles.length === 0) {
            console.log(`  ⚪ No .webm files (${files.length} other items)`);
            continue;
        }

        console.log(`  📹 Found ${videoFiles.length} video files:\n`);

        // Sort by sequence number
        videoFiles.sort((a, b) => {
            const seqA = parseInt(a.name.replace('.webm', ''), 10) || 0;
            const seqB = parseInt(b.name.replace('.webm', ''), 10) || 0;
            return seqA - seqB;
        });

        for (const file of videoFiles) {
            const filePath = `${folder.path}${file.name}`;
            const size = file.metadata?.size;
            const sizeKB = size ? (size / 1024).toFixed(1) : '???';

            process.stdout.write(`  ${file.name.padEnd(12)} (${sizeKB} KB) ... `);

            // Try to create signed URL
            const { data: signedData, error: signedError } = await supabase.storage
                .from(bucketName)
                .createSignedUrl(filePath, 60);

            if (signedError) {
                console.log(`❌ Signed URL failed: ${signedError.message}`);
                continue;
            }

            // Test if URL is accessible
            try {
                const response = await fetch(signedData.signedUrl, { method: 'HEAD' });
                if (response.ok) {
                    const contentLength = response.headers.get('content-length');
                    const contentType = response.headers.get('content-type');
                    console.log(`✅ Accessible (${contentLength} bytes, ${contentType})`);
                } else {
                    console.log(`❌ HTTP ${response.status} ${response.statusText}`);
                }
            } catch (fetchError) {
                console.log(`❌ Fetch failed: ${fetchError instanceof Error ? fetchError.message : 'Unknown'}`);
            }
        }
    }

    // Download and verify first video
    console.log('\n\n🔬 Deep verification of first video:');
    console.log('─'.repeat(60));

    const webcamPath = `${basePath}webcam/1.webm`;
    console.log(`\nDownloading: ${webcamPath}`);

    const { data: downloadData, error: downloadError } = await supabase.storage
        .from(bucketName)
        .download(webcamPath);

    if (downloadError) {
        console.log(`❌ Download failed: ${downloadError.message}`);
    } else {
        const arrayBuffer = await downloadData.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        console.log(`  Size: ${downloadData.size} bytes`);
        console.log(`  Type: ${downloadData.type}`);
        console.log(`  First 20 bytes: ${Array.from(bytes.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);

        // Check WebM magic bytes (EBML header)
        const isWebM = bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3;
        console.log(`  Valid WebM header: ${isWebM ? '✅ Yes' : '❌ No'}`);
    }

    // Also check second video
    const webcamPath2 = `${basePath}webcam/2.webm`;
    console.log(`\nDownloading: ${webcamPath2}`);

    const { data: downloadData2, error: downloadError2 } = await supabase.storage
        .from(bucketName)
        .download(webcamPath2);

    if (downloadError2) {
        console.log(`❌ Download failed: ${downloadError2.message}`);
        console.log(`\n⚠️  Video 2 does not exist or cannot be accessed!`);
        console.log(`   This explains why playback fails after the first video.`);
    } else {
        const arrayBuffer = await downloadData2.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        console.log(`  Size: ${downloadData2.size} bytes`);
        console.log(`  Type: ${downloadData2.type}`);
        console.log(`  First 20 bytes: ${Array.from(bytes.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);

        const isWebM = bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3;
        console.log(`  Valid WebM header: ${isWebM ? '✅ Yes' : '❌ No'}`);
    }

    console.log('\n========================================');
    console.log('🏁 Debug complete');
    console.log('========================================\n');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
