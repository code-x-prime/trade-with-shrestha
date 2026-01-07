'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { courseAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Trash2, Loader2, Edit, FileText, Video, Link2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import RichTextEditor from '@/components/RichTextEditor';
import VideoSelector from '@/components/admin/VideoSelector';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function ManageSessionsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [course, setCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [showChapterDialog, setShowChapterDialog] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editingChapter, setEditingChapter] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: null, id: null });
  const [sessionForm, setSessionForm] = useState({
    title: '',
    description: '',
    order: '',
    isPublished: false,
  });
  const [chapterForm, setChapterForm] = useState({
    title: '',
    videoSource: 'youtube', // 'youtube' or 'bunny'
    videoUrl: '',
    bunnyVideoId: '',
    bunnyVideoTitle: '',
    videoDuration: null,
    isFreePreview: false,
    order: '',
    isPublished: false,
  });
  const [showVideoSelector, setShowVideoSelector] = useState(false);
  const [resourceFile, setResourceFile] = useState(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/auth');
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    if (courseId && isAdmin) {
      fetchCourse();
      fetchSessions();
    }
  }, [courseId, isAdmin]);

  const fetchCourse = async () => {
    try {
      setFetching(true);
      const response = await courseAPI.getCourseById(courseId);
      if (response.success) {
        setCourse(response.data.course);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch course');
      router.push('/admin/courses');
    } finally {
      setFetching(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await courseAPI.getSessions(courseId);
      if (response.success) {
        setSessions(response.data.sessions || []);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch sessions');
    }
  };

  const handleAddSession = async () => {
    if (!sessionForm.title || !sessionForm.order) {
      toast.error('Title and order are required');
      return;
    }

    if (!isAdmin) {
      toast.error('Admin access required');
      router.push('/auth');
      return;
    }

    try {
      setLoading(true);
      const response = await courseAPI.createSession(courseId, {
        title: sessionForm.title,
        description: sessionForm.description,
        order: parseInt(sessionForm.order),
        isPublished: sessionForm.isPublished,
      });
      if (response.success) {
        toast.success('Session created successfully');
        setShowSessionDialog(false);
        setSessionForm({ title: '', description: '', order: '', isPublished: false });
        await fetchSessions();
      }
    } catch (error) {
      if (error.message?.includes('Admin access required') || error.message?.includes('403')) {
        toast.error('Admin access required. Please log in again.');
        router.push('/auth');
      } else {
        toast.error(error.message || 'Failed to create session');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditSession = async () => {
    if (!editingSession || !sessionForm.title || !sessionForm.order) {
      toast.error('Title and order are required');
      return;
    }

    if (!isAdmin) {
      toast.error('Admin access required');
      router.push('/auth');
      return;
    }

    try {
      setLoading(true);
      const response = await courseAPI.updateSession(editingSession.id, {
        title: sessionForm.title,
        description: sessionForm.description,
        order: parseInt(sessionForm.order),
        isPublished: sessionForm.isPublished,
      });
      if (response.success) {
        toast.success('Session updated successfully');
        setShowSessionDialog(false);
        setEditingSession(null);
        setSessionForm({ title: '', description: '', order: '', isPublished: false });
        await fetchSessions();
      }
    } catch (error) {
      if (error.message?.includes('Admin access required') || error.message?.includes('403')) {
        toast.error('Admin access required. Please log in again.');
        router.push('/auth');
      } else {
        toast.error(error.message || 'Failed to update session');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!deleteDialog.id) return;

    try {
      setLoading(true);
      const response = await courseAPI.deleteSession(deleteDialog.id);
      if (response.success) {
        toast.success('Session deleted successfully');
        setDeleteDialog({ open: false, type: null, id: null });
        await fetchSessions();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete session');
    } finally {
      setLoading(false);
    }
  };

  const openEditSession = (session) => {
    setEditingSession(session);
    setSessionForm({
      title: session.title || '',
      description: session.description || '',
      order: session.order?.toString() || '',
      isPublished: session.isPublished || false,
    });
    setShowSessionDialog(true);
  };

  const handleAddChapter = async () => {
    // Validate: need title, order, and either videoUrl OR bunnyVideoId
    const hasVideo = chapterForm.videoSource === 'youtube' 
      ? chapterForm.videoUrl 
      : chapterForm.bunnyVideoId;
    
    if (!selectedSessionId || !chapterForm.title || !hasVideo || !chapterForm.order) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!isAdmin) {
      toast.error('Admin access required');
      router.push('/auth');
      return;
    }

    try {
      setLoading(true);
      
      const chapterData = {
        title: chapterForm.title,
        isFreePreview: chapterForm.isFreePreview,
        order: parseInt(chapterForm.order),
        isPublished: chapterForm.isPublished,
      };

      // Set video source based on selection
      if (chapterForm.videoSource === 'youtube') {
        chapterData.videoUrl = chapterForm.videoUrl;
        chapterData.bunnyVideoId = null;
      } else {
        chapterData.bunnyVideoId = chapterForm.bunnyVideoId;
        chapterData.videoDuration = chapterForm.videoDuration;
        chapterData.videoStatus = 4; // Ready
        chapterData.videoUrl = null;
      }

      const response = await courseAPI.createChapter(selectedSessionId, chapterData);
      if (response.success) {
        toast.success('Chapter created successfully');
        setShowChapterDialog(false);
        setChapterForm({ 
          title: '', 
          videoSource: 'youtube',
          videoUrl: '', 
          bunnyVideoId: '',
          bunnyVideoTitle: '',
          videoDuration: null,
          isFreePreview: false, 
          order: '', 
          isPublished: false 
        });
        setSelectedSessionId(null);
        await fetchSessions();
      }
    } catch (error) {
      if (error.message?.includes('Admin access required') || error.message?.includes('403')) {
        toast.error('Admin access required. Please log in again.');
        router.push('/auth');
      } else {
        toast.error(error.message || 'Failed to create chapter');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditChapter = async () => {
    // Validate: need title, order, and either videoUrl OR bunnyVideoId
    const hasVideo = chapterForm.videoSource === 'youtube' 
      ? chapterForm.videoUrl 
      : chapterForm.bunnyVideoId;
    
    if (!editingChapter || !chapterForm.title || !hasVideo || !chapterForm.order) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!isAdmin) {
      toast.error('Admin access required');
      router.push('/auth');
      return;
    }

    try {
      setLoading(true);
      
      const chapterData = {
        title: chapterForm.title,
        isFreePreview: chapterForm.isFreePreview,
        order: parseInt(chapterForm.order),
        isPublished: chapterForm.isPublished,
      };

      // Set video source based on selection
      if (chapterForm.videoSource === 'youtube') {
        chapterData.videoUrl = chapterForm.videoUrl;
        chapterData.bunnyVideoId = null;
      } else {
        chapterData.bunnyVideoId = chapterForm.bunnyVideoId;
        chapterData.videoDuration = chapterForm.videoDuration;
        chapterData.videoStatus = 4; // Ready
        chapterData.videoUrl = null;
      }

      const response = await courseAPI.updateChapter(editingChapter.id, chapterData);
      if (response.success) {
        toast.success('Chapter updated successfully');
        setShowChapterDialog(false);
        setEditingChapter(null);
        setChapterForm({ 
          title: '', 
          videoSource: 'youtube',
          videoUrl: '', 
          bunnyVideoId: '',
          bunnyVideoTitle: '',
          videoDuration: null,
          isFreePreview: false, 
          order: '', 
          isPublished: false 
        });
        await fetchSessions();
      }
    } catch (error) {
      if (error.message?.includes('Admin access required') || error.message?.includes('403')) {
        toast.error('Admin access required. Please log in again.');
        router.push('/auth');
      } else {
        toast.error(error.message || 'Failed to update chapter');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChapter = async () => {
    if (!deleteDialog.id) return;

    try {
      setLoading(true);
      const response = await courseAPI.deleteChapter(deleteDialog.id);
      if (response.success) {
        toast.success('Chapter deleted successfully');
        setDeleteDialog({ open: false, type: null, id: null });
        await fetchSessions();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete chapter');
    } finally {
      setLoading(false);
    }
  };

  const openAddChapter = (sessionId) => {
    setSelectedSessionId(sessionId);
    setEditingChapter(null);
    setChapterForm({ 
      title: '', 
      videoSource: 'youtube',
      videoUrl: '', 
      bunnyVideoId: '',
      bunnyVideoTitle: '',
      videoDuration: null,
      isFreePreview: false, 
      order: '', 
      isPublished: false 
    });
    setShowChapterDialog(true);
  };

  const openEditChapter = (chapter, sessionId) => {
    setSelectedSessionId(sessionId);
    setEditingChapter(chapter);
    
    // Determine video source based on existing data
    const hasBunnyVideo = chapter.bunnyVideoId && !chapter.videoUrl;
    
    setChapterForm({
      title: chapter.title || '',
      videoSource: hasBunnyVideo ? 'bunny' : 'youtube',
      videoUrl: chapter.videoUrl || '',
      bunnyVideoId: chapter.bunnyVideoId || '',
      bunnyVideoTitle: '', // Will be fetched if needed
      videoDuration: chapter.videoDuration || null,
      isFreePreview: chapter.isFreePreview || false,
      order: chapter.order?.toString() || '',
      isPublished: chapter.isPublished || false,
    });
    setShowChapterDialog(true);
  };

  const handleUploadResource = async (sessionId) => {
    if (!resourceFile) {
      toast.error('Please select a file');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('resource', resourceFile);
      
      const response = await courseAPI.uploadSessionResource(sessionId, formData);
      if (response.success) {
        toast.success('Resource uploaded successfully');
        setResourceFile(null);
        await fetchSessions();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to upload resource');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResource = async (resourceId) => {
    try {
      setLoading(true);
      const response = await courseAPI.deleteSessionResource(resourceId);
      if (response.success) {
        toast.success('Resource deleted successfully');
        await fetchSessions();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete resource');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!user || !isAdmin || !course) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-6xl">
      <div className="mb-4 sm:mb-6">
        <Link href={`/admin/courses/${courseId}/edit`}>
          <Button variant="ghost" size="sm" className="w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Manage Sessions & Chapters</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Course: {course.title}
          </p>
        </CardHeader>
      </Card>

      <div className="mb-4">
        <Button 
          onClick={() => {
            setEditingSession(null);
            setSessionForm({ title: '', description: '', order: '', isPublished: false });
            setShowSessionDialog(true);
          }}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Session
        </Button>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No sessions found</p>
            <Button onClick={() => {
              setEditingSession(null);
              setSessionForm({ title: '', description: '', order: '', isPublished: false });
              setShowSessionDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Session
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-base sm:text-lg">
                      <span className="break-words">Session {session.order}: {session.title}</span>
                      {session.isPublished ? (
                        <Badge className="bg-green-500 w-fit">Published</Badge>
                      ) : (
                        <Badge variant="outline" className="w-fit">Draft</Badge>
                      )}
                    </CardTitle>
                    {session.description && (
                      <div 
                        className="text-sm text-muted-foreground mt-2 line-clamp-2 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: session.description }}
                      />
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditSession(session)}
                      className="flex-1 sm:flex-initial"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteDialog({ open: true, type: 'session', id: session.id })}
                      className="flex-1 sm:flex-initial"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value={`session-${session.id}`}>
                    <AccordionTrigger>Manage Chapters ({session.chapters?.length || 0})</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAddChapter(session.id)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Chapter
                        </Button>

                        {session.chapters && session.chapters.length > 0 ? (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-16">Order</TableHead>
                                  <TableHead className="min-w-[150px]">Title</TableHead>
                                  <TableHead className="hidden md:table-cell min-w-[200px]">Video URL</TableHead>
                                  <TableHead className="hidden sm:table-cell">Free Preview</TableHead>
                                  <TableHead className="hidden sm:table-cell">Published</TableHead>
                                  <TableHead className="text-right w-24">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {session.chapters.map((chapter) => (
                                  <TableRow key={chapter.id}>
                                    <TableCell className="font-medium">{chapter.order}</TableCell>
                                    <TableCell className="font-medium min-w-[150px]">
                                      <div className="break-words">{chapter.title}</div>
                                      {/* Mobile: Show video URL below title */}
                                      {chapter.videoUrl && (
                                        <a
                                          href={chapter.videoUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline text-xs md:hidden mt-1 block break-all"
                                        >
                                          {chapter.videoUrl.length > 50 ? `${chapter.videoUrl.substring(0, 50)}...` : chapter.videoUrl}
                                        </a>
                                      )}
                                      {/* Mobile: Show badges below title */}
                                      <div className="flex gap-2 mt-2 md:hidden">
                                        {chapter.isFreePreview ? (
                                          <Badge className="bg-green-500 text-xs">Free Preview</Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-xs">Paid</Badge>
                                        )}
                                        {chapter.isPublished ? (
                                          <Badge className="bg-green-500 text-xs">Published</Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-xs">Draft</Badge>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                      {chapter.videoUrl ? (
                                        <a
                                          href={chapter.videoUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline text-sm break-all"
                                        >
                                          {chapter.videoUrl.length > 40 ? `${chapter.videoUrl.substring(0, 40)}...` : chapter.videoUrl}
                                        </a>
                                      ) : chapter.bunnyVideoId ? (
                                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                          Bunny: {chapter.bunnyVideoId.substring(0, 8)}...
                                        </Badge>
                                      ) : (
                                        <span className="text-muted-foreground text-xs">No video</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                      {chapter.isFreePreview ? (
                                        <Badge className="bg-green-500">Yes</Badge>
                                      ) : (
                                        <Badge variant="outline">No</Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                      {chapter.isPublished ? (
                                        <Badge className="bg-green-500">Published</Badge>
                                      ) : (
                                        <Badge variant="outline">Draft</Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => openEditChapter(chapter, session.id)}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setDeleteDialog({ open: true, type: 'chapter', id: chapter.id })}
                                        >
                                          <Trash2 className="h-4 w-4 text-red-600" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No chapters yet</p>
                        )}

                        {/* Session Resources */}
                        <div className="mt-6 pt-6 border-t">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Session Resources (PDF)
                          </h4>
                          <div className="space-y-2">
                            {session.resources && session.resources.length > 0 && (
                              <div className="space-y-2">
                                {session.resources.map((resource) => (
                                  <div key={resource.id} className="flex items-center justify-between p-2 border rounded">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm">{resource.fileName}</span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteResource(resource.id)}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => setResourceFile(e.target.files[0])}
                                className="flex-1 sm:max-w-xs"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleUploadResource(session.id)}
                                disabled={!resourceFile || loading}
                                className="w-full sm:w-auto"
                              >
                                Upload PDF
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Session Dialog */}
      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSession ? 'Edit Session' : 'Add New Session'}</DialogTitle>
            <DialogDescription>
              Create a session to organize chapters in your course.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sessionTitle">Title *</Label>
              <Input
                id="sessionTitle"
                value={sessionForm.title}
                onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                placeholder="e.g., Introduction to Trading"
              />
            </div>
            <div>
              <Label htmlFor="sessionDescription">Description</Label>
              <RichTextEditor
                value={sessionForm.description}
                onChange={(value) => setSessionForm({ ...sessionForm, description: value })}
              />
            </div>
            <div>
              <Label htmlFor="sessionOrder">Order *</Label>
              <Input
                id="sessionOrder"
                type="number"
                min="1"
                value={sessionForm.order}
                onChange={(e) => setSessionForm({ ...sessionForm, order: e.target.value })}
                placeholder="1, 2, 3..."
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="sessionPublished"
                checked={sessionForm.isPublished}
                onCheckedChange={(checked) => setSessionForm({ ...sessionForm, isPublished: checked })}
              />
              <Label htmlFor="sessionPublished">Publish Session</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSessionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={editingSession ? handleEditSession : handleAddSession} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingSession ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingSession ? 'Update Session' : 'Create Session'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chapter Dialog */}
      <Dialog open={showChapterDialog} onOpenChange={setShowChapterDialog}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingChapter ? 'Edit Chapter' : 'Add New Chapter'}</DialogTitle>
            <DialogDescription>
              Add a video chapter to the session. Choose between YouTube URL or Bunny.net video.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="chapterTitle">Title *</Label>
              <Input
                id="chapterTitle"
                value={chapterForm.title}
                onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                placeholder="e.g., Chapter 1: Basics of Trading"
              />
            </div>
            
            {/* Video Source Toggle */}
            <div>
              <Label>Video Source *</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant={chapterForm.videoSource === 'youtube' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChapterForm({ ...chapterForm, videoSource: 'youtube' })}
                  className="flex items-center gap-2"
                >
                  <Link2 className="h-4 w-4" />
                  YouTube URL
                </Button>
                <Button
                  type="button"
                  variant={chapterForm.videoSource === 'bunny' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChapterForm({ ...chapterForm, videoSource: 'bunny' })}
                  className="flex items-center gap-2"
                >
                  <Video className="h-4 w-4" />
                  Bunny.net Video
                </Button>
              </div>
            </div>

            {/* YouTube URL Input */}
            {chapterForm.videoSource === 'youtube' && (
              <div>
                <Label htmlFor="chapterVideoUrl">Video URL (YouTube) *</Label>
                <Input
                  id="chapterVideoUrl"
                  value={chapterForm.videoUrl}
                  onChange={(e) => setChapterForm({ ...chapterForm, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Paste YouTube video or Shorts URL
                </p>
              </div>
            )}

            {/* Bunny Video Selector */}
            {chapterForm.videoSource === 'bunny' && (
              <div>
                <Label>Bunny.net Video *</Label>
                <div className="mt-2">
                  {chapterForm.bunnyVideoId ? (
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                      <Video className="h-8 w-8 text-brand-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {chapterForm.bunnyVideoTitle || 'Video Selected'}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          ID: {chapterForm.bunnyVideoId.substring(0, 16)}...
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowVideoSelector(true)}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-20 border-dashed"
                      onClick={() => setShowVideoSelector(true)}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Video className="h-6 w-6" />
                        <span>Select Video from Library</span>
                      </div>
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Select a video from your Bunny.net media library
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="chapterOrder">Order *</Label>
              <Input
                id="chapterOrder"
                type="number"
                min="1"
                value={chapterForm.order}
                onChange={(e) => setChapterForm({ ...chapterForm, order: e.target.value })}
                placeholder="1, 2, 3..."
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="chapterFreePreview"
                checked={chapterForm.isFreePreview}
                onCheckedChange={(checked) => setChapterForm({ ...chapterForm, isFreePreview: checked })}
              />
              <Label htmlFor="chapterFreePreview">Free Preview (visible without enrollment)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="chapterPublished"
                checked={chapterForm.isPublished}
                onCheckedChange={(checked) => setChapterForm({ ...chapterForm, isPublished: checked })}
              />
              <Label htmlFor="chapterPublished">Publish Chapter</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChapterDialog(false)}>
              Cancel
            </Button>
            <Button onClick={editingChapter ? handleEditChapter : handleAddChapter} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingChapter ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingChapter ? 'Update Chapter' : 'Create Chapter'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Selector Modal */}
      <VideoSelector
        open={showVideoSelector}
        onOpenChange={setShowVideoSelector}
        selectedVideoId={chapterForm.bunnyVideoId}
        onSelect={(video) => {
          setChapterForm({
            ...chapterForm,
            bunnyVideoId: video.id,
            bunnyVideoTitle: video.title,
            videoDuration: video.duration,
          });
        }}
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, type: deleteDialog.type, id: deleteDialog.id })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {deleteDialog.type === 'session' ? 'session and all its chapters' : 'chapter'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteDialog.type === 'session') {
                  handleDeleteSession();
                } else {
                  handleDeleteChapter();
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

