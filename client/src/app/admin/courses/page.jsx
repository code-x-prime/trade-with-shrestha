'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { courseAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, Eye, EyeOff, Tag, Loader2, Star, TrendingUp, Sparkles, Flame, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { getPublicUrl } from '@/lib/imageUtils';
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
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';

const BADGES = [
    { value: 'FEATURED', label: 'Featured', icon: Star, color: 'bg-yellow-500' },
    { value: 'BESTSELLER', label: 'Bestseller', icon: TrendingUp, color: 'bg-green-500' },
    { value: 'NEW', label: 'New Release', icon: Sparkles, color: 'bg-blue-500' },
    { value: 'TRENDING', label: 'Trending', icon: Flame, color: 'bg-orange-500' },
    { value: 'POPULAR', label: 'Popular', icon: Users, color: 'bg-purple-500' },
];

export default function AdminCoursesPage() {
    const router = useRouter();
    const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, courseId: null });
    
    // Badge management state
    const [badgeDialog, setBadgeDialog] = useState({ open: false, course: null });
    const [selectedBadges, setSelectedBadges] = useState([]);
    const [savingBadges, setSavingBadges] = useState(false);

    useEffect(() => {
        if (!authLoading && (!isAuthenticated || !isAdmin)) {
            router.push('/auth');
        }
    }, [isAuthenticated, isAdmin, authLoading, router]);

    useEffect(() => {
        if (isAuthenticated && isAdmin) {
            fetchCourses();
        }
    }, [isAuthenticated, isAdmin]);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await courseAPI.getCourses();
            if (response.success) {
                setCourses(response.data.courses || []);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to fetch courses');
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePublish = async (courseId) => {
        try {
            const response = await courseAPI.togglePublishStatus(courseId);
            if (response.success) {
                toast.success('Publish status updated');
                fetchCourses();
            }
        } catch (error) {
            toast.error(error.message || 'Failed to update publish status');
        }
    };

    const handleDelete = async () => {
        if (!deleteDialog.courseId) return;

        try {
            const response = await courseAPI.deleteCourse(deleteDialog.courseId);
            if (response.success) {
                toast.success('Course deleted successfully');
                setDeleteDialog({ open: false, courseId: null });
                fetchCourses();
            }
        } catch (error) {
            toast.error(error.message || 'Failed to delete course');
        }
    };

    const openBadgeDialog = (course) => {
        setBadgeDialog({ open: true, course });
        setSelectedBadges(course.badges || []);
    };

    const handleBadgeToggle = (badgeValue) => {
        setSelectedBadges(prev => 
            prev.includes(badgeValue)
                ? prev.filter(b => b !== badgeValue)
                : [...prev, badgeValue]
        );
    };

    const saveBadges = async () => {
        if (!badgeDialog.course) return;

        try {
            setSavingBadges(true);
            const response = await courseAPI.updateBadges(badgeDialog.course.id, selectedBadges);
            if (response.success) {
                toast.success('Badges updated successfully');
                setBadgeDialog({ open: false, course: null });
                fetchCourses();
            }
        } catch (error) {
            toast.error(error.message || 'Failed to update badges');
        } finally {
            setSavingBadges(false);
        }
    };

    const formatPrice = (price, salePrice, isFree) => {
        if (isFree) return 'FREE';
        if (salePrice && salePrice < price) {
            return `₹${salePrice.toLocaleString('en-IN')} (₹${price.toLocaleString('en-IN')})`;
        }
        return `₹${price.toLocaleString('en-IN')}`;
    };

    const getBadgeIcon = (badgeValue) => {
        const badge = BADGES.find(b => b.value === badgeValue);
        if (!badge) return null;
        const IconComponent = badge.icon;
        return <IconComponent className="h-3 w-3" />;
    };

    const getBadgeColor = (badgeValue) => {
        const badge = BADGES.find(b => b.value === badgeValue);
        return badge?.color || 'bg-gray-500';
    };

    if (authLoading || loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <Skeleton className="h-10 w-48 mb-6" />
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !isAdmin) {
        return null;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Courses</h1>
                <Button onClick={() => router.push('/admin/courses/create')} className="bg-brand-600 hover:bg-brand-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Course
                </Button>
            </div>

            {courses.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground mb-4">No courses found</p>
                        <Button onClick={() => router.push('/admin/courses/create')}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create First Course
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>All Courses ({courses.length})</CardTitle>
                        <CardDescription>Click on &quot;Badges&quot; to add Featured, Bestseller, Trending tags</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Cover</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Badges</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Published</TableHead>
                                        <TableHead>Enrollments</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {courses.map((course) => (
                                        <TableRow key={course.id}>
                                            <TableCell>
                                                {course.coverImageUrl || course.coverImage ? (
                                                    <div className="relative w-16 h-10 rounded overflow-hidden border">
                                                        <Image
                                                            src={getPublicUrl(course.coverImageUrl || course.coverImage) || course.coverImageUrl || course.coverImage}
                                                            alt={course.title}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-16 h-10 bg-muted rounded flex items-center justify-center">
                                                        <span className="text-xs text-muted-foreground">No Image</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{course.title}</p>
                                                    <p className="text-xs text-muted-foreground">{course.language}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {course.badges && course.badges.length > 0 ? (
                                                        course.badges.map(badge => (
                                                            <Badge key={badge} className={`${getBadgeColor(badge)} text-white text-xs`}>
                                                                {getBadgeIcon(badge)}
                                                                <span className="ml-1">{badge}</span>
                                                            </Badge>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">No badges</span>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openBadgeDialog(course)}
                                                        className="h-6 px-2 text-xs"
                                                    >
                                                        <Tag className="h-3 w-3 mr-1" />
                                                        Edit
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{formatPrice(course.price, course.salePrice, course.isFree)}</span>
                                                    {course.isFree && <Badge className="bg-green-500 mt-1 w-fit">Free</Badge>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleTogglePublish(course.id)}
                                                    className={course.isPublished ? 'text-green-600' : 'text-gray-500'}
                                                >
                                                    {course.isPublished ? (
                                                        <>
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            Live
                                                        </>
                                                    ) : (
                                                        <>
                                                            <EyeOff className="h-4 w-4 mr-1" />
                                                            Draft
                                                        </>
                                                    )}
                                                </Button>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{course._count?.enrollments || 0}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link href={`/admin/courses/${course.id}/sessions`}>
                                                        <Button variant="ghost" size="sm" title="Manage Sessions">
                                                            <Sparkles className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/admin/courses/${course.id}/edit`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setDeleteDialog({ open: true, courseId: course.id })}
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
                    </CardContent>
                </Card>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, courseId: deleteDialog.courseId })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the course and all its sessions, chapters, and resources.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Badge Management Dialog */}
            <Dialog open={badgeDialog.open} onOpenChange={(open) => setBadgeDialog({ open, course: badgeDialog.course })}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Tag className="h-5 w-5" />
                            Manage Badges
                        </DialogTitle>
                        <DialogDescription>
                            {badgeDialog.course?.title}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                            Select badges to display on this course. Badges help highlight courses on the home page.
                        </p>
                        
                        <div className="space-y-3">
                            {BADGES.map(badge => {
                                const Icon = badge.icon;
                                const isSelected = selectedBadges.includes(badge.value);
                                return (
                                    <div
                                        key={badge.value}
                                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                            isSelected 
                                                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' 
                                                : 'border-border hover:border-brand-200'
                                        }`}
                                        onClick={() => handleBadgeToggle(badge.value)}
                                    >
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => handleBadgeToggle(badge.value)}
                                        />
                                        <div className={`p-2 rounded-full ${badge.color}`}>
                                            <Icon className="h-4 w-4 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{badge.label}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {badge.value === 'FEATURED' && 'Highlight on home page'}
                                                {badge.value === 'BESTSELLER' && 'Mark as bestselling course'}
                                                {badge.value === 'NEW' && 'Mark as new release'}
                                                {badge.value === 'TRENDING' && 'Show as trending'}
                                                {badge.value === 'POPULAR' && 'Mark as popular choice'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setBadgeDialog({ open: false, course: null })}
                        >
                            Cancel
                        </Button>
                        <Button onClick={saveBadges} disabled={savingBadges}>
                            {savingBadges ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Badges'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
