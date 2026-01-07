'use client';

import { useState, useEffect } from 'react';
import { flashSaleAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
import { toast } from 'sonner';
import {
    Plus,
    Trash2,
    Pencil,
    Zap,
    BookOpen,
    GraduationCap,
    Video,
    MessageCircle,
    TrendingUp,
    Loader2,
    Power,
    Calendar,
    Percent,
    Palette,
    Package,
} from 'lucide-react';
import Image from 'next/image';

const TYPE_OPTIONS = [
    { value: 'COURSE', label: 'Course', icon: GraduationCap },
    { value: 'BUNDLE', label: 'Bundle', icon: Package },
    { value: 'EBOOK', label: 'E-Book', icon: BookOpen },
    { value: 'WEBINAR', label: 'Webinar', icon: Video },
    { value: 'MENTORSHIP', label: 'Mentorship', icon: Video },
    { value: 'GUIDANCE', label: '1:1 Guidance', icon: MessageCircle },
    { value: 'INDICATOR', label: 'Indicator', icon: TrendingUp },
];

const THEME_OPTIONS = [
    { value: 'default', label: 'Default', bg: '#dc2626', text: '#ffffff' },
    { value: 'blackfriday', label: '🖤 Black Friday', bg: '#000000', text: '#fbbf24' },
    { value: 'diwali', label: '🪔 Diwali', bg: '#f59e0b', text: '#1f2937' },
    { value: 'holi', label: '🎨 Holi', bg: 'linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6)', text: '#ffffff' },
    { value: 'christmas', label: '🎄 Christmas', bg: '#16a34a', text: '#ffffff' },
    { value: 'newyear', label: '🎉 New Year', bg: 'linear-gradient(90deg, #fbbf24, #f59e0b)', text: '#1f2937' },
    { value: 'summer', label: '☀️ Summer Sale', bg: '#f97316', text: '#ffffff' },
    { value: 'monsoon', label: '🌧️ Monsoon Sale', bg: '#0ea5e9', text: '#ffffff' },
];

const initialFormState = {
    type: 'COURSE',
    referenceIds: [],
    title: '',
    subtitle: '',
    discountPercent: 20,
    theme: 'default',
    bgColor: '#dc2626',
    textColor: '#ffffff',
    startDate: '',
    endDate: '',
    isActive: true,
};

export default function AdminFlashSalesPage() {
    const [flashSales, setFlashSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);
    const [form, setForm] = useState(initialFormState);
    const [items, setItems] = useState([]);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const fetchFlashSales = async () => {
        try {
            setLoading(true);
            const res = await flashSaleAPI.getAll({ limit: 50 });
            if (res.success) {
                setFlashSales(res.data.flashSales);
            }
        } catch (error) {
            toast.error('Failed to load flash sales');
        } finally {
            setLoading(false);
        }
    };

    const fetchItems = async (type) => {
        try {
            setItemsLoading(true);
            const res = await flashSaleAPI.getItemsByType(type);
            if (res.success) {
                setItems(res.data.items);
            }
        } catch (error) {
            console.error('Failed to load items:', error);
        } finally {
            setItemsLoading(false);
        }
    };

    useEffect(() => {
        fetchFlashSales();
    }, []);

    useEffect(() => {
        if (dialogOpen && form.type) {
            fetchItems(form.type);
        }
    }, [dialogOpen, form.type]);

    const handleCreate = () => {
        setIsEditing(false);
        setForm({
            ...initialFormState,
            startDate: new Date().toISOString().slice(0, 16),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        });
        setDialogOpen(true);
    };

    const handleEdit = (sale) => {
        setIsEditing(true);
        setSelectedSale(sale);
        setForm({
            type: sale.type,
            referenceIds: sale.referenceIds || [],
            title: sale.title,
            subtitle: sale.subtitle || '',
            discountPercent: sale.discountPercent,
            theme: sale.theme,
            bgColor: sale.bgColor,
            textColor: sale.textColor,
            startDate: new Date(sale.startDate).toISOString().slice(0, 16),
            endDate: new Date(sale.endDate).toISOString().slice(0, 16),
            isActive: sale.isActive,
        });
        setDialogOpen(true);
    };

    const handleDelete = (sale) => {
        setSelectedSale(sale);
        setDeleteDialogOpen(true);
    };

    const handleThemeChange = (themeValue) => {
        const theme = THEME_OPTIONS.find(t => t.value === themeValue);
        setForm(f => ({
            ...f,
            theme: themeValue,
            bgColor: theme?.bg || '#dc2626',
            textColor: theme?.text || '#ffffff',
        }));
    };

    const handleSubmit = async () => {
        if (!form.referenceIds || form.referenceIds.length === 0) {
            toast.error('Please select at least one item');
            return;
        }
        if (!form.title) {
            toast.error('Please enter a title');
            return;
        }

        try {
            setActionLoading(true);
            if (isEditing && selectedSale) {
                const res = await flashSaleAPI.update(selectedSale.id, form);
                if (res.success) {
                    toast.success('Flash sale updated!');
                    setDialogOpen(false);
                    fetchFlashSales();
                }
            } else {
                const res = await flashSaleAPI.create(form);
                if (res.success) {
                    toast.success('Flash sale created!');
                    setDialogOpen(false);
                    fetchFlashSales();
                }
            }
        } catch (error) {
            toast.error(error.message || 'Failed to save flash sale');
        } finally {
            setActionLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!selectedSale) return;
        try {
            setActionLoading(true);
            const res = await flashSaleAPI.delete(selectedSale.id);
            if (res.success) {
                toast.success('Flash sale deleted');
                setDeleteDialogOpen(false);
                fetchFlashSales();
            }
        } catch (error) {
            toast.error(error.message || 'Failed to delete');
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggle = async (sale) => {
        try {
            const res = await flashSaleAPI.toggle(sale.id);
            if (res.success) {
                toast.success(res.message);
                fetchFlashSales();
            }
        } catch (error) {
            toast.error(error.message || 'Failed to toggle');
        }
    };

    const getTypeIcon = (type) => {
        const opt = TYPE_OPTIONS.find(t => t.value === type);
        return opt ? opt.icon : Zap;
    };

    const isExpired = (endDate) => new Date(endDate) < new Date();
    const isUpcoming = (startDate) => new Date(startDate) > new Date();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Zap className="h-6 w-6 text-yellow-500" />
                        Flash Sales
                    </h1>
                    <p className="text-muted-foreground">Create promotional flash sales for courses, ebooks, and more</p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Flash Sale
                </Button>
            </div>

            {/* Info Card */}
            <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-yellow-100 rounded-full">
                            <Zap className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-yellow-900">How Flash Sales Work</h3>
                            <p className="text-sm text-yellow-800 mt-1">
                                Only one flash sale can be active at a time. When you activate a sale, all others are automatically deactivated.
                                The active sale banner appears on the home page below the header.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Flash Sales Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Status</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Item</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Discount</TableHead>
                                <TableHead>Theme</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(3)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                                    </TableRow>
                                ))
                            ) : flashSales.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-12">
                                        <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground">No flash sales yet</p>
                                        <Button className="mt-4" onClick={handleCreate}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create First Sale
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                flashSales.map((sale) => {
                                    const TypeIcon = getTypeIcon(sale.type);
                                    const expired = isExpired(sale.endDate);
                                    const upcoming = isUpcoming(sale.startDate);

                                    return (
                                        <TableRow key={sale.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={sale.isActive}
                                                        onCheckedChange={() => handleToggle(sale)}
                                                        disabled={expired}
                                                    />
                                                    {sale.isActive && !expired && !upcoming ? (
                                                        <Badge className="bg-green-100 text-green-800">Live</Badge>
                                                    ) : expired ? (
                                                        <Badge variant="secondary">Expired</Badge>
                                                    ) : upcoming ? (
                                                        <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>
                                                    ) : (
                                                        <Badge variant="outline">Inactive</Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                                    <TypeIcon className="h-3 w-3" />
                                                    {sale.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {sale.itemImage && (
                                                        <Image
                                                            src={sale.itemImage}
                                                            alt={sale.itemTitle}
                                                            width={40}
                                                            height={40}
                                                            className="rounded object-cover"
                                                        />
                                                    )}
                                                    <div>
                                                        <span className="font-medium text-sm line-clamp-1 max-w-[150px]">
                                                            {sale.itemTitle}
                                                        </span>
                                                        {sale.itemCount > 1 && (
                                                            <p className="text-xs text-muted-foreground">
                                                                +{sale.itemCount - 1} more
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{sale.title}</p>
                                                    {sale.subtitle && (
                                                        <p className="text-xs text-muted-foreground">{sale.subtitle}</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className="bg-red-100 text-red-800">
                                                    {sale.discountPercent}% OFF
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div
                                                    className="w-6 h-6 rounded-full border-2 border-gray-200"
                                                    style={{ background: sale.bgColor }}
                                                    title={sale.theme}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs">
                                                    <p>{new Date(sale.startDate).toLocaleDateString()}</p>
                                                    <p className="text-muted-foreground">to {new Date(sale.endDate).toLocaleDateString()}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(sale)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-600"
                                                        onClick={() => handleDelete(sale)}
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

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            {isEditing ? 'Edit Flash Sale' : 'Create Flash Sale'}
                        </DialogTitle>
                        <DialogDescription>
                            Set up a promotional flash sale banner for your home page
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Preview */}
                        <div
                            className="p-4 rounded-lg text-center"
                            style={{
                                background: form.bgColor,
                                color: form.textColor,
                            }}
                        >
                            <p className="font-bold text-lg">
                                {form.title || 'Flash Sale Title'} 
                                {form.discountPercent > 0 && ` - ${form.discountPercent}% OFF!`}
                            </p>
                            {form.subtitle && <p className="text-sm opacity-90">{form.subtitle}</p>}
                        </div>

                        {/* Type Selection */}
                        <div className="space-y-2">
                            <Label>Sale Type</Label>
                            <Select
                                value={form.type}
                                onValueChange={(v) => {
                                    setForm(f => ({ ...f, type: v, referenceIds: [] }));
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TYPE_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            <div className="flex items-center gap-2">
                                                <opt.icon className="h-4 w-4" />
                                                {opt.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Item Selection - Multi-select */}
                        <div className="space-y-2">
                            <Label>Select Items (Multiple)</Label>
                            {itemsLoading ? (
                                <Skeleton className="h-32 w-full" />
                            ) : (
                                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                                    {items.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            No paid items available
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {items.map((item) => {
                                                const isSelected = form.referenceIds.includes(item.id);
                                                return (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                setForm(f => ({
                                                                    ...f,
                                                                    referenceIds: f.referenceIds.filter(id => id !== item.id)
                                                                }));
                                                            } else {
                                                                setForm(f => ({
                                                                    ...f,
                                                                    referenceIds: [...f.referenceIds, item.id]
                                                                }));
                                                            }
                                                        }}
                                                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                                            isSelected
                                                                ? 'border-primary bg-primary/5'
                                                                : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => {}}
                                                            className="w-4 h-4"
                                                        />
                                                        {item.image && (
                                                            <Image
                                                                src={item.image}
                                                                alt={item.title}
                                                                width={40}
                                                                height={40}
                                                                className="rounded object-cover"
                                                            />
                                                        )}
                                                        <div className="flex-1">
                                                            <p className="font-medium text-sm">{item.title}</p>
                                                            {item.price > 0 && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    ₹{item.salePrice || item.price}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                            {form.referenceIds.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    {form.referenceIds.length} item{form.referenceIds.length > 1 ? 's' : ''} selected
                                </p>
                            )}
                        </div>

                        {/* Title & Subtitle */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Title *</Label>
                                <Input
                                    value={form.title}
                                    onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="e.g. Black Friday Sale!"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Subtitle</Label>
                                <Input
                                    value={form.subtitle}
                                    onChange={(e) => setForm(f => ({ ...f, subtitle: e.target.value }))}
                                    placeholder="e.g. Limited time offer"
                                />
                            </div>
                        </div>

                        {/* Discount */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Percent className="h-4 w-4" />
                                Discount Percentage
                            </Label>
                            <div className="flex items-center gap-4">
                                <Input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={form.discountPercent}
                                    onChange={(e) => setForm(f => ({ ...f, discountPercent: parseInt(e.target.value) || 0 }))}
                                    className="w-24"
                                />
                                <span className="text-muted-foreground">% off</span>
                            </div>
                        </div>

                        {/* Theme */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Palette className="h-4 w-4" />
                                Theme
                            </Label>
                            <div className="grid grid-cols-4 gap-2">
                                {THEME_OPTIONS.map((theme) => (
                                    <button
                                        key={theme.value}
                                        type="button"
                                        onClick={() => handleThemeChange(theme.value)}
                                        className={`p-3 rounded-lg border-2 text-center text-sm transition-all ${
                                            form.theme === theme.value
                                                ? 'border-brand-600 ring-2 ring-brand-200'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                        style={{
                                            background: theme.bg,
                                            color: theme.text,
                                        }}
                                    >
                                        {theme.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Colors */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Background Color</Label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={form.bgColor.startsWith('#') ? form.bgColor : '#dc2626'}
                                        onChange={(e) => setForm(f => ({ ...f, bgColor: e.target.value }))}
                                        className="w-10 h-10 rounded cursor-pointer"
                                    />
                                    <Input
                                        value={form.bgColor}
                                        onChange={(e) => setForm(f => ({ ...f, bgColor: e.target.value }))}
                                        placeholder="#dc2626"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Text Color</Label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={form.textColor}
                                        onChange={(e) => setForm(f => ({ ...f, textColor: e.target.value }))}
                                        className="w-10 h-10 rounded cursor-pointer"
                                    />
                                    <Input
                                        value={form.textColor}
                                        onChange={(e) => setForm(f => ({ ...f, textColor: e.target.value }))}
                                        placeholder="#ffffff"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Duration */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Start Date & Time
                                </Label>
                                <Input
                                    type="datetime-local"
                                    value={form.startDate}
                                    onChange={(e) => setForm(f => ({ ...f, startDate: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    End Date & Time
                                </Label>
                                <Input
                                    type="datetime-local"
                                    value={form.endDate}
                                    onChange={(e) => setForm(f => ({ ...f, endDate: e.target.value }))}
                                />
                            </div>
                        </div>

                        {/* Active Switch */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg dark:bg-gray-800 dark:text-gray-100">
                            <div>
                                <Label className="flex items-center gap-2">
                                    <Power className="h-4 w-4" />
                                    Activate Immediately
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    This will deactivate any other active flash sale
                                </p>
                            </div>
                            <Switch
                                checked={form.isActive}
                                onCheckedChange={(v) => setForm(f => ({ ...f, isActive: v }))}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={actionLoading}>
                            {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {isEditing ? 'Update' : 'Create'} Flash Sale
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Flash Sale</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this flash sale? This action cannot be undone.
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

