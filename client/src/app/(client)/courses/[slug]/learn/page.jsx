'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { courseAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Lock, Play, ArrowLeft, Loader2, X, FileText, Download } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';
import { toast } from 'sonner';
import VideoPlayer from '@/components/VideoPlayer';
import { getPublicUrl } from '@/lib/imageUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Helper to strip HTML tags
const stripHtml = (html) => {
  if (!html) return '';
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

export default function CourseLearnPage({ params }) {
  const slug = params.slug;
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewChapter, setPreviewChapter] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [useIframe, setUseIframe] = useState(false);
  const [isProcessingComplete, setIsProcessingComplete] = useState(false);
  const [hasShownCompletionMessage, setHasShownCompletionMessage] = useState(false);

  useEffect(() => {
    const chapterId = searchParams.get('chapter');
    if (chapterId) {
      setSelectedChapterId(chapterId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (authLoading) return; // Wait for auth to load

    if (slug) {
      if (!isAuthenticated) {
        router.push('/auth?mode=login&redirect=' + encodeURIComponent(window.location.pathname));
        return;
      }
      fetchCourse();
    }
  }, [slug, isAuthenticated, authLoading]);

  useEffect(() => {
    if (course?.id && isAuthenticated) {
      fetchProgress();
    }
  }, [course?.id, isAuthenticated]);

  useEffect(() => {
    if (course && selectedChapterId) {
      const chapter = findChapterById(selectedChapterId);
      if (chapter) {
        // Check if user is enrolled or chapter is free preview
        if (isEnrolled || chapter.isFreePreview) {
          setSelectedChapter(chapter);
          // Auto-play will be handled by onReady callback
        } else {
          toast.error('Please enroll in the course to access this chapter');
          router.push(`/courses/${slug}`);
        }
      }
    }
  }, [course, selectedChapterId, isEnrolled]);

  useEffect(() => {
    // Reset states when chapter changes
    if (selectedChapter) {
      setUseIframe(false);
      setIsProcessingComplete(false);
      // Don't reset hasShownCompletionMessage - keep it for the session
    }
  }, [selectedChapter?.id]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await courseAPI.getCourseBySlug(slug);
      if (response.success) {
        const courseData = response.data.course;
        setCourse(courseData);
        const enrolled = response.data.isEnrolled || false;
        setIsEnrolled(enrolled);

        // Get chapter from URL if present
        const chapterId = searchParams.get('chapter');
        if (chapterId) {
          const chapter = findChapterByIdInSessions(courseData.sessions, chapterId);
          if (chapter) {
            // Allow if enrolled OR free preview
            if (enrolled || chapter.isFreePreview) {
              setSelectedChapterId(chapterId);
              setSelectedChapter(chapter);
            } else {
              // Not enrolled and not free preview - redirect to course page
              toast.error('Please enroll in the course to access this chapter');
              router.push(`/courses/${slug}`);
              return;
            }
          }
        } else if (courseData.sessions && enrolled) {
          // No chapter in URL - find last watched or first incomplete chapter
          try {
            const progressResp = await courseAPI.getCourseProgress(courseData.id);
            if (progressResp.success && progressResp.data.progress) {
              const userProgress = progressResp.data.progress;
              setProgress(progressResp.data);

              // Find chapter to resume - last watched that's not complete, or first incomplete
              let resumeChapter = null;

              // Get all chapters in order
              const allChapters = [];
              for (const session of courseData.sessions) {
                if (session.chapters) {
                  for (const chapter of session.chapters) {
                    allChapters.push(chapter);
                  }
                }
              }

              // Find last in-progress chapter (has progress but not completed)
              let lastInProgress = null;
              let firstIncomplete = null;

              for (const chapter of allChapters) {
                const prog = userProgress.find(p => p.chapter.id === chapter.id);
                if (prog) {
                  if (!prog.completed && prog.progress > 0) {
                    lastInProgress = chapter; // Keep updating to get the latest one
                  }
                } else if (!firstIncomplete) {
                  firstIncomplete = chapter; // First chapter with no progress
                }
              }

              // Priority: last in-progress > first incomplete > first chapter
              resumeChapter = lastInProgress || firstIncomplete || allChapters[0];

              if (resumeChapter) {
                setSelectedChapterId(resumeChapter.id);
                setSelectedChapter(resumeChapter);
                router.push(`/courses/${slug}/learn?chapter=${resumeChapter.id}`, { scroll: false });
              }
            } else {
              // No progress data - start from first chapter
              const firstChapter = findFirstChapter(courseData.sessions);
              if (firstChapter) {
                setSelectedChapterId(firstChapter.id);
                setSelectedChapter(firstChapter);
                router.push(`/courses/${slug}/learn?chapter=${firstChapter.id}`, { scroll: false });
              }
            }
          } catch (err) {
            console.error('Error fetching progress for resume:', err);
            // Fallback to first chapter
            const firstChapter = findFirstChapter(courseData.sessions);
            if (firstChapter) {
              setSelectedChapterId(firstChapter.id);
              setSelectedChapter(firstChapter);
              router.push(`/courses/${slug}/learn?chapter=${firstChapter.id}`, { scroll: false });
            }
          }
        } else if (courseData.sessions) {
          // Not enrolled - show first free preview chapter
          const firstChapter = findFirstChapter(courseData.sessions);
          if (firstChapter && firstChapter.isFreePreview) {
            setSelectedChapterId(firstChapter.id);
            setSelectedChapter(firstChapter);
            router.push(`/courses/${slug}/learn?chapter=${firstChapter.id}`, { scroll: false });
          }
        }
      }
    } catch (error) {
      console.error('Fetch course error:', error);
      toast.error(error.message || 'Failed to fetch course');
      router.push(`/courses/${slug}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    if (!course?.id) return;
    try {
      const response = await courseAPI.getCourseProgress(course.id);
      if (response.success) {
        setProgress(response.data);
        if (selectedChapter) {
          const chapterProgress = response.data.progress?.find(p => p.chapter.id === selectedChapter.id);
          if (chapterProgress) {
            setVideoProgress(chapterProgress.progress);
          }
        }
        // Note: Course completion check is handled in onEnded callback to avoid repeated redirects
      }
    } catch (error) {
      if (!error.message?.includes('Not enrolled') && !error.message?.includes('enrolled')) {
        console.error('Failed to fetch progress:', error);
      }
    }
  };

  const findChapterById = (chapterId) => {
    if (!course?.sessions) return null;
    return findChapterByIdInSessions(course.sessions, chapterId);
  };

  const findChapterByIdInSessions = (sessions, chapterId) => {
    if (!sessions) return null;
    for (const session of sessions) {
      if (session.chapters) {
        const chapter = session.chapters.find(c => c.id === chapterId);
        if (chapter) return chapter;
      }
    }
    return null;
  };

  const findFirstChapter = (sessions) => {
    for (const session of sessions) {
      if (session.chapters && session.chapters.length > 0) {
        return session.chapters[0];
      }
    }
    return null;
  };

  // Extract YouTube video ID from URL

  // Get all chapters in order
  const getAllChapters = () => {
    if (!course?.sessions) return [];
    const chapters = [];
    for (const session of course.sessions) {
      if (session.chapters) {
        for (const chapter of session.chapters) {
          chapters.push({ ...chapter, sessionId: session.id });
        }
      }
    }
    return chapters;
  };

  // Check if all chapters of previous session are completed
  const isPreviousSessionCompleted = (chapter) => {
    if (!isEnrolled) return chapter.isFreePreview;

    // Find the session containing this chapter
    const currentSession = course?.sessions?.find(s =>
      s.chapters?.some(ch => ch.id === chapter.id)
    );

    if (!currentSession) return true;

    // First session is always available if enrolled
    const sessionIndex = course.sessions.findIndex(s => s.id === currentSession.id);
    if (sessionIndex === 0) return true;

    // Check if all chapters of previous session are completed
    if (sessionIndex > 0) {
      const previousSession = course.sessions[sessionIndex - 1];
      if (!previousSession.chapters || previousSession.chapters.length === 0) return true;

      // Check if all chapters of previous session are completed
      const allCompleted = previousSession.chapters.every(ch => {
        const chapterProgress = progress?.progress?.find(p => p.chapter.id === ch.id);
        return chapterProgress?.completed === true;
      });

      return allCompleted;
    }

    return false;
  };

  const getChapterStatus = (chapter) => {
    if (isEnrolled) {
      // Check if previous session is completed (all chapters of previous session)
      if (!isPreviousSessionCompleted(chapter)) {
        return 'locked';
      }

      // Within a session, all chapters are available once session is unlocked
      const chapterProgress = progress?.progress?.find(p => p.chapter.id === chapter.id);
      if (chapterProgress?.completed) return 'completed';
      if (chapterProgress) return 'in-progress';
      return 'available';
    }
    return chapter.isFreePreview ? 'available' : 'locked';
  };

  const handleChapterClick = (chapter) => {
    const status = getChapterStatus(chapter);

    if (status === 'locked') {
      toast.error('Please enroll in the course to access this chapter');
      return;
    }

    if (chapter.isFreePreview && !isEnrolled) {
      // Show preview dialog for free chapters when not enrolled
      setPreviewChapter(chapter);
      setShowPreviewDialog(true);
    } else {
      // Enrolled users - play directly
      setSelectedChapterId(chapter.id);
      setSelectedChapter(chapter);
      setVideoProgress(0);
      setIsPlaying(false); // Will be set to true in onReady
      router.push(`/courses/${course.slug}/learn?chapter=${chapter.id}`, { scroll: false });
    }
  };

  const getNextChapter = () => {
    if (!course?.sessions || !selectedChapter || !isEnrolled) return null;

    // Check if current chapter is completed
    const currentProgress = progress?.progress?.find(p => p.chapter.id === selectedChapter.id);
    if (!currentProgress?.completed) {
      return null; // Next chapter only unlocks when current is completed
    }

    const allChapters = getAllChapters();
    const currentIndex = allChapters.findIndex(c => c.id === selectedChapter.id);

    if (currentIndex >= 0 && currentIndex < allChapters.length - 1) {
      const nextChapter = allChapters[currentIndex + 1];
      // Check if next chapter is accessible (not locked)
      if (getChapterStatus(nextChapter) !== 'locked') {
        return nextChapter;
      }
    }

    return null;
  };

  const totalChapters = course?.sessions?.reduce((sum, session) => sum + (session.chapters?.length || 0), 0) || 0;
  const completedChapters = progress?.completedChapters || 0;
  const overallProgress = progress?.overallProgress || 0;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!course) {
    return null;
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-7xl">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Courses', href: '/courses' },
          { label: stripHtml(course.title), href: `/courses/${course.slug}` },
          { label: 'Learn' },
        ]} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 mt-4 sm:mt-6">
          {/* Video Player */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            {/* Progress Bar */}
            {isEnrolled && (
              <Card className="bg-gradient-to-r from-brand-50 to-brand-100 border-brand-200 dark:from-brand-900/20 dark:to-brand-800/20 dark:border-brand-800">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-base sm:text-lg font-semibold text-brand-900 dark:text-brand-100">Course Progress</span>
                    <span className="text-lg sm:text-xl font-bold text-brand-900 dark:text-brand-100">{Math.round(overallProgress)}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-3 bg-brand-200 dark:bg-brand-900/30" />
                  <p className="text-sm text-brand-700 dark:text-brand-300 mt-2">
                    {completedChapters} of {totalChapters} chapters completed
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Video Player */}
            {selectedChapter ? (
              <Card className="overflow-hidden shadow-lg dark:bg-gray-900 dark:border-gray-800">
                <CardContent className="p-0">
                  {selectedChapter.videoUrl || selectedChapter.bunnyVideoId ? (
                    <VideoPlayer
                      key={selectedChapter.id} // Force re-render when chapter changes
                      videoUrl={selectedChapter.videoUrl}
                      bunnyVideoId={selectedChapter.bunnyVideoId}
                      isLoading={false}
                      onProgress={(state) => {
                        if (state) {
                          setVideoProgress(state.playedSeconds);
                          setVideoDuration(state.loadedSeconds);
                        }
                      }}
                      onDuration={(duration) => {
                        setVideoDuration(duration);
                      }}
                      onEnded={async () => {
                        console.log('onEnded called for chapter:', selectedChapter?.id);

                        // Prevent duplicate processing
                        if (isProcessingComplete) {
                          console.log('Already processing completion, skipping');
                          return;
                        }

                        // Check if enrolled
                        if (!selectedChapter || !isEnrolled) {
                          console.warn('Cannot mark complete - not enrolled or no chapter selected');
                          return;
                        }

                        setIsProcessingComplete(true);

                        try {
                          // Mark chapter as complete
                          console.log('Marking chapter complete:', selectedChapter.id);
                          const updateResponse = await courseAPI.updateChapterProgress(selectedChapter.id, 100, true);

                          // Fetch updated progress immediately
                          const progressResponse = await courseAPI.getCourseProgress(course.id);

                          if (progressResponse.success) {
                            setProgress(progressResponse.data);

                            // Get all chapters for navigation
                            const allChapters = getAllChapters();
                            const currentIndex = allChapters.findIndex(c => c.id === selectedChapter.id);
                            const completedCount = progressResponse.data.completedChapters || 0;
                            const totalCount = progressResponse.data.totalChapters || 0;

                            // Check if course is fully complete (from API response or progress data)
                            const isCourseComplete = (updateResponse.success && updateResponse.data?.courseCompleted) ||
                              (completedCount >= totalCount && totalCount > 0);

                            if (isCourseComplete && !hasShownCompletionMessage) {
                              // Course is complete - show congratulations (only once)
                              setHasShownCompletionMessage(true);

                              const certificateMsg = updateResponse.success && updateResponse.data?.certificateGenerated
                                ? ' Certificate has been generated!'
                                : '';

                              toast.success(`🎉 Congratulations! You have completed the entire course!${certificateMsg}`, {
                                duration: 5000,
                              });

                              // Don't redirect - let user continue viewing the course
                              // They can see completion status in enrolled page
                            } else if (currentIndex >= 0 && currentIndex < allChapters.length - 1) {
                              // More chapters available - go to next
                              const nextChapter = allChapters[currentIndex + 1];

                              toast.success('Chapter completed!', { duration: 1500 });

                              // Auto-open next chapter after 1 second
                              setTimeout(() => {
                                setSelectedChapterId(nextChapter.id);
                                setSelectedChapter(nextChapter);
                                setVideoProgress(0);
                                setVideoDuration(0);
                                router.push(`/courses/${course.slug}/learn?chapter=${nextChapter.id}`, { scroll: false });
                              }, 1000);
                            } else {
                              // Last chapter but course not complete (some chapters skipped)
                              toast.success('Chapter completed!', { duration: 1500 });
                            }
                          }
                        } catch (error) {
                          console.error('Failed to mark chapter complete:', error);
                          // Don't show error toast for duplicate completion attempts
                          if (!error.message?.includes('already')) {
                            toast.error('Failed to mark chapter as complete');
                          }
                        } finally {
                          // Reset processing flag after a delay to allow new chapter
                          setTimeout(() => {
                            setIsProcessingComplete(false);
                          }, 2000);
                        }
                      }}
                      initialProgress={(() => {
                        if (progress?.progress) {
                          const chapterProgress = progress.progress.find(p => p.chapter.id === selectedChapter.id);
                          if (chapterProgress && videoDuration > 0) {
                            return (chapterProgress.progress / 100) * videoDuration;
                          }
                        }
                        return 0;
                      })()}
                      isCompleted={(() => {
                        if (progress?.progress) {
                          const chapterProgress = progress.progress.find(p => p.chapter.id === selectedChapter.id);
                          return chapterProgress?.completed || false;
                        }
                        return false;
                      })()}
                      chapterId={selectedChapter.id}
                      courseAPI={courseAPI}
                      className="bg-black"
                    />
                  ) : (
                    <div className="aspect-video bg-black flex items-center justify-center text-white">
                      <div className="text-center">
                        <p className="text-lg mb-2">Video not available</p>
                        <p className="text-sm text-gray-400">Please contact support if this issue persists</p>
                      </div>
                    </div>
                  )}
                  <div className="p-4 sm:p-6 bg-white dark:bg-gray-900">
                    <div className="flex items-start justify-between mb-2">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex-1">{selectedChapter.title}</h2>
                    </div>
                    {selectedChapter.description && (
                      <p className="text-sm text-muted-foreground dark:text-gray-400 mt-2" dangerouslySetInnerHTML={{ __html: selectedChapter.description }} />
                    )}
                  </div>

                  {/* Session Resources (PDFs) */}
                  {(() => {
                    // Find the session that contains this chapter
                    const session = course?.sessions?.find(s =>
                      s.chapters?.some(ch => ch.id === selectedChapter.id)
                    );
                    if (session?.resources && session.resources.length > 0) {
                      return (
                        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-800">
                          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 dark:text-gray-200">
                            <FileText className="h-5 w-5" />
                            Session {session.order} Resources
                          </h3>
                          <div className="space-y-2">
                            {session.resources.map((resource) => (
                              <a
                                key={resource.id}
                                href={resource.fileUrl || getPublicUrl(resource.fileUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:border-brand-300 hover:bg-brand-50 transition-colors dark:bg-gray-900 dark:border-gray-700 dark:hover:border-brand-700 dark:hover:bg-brand-900/10"
                              >
                                <FileText className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                                <div className="flex-1">
                                  <p className="font-medium text-sm dark:text-gray-200">{resource.fileName}</p>
                                  {resource.fileSize && (
                                    <p className="text-xs text-muted-foreground dark:text-gray-400">
                                      {(resource.fileSize / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  )}
                                </div>
                                <Download className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                              </a>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-lg dark:bg-gray-900 dark:border-gray-800">
                <CardContent className="py-16 text-center">
                  <Play className="h-16 w-16 mx-auto text-muted-foreground mb-4 dark:text-gray-600" />
                  <p className="text-muted-foreground text-lg dark:text-gray-400">Select a chapter to start learning</p>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            {selectedChapter && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/courses/${course.slug}`)}
                  className="w-full sm:w-auto"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Course
                </Button>
                {getNextChapter() && (
                  <Button
                    onClick={() => {
                      const next = getNextChapter();
                      setSelectedChapterId(next.id);
                      setSelectedChapter(next);
                      setVideoProgress(0);
                      router.push(`/courses/${course.slug}/learn?chapter=${next.id}`, { scroll: false });
                    }}
                    className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700"
                  >
                    Next Chapter
                    <Play className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Course Content */}
          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-6 shadow-lg border-2 dark:bg-gray-900 dark:border-gray-800">
              <CardContent className="p-4 sm:p-6">
                <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Course Content</h3>
                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                  {course.sessions?.map((session) => (
                    <div key={session.id} className="space-y-2">
                      <div className="font-semibold text-sm text-gray-700 bg-gray-50 p-2 rounded dark:text-gray-200 dark:bg-gray-800">
                        Session {session.order}: {stripHtml(session.title)}
                      </div>
                      {session.chapters?.map((chapter) => {
                        const status = getChapterStatus(chapter);
                        const isSelected = selectedChapter?.id === chapter.id;

                        return (
                          <button
                            key={chapter.id}
                            onClick={() => handleChapterClick(chapter)}
                            className={`w-full text-left p-3 rounded-lg text-sm transition-all ${isSelected
                              ? 'bg-brand-600 text-white shadow-md'
                              : status === 'locked'
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                                : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-brand-300 dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-300'
                              }`}
                            disabled={status === 'locked'}
                          >
                            <div className="flex items-center gap-2">
                              {status === 'completed' ? (
                                <CheckCircle2 className={`h-4 w-4 flex-shrink-0 ${isSelected ? 'text-white' : 'text-green-600 dark:text-green-400'}`} />
                              ) : status === 'locked' ? (
                                <Lock className="h-4 w-4 flex-shrink-0" />
                              ) : (
                                <Play className={`h-4 w-4 flex-shrink-0 ${isSelected ? 'text-white' : 'text-brand-600 dark:text-brand-400'}`} />
                              )}
                              <span className="flex-1 font-medium">{chapter.order}. {chapter.title}</span>
                              {chapter.isFreePreview && (
                                <Badge variant="outline" className={`text-xs ${isSelected ? 'border-white text-white' : ''}`}>
                                  Free
                                </Badge>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Free Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{previewChapter?.title}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreviewDialog(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription>
              Free Preview - Watch this chapter without enrollment
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <VideoPlayer
              videoUrl={previewChapter?.videoUrl}
              bunnyVideoId={previewChapter?.bunnyVideoId}
              isLoading={false}
              onProgress={() => { }}
              onDuration={() => { }}
              onEnded={() => { }}
              initialProgress={0}
              isCompleted={false}
              chapterId={previewChapter?.id || ''}
              courseAPI={courseAPI}
              className="bg-black rounded-lg overflow-hidden"
            />
            <div className="mt-4 flex gap-3">
              <Button
                onClick={() => {
                  setShowPreviewDialog(false);
                  router.push(`/courses/${course.slug}`);
                }}
                variant="outline"
                className="flex-1"
              >
                Enroll to Access All Chapters
              </Button>
              <Button
                onClick={() => setShowPreviewDialog(false)}
                className="flex-1 bg-brand-600 hover:bg-brand-700"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
