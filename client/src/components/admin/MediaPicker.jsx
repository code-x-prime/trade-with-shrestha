'use client';

import { useState, useEffect, useCallback } from 'react';
import { mediaAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Loader2, 
  Upload, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  Check,
  X,
  Video,
  FolderOpen,
  Link2
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

// Helpers
const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * MediaPicker - Reusable media picker component for admin forms
 * 
 * @param {boolean} open - Whether the dialog is open
 * @param {function} onOpenChange - Callback when dialog open state changes
 * @param {function} onSelect - Callback when a file is selected, receives the public URL
 * @param {string} type - 'image' | 'video' | 'document' | 'all' - Filter by file type
 * @param {string} title - Dialog title
 * @param {string} description - Dialog description
 */
export default function MediaPicker({ 
  open, 
  onOpenChange, 
  onSelect, 
  type = 'all',
  title = 'Select Media',
  description = 'Choose from your media library or upload new'
}) {
  const [activeTab, setActiveTab] = useState('library');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 24, total: 0, totalPages: 0 });
  const [folder, setFolder] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadFolder, setUploadFolder] = useState('general');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Video URL state (for Bunny.net links)
  const [videoUrl, setVideoUrl] = useState('');

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await mediaAPI.listR2Files({
        page: pagination.page,
        limit: pagination.limit,
        folder: folder === 'all' ? '' : folder,
        type: type === 'all' ? '' : type,
      });

      if (response.success) {
        setFiles(response.data.files || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          totalPages: response.data.pagination?.totalPages || 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to fetch files');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, folder, type]);

  useEffect(() => {
    if (open) {
      fetchFiles();
    }
  }, [open, fetchFiles]);

  const handleFileUpload = async () => {
    if (!uploadFile) return;
    try {
      setIsUploading(true);
      setUploadProgress(0);
      const response = await mediaAPI.uploadR2File(uploadFile, uploadFolder, (progress) => {
        setUploadProgress(progress);
      });
      if (response.success) {
        toast.success('File uploaded successfully!');
        setUploadFile(null);
        setUploadProgress(0);
        // Switch to library tab and refresh
        setActiveTab('library');
        fetchFiles();
        // Auto-select the uploaded file
        if (response.data.file) {
          handleSelect(response.data.file.publicUrl);
        }
      }
    } catch (error) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelect = (url) => {
    if (onSelect) {
      onSelect(url);
    }
    onOpenChange(false);
    setSelectedFile(null);
  };

  const handleVideoUrlSubmit = () => {
    if (!videoUrl.trim()) {
      toast.error('Please enter a video URL');
      return;
    }
    handleSelect(videoUrl);
    setVideoUrl('');
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'image': return <ImageIcon className="h-8 w-8 text-blue-500" />;
      case 'video': return <Video className="h-8 w-8 text-purple-500" />;
      case 'document': 
      case 'pdf': return <FileText className="h-8 w-8 text-orange-500" />;
      default: return <FileIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  // Filter files based on search
  const filteredFiles = files.filter(file => 
    !searchQuery || file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="library">Media Library</TabsTrigger>
            <TabsTrigger value="upload">Upload New</TabsTrigger>
            {type === 'video' && <TabsTrigger value="url">Video URL</TabsTrigger>}
          </TabsList>

          {/* Library Tab */}
          <TabsContent value="library" className="flex-1 flex flex-col overflow-hidden mt-4">
            {/* Filters */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={folder} onValueChange={(val) => { setFolder(val); setPagination(p => ({...p, page: 1})); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Folders</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="courses">Courses</SelectItem>
                  <SelectItem value="products">Products</SelectItem>
                  <SelectItem value="banners">Banners</SelectItem>
                  <SelectItem value="ebooks">E-books</SelectItem>
                  <SelectItem value="webinars">Webinars</SelectItem>
                  <SelectItem value="mentorship">Mentorship</SelectItem>
                  <SelectItem value="guidance">Guidance</SelectItem>
                  <SelectItem value="bundles">Bundles</SelectItem>
                  <SelectItem value="offline-batches">Offline Batches</SelectItem>
                  <SelectItem value="indicators">Indicators</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Files Grid */}
            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No files found</p>
                  <Button variant="link" onClick={() => setActiveTab('upload')}>
                    Upload a file
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.key}
                      className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:shadow-md ${
                        selectedFile?.key === file.key 
                          ? 'border-brand-500 ring-2 ring-brand-500/30' 
                          : 'border-transparent hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedFile(file)}
                      onDoubleClick={() => handleSelect(file.publicUrl)}
                    >
                      {file.fileType === 'image' ? (
                        <Image
                          src={file.publicUrl}
                          alt={file.fileName}
                          className="w-full h-full object-cover"
                          width={200}
                          height={200}
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          {getFileIcon(file.fileType)}
                        </div>
                      )}
                      {selectedFile?.key === file.key && (
                        <div className="absolute top-2 right-2 bg-brand-500 text-white rounded-full p-1">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-white text-xs truncate">{file.fileName}</p>
                        <p className="text-white/70 text-xs">{formatSize(file.size)}</p>
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
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
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
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Selection Action */}
            {selectedFile && (
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Selected:</span>
                  <span className="text-sm text-muted-foreground truncate max-w-[200px]">{selectedFile.fileName}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedFile(null)}>
                    <X className="h-4 w-4 mr-1" /> Clear
                  </Button>
                  <Button size="sm" onClick={() => handleSelect(selectedFile.publicUrl)}>
                    <Check className="h-4 w-4 mr-1" /> Select
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="flex-1 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Folder Location</Label>
                <Select value={uploadFolder} onValueChange={setUploadFolder}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="courses">Courses</SelectItem>
                    <SelectItem value="products">Products</SelectItem>
                    <SelectItem value="banners">Banners</SelectItem>
                    <SelectItem value="ebooks">E-books</SelectItem>
                    <SelectItem value="webinars">Webinars</SelectItem>
                    <SelectItem value="mentorship">Mentorship</SelectItem>
                    <SelectItem value="guidance">Guidance</SelectItem>
                    <SelectItem value="bundles">Bundles</SelectItem>
                    <SelectItem value="offline-batches">Offline Batches</SelectItem>
                    <SelectItem value="indicators">Indicators</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Select File</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-brand-500 transition-colors">
                  <Input 
                    type="file" 
                    accept={type === 'image' ? 'image/*' : type === 'video' ? 'video/*' : undefined}
                    onChange={(e) => setUploadFile(e.target.files[0])} 
                    className="hidden"
                    id="media-picker-upload"
                  />
                  <label htmlFor="media-picker-upload" className="cursor-pointer">
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    {uploadFile ? (
                      <p className="text-sm font-medium">{uploadFile.name}</p>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">Click to select file</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {type === 'image' ? 'PNG, JPG, GIF up to 10MB' : 
                           type === 'video' ? 'MP4, WebM up to 100MB' : 
                           'All file types supported'}
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {isUploading && (
                <div className="space-y-1">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">{uploadProgress}%</p>
                </div>
              )}

              <Button 
                className="w-full" 
                onClick={handleFileUpload} 
                disabled={!uploadFile || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload & Select
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Video URL Tab (for video type) */}
          {type === 'video' && (
            <TabsContent value="url" className="flex-1 mt-4">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                  <p className="font-medium mb-1">Bunny.net Video URL</p>
                  <p>Enter the streaming URL from your Bunny.net video library or any other video hosting service.</p>
                </div>

                <div className="space-y-2">
                  <Label>Video URL</Label>
                  <Input
                    placeholder="https://vz-xxxx.b-cdn.net/xxxx/playlist.m3u8"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                  />
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleVideoUrlSubmit}
                  disabled={!videoUrl.trim()}
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  Use This URL
                </Button>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
