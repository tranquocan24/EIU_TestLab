'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface WebcamRecorderProps {
    readonly attemptId: string;
    readonly isRecording?: boolean;
    readonly onError?: (error: string) => void;
    readonly onStatusChange?: (status: 'idle' | 'recording' | 'error') => void;
    readonly chunkInterval?: number; // Interval in seconds (default: 10)
    readonly maxRetries?: number; // Max retries per chunk (default: 3)
    readonly className?: string;
}

export default function WebcamRecorder({
    attemptId,
    isRecording = true,
    onError,
    onStatusChange,
    chunkInterval = 10,
    maxRetries = 3,
    className,
}: WebcamRecorderProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const sequenceRef = useRef(1);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isInitializedRef = useRef(false);

    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [status, setStatus] = useState<'idle' | 'recording' | 'error'>('idle');
    const [uploadedCount, setUploadedCount] = useState(0);
    const [failedCount, setFailedCount] = useState(0);

    // Upload chunk function
    const uploadChunk = async (blob: Blob, seq: number) => {
        for (let retry = 0; retry < maxRetries; retry++) {
            try {
                const formData = new FormData();
                formData.append('video', blob, `${seq}.webm`);
                await api.uploadProctoringChunk(attemptId, seq, formData);
                setUploadedCount(c => c + 1);
                return true;
            } catch (err) {
                console.error(`Chunk ${seq} failed (${retry + 1}/${maxRetries}):`, err);
                if (retry < maxRetries - 1) {
                    await new Promise(r => setTimeout(r, Math.pow(2, retry) * 1000));
                }
            }
        }
        setFailedCount(c => c + 1);
        return false;
    };

    // Single useEffect for entire lifecycle
    useEffect(() => {
        // Don't start if not recording or already initialized
        if (!isRecording) {
            return;
        }

        // Prevent double initialization (React StrictMode)
        if (isInitializedRef.current) {
            return;
        }
        isInitializedRef.current = true;

        let isActive = true; // For cleanup

        const startRecording = async () => {
            try {
                // Get camera stream
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
                    audio: false,
                });

                if (!isActive) {
                    // Component unmounted during async operation
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }

                streamRef.current = stream;
                setHasPermission(true);

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }

                // Setup MediaRecorder
                let mimeType = 'video/webm';
                if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
                    mimeType = 'video/webm;codecs=vp9';
                } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
                    mimeType = 'video/webm;codecs=vp8';
                }

                const recorder = new MediaRecorder(stream, {
                    mimeType,
                    videoBitsPerSecond: 500000,
                });

                recorder.ondataavailable = (e) => {
                    if (e.data && e.data.size > 0) {
                        chunksRef.current.push(e.data);
                    }
                };

                // Start recording with timeslice (collect data every second)
                recorder.start(1000);
                mediaRecorderRef.current = recorder;

                setStatus('recording');
                onStatusChange?.('recording');

                // Create chunks and upload every chunkInterval seconds
                intervalRef.current = setInterval(() => {
                    if (!isActive) return;

                    if (mediaRecorderRef.current?.state === 'recording' && chunksRef.current.length > 0) {
                        // Force data collection
                        mediaRecorderRef.current.requestData();

                        // Small delay to ensure ondataavailable fires
                        setTimeout(() => {
                            if (chunksRef.current.length === 0) return;

                            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                            const seq = sequenceRef.current;

                            // Clear chunks and increment sequence
                            chunksRef.current = [];
                            sequenceRef.current++;

                            // Upload (async, don't block interval)
                            uploadChunk(blob, seq);
                        }, 100);
                    }
                }, chunkInterval * 1000);

            } catch (err) {
                console.error('Camera error:', err);
                if (isActive) {
                    setHasPermission(false);
                    setStatus('error');
                    onStatusChange?.('error');
                    onError?.('Camera access denied');
                }
            }
        };

        startRecording();

        // Cleanup function
        return () => {
            isActive = false;
            isInitializedRef.current = false;

            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }

            // Upload any remaining chunks before stopping
            if (chunksRef.current.length > 0 && mediaRecorderRef.current) {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const seq = sequenceRef.current;
                chunksRef.current = [];
                uploadChunk(blob, seq);
            }

            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
                mediaRecorderRef.current = null;
            }

            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRecording]);

    return (
        <div className={cn('relative', className)}>
            <div className="relative bg-black rounded-lg overflow-hidden shadow-lg" style={{ width: 160, height: 120 }}>
                {/* Video */}
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ width: 160, height: 120, objectFit: 'cover', transform: 'scaleX(-1)' }}
                />

                {/* REC indicator */}
                {status === 'recording' && (
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                        <span className="text-xs font-medium text-white drop-shadow-md">REC</span>
                    </div>
                )}

                {/* Error indicator */}
                {status === 'error' && (
                    <div className="absolute top-2 left-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                    </div>
                )}

                {/* Upload counter */}
                <div className="absolute bottom-2 left-2">
                    <div className="flex items-center gap-1 text-xs text-white bg-black/60 px-1.5 py-0.5 rounded">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        <span className="font-mono">{uploadedCount}</span>
                    </div>
                </div>

                {/* Failed counter */}
                {failedCount > 0 && (
                    <div className="absolute bottom-2 right-2">
                        <div className="flex items-center gap-1 text-xs text-white bg-red-600/80 px-1.5 py-0.5 rounded">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span className="font-mono">{failedCount}</span>
                        </div>
                    </div>
                )}

                {/* Permission denied */}
                {hasPermission === false && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                        <CameraOff className="w-8 h-8 text-gray-400" />
                    </div>
                )}

                {/* Loading */}
                {hasPermission === null && status === 'idle' && isRecording && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                        <Camera className="w-8 h-8 text-gray-400 animate-pulse" />
                    </div>
                )}
            </div>
        </div>
    );
}
