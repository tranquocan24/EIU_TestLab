'use client';

import { useState, useEffect } from 'react';
import { Camera, Monitor, LayoutGrid, LayoutTemplate, VideoOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SeamlessVideoPlayer from './SeamlessVideoPlayer';
import api from '@/lib/api';

interface ProctoringViewerProps {
    readonly attemptId: string;
    readonly className?: string;
}

type ViewMode = 'tabs' | 'side-by-side' | 'picture-in-picture';

/**
 * Component for teachers to view both webcam and screen recordings
 * with different layout options
 */
export default function ProctoringViewer({
    attemptId,
    className,
}: ProctoringViewerProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('tabs');
    const [activeTab, setActiveTab] = useState<'webcam' | 'screen'>('webcam');
    const [isLoading, setIsLoading] = useState(true);
    const [isProctoringEnabled, setIsProctoringEnabled] = useState(false);
    const [hasWebcamVideos, setHasWebcamVideos] = useState(false);
    const [hasScreenVideos, setHasScreenVideos] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check proctoring status and video availability
    useEffect(() => {
        const checkAvailability = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Check if proctoring is enabled
                const status = await api.getProctoringStatus();
                if (!status.enabled) {
                    setIsProctoringEnabled(false);
                    setError('Tính năng giám sát thi chưa được cấu hình trên server.');
                    setIsLoading(false);
                    return;
                }
                setIsProctoringEnabled(true);

                // Check if videos exist
                try {
                    const allVideos = await api.getAllProctoringVideos(attemptId);
                    setHasWebcamVideos(allVideos.webcam.totalChunks > 0);
                    setHasScreenVideos(allVideos.screen.totalChunks > 0);

                    if (allVideos.webcam.totalChunks === 0 && allVideos.screen.totalChunks === 0) {
                        setError('Không có video giám sát cho bài thi này.');
                    }
                } catch {
                    // If we can't get videos, show message
                    setError('Không thể tải video giám sát.');
                }
            } catch {
                setError('Không thể kiểm tra trạng thái giám sát thi.');
            } finally {
                setIsLoading(false);
            }
        };

        checkAvailability();
    }, [attemptId]);

    // Loading state
    if (isLoading) {
        return (
            <div className={cn('flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg', className)}>
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-3" />
                <p className="text-gray-500">Đang kiểm tra video giám sát...</p>
            </div>
        );
    }

    // Error or no videos state
    if (error || (!hasWebcamVideos && !hasScreenVideos)) {
        return (
            <div className={cn('flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg', className)}>
                <VideoOff className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-gray-600 font-medium">Video Giám Sát</p>
                <p className="text-gray-500 text-sm mt-1">{error || 'Không có video giám sát cho bài thi này.'}</p>
            </div>
        );
    }

    return (
        <div className={cn('space-y-4', className)}>
            {/* View mode selector - only show if both types have videos */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Video Giám Sát</h3>
                {hasWebcamVideos && hasScreenVideos && (
                    <div className="flex items-center gap-2">
                        <Button
                            variant={viewMode === 'tabs' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('tabs')}
                            className="gap-1"
                        >
                            <LayoutTemplate className="w-4 h-4" />
                            Tab
                        </Button>
                        <Button
                            variant={viewMode === 'side-by-side' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('side-by-side')}
                            className="gap-1"
                        >
                            <LayoutGrid className="w-4 h-4" />
                            Song song
                        </Button>
                    </div>
                )}
            </div>

            {/* Single video type - just show the available one */}
            {hasWebcamVideos && !hasScreenVideos && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                        <Camera className="w-4 h-4" />
                        Webcam
                    </div>
                    <SeamlessVideoPlayer
                        attemptId={attemptId}
                        type="webcam"
                        onError={(err) => console.error('[WebcamPlayer] Error:', err)}
                    />
                </div>
            )}

            {!hasWebcamVideos && hasScreenVideos && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                        <Monitor className="w-4 h-4" />
                        Màn hình
                    </div>
                    <SeamlessVideoPlayer
                        attemptId={attemptId}
                        type="screen"
                        onError={(err) => console.error('[ScreenPlayer] Error:', err)}
                    />
                </div>
            )}

            {/* Both video types available - Tab View Mode */}
            {hasWebcamVideos && hasScreenVideos && viewMode === 'tabs' && (
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'webcam' | 'screen')}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="webcam" className="gap-2">
                            <Camera className="w-4 h-4" />
                            Webcam
                        </TabsTrigger>
                        <TabsTrigger value="screen" className="gap-2">
                            <Monitor className="w-4 h-4" />
                            Màn hình
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="webcam" className="mt-4">
                        <SeamlessVideoPlayer
                            attemptId={attemptId}
                            type="webcam"
                            onError={(err) => console.error('[WebcamPlayer] Error:', err)}
                        />
                    </TabsContent>
                    <TabsContent value="screen" className="mt-4">
                        <SeamlessVideoPlayer
                            attemptId={attemptId}
                            type="screen"
                            onError={(err) => console.error('[ScreenPlayer] Error:', err)}
                        />
                    </TabsContent>
                </Tabs>
            )}

            {/* Both video types available - Side by Side View Mode */}
            {hasWebcamVideos && hasScreenVideos && viewMode === 'side-by-side' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                            <Camera className="w-4 h-4" />
                            Webcam
                        </div>
                        <SeamlessVideoPlayer
                            attemptId={attemptId}
                            type="webcam"
                            onError={(err) => console.error('[WebcamPlayer] Error:', err)}
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                            <Monitor className="w-4 h-4" />
                            Màn hình
                        </div>
                        <SeamlessVideoPlayer
                            attemptId={attemptId}
                            type="screen"
                            onError={(err) => console.error('[ScreenPlayer] Error:', err)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
