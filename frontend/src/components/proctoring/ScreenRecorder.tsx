'use client';

import { useEffect, useRef, useState } from 'react';
import { Monitor, MonitorOff, AlertCircle, CheckCircle2, MonitorPlay } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface ScreenRecorderProps {
    readonly attemptId: string;
    readonly isRecording?: boolean;
    readonly onError?: (error: string) => void;
    readonly onStatusChange?: (status: 'idle' | 'recording' | 'error') => void;
    readonly chunkInterval?: number; // Interval in seconds (default: 10)
    readonly maxRetries?: number; // Max retries per chunk (default: 3)
    readonly className?: string;
}

export default function ScreenRecorder({
    attemptId,
    isRecording = true,
    onError,
    onStatusChange,
    chunkInterval = 10,
    maxRetries = 3,
    className,
}: ScreenRecorderProps) {
    const previewRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const sequenceRef = useRef(1);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isInitializedRef = useRef(false);

    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [status, setStatus] = useState<'idle' | 'recording' | 'error'>('idle');
    const [uploadedCount, setUploadedCount] = useState(0);
    const [failedCount, setFailedCount] = useState(0);
    const [isRequestingPermission, setIsRequestingPermission] = useState(false);

    // Upload chunk function
    const uploadChunk = async (blob: Blob, seq: number) => {
        for (let retry = 0; retry < maxRetries; retry++) {
            try {
                const formData = new FormData();
                formData.append('video', blob, `${seq}.webm`);
                await api.uploadScreenChunk(attemptId, seq, formData);
                setUploadedCount(c => c + 1);
                return true;
            } catch (err) {
                console.error(`Screen chunk ${seq} failed (${retry + 1}/${maxRetries}):`, err);
                if (retry < maxRetries - 1) {
                    await new Promise(r => setTimeout(r, Math.pow(2, retry) * 1000));
                }
            }
        }
        setFailedCount(c => c + 1);
        return false;
    };

    // Request screen sharing permission
    const requestScreenPermission = async () => {
        if (isRequestingPermission) return;
        setIsRequestingPermission(true);

        try {
            // Request screen capture with display surface preference
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    displaySurface: 'monitor', // Prefer entire screen
                    width: { ideal: 1920, max: 1920 },
                    height: { ideal: 1080, max: 1080 },
                    frameRate: { ideal: 5, max: 10 }, // Lower framerate to save bandwidth
                },
                audio: false,
            });

            // Check if user selected entire screen (preferred for proctoring)
            const videoTrack = stream.getVideoTracks()[0];
            const settings = videoTrack.getSettings();
            console.log('[ScreenRecorder] Display surface:', settings.displaySurface);

            // Listen for when user stops sharing
            videoTrack.onended = () => {
                console.log('[ScreenRecorder] User stopped screen sharing');
                stopRecording();
                setStatus('error');
                onStatusChange?.('error');
                onError?.('Chia sẻ màn hình đã bị dừng');
            };

            streamRef.current = stream;
            setHasPermission(true);
            return stream;
        } catch (err: unknown) {
            console.error('[ScreenRecorder] Screen capture error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';

            if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
                onError?.('Bạn cần cho phép chia sẻ màn hình để tiếp tục thi');
            } else if (errorMessage.includes('NotSupportedError')) {
                onError?.('Trình duyệt không hỗ trợ ghi màn hình');
            } else {
                onError?.(`Lỗi chia sẻ màn hình: ${errorMessage}`);
            }

            setHasPermission(false);
            setStatus('error');
            onStatusChange?.('error');
            return null;
        } finally {
            setIsRequestingPermission(false);
        }
    };

    // Stop recording and cleanup
    const stopRecording = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // Stop recorder - this triggers onstop which uploads remaining data
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
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
                // Request screen sharing permission
                const stream = await requestScreenPermission();

                if (!isActive || !stream) {
                    if (stream) {
                        stream.getTracks().forEach(t => t.stop());
                    }
                    return;
                }

                // Show preview
                if (previewRef.current) {
                    previewRef.current.srcObject = stream;
                }

                // Setup MediaRecorder
                let mimeType = 'video/webm';
                if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
                    mimeType = 'video/webm;codecs=vp9';
                } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
                    mimeType = 'video/webm;codecs=vp8';
                }

                // Function to create a new recorder session
                // Minimum blob size (1KB) - smaller blobs are likely incomplete
                const MIN_BLOB_SIZE = 1024;

                // Each session produces a complete, playable video file
                const createRecorderSession = () => {
                    if (!isActive || !streamRef.current) return null;

                    const recorder = new MediaRecorder(streamRef.current, {
                        mimeType,
                        videoBitsPerSecond: 1000000, // 1 Mbps for screen (higher than webcam)
                    });

                    const chunks: Blob[] = [];

                    recorder.ondataavailable = (e) => {
                        if (e.data && e.data.size > 0) {
                            chunks.push(e.data);
                        }
                    };

                    recorder.onstop = () => {
                        if (chunks.length > 0) {
                            const blob = new Blob(chunks, { type: mimeType });
                            // Only upload if blob is large enough to be valid
                            if (blob.size >= MIN_BLOB_SIZE) {
                                const seq = sequenceRef.current;
                                sequenceRef.current++;
                                uploadChunk(blob, seq);
                            } else {
                                console.log(`[ScreenRecorder] Skipping small chunk (${blob.size} bytes)`);
                            }
                        }
                    };

                    return recorder;
                };

                // Start first recording session
                let currentRecorder = createRecorderSession();
                if (currentRecorder) {
                    currentRecorder.start();
                    mediaRecorderRef.current = currentRecorder;
                }

                setStatus('recording');
                onStatusChange?.('recording');

                // Every chunkInterval: stop current recorder and start new one
                // This ensures each chunk is a complete, playable video file
                intervalRef.current = setInterval(() => {
                    if (!isActive) return;

                    // Stop current recorder (triggers onstop which uploads)
                    if (mediaRecorderRef.current?.state === 'recording') {
                        mediaRecorderRef.current.stop();
                    }

                    // Start new recorder session
                    const newRecorder = createRecorderSession();
                    if (newRecorder) {
                        newRecorder.start();
                        mediaRecorderRef.current = newRecorder;
                    }
                }, chunkInterval * 1000);

            } catch (err) {
                console.error('[ScreenRecorder] Recording error:', err);
                if (isActive) {
                    setHasPermission(false);
                    setStatus('error');
                    onStatusChange?.('error');
                    onError?.('Không thể ghi màn hình');
                }
            }
        };

        startRecording();

        // Cleanup function
        return () => {
            isActive = false;
            isInitializedRef.current = false;
            stopRecording();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRecording]);

    return (
        <div className={cn('relative', className)}>
            <div className="relative bg-gray-900 rounded-lg overflow-hidden shadow-lg" style={{ width: 160, height: 90 }}>
                {/* Preview Video */}
                <video
                    ref={previewRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ width: 160, height: 90, objectFit: 'cover' }}
                />

                {/* Recording indicator */}
                {status === 'recording' && (
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                        <span className="text-xs font-medium text-white drop-shadow-md">SCREEN</span>
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
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
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

                {/* Permission denied / No screen selected */}
                {hasPermission === false && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                        <MonitorOff className="w-6 h-6 text-gray-400" />
                    </div>
                )}

                {/* Loading / Requesting permission */}
                {hasPermission === null && status === 'idle' && isRecording && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 gap-1">
                        <Monitor className="w-6 h-6 text-gray-400 animate-pulse" />
                        <span className="text-xs text-gray-400">Đang yêu cầu...</span>
                    </div>
                )}
            </div>
        </div>
    );
}
