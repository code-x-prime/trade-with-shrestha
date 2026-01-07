'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { bundleAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2, Eye, EyeOff, Package } from 'lucide-react';
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

export default function AdminBundlesPage() {
    const router = useRouter();
    const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
    const [bundles, setBundles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, bundleId: null });
    const [togglingPublish, setTogglingPublish] = useState(null);

    useEffect(() => {
        if (!authLoading && (!isAuthenticated || !isAdmin)) {
            router.push('/auth');
        }
    }, [isAuthenticated, isAdmin, authLoading, router]);

    useEffect(() => {
        if (isAuthenticated && isAdmin) {
            fetchBundles();
        }
    }, [isAuthenticated, isAdmin]);

    const fetchBundles = async () => {
        try {
            setLoading(true);
            const response = await bundleAPI.getAll();
            if (response.success) {
                setBundles(response.data.bundles || []);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to fetch bundles');
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePublish = async (bundleId) => {
        try {
            setTogglingPublish(bundleId);
            const response = await bundleAPI.togglePublish(bundleId);
            if (response.success) {
                toast.success(response.message || 'Publish status updated');
                fetchBundles();
            }
        } catch (error) {
            toast.error(error.message || 'Failed to update publish status');
        } finally {
            setTogglingPublish(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteDialog.bundleId) return;

        try {
            const response = await bundleAPI.delete(deleteDialog.bundleId);
            if (response.success) {
                toast.success('Bundle deleted successfully');
                setDeleteDialog({ open: false, bundleId: null });
                fetchBundles();
            }
        } catch (error) {
            toast.error(error.message || 'Failed to delete bundle');
        }
    };

    const formatPrice = (price, salePrice) => {
        if (salePrice && salePrice < price) {
            return `₹${salePrice.toLocaleString('en-IN')} (from ₹${price.toLocaleString('en-IN')})`;
        }
        return `₹${price.toLocaleString('en-IN')}`;
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
                <div>
                    <h1 className="text-3xl font-bold">Course Bundles</h1>
                    <p className="text-muted-foreground mt-1">Combine multiple courses into discounted bundles</p>
                </div>
                <Button onClick={() => router.push('/admin/bundles/create')} className="bg-brand-600 hover:bg-brand-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Bundle
                </Button>
            </div>

            {bundles.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">No bundles found</p>
                        <Button onClick={() => router.push('/admin/bundles/create')}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create First Bundle
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>All Bundles ({bundles.length})</CardTitle>
                        <CardDescription>Manage your course bundles. Each bundle must have at least 2 courses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Thumbnail</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Courses</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Published</TableHead>
                                        <TableHead>Enrollments</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bundles.map((bundle) => (
                                        <TableRow key={bundle.id}>
                                            <TableCell>
                                                {bundle.thumbnailUrl || bundle.thumbnail ? (
                                                    <div className="relative w-16 h-10 rounded overflow-hidden border">
                                                        <Image
                                                            src={getPublicUrl(bundle.thumbnailUrl || bundle.thumbnail) || bundle.thumbnailUrl || bundle.thumbnail}
                                                            alt={bundle.title}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-16 h-10 bg-muted rounded flex items-center justify-center">
                                                        <Package className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{bundle.title}</p>
                                                    <p className="text-xs text-muted-foreground truncate max-w-xs">
                                                        {bundle.courseNames || 'No courses'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{bundle.coursesCount || 0} courses</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {formatPrice(bundle.price, bundle.salePrice)}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleTogglePublish(bundle.id)}
                                                    disabled={togglingPublish === bundle.id}
                                                    className={bundle.isPublished ? 'text-green-600' : 'text-gray-500'}
                                                >
                                                    {bundle.isPublished ? (
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
                                                <Badge variant="outline">{bundle.enrollmentsCount || 0}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link href={`/admin/bundles/${bundle.id}/edit`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setDeleteDialog({ open: true, bundleId: bundle.id })}
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
            <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, bundleId: deleteDialog.bundleId })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the bundle. Users who purchased this bundle will still have access to the courses.
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
        </div>
    );
}
