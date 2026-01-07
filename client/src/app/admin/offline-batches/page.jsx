'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { offlineBatchAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2, Eye, Calendar, MapPin, Users, MoreVertical } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';



export default function AdminOfflineBatchesPage() {
    const router = useRouter();
    const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, batchId: null });

    useEffect(() => {
        if (!authLoading && (!isAuthenticated || !isAdmin)) {
            router.push('/auth');
        }
    }, [isAuthenticated, isAdmin, authLoading, router]);

    useEffect(() => {
        if (isAuthenticated && isAdmin) {
            fetchBatches();
        }
    }, [isAuthenticated, isAdmin]);

    const fetchBatches = async () => {
        try {
            setLoading(true);
            const response = await offlineBatchAPI.getAll();
            if (response.success) {
                setBatches(response.data.batches || []);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to fetch offline batches');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteDialog.batchId) return;

        try {
            const response = await offlineBatchAPI.delete(deleteDialog.batchId);
            if (response.success) {
                toast.success('Offline batch deleted successfully');
                fetchBatches();
                setDeleteDialog({ open: false, batchId: null });
            }
        } catch (error) {
            toast.error(error.message || 'Failed to delete batch');
        }
    };

    const handleStatusChange = async (batchId, newStatus) => {
        try {
            // Create FormData for update
            const formData = new FormData();
            formData.append('status', newStatus);

            const response = await offlineBatchAPI.update(batchId, formData);
            if (response.success) {
                toast.success('Status updated successfully');
                fetchBatches();
            }
        } catch (error) {
            toast.error(error.message || 'Failed to update status');
        }
    };

    if (authLoading || loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-9 w-48" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!isAuthenticated || !isAdmin) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Offline Batches</h1>
                    <p className="text-muted-foreground">Manage offline training batches</p>
                </div>
                <Button onClick={() => router.push('/admin/offline-batches/create')} className="bg-brand-600 hover:bg-brand-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Batch
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Offline Batches</CardTitle>
                </CardHeader>
                <CardContent>
                    {batches.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No offline batches found. Create one to get started.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Thumbnail</TableHead>
                                    <TableHead>Batch Title</TableHead>
                                    <TableHead>City</TableHead>
                                    <TableHead>Start Date</TableHead>
                                    <TableHead>Pricing</TableHead>
                                    <TableHead>Seats</TableHead>
                                    <TableHead>Enrolled</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {batches.map((batch) => (
                                    <TableRow key={batch.id}>
                                        <TableCell>
                                            {batch.thumbnailUrl ? (
                                                <Image
                                                    src={batch.thumbnailUrl}
                                                    alt={batch.title}
                                                    width={100}
                                                    height={100}
                                                    className="rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="w-[60px] h-[60px] bg-slate-200 rounded-lg flex items-center justify-center">
                                                    <Calendar className="h-6 w-6 text-slate-400" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{batch.title}</div>
                                            {batch.shortDescription && (
                                                <div className="text-sm text-muted-foreground line-clamp-1">
                                                    {batch.shortDescription?.slice(0, 30) || 'No description'}...
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-sm">
                                                <MapPin className="h-4 w-4" />
                                                {batch.city}, {batch.state}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {new Date(batch.startDate).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {batch.isFree || batch.pricingType === 'FREE' ? (
                                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                                    FREE
                                                </Badge>
                                            ) : batch.salePrice ? (
                                                <div className="text-sm">
                                                    <span className="line-through text-muted-foreground">₹{batch.price}</span>
                                                    <span className="ml-2 font-semibold">₹{batch.salePrice}</span>
                                                </div>
                                            ) : batch.price ? (
                                                <span className="text-sm font-semibold">₹{batch.price}</span>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">TBD</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {batch.isUnlimitedSeats ? (
                                                <Badge variant="outline">Unlimited</Badge>
                                            ) : (
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Users className="h-4 w-4" />
                                                    {batch.seatsFilled}/{batch.seatLimit || 'N/A'}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-sm font-medium">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                {batch._count?.enrollments || 0}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={batch.status}
                                                onValueChange={(value) => handleStatusChange(batch.id, value)}
                                            >
                                                <SelectTrigger className="w-[120px] h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="DRAFT">DRAFT</SelectItem>
                                                    <SelectItem value="OPEN">OPEN</SelectItem>
                                                    <SelectItem value="FULL">FULL</SelectItem>
                                                    <SelectItem value="CLOSED">CLOSED</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => router.push(`/admin/offline-batches/${batch.id}`)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => router.push(`/admin/offline-batches/${batch.id}/edit`)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => setDeleteDialog({ open: true, batchId: batch.id })}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, batchId: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Offline Batch</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this batch? This action cannot be undone and will also delete all enrollments.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

