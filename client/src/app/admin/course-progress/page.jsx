'use client';

import { useState, useEffect } from 'react';
import { courseAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users,
  BookOpen,
  Search,
  Eye,
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  BarChart3,
  PlayCircle,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Image from 'next/image';

export default function CourseProgressPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [courseStats, setCourseStats] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [sortBy, setSortBy] = useState('enrolledAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [enrollmentDetails, setEnrollmentDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('enrollments'); // 'enrollments' | 'stats'

  // Fetch enrollments
  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        sortBy,
        sortOrder,
      };
      if (search) params.search = search;
      if (selectedCourse !== 'all') params.courseId = selectedCourse;

      const response = await courseAPI.getAdminEnrollments(params);
      if (response.success) {
        setEnrollments(response.data.enrollments);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error('Failed to fetch enrollments');
    } finally {
      setLoading(false);
    }
  };

  // Fetch course stats
  const fetchCourseStats = async () => {
    setStatsLoading(true);
    try {
      const response = await courseAPI.getAdminCourseStats();
      if (response.success) {
        setCourseStats(response.data.courseStats);
      }
    } catch (error) {
      console.error('Error fetching course stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch courses for filter
  const fetchCourses = async () => {
    try {
      const response = await courseAPI.getCourses();
      if (response.success) {
        setCourses(response.data.courses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  // Fetch enrollment details
  const fetchEnrollmentDetails = async (enrollmentId) => {
    setDetailsLoading(true);
    try {
      const response = await courseAPI.getAdminEnrollmentDetails(enrollmentId);
      if (response.success) {
        setEnrollmentDetails(response.data.enrollment);
      }
    } catch (error) {
      console.error('Error fetching enrollment details:', error);
      toast.error('Failed to fetch details');
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchCourseStats();
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [page, sortBy, sortOrder, selectedCourse]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEnrollments();
  };

  const handleViewDetails = (enrollment) => {
    setSelectedEnrollment(enrollment);
    fetchEnrollmentDetails(enrollment.id);
  };

  // Generate certificate manually for completed course
  const handleGenerateCertificate = async (userId, courseId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/certificates/admin/generate-for-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, courseId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Certificate generated successfully!');
      } else {
        toast.error(data.message || 'Failed to generate certificate');
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast.error('Failed to generate certificate');
    }
  };

  // Calculate summary stats
  const totalEnrollments = courseStats.reduce((acc, c) => acc + c.totalEnrollments, 0);
  const totalCompleted = courseStats.reduce((acc, c) => acc + c.completedEnrollments, 0);
  const avgProgress = courseStats.length > 0
    ? Math.round(courseStats.reduce((acc, c) => acc + c.avgProgress, 0) / courseStats.length)
    : 0;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-brand-600" />
            Course Progress Tracking
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor student enrollments and progress across all courses
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'enrollments' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('enrollments')}
          >
            <Users className="h-4 w-4 mr-1" />
            Enrollments
          </Button>
          <Button
            variant={viewMode === 'stats' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('stats')}
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            Course Stats
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Enrollments</p>
                <p className="text-2xl font-bold">{totalEnrollments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{totalCompleted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <PlayCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{totalEnrollments - totalCompleted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Progress</p>
                <p className="text-2xl font-bold">{avgProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'stats' ? (
        /* Course Stats View */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Course-wise Statistics
            </CardTitle>
            <CardDescription>Overview of all courses with enrollment and completion data</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : courseStats.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No courses found
              </div>
            ) : (
              <div className="space-y-4">
                {courseStats.map((course) => (
                  <div
                    key={course.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="relative h-16 w-24 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      {course.coverImageUrl ? (
                        <Image
                          src={course.coverImageUrl}
                          alt={course.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <BookOpen className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium truncate">{course.title}</h3>
                        <Badge variant={course.isPublished ? 'default' : 'secondary'} className="text-xs">
                          {course.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {course.totalChapters} chapters
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <Progress value={course.avgProgress} className="w-32 h-2" />
                        <span className="text-sm font-medium">{course.avgProgress}% avg</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{course.totalEnrollments}</p>
                        <p className="text-muted-foreground">Enrolled</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{course.completedEnrollments}</p>
                        <p className="text-muted-foreground">Completed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-600">{course.inProgressEnrollments}</p>
                        <p className="text-muted-foreground">In Progress</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Enrollments View */
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Student Enrollments
                </CardTitle>
                <CardDescription>View and manage individual student progress</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchEnrollments}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit">Search</Button>
              </form>
              <Select value={selectedCourse} onValueChange={(value) => { setSelectedCourse(value); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [by, order] = value.split('-');
                setSortBy(by);
                setSortOrder(order);
                setPage(1);
              }}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enrolledAt-desc">Newest First</SelectItem>
                  <SelectItem value="enrolledAt-asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : enrollments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No enrollments found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead className="text-center">Progress</TableHead>
                      <TableHead className="text-center">Chapters</TableHead>
                      <TableHead>Enrolled</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center overflow-hidden">
                              {enrollment.user.avatarUrl ? (
                                <Image
                                  src={enrollment.user.avatarUrl}
                                  alt={enrollment.user.name}
                                  width={36}
                                  height={36}
                                  className="object-cover"
                                />
                              ) : (
                                <span className="text-brand-600 font-medium text-sm">
                                  {enrollment.user.name?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{enrollment.user.name}</p>
                              <p className="text-xs text-muted-foreground">{enrollment.user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-12 rounded bg-muted overflow-hidden relative flex-shrink-0">
                              {enrollment.course.coverImageUrl ? (
                                <Image
                                  src={enrollment.course.coverImageUrl}
                                  alt=""
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <span className="text-sm font-medium truncate max-w-[150px]">
                              {enrollment.course.title}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-center gap-1">
                            <Progress value={enrollment.progressPercentage} className="w-20 h-2" />
                            <span className="text-xs font-medium">{enrollment.progressPercentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={enrollment.isCompleted ? 'default' : 'secondary'}>
                            {enrollment.completedChapters}/{enrollment.totalChapters}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {format(new Date(enrollment.enrolledAt), 'dd MMM yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          {enrollment.lastWatched ? (
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(enrollment.lastWatched), 'dd MMM yyyy')}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(enrollment)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                    disabled={page === pagination.pages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Enrollment Details Dialog */}
      <Dialog open={!!selectedEnrollment} onOpenChange={() => { setSelectedEnrollment(null); setEnrollmentDetails(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Enrollment Details
            </DialogTitle>
          </DialogHeader>

          {detailsLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : enrollmentDetails ? (
            <div className="space-y-6">
              {/* User & Course Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Student
                  </h4>
                  <p className="font-medium">{enrollmentDetails.user.name}</p>
                  <p className="text-sm text-muted-foreground">{enrollmentDetails.user.email}</p>
                  {enrollmentDetails.user.phone && (
                    <p className="text-sm text-muted-foreground">{enrollmentDetails.user.phone}</p>
                  )}
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Course
                  </h4>
                  <p className="font-medium">{enrollmentDetails.course.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Enrolled: {format(new Date(enrollmentDetails.enrolledAt), 'PPP')}
                  </p>
                </div>
              </div>

              {/* Progress Summary */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Overall Progress</h4>
                  <Badge variant={enrollmentDetails.stats.isCompleted ? 'default' : 'secondary'}>
                    {enrollmentDetails.stats.isCompleted ? 'Completed' : 'In Progress'}
                  </Badge>
                </div>
                <Progress value={enrollmentDetails.stats.progressPercentage} className="h-3 mb-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {enrollmentDetails.stats.completedChapters} of {enrollmentDetails.stats.totalChapters} chapters
                  </span>
                  <span className="font-medium">{enrollmentDetails.stats.progressPercentage}%</span>
                </div>
                
                {/* Generate Certificate Button - Only for completed courses without certificate */}
                {enrollmentDetails.stats.isCompleted && (
                  <div className="mt-4 pt-4 border-t">
                    {enrollmentDetails.certificate ? (
                      <div>
                        <div className="flex items-center gap-2 text-green-600 mb-2">
                          <Award className="h-5 w-5" />
                          <span className="font-medium">Certificate Generated</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Certificate No: {enrollmentDetails.certificate.certificateNo}
                        </p>
                        <a
                          href={enrollmentDetails.certificate.certificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 text-sm"
                        >
                          <Award className="h-4 w-4" />
                          View/Download Certificate
                        </a>
                      </div>
                    ) : (
                      <>
                        <Button
                          onClick={() => handleGenerateCertificate(enrollmentDetails.user.id, enrollmentDetails.course.id)}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <Award className="h-4 w-4 mr-2" />
                          Generate Certificate
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          Click to manually generate certificate for this completed course
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Session-wise Progress */}
              <div className="space-y-3">
                <h4 className="font-medium">Chapter Progress</h4>
                {enrollmentDetails.sessions.map((session) => (
                  <div key={session.id} className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-4 py-2 font-medium text-sm">
                      Session {session.order}: {session.title}
                    </div>
                    <div className="divide-y">
                      {session.chapters.map((chapter) => (
                        <div key={chapter.id} className="flex items-center justify-between px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            {chapter.completed ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : chapter.progress > 0 ? (
                              <PlayCircle className="h-4 w-4 text-yellow-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="text-sm">{chapter.title}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Progress value={chapter.progress} className="w-16 h-1.5" />
                            <span className="text-xs font-medium w-10 text-right">
                              {Math.round(chapter.progress)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Failed to load details
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

