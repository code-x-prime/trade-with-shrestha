'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { mediaAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Upload, 
  Trash2, 
  Search, 
  Video, 
  Link2, 
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Grid,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  Music,
  FolderOpen,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';

// ==========================================
// Helpers
// ==========================================

const formatDuration = (seconds) => {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const copyToClipboard = (text, label) => {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copied to clipboard`);
};

// ==========================================
// Bunny.net Library Component
// ==========================================

const StatusBadge = ({ status, statusText }) => {
  const statusConfig = {
    0: { color: 'bg-gray-500', icon: Clock, label: 'Created' },
    1: { color: 'bg-blue-500', icon: Upload, label: 'Uploaded' },
    2: { color: 'bg-yellow-500', icon: RefreshCw, label: 'Processing' },
    3: { color: 'bg-orange-500', icon: RefreshCw, label: 'Transcoding' },
    4: { color: 'bg-green-500', icon: CheckCircle, label: 'Ready' },
    5: { color: 'bg-red-500', icon: XCircle, label: 'Error' },
    6: { color: 'bg-red-500', icon: AlertCircle, label: 'Upload Failed' },
  };

  const config = statusConfig[status] || statusConfig[0];
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} text-white flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {statusText || config.label}
    </Badge>
  );
};

const BunnyLibrary = ({ isActive }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  
  // Upload state
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadTab, setUploadTab] = useState('file');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Delete state
  const [deleteDialog, setDeleteDialog] = useState({ open: false, video: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch videos
  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await mediaAPI.listVideos({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery,
      });

      if (response.success) {
        setVideos(response.data.videos || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          totalPages: response.data.pagination?.totalPages || 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error('Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery]);

  useEffect(() => {
    if (isActive) {
      fetchVideos();
    }
  }, [isActive, fetchVideos]);

  // Handle file upload
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle.trim()) {
      toast.error('Please provide a video file and title');
      return;
    }
    try {
      setIsUploading(true);
      setUploadProgress(0);
      const response = await mediaAPI.uploadVideo(uploadFile, uploadTitle, (progress) => {
        setUploadProgress(progress);
      });
      if (response.success) {
        toast.success('Video uploaded successfully!');
        setShowUploadDialog(false);
        resetUploadForm();
        fetchVideos();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to upload video');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle URL fetch
  const handleUrlFetch = async (e) => {
    e.preventDefault();
    if (!uploadUrl.trim() || !uploadTitle.trim()) {
      toast.error('Please provide a video URL and title');
      return;
    }
    try {
      setIsUploading(true);
      const response = await mediaAPI.fetchFromUrl(uploadUrl, uploadTitle);
      if (response.success) {
        toast.success('Video fetch initiated!');
        setShowUploadDialog(false);
        resetUploadForm();
        fetchVideos();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch video');
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadTitle('');
    setUploadUrl('');
    setUploadProgress(0);
    setUploadTab('file');
  };

  const handleDelete = async () => {
    if (!deleteDialog.video) return;
    try {
      setIsDeleting(true);
      const response = await mediaAPI.deleteVideo(deleteDialog.video.id);
      if (response.success) {
        toast.success('Video deleted successfully');
        setDeleteDialog({ open: false, video: null });
        fetchVideos();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete video');
    } finally {
      setIsDeleting(false);
    }
  };

  const refreshVideoStatus = async (videoId) => {
    try {
      const response = await mediaAPI.getVideoStatus(videoId);
      if (response.success) {
        setVideos(prev => prev.map(v => 
          v.id === videoId 
            ? { ...v, status: response.data.status, statusText: response.data.statusText, isReady: response.data.isReady }
            : v
        ));
        toast.success('Video status refreshed');
      }
    } catch (error) {
      toast.error('Failed to refresh status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <ListIcon className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={fetchVideos}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : videos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No videos found</p>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Your First Video
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => (
            <Card key={video.id} className="overflow-hidden group">
              <div className="relative aspect-video bg-muted group-hover:opacity-90 transition-opacity">
                {video.thumbnailUrl ? (
                  <Image
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    width={640}
                    height={360}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Video className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <StatusBadge status={video.status} statusText={video.statusText} />
                </div>
                {video.length > 0 && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded text-xs">
                    {formatDuration(video.length)}
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium truncate mb-1" title={video.title}>{video.title}</h3>
                <div className="text-xs text-muted-foreground mb-3 flex items-center justify-between">
                  <span>{formatSize(video.size)}</span>
                  <span className="font-mono">{video.id.substring(0, 8)}...</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 h-8" onClick={() => copyToClipboard(video.id, 'Video ID')}>
                    <Copy className="h-3 w-3 mr-1" /> ID
                  </Button>
                  {video.isReady && (
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => window.open(video.embedUrl, '_blank')}>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => setDeleteDialog({ open: true, video })}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="divide-y divide-border">
            {videos.map((video) => (
              <div key={video.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                <div className="w-24 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                  {video.thumbnailUrl ? (
                    <Image src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" width={640} height={360} />
                  ) : (
                    <div className="flex items-center justify-center h-full"><Video className="h-6 w-6 text-muted-foreground" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{video.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span>{formatDuration(video.length)}</span>
                    <span>{formatSize(video.size)}</span>
                    <span className="font-mono text-xs">{video.id}</span>
                  </div>
                </div>
                <StatusBadge status={video.status} statusText={video.statusText} />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(video.id, 'Video ID')}><Copy className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" className="text-red-600" onClick={() => setDeleteDialog({ open: true, video })}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled={pagination.page === 1} onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {pagination.page} of {pagination.totalPages}</span>
          <Button variant="outline" size="sm" disabled={pagination.page === pagination.totalPages} onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Video</DialogTitle>
            <DialogDescription>Upload a video to Bunny.net</DialogDescription>
          </DialogHeader>
          <Tabs value={uploadTab} onValueChange={setUploadTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file">File Upload</TabsTrigger>
              <TabsTrigger value="url">From URL</TabsTrigger>
            </TabsList>
            <TabsContent value="file" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Required: Video Title</Label>
                <Input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Video Title" />
              </div>
              <div className="space-y-2">
                <Label>Video File <span className="text-xs text-muted-foreground font-normal">(Max size: 2GB)</span></Label>
                <Input type="file" accept="video/*" onChange={(e) => setUploadFile(e.target.files[0])} />
              </div>
              {isUploading && <Progress value={uploadProgress} className="h-2" />}
              <Button className="w-full" onClick={handleFileUpload} disabled={isUploading || !uploadFile || !uploadTitle}>
                {isUploading ? 'Uploading...' : 'Upload Video'}
              </Button>
            </TabsContent>
            <TabsContent value="url" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Required: Video Title</Label>
                <Input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Video Title" />
              </div>
              <div className="space-y-2">
                <Label>Video URL</Label>
                <Input value={uploadUrl} onChange={(e) => setUploadUrl(e.target.value)} placeholder="https://..." />
              </div>
              <Button className="w-full" onClick={handleUrlFetch} disabled={isUploading || !uploadUrl || !uploadTitle}>
                {isUploading ? 'Processing...' : 'Fetch Video'}
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, video: deleteDialog.video })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone. Video: {deleteDialog.video?.title}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ==========================================
// R2 Library Component
// ==========================================

const R2Library = ({ isActive }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [folder, setFolder] = useState('all');
  const [folders, setFolders] = useState([]);
  const [fileType, setFileType] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  
  // Upload state
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadFolder, setUploadFolder] = useState('general');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Delete state
  const [deleteDialog, setDeleteDialog] = useState({ open: false, file: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await mediaAPI.listR2Files({
        page: pagination.page,
        limit: pagination.limit,
        folder: folder === 'all' ? '' : folder,
        type: fileType === 'all' ? '' : fileType,
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
      console.error('Error fetching R2 files:', error);
      toast.error('Failed to fetch files');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, folder, fileType]);

  const fetchFolders = async () => {
    try {
      // In a real app we might fetch folders active in R2, 
      // for now let's use a static list + any from API if we implement it efficiently
      // or just trust the user input for upload. 
      // But for viewing, we can use the folders returned by API if we implement getR2Folders properly.
      const response = await mediaAPI.getR2Folders();
      if(response.success) {
        setFolders(response.data.folders || []);
      }
    } catch (error) {
       console.error("Error fetching folders", error);
    }
  };

  useEffect(() => {
    if (isActive) {
      fetchFiles();
      fetchFolders();
    }
  }, [isActive, fetchFiles]);

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
        setShowUploadDialog(false);
        setUploadFile(null);
        fetchFiles();
      }
    } catch (error) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.file) return;
    try {
      setIsDeleting(true);
      const response = await mediaAPI.deleteR2File(deleteDialog.file.key);
      if (response.success) {
        toast.success('File deleted successfully');
        setDeleteDialog({ open: false, file: null });
        fetchFiles();
      }
    } catch (error) {
      toast.error(error.message || 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-8 w-8 text-blue-500" />;
      case 'video': return <Video className="h-8 w-8 text-purple-500" />;
      case 'document': 
      case 'pdf': return <FileText className="h-8 w-8 text-orange-500" />;
      case 'audio': return <Music className="h-8 w-8 text-green-500" />;
      default: return <FileIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          {/* Folder Filter */}
             <div className="w-40">
            <Select value={folder} onValueChange={(val) => { setFolder(val); setPagination(p => ({...p, page: 1})); }}>
              <SelectTrigger>
                <SelectValue placeholder="Folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Folders</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="courses">Courses</SelectItem>
                <SelectItem value="products">Products</SelectItem>
                <SelectItem value="banners">Banners</SelectItem>
                 {folders.map(f => (
                    !['general', 'courses', 'products', 'banners'].includes(f.name) && 
                    <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>
                 ))}
              </SelectContent>
            </Select>
            </div>

          {/* Type Filter */}
          <div className="w-40">
            <Select value={fileType} onValueChange={(val) => { setFileType(val); setPagination(p => ({...p, page: 1})); }}>
              <SelectTrigger>
                 <SelectValue placeholder="File Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <ListIcon className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={fetchFiles}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        </div>
      </div>

       {/* Grid/List */}
       {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : files.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No files found in this folder</p>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload First File
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {files.map((file) => (
             <Card key={file.key} className="overflow-hidden group hover:shadow-md transition-shadow">
               <div className="aspect-square bg-muted relative flex items-center justify-center overflow-hidden">
                 {file.fileType === 'image' ? (
                   <Image 
                     src={file.publicUrl} 
                     alt={file.fileName} 
                     className="w-full h-full object-cover"
                     width={640}
                     height={360}
                     loading="lazy" 
                   />
                 ) : (
                    getFileIcon(file.fileType)
                 )}
                 {/* Overlay Actions */}
                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                     <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => copyToClipboard(file.publicUrl, 'URL')}>
                       <Copy className="h-4 w-4" />
                     </Button>
                     <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => setDeleteDialog({ open: true, file })}>
                       <Trash2 className="h-4 w-4" />
                     </Button>
                     <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => window.open(file.publicUrl, '_blank')}>
                        <ExternalLink className="h-4 w-4" />
                     </Button>
                 </div>
               </div>
               <div className="p-3">
                 <p className="font-medium text-sm truncate" title={file.fileName}>{file.fileName}</p>
                 <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
                    <span>{formatSize(file.size)}</span>
                    <span className="uppercase">{file.extension}</span>
                 </div>
               </div>
             </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="divide-y divide-border">
            {files.map((file) => (
               <div key={file.key} className="flex items-center gap-4 p-3 hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 flex items-center justify-center bg-muted rounded">
                     {file.fileType === 'image' ? (
                        <Image src={file.publicUrl} className="w-full h-full object-cover rounded" width={640} height={360}  alt={file.fileName}/>
                     ) : getFileIcon(file.fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.fileName}</p>
                    <p className="text-xs text-muted-foreground">{file.folder}/{file.fileName}</p>
                  </div>
                  <div className="text-sm text-muted-foreground w-20">{formatSize(file.size)}</div>
                  <div className="flex gap-2">
                     <Button size="sm" variant="ghost" onClick={() => copyToClipboard(file.publicUrl, 'URL')}><Copy className="h-4 w-4" /></Button>
                     <Button size="sm" variant="ghost" onClick={() => window.open(file.publicUrl, '_blank')}><Download className="h-4 w-4" /></Button>
                     <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setDeleteDialog({ open: true, file })}><Trash2 className="h-4 w-4" /></Button>
                  </div>
               </div>
            ))}
          </div>
        </Card>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled={pagination.page === 1} onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {pagination.page} of {pagination.totalPages}</span>
          <Button variant="outline" size="sm" disabled={pagination.page === pagination.totalPages} onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Upload File to R2</DialogTitle>
             <DialogDescription>Supported: Images, Documents, Videos, Audio</DialogDescription>
           </DialogHeader>
           <div className="space-y-4">
              <div className="space-y-2">
                <Label>Folder Location</Label>
                <div className="flex gap-2">
                   <Select value={uploadFolder} onValueChange={setUploadFolder}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select folder" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="courses">Courses</SelectItem>
                      <SelectItem value="products">Products</SelectItem>
                      <SelectItem value="banners">Banners</SelectItem>
                      <SelectItem value="custom">Custom...</SelectItem>
                    </SelectContent>
                   </Select>
                   {uploadFolder === 'custom' && (
                     <Input placeholder="Folder name" className="flex-1" onChange={(e) => setUploadFolder(e.target.value)} />
                   )}
                </div>
              </div>
              <div className="space-y-2">
                 <Label>File</Label>
                 <Input type="file" onChange={(e) => setUploadFile(e.target.files[0])} />
              </div>
              {isUploading && <Progress value={uploadProgress} className="h-2" />}
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
             <Button onClick={handleFileUpload} disabled={!uploadFile || isUploading}>
                {isUploading ? 'Uploading...' : 'Upload'}
             </Button>
           </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, file: deleteDialog.file })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteDialog.file?.fileName}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};


// ==========================================
// Main Page Component
// ==========================================

export default function MediaLibraryPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('bunny');
  const [config, setConfig] = useState({ isBunnyConfigured: false, isR2Configured: false });

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/auth');
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
     const checkConfig = async () => {
       try {
         const response = await mediaAPI.getConfigStatus();
         if(response.success) {
           setConfig({
             isBunnyConfigured: response.data.isBunnyConfigured || response.data.isConfigured,
             isR2Configured: response.data.isR2Configured
           });
         }
       } catch (error) {
         console.error("Config check failed", error);
       }
     };
     if(isAdmin) checkConfig();
  }, [isAdmin]);

  if (authLoading || (!user || !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Media Library</h1>
        <p className="text-muted-foreground">Manage all your digital assets</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="bunny" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Bunny.net (Videos)
          </TabsTrigger>
          <TabsTrigger value="r2" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            R2 Storage (Files)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bunny" className="space-y-4">
          {!config.isBunnyConfigured ? (
             <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
               <CardContent className="pt-6 flex items-start gap-4">
                 <AlertCircle className="h-6 w-6 text-yellow-600 shrink-0" />
                 <div>
                   <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">Bunny.net Not Configured</h3>
                   <p className="text-yellow-800 dark:text-yellow-300 text-sm mt-1">Please set BUNNY_LIBRARY_ID and BUNNY_API_KEY in your .env file.</p>
                 </div>
               </CardContent>
             </Card>
          ) : (
            <BunnyLibrary isActive={activeTab === 'bunny'} />
          )}
        </TabsContent>

        <TabsContent value="r2" className="space-y-4">
           {!config.isR2Configured ? (
             <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
               <CardContent className="pt-6 flex items-start gap-4">
                 <AlertCircle className="h-6 w-6 text-yellow-600 shrink-0" />
                 <div>
                   <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">R2 Storage Not Configured</h3>
                   <p className="text-yellow-800 dark:text-yellow-300 text-sm mt-1">Please set R2_BUCKET_NAME, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY in your .env file.</p>
                 </div>
               </CardContent>
             </Card>
          ) : (
             <R2Library isActive={activeTab === 'r2'} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
