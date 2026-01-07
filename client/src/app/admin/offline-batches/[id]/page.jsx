'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { offlineBatchAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, MapPin, Calendar, Clock, Users, User, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';

export default function ViewOfflineBatchPage() {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const id = params.id;
    const [loading, setLoading] = useState(true);
    const [batch, setBatch] = useState(null);

    useEffect(() => {
        if (!authLoading && (!user || !isAdmin)) {
            router.push('/auth');
        }
    }, [user, isAdmin, authLoading, router]);

    useEffect(() => {
        if (user && isAdmin && id) {
            fetchBatch();
        }
    }, [user, isAdmin, id]);

    const fetchBatch = async () => {
        try {
            setLoading(true);
            const response = await offlineBatchAPI.getById(id);
            if (response.success) {
                setBatch(response.data.batch);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to load batch');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!user || !isAdmin || !batch) {
        return null;
    }

    const STATUS_COLORS = {
        DRAFT: 'bg-gray-500',
        OPEN: 'bg-green-500',
        FULL: 'bg-orange-500',
        CLOSED: 'bg-red-500',
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/offline-batches">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">{batch.title}</h1>
                        <p className="text-muted-foreground">Batch Details</p>
                    </div>
                </div>
                <Button onClick={() => router.push(`/admin/offline-batches/${id}/edit`)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Thumbnail */}
                    {batch.thumbnailUrl && (
                        <Card>
                            <CardContent className="p-0">
                                <Image
                                    src={batch.thumbnailUrl}
                                    alt={batch.title}
                                    width={800}
                                    height={400}
                                    className="w-full h-64 object-cover rounded-t-lg"
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Description */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div
                                className="prose max-w-none"
                                dangerouslySetInnerHTML={{ __html: batch.description }}
                            />
                        </CardContent>
                    </Card>

                    {/* Location */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Location</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex items-start gap-2">
                                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="font-semibold">{batch.centerName}</p>
                                    <p className="text-sm text-muted-foreground">{batch.address}</p>
                                    <p className="text-sm text-muted-foreground">{batch.city}, {batch.state}</p>
                                </div>
                            </div>
                            {batch.googleMap && (
                                <a
                                    href={batch.googleMap}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-brand-600 hover:underline"
                                >
                                    View on Google Maps
                                </a>
                            )}
                        </CardContent>
                    </Card>

                    {/* Schedule */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Schedule</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-semibold">
                                        {new Date(batch.startDate).toLocaleDateString()} - {new Date(batch.endDate).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-muted-foreground" />
                                <p className="font-semibold">{batch.startTime} - {batch.endTime}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-2">Days:</p>
                                <div className="flex flex-wrap gap-2">
                                    {batch.days.map((day) => (
                                        <Badge key={day} variant="outline">{day}</Badge>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Instructor */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Instructor</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-start gap-2">
                                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="font-semibold">{batch.instructorName}</p>
                                    {batch.instructorBio && (
                                        <p className="text-sm text-muted-foreground mt-1">{batch.instructorBio}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Pricing & Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pricing & Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Status</p>
                                <Badge className={STATUS_COLORS[batch.status] || 'bg-gray-500'}>
                                    {batch.status}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Pricing</p>
                                {batch.isFree || batch.pricingType === 'FREE' ? (
                                    <Badge variant="outline" className="bg-green-50 text-green-700">
                                        FREE
                                    </Badge>
                                ) : batch.salePrice ? (
                                    <div>
                                        <span className="line-through text-muted-foreground">₹{batch.price}</span>
                                        <span className="ml-2 font-semibold text-lg">₹{batch.salePrice}</span>
                                    </div>
                                ) : batch.price ? (
                                    <p className="font-semibold text-lg">₹{batch.price}</p>
                                ) : (
                                    <p className="text-muted-foreground">TBD</p>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Seats</p>
                                {batch.isUnlimitedSeats ? (
                                    <Badge variant="outline">Unlimited</Badge>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        <span>{batch.seatsFilled} / {batch.seatLimit}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Features */}
                    <Card>
                        <CardHeader>
                            <CardTitle>What Students Get</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex items-center gap-2">
                                {batch.includesNotes ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                    <XCircle className="h-4 w-4 text-gray-400" />
                                )}
                                <span className="text-sm">Notes</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {batch.includesRecordings ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                    <XCircle className="h-4 w-4 text-gray-400" />
                                )}
                                <span className="text-sm">Recordings</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {batch.includesTests ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                    <XCircle className="h-4 w-4 text-gray-400" />
                                )}
                                <span className="text-sm">Tests</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {batch.includesDoubtSupport ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                    <XCircle className="h-4 w-4 text-gray-400" />
                                )}
                                <span className="text-sm">Doubt Support</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Enrollments */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Enrollments ({batch._count?.enrollments || 0})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {batch.enrollments && batch.enrollments.length > 0 ? (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {batch.enrollments.map((enrollment) => (
                                        <div key={enrollment.id} className="flex items-center justify-between p-2 border rounded">
                                            <div>
                                                <p className="text-sm font-medium">{enrollment.user.name || enrollment.user.email}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(enrollment.enrolledAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Badge variant={enrollment.paymentStatus === 'PAID' ? 'default' : 'outline'}>
                                                {enrollment.paymentStatus}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No enrollments yet</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

