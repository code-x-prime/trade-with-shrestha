'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { offlineBatchAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Loader2, ArrowLeft, ImageIcon } from 'lucide-react';
import MediaPicker from '@/components/admin/MediaPicker';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import RichTextEditor from '@/components/RichTextEditor';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export default function EditOfflineBatchPage() {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const id = params.id;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        shortDescription: '',
        description: '',
        centerName: '',
        address: '',
        city: '',
        state: '',
        googleMap: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        days: [],
        instructorName: '',
        instructorBio: '',
        pricingType: 'PAID',
        price: '',
        salePrice: '',
        isFree: false,
        isUnlimitedSeats: false,
        seatLimit: '',
        includesNotes: true,
        includesRecordings: false,
        includesTests: true,
        includesDoubtSupport: true,
        status: 'DRAFT',
    });
    const [thumbnail, setThumbnail] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [existingThumbnail, setExistingThumbnail] = useState(null);
    const [removeThumbnailFlag, setRemoveThumbnailFlag] = useState(false);

    // MediaPicker state
    const [showImagePicker, setShowImagePicker] = useState(false);

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
                const batch = response.data.batch;
                const startDate = new Date(batch.startDate).toISOString().split('T')[0];
                const endDate = new Date(batch.endDate).toISOString().split('T')[0];

                setFormData({
                    title: batch.title || '',
                    shortDescription: batch.shortDescription || '',
                    description: batch.description || '',
                    centerName: batch.centerName || '',
                    address: batch.address || '',
                    city: batch.city || '',
                    state: batch.state || '',
                    googleMap: batch.googleMap || '',
                    startDate,
                    endDate,
                    startTime: batch.startTime || '',
                    endTime: batch.endTime || '',
                    days: batch.days || [],
                    instructorName: batch.instructorName || '',
                    instructorBio: batch.instructorBio || '',
                    pricingType: batch.pricingType || 'PAID',
                    price: batch.price?.toString() || '',
                    salePrice: batch.salePrice?.toString() || '',
                    isFree: batch.isFree || false,
                    isUnlimitedSeats: batch.isUnlimitedSeats || false,
                    seatLimit: batch.seatLimit?.toString() || '',
                    includesNotes: batch.includesNotes !== undefined ? batch.includesNotes : true,
                    includesRecordings: batch.includesRecordings || false,
                    includesTests: batch.includesTests !== undefined ? batch.includesTests : true,
                    includesDoubtSupport: batch.includesDoubtSupport !== undefined ? batch.includesDoubtSupport : true,
                    status: batch.status || 'DRAFT',
                });
                if (batch.thumbnailUrl) {
                    setExistingThumbnail(batch.thumbnailUrl);
                }
            }
        } catch (error) {
            toast.error(error.message || 'Failed to load batch');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };


    const removeThumbnail = () => {
        setThumbnail(null);
        setThumbnailPreview(null);
        setExistingThumbnail(null);
        setRemoveThumbnailFlag(true);
    };

    const toggleDay = (day) => {
        setFormData({
            ...formData,
            days: formData.days.includes(day)
                ? formData.days.filter((d) => d !== day)
                : [...formData.days, day],
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const submitData = new FormData();

            // Add all form fields
            Object.keys(formData).forEach((key) => {
                if (key === 'days') {
                    formData.days.forEach((day) => submitData.append('days[]', day));
                } else if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
                    submitData.append(key, formData[key]);
                }
            });

            // Handle thumbnail - either file upload or URL from MediaPicker
            if (removeThumbnailFlag) {
                submitData.append('removeThumbnail', 'true');
            } else if (thumbnail) {
                // File upload
                submitData.append('thumbnail', thumbnail);
            } else if (thumbnailPreview && !thumbnail) {
                // URL from MediaPicker
                submitData.append('thumbnailUrl', thumbnailPreview);
            }

            const response = await offlineBatchAPI.update(id, submitData);
            if (response.success) {
                toast.success('Offline batch updated successfully');
                router.push('/admin/offline-batches');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to update offline batch');
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!user || !isAdmin) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/offline-batches">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Edit Offline Batch</h1>
                    <p className="text-muted-foreground">Update offline training batch details</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info - Same as create page */}
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                        <CardDescription>Title, description, and thumbnail</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title *</Label>
                            <Input
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="shortDescription">Short Description</Label>
                            <Input
                                id="shortDescription"
                                name="shortDescription"
                                value={formData.shortDescription}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Full Description *</Label>
                            <RichTextEditor
                                value={formData.description}
                                onChange={(value) => setFormData({ ...formData, description: value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="thumbnail">Thumbnail Image</Label>
                            {(thumbnailPreview || existingThumbnail) ? (
                                <div className="relative w-48 h-48 border rounded-lg overflow-hidden">
                                    <Image
                                        src={thumbnailPreview || existingThumbnail}
                                        alt="Thumbnail preview"
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setShowImagePicker(true)}
                                        >
                                            Change
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={removeThumbnail}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted hover:border-brand-500 transition-colors"
                                    onClick={() => setShowImagePicker(true)}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Click to select thumbnail</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Rest of the form sections are same as create page - Location, Date & Time, Instructor, Pricing, Seats, Features, Status */}
                {/* For brevity, I'll include key sections - you can copy the rest from create page */}

                {/* Location */}
                <Card>
                    <CardHeader>
                        <CardTitle>Location Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="centerName">Center Name *</Label>
                                <Input id="centerName" name="centerName" value={formData.centerName} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">City *</Label>
                                <Input id="city" name="city" value={formData.city} onChange={handleInputChange} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address *</Label>
                            <Textarea id="address" name="address" value={formData.address} onChange={handleInputChange} required />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="state">State *</Label>
                                <Input id="state" name="state" value={formData.state} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="googleMap">Google Maps Link</Label>
                                <Input id="googleMap" name="googleMap" value={formData.googleMap} onChange={handleInputChange} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Date & Time */}
                <Card>
                    <CardHeader>
                        <CardTitle>Date & Time</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date *</Label>
                                <Input id="startDate" name="startDate" type="date" value={formData.startDate} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date *</Label>
                                <Input id="endDate" name="endDate" type="date" value={formData.endDate} onChange={handleInputChange} required />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startTime">Start Time *</Label>
                                <Input id="startTime" name="startTime" type="time" value={formData.startTime} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endTime">End Time *</Label>
                                <Input id="endTime" name="endTime" type="time" value={formData.endTime} onChange={handleInputChange} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Days *</Label>
                            <div className="flex flex-wrap gap-2">
                                {DAYS.map((day) => (
                                    <div key={day} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={day}
                                            checked={formData.days.includes(day)}
                                            onCheckedChange={() => toggleDay(day)}
                                        />
                                        <Label htmlFor={day} className="cursor-pointer">{day}</Label>
                                    </div>
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
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="instructorName">Instructor Name *</Label>
                            <Input id="instructorName" name="instructorName" value={formData.instructorName} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="instructorBio">Instructor Bio</Label>
                            <Textarea id="instructorBio" name="instructorBio" value={formData.instructorBio} onChange={handleInputChange} rows={4} />
                        </div>
                    </CardContent>
                </Card>

                {/* Pricing */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pricing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Pricing Type *</Label>
                            <RadioGroup
                                value={formData.pricingType}
                                onValueChange={(value) => setFormData({ ...formData, pricingType: value, isFree: value === 'FREE' })}
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="FREE" id="free" />
                                    <Label htmlFor="free">FREE</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="PAID" id="paid" />
                                    <Label htmlFor="paid">PAID</Label>
                                </div>
                            </RadioGroup>
                        </div>
                        {formData.pricingType === 'PAID' && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="price">Price (₹) *</Label>
                                    <Input id="price" name="price" type="number" min="0" step="0.01" value={formData.price} onChange={handleInputChange} required={formData.pricingType === 'PAID'} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="salePrice">Sale Price (₹)</Label>
                                    <Input id="salePrice" name="salePrice" type="number" min="0" step="0.01" value={formData.salePrice} onChange={handleInputChange} />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Seats */}
                <Card>
                    <CardHeader>
                        <CardTitle>Seats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="isUnlimitedSeats"
                                checked={formData.isUnlimitedSeats}
                                onCheckedChange={(checked) => setFormData({ ...formData, isUnlimitedSeats: checked })}
                            />
                            <Label htmlFor="isUnlimitedSeats">Unlimited Seats</Label>
                        </div>
                        {!formData.isUnlimitedSeats && (
                            <div className="space-y-2">
                                <Label htmlFor="seatLimit">Seat Limit *</Label>
                                <Input id="seatLimit" name="seatLimit" type="number" min="1" value={formData.seatLimit} onChange={handleInputChange} required={!formData.isUnlimitedSeats} />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Features */}
                <Card>
                    <CardHeader>
                        <CardTitle>What Students Get</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="includesNotes" checked={formData.includesNotes} onCheckedChange={(checked) => setFormData({ ...formData, includesNotes: checked })} />
                            <Label htmlFor="includesNotes">Includes Notes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="includesRecordings" checked={formData.includesRecordings} onCheckedChange={(checked) => setFormData({ ...formData, includesRecordings: checked })} />
                            <Label htmlFor="includesRecordings">Includes Recordings</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="includesTests" checked={formData.includesTests} onCheckedChange={(checked) => setFormData({ ...formData, includesTests: checked })} />
                            <Label htmlFor="includesTests">Includes Tests</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="includesDoubtSupport" checked={formData.includesDoubtSupport} onCheckedChange={(checked) => setFormData({ ...formData, includesDoubtSupport: checked })} />
                            <Label htmlFor="includesDoubtSupport">Includes Doubt Support</Label>
                        </div>
                    </CardContent>
                </Card>

                {/* Status */}
                <Card>
                    <CardHeader>
                        <CardTitle>Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status *</Label>
                            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DRAFT">Draft</SelectItem>
                                    <SelectItem value="OPEN">Open</SelectItem>
                                    <SelectItem value="FULL">Full</SelectItem>
                                    <SelectItem value="CLOSED">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex gap-4">
                    <Button type="submit" disabled={saving} className="bg-brand-600 hover:bg-brand-700">
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            'Update Batch'
                        )}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.push('/admin/offline-batches')}>
                        Cancel
                    </Button>
                </div>
            </form>

            {/* MediaPicker Dialog */}
            <MediaPicker
                open={showImagePicker}
                onOpenChange={setShowImagePicker}
                onSelect={(url) => {
                    setThumbnailPreview(url);
                    setThumbnail(null);
                    setExistingThumbnail(null);
                    setRemoveThumbnailFlag(false);
                }}
                type="image"
                title="Select Batch Thumbnail"
                description="Choose an image from your media library"
            />
        </div>
    );
}

