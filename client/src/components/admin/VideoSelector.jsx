'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { mediaAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Search, Video, CheckCircle, RefreshCw, ChevronLeft, ChevronRight, Upload, Library } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import Image from 'next/image';

// Format duration
const formatDuration = (seconds) => {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * VideoSelector Component
 * Modal for selecting a video from the Bunny.net media library OR uploading a new one
 * 
 * @param {boolean} open - Whether the modal is open
 * @param {function} onOpenChange - Callback when modal open state changes
 * @param {function} onSelect - Callback when a video is selected, receives { id, title, duration, thumbnailUrl }
 * @param {string} selectedVideoId - Currently selected video ID (for highlighting)
 */
export default function VideoSelector({ open, onOpenChange, onSelect, selectedVideoId }) {
  const [activeTab, setActiveTab] = useState('library'); // 'library' or 'upload'
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState(null);
  
  // Upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Check configuration and fetch videos when modal opens
  useEffect(() => {
    if (open) {
      checkConfigAndFetch();
      // Reset upload state
      setUploadFile(null);
      setUploadTitle('');
      setUploadProgress(0);
      setUploading(false);
    }
  }, [open]);

  // Update selected when selectedVideoId changes
  useEffect(() => {
    if (selectedVideoId && videos.length > 0) {
      const video = videos.find(v => v.id === selectedVideoId);
      if (video) {
        setSelected(video);
      }
    }
  }, [selectedVideoId, videos]);

  const checkConfigAndFetch = async () => {
    try {
      const configResponse = await mediaAPI.getConfigStatus();
      const configured = configResponse.data?.isConfigured || false;
      setIsConfigured(configured);
      
      if (configured) {
        await fetchVideos();
      }
    } catch (error) {
      console.error('Error checking config:', error);
      setIsConfigured(false);
    }
  };

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await mediaAPI.listVideos({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery,
      });

      if (response.success) {
        // Only show ready videos
        const readyVideos = (response.data.videos || []).filter(v => v.isReady);
        setVideos(readyVideos);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          totalPages: response.data.pagination?.totalPages || 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery]);

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle video selection
  const handleVideoClick = (video) => {
    setSelected(video);
  };

  // Handle confirm selection
  const handleConfirm = () => {
    if (selected && onSelect) {
      onSelect({
        id: selected.id,
        title: selected.title,
        duration: selected.length,
        thumbnailUrl: selected.thumbnailUrl,
        status: selected.status,
      });
    }
    onOpenChange(false);
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      // Use filename without extension as default title
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setUploadTitle(nameWithoutExt);
    }
  };

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setUploadFile(file);
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setUploadTitle(nameWithoutExt);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) {
      toast.error('Please select a file and enter a title');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('video', uploadFile);
      formData.append('title', uploadTitle.trim());

      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(percent);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch {
              reject(new Error('Invalid response'));
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        xhr.open('POST', `${API_BASE_URL}/media/upload`);
        
        // Add auth header
        const token = localStorage.getItem('accessToken');
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        
        xhr.send(formData);
      });

      const response = await uploadPromise;

      if (response.success && response.data?.video) {
        toast.success('Video uploaded successfully!');
        
        // Select the uploaded video
        const uploadedVideo = {
          id: response.data.video.guid,
          title: response.data.video.title,
          length: response.data.video.length || 0,
          thumbnailUrl: response.data.video.thumbnailUrl,
          status: response.data.video.status,
        };
        
        setSelected(uploadedVideo);
        
        // Switch to library and refresh
        await fetchVideos();
        setActiveTab('library');
        
        // Reset upload form
        setUploadFile(null);
        setUploadTitle('');
        setUploadProgress(0);
      }
    } catch (error) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select or Upload Video</DialogTitle>
          <DialogDescription>
            Choose a video from your library or upload a new one
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 border-b mb-4">
          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'library'
                ? 'border-b-2 border-brand-600 text-brand-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Library className="h-4 w-4" />
            Library
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'upload'
                ? 'border-b-2 border-brand-600 text-brand-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Upload className="h-4 w-4" />
            Upload New
          </button>
        </div>

        {!isConfigured ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Bunny.net is not configured. Please configure it in the server settings.
            </p>
            <Button variant="outline" onClick={checkConfigAndFetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Again
            </Button>
          </div>
        ) : activeTab === 'library' ? (
          <>
            {/* Search */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={fetchVideos}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Video Grid */}
            <div className="flex-1 overflow-y-auto min-h-[300px]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
                </div>
              ) : videos.length === 0 ? (
                <div className="py-12 text-center">
                  <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No videos match your search' : 'No videos available'}
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveTab('upload')}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload First Video
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => handleVideoClick(video)}
                      className={`
                        relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all
                        ${selected?.id === video.id 
                          ? 'border-brand-600 ring-2 ring-brand-600/20' 
                          : 'border-transparent hover:border-gray-300'}
                      `}
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-video bg-muted">
                        {video.thumbnailUrl ? (
                          <Image
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover"
                            width={640}
                            height={360}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Video className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        
                        {/* Duration */}
                        {video.length > 0 && (
                          <div className="absolute bottom-1 right-1 bg-black/70 text-white px-1.5 py-0.5 rounded text-xs">
                            {formatDuration(video.length)}
                          </div>
                        )}
                        
                        {/* Selected indicator */}
                        {selected?.id === video.id && (
                          <div className="absolute top-1 right-1">
                            <Badge className="bg-brand-600 text-white">
                              <CheckCircle className="h-3 w-3" />
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      {/* Title */}
                      <div className="p-2">
                        <p className="text-xs font-medium truncate" title={video.title}>
                          {video.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => {
                    setPagination(prev => ({ ...prev, page: prev.page - 1 }));
                    fetchVideos();
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => {
                    setPagination(prev => ({ ...prev, page: prev.page + 1 }));
                    fetchVideos();
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          /* Upload Tab */
          <div className="flex-1 space-y-4">
            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${uploadFile 
                  ? 'border-brand-600 bg-brand-50 dark:bg-brand-950' 
                  : 'border-gray-300 hover:border-gray-400 dark:border-gray-700'}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {uploadFile ? (
                <div className="space-y-2">
                  <Video className="h-12 w-12 mx-auto text-brand-600" />
                  <p className="font-medium">{uploadFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadFile(null);
                      setUploadTitle('');
                    }}
                  >
                    Change File
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="font-medium">Click to select or drag & drop video</p>
                  <p className="text-sm text-muted-foreground">
                    Supports MP4, MOV, AVI, MKV (Max size: 2GB)
                  </p>
                </div>
              )}
            </div>

            {/* Title Input */}
            {uploadFile && (
              <div>
                <label className="text-sm font-medium mb-1 block">Video Title</label>
                <Input
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Enter video title..."
                />
              </div>
            )}

            {/* Progress Bar */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Upload Button */}
            {uploadFile && !uploading && (
              <Button 
                className="w-full" 
                onClick={handleUpload}
                disabled={!uploadTitle.trim()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Video
              </Button>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selected}>
            Select Video
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

