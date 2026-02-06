'use client';

import { useState, useEffect } from 'react';
import { reviewAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
    Search,
    Star,
    Trash2,
    Pencil,
    BookOpen,
    GraduationCap,
    TrendingUp,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Eye,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import DataExport from '@/components/admin/DataExport';

const TYPE_ICONS = {
    EBOOK: BookOpen,
    COURSE: GraduationCap,
};

const TYPE_COLORS = {
    EBOOK: 'bg-blue-100 text-blue-800',
    COURSE: 'bg-green-100 text-green-800',
};

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [ratingFilter, setRatingFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, pages: 1 });
    const [selectedReview, setSelectedReview] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editForm, setEditForm] = useState({ rating: 5, comment: '' });
    const [actionLoading, setActionLoading] = useState(false);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const res = await reviewAPI.getAll({
                page,
                limit: 20,
                type: typeFilter !== 'all' ? typeFilter : undefined,
                rating: ratingFilter !== 'all' ? ratingFilter : undefined,
                search,
            });
            if (res.success) {
                setReviews(res.data.reviews);
                setPagination(res.data.pagination);
            }
        } catch (error) {
            toast.error('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            setStatsLoading(true);
            const res = await reviewAPI.getStats();
            if (res.success) {
                setStats(res.data);
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchReviews();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, typeFilter, ratingFilter]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchReviews();
    };

    const handleEdit = (review) => {
        setSelectedReview(review);
        setEditForm({ rating: review.rating, comment: review.comment || '' });
        setEditDialogOpen(true);
    };

    const handleDelete = (review) => {
        setSelectedReview(review);
        setDeleteDialogOpen(true);
    };

    const confirmEdit = async () => {
        if (!selectedReview) return;
        try {
            setActionLoading(true);
            const res = await reviewAPI.update(selectedReview.id, selectedReview.reviewType, editForm);
            if (res.success) {
                toast.success('Review updated successfully');
                setEditDialogOpen(false);
                fetchReviews();
                fetchStats();
            }
        } catch (error) {
            toast.error(error.message || 'Failed to update review');
        } finally {
            setActionLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!selectedReview) return;
        try {
            setActionLoading(true);
            const res = await reviewAPI.delete(selectedReview.id, selectedReview.reviewType);
            if (res.success) {
                toast.success('Review deleted successfully');
                setDeleteDialogOpen(false);
                fetchReviews();
                fetchStats();
            }
        } catch (error) {
            toast.error(error.message || 'Failed to delete review');
        } finally {
            setActionLoading(false);
        }
    };

    const renderStars = (rating) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Reviews Management</h1>
                    <p className="text-muted-foreground">Manage all reviews across courses, ebooks and indicators</p>
                </div>
                <DataExport
                    data={reviews}
                    columns={[
                        { key: 'reviewType', label: 'Type' },
                        { key: 'itemTitle', label: 'Item' },
                        { key: 'user.name', label: 'User name' },
                        { key: 'user.email', label: 'User email' },
                        { key: 'rating', label: 'Rating' },
                        { key: 'comment', label: 'Comment' },
                        { key: 'createdAt', label: 'Date' },
                    ]}
                    dateKey="createdAt"
                    statusKey="reviewType"
                    statusOptions={['EBOOK', 'COURSE', 'INDICATOR']}
                    filename="reviews"
                    fetchAllData={async () => {
                        const r = await reviewAPI.getAll({ page: 1, limit: 99999, type: 'all' });
                        return r?.data?.reviews ?? [];
                    }}
                    disabled={loading}
                />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {statsLoading ? (
                    <>
                        {[...Array(5)].map((_, i) => (
                            <Card key={i}>
                                <CardHeader className="pb-2">
                                    <Skeleton className="h-4 w-24" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-8 w-16" />
                                </CardContent>
                            </Card>
                        ))}
                    </>
                ) : stats && (
                    <>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Total Reviews
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-xs text-muted-foreground">+{stats.recentWeek} this week</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4" />
                                    Course Reviews
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{stats.byType.course}</p>
                                <p className="text-xs text-muted-foreground">Avg: {stats.averageRating.course.toFixed(1)} ⭐</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <BookOpen className="h-4 w-4" />
                                    Ebook Reviews
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{stats.byType.ebook}</p>
                                <p className="text-xs text-muted-foreground">Avg: {stats.averageRating.ebook.toFixed(1)} ⭐</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    Indicator Reviews
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{stats.byType.indicator}</p>
                                <p className="text-xs text-muted-foreground">Avg: {stats.averageRating.indicator.toFixed(1)} ⭐</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Star className="h-4 w-4" />
                                    Overall Rating
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{stats.averageRating.overall.toFixed(1)}</p>
                                {renderStars(Math.round(stats.averageRating.overall))}
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* Rating Distribution */}
            {stats && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Rating Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4 flex-wrap">
                            {[5, 4, 3, 2, 1].map((rating) => (
                                <div key={rating} className="flex items-center gap-2">
                                    <span className="text-sm font-medium w-6">{rating}★</span>
                                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-yellow-400"
                                            style={{
                                                width: `${stats.total > 0 ? (stats.ratingDistribution[rating] / stats.total) * 100 : 0}%`,
                                            }}
                                        />
                                    </div>
                                    <span className="text-sm text-muted-foreground w-8">{stats.ratingDistribution[rating]}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by user, item, or comment..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </form>
                        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="course">Courses</SelectItem>
                                <SelectItem value="ebook">Ebooks</SelectItem>
                                <SelectItem value="indicator">Indicators</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={ratingFilter} onValueChange={(v) => { setRatingFilter(v); setPage(1); }}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="All Ratings" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Ratings</SelectItem>
                                <SelectItem value="5">5 Stars</SelectItem>
                                <SelectItem value="4">4 Stars</SelectItem>
                                <SelectItem value="3">3 Stars</SelectItem>
                                <SelectItem value="2">2 Stars</SelectItem>
                                <SelectItem value="1">1 Star</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Reviews Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Item</TableHead>
                                <TableHead>Rating</TableHead>
                                <TableHead className="max-w-[300px]">Comment</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                                    </TableRow>
                                ))
                            ) : reviews.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12">
                                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground">No reviews found</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                reviews.map((review) => {
                                    const TypeIcon = TYPE_ICONS[review.reviewType] || MessageSquare;
                                    return (
                                        <TableRow key={`${review.reviewType}-${review.id}`}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                                                        {review.user?.avatarUrl ? (
                                                            <Image
                                                                src={review.user.avatarUrl}
                                                                alt={review.user.name || 'User'}
                                                                width={32}
                                                                height={32}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center text-xs font-medium">
                                                                {review.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">{review.user?.name || 'Unknown'}</p>
                                                        <p className="text-xs text-muted-foreground">{review.user?.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={TYPE_COLORS[review.reviewType]}>
                                                    <TypeIcon className="h-3 w-3 mr-1" />
                                                    {review.reviewType}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {review.itemImage && (
                                                        <Image
                                                            src={review.itemImage}
                                                            alt={review.itemTitle}
                                                            width={40}
                                                            height={40}
                                                            className="rounded object-cover"
                                                        />
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-sm line-clamp-1">{review.itemTitle}</p>
                                                        {review.itemSlug && (
                                                            <Link
                                                                href={`/${review.reviewType === 'COURSE' ? 'courses' : review.reviewType === 'EBOOK' ? 'ebooks' : 'indicators'}/${review.itemSlug}`}
                                                                target="_blank"
                                                                className="text-xs text-brand-600 hover:underline flex items-center gap-1"
                                                            >
                                                                <Eye className="h-3 w-3" /> View
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{renderStars(review.rating)}</TableCell>
                                            <TableCell className="max-w-[300px]">
                                                <p className="text-sm line-clamp-2">{review.comment || '-'}</p>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(review.createdAt).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </p>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(review)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-600 hover:text-red-700"
                                                        onClick={() => handleDelete(review)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, pagination.total)} of {pagination.total} reviews
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <span className="text-sm">Page {page} of {pagination.pages}</span>
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

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Review</DialogTitle>
                        <DialogDescription>
                            Update the rating or comment for this review.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Rating</Label>
                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setEditForm(f => ({ ...f, rating: star }))}
                                        className="focus:outline-none"
                                    >
                                        <Star
                                            className={`h-8 w-8 cursor-pointer transition-colors ${
                                                star <= editForm.rating
                                                    ? 'fill-yellow-400 text-yellow-400'
                                                    : 'text-gray-300 hover:text-yellow-300'
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Comment</Label>
                            <Textarea
                                value={editForm.comment}
                                onChange={(e) => setEditForm(f => ({ ...f, comment: e.target.value }))}
                                rows={4}
                                placeholder="Review comment..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={confirmEdit} disabled={actionLoading}>
                            {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Review</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this review? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={actionLoading}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

