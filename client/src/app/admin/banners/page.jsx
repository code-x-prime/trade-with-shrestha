'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { bannerAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import MediaPicker from '@/components/admin/MediaPicker';
import { Skeleton } from '@/components/ui/skeleton';
import { Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

export default function AdminBannersPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showMobileImagePicker, setShowMobileImagePicker] = useState(false);
  const [pickerFor, setPickerFor] = useState('desktop'); // 'desktop' | 'mobile'
  const [form, setForm] = useState({
    title: '',
    imageUrl: '',
    imageUrlMobile: '',
    link: '',
    sortOrder: 0,
    isActive: true,
  });
  const [imagePreview, setImagePreview] = useState('');
  const [imageMobilePreview, setImageMobilePreview] = useState('');
  const [saving, setSaving] = useState(false);

  const SIZE_DESKTOP = '1200×450 px';
  const SIZE_MOBILE = '800×400 px';

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/auth');
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    if (user && isAdmin) fetchBanners();
  }, [user, isAdmin]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await bannerAPI.getAll();
      if (res.success) setBanners(res.data || []);
    } catch (e) {
      toast.error(e.message || 'Failed to fetch banners');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ title: '', imageUrl: '', imageUrlMobile: '', link: '', sortOrder: banners.length, isActive: true });
    setImagePreview('');
    setImageMobilePreview('');
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (b) => {
    setForm({
      title: b.title || '',
      imageUrl: b.imageUrl || '',
      imageUrlMobile: b.imageUrlMobile || '',
      link: b.link || '',
      sortOrder: b.sortOrder ?? 0,
      isActive: b.isActive !== false,
    });
    setImagePreview(b.imageUrl || '');
    setImageMobilePreview(b.imageUrlMobile || '');
    setEditingId(b.id);
    setShowForm(true);
  };

  const handleImageSelect = (url) => {
    if (pickerFor === 'mobile') {
      setForm((prev) => ({ ...prev, imageUrlMobile: url }));
      setImageMobilePreview(url);
      setShowMobileImagePicker(false);
    } else {
      setForm((prev) => ({ ...prev, imageUrl: url }));
      setImagePreview(url);
      setShowImagePicker(false);
    }
    setPickerFor('desktop');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imagePreview && !form.imageUrl) {
      toast.error('Select at least the desktop banner image');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        title: form.title || null,
        imageUrl: imagePreview || form.imageUrl,
        imageUrlMobile: imageMobilePreview || form.imageUrlMobile || null,
        link: form.link || null,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      if (editingId) {
        const res = await bannerAPI.update(editingId, payload);
        if (res.success) {
          toast.success('Banner updated');
          fetchBanners();
          resetForm();
        }
      } else {
        const res = await bannerAPI.create(payload);
        if (res.success) {
          toast.success('Banner created');
          fetchBanners();
          resetForm();
        }
      }
    } catch (e) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await bannerAPI.delete(deleteId);
      if (res.success) {
        toast.success('Banner deleted');
        fetchBanners();
        setDeleteId(null);
      }
    } catch (e) {
      toast.error(e.message || 'Failed to delete');
    }
  };

  if (!user || !isAdmin) return null;

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ImageIcon className="h-8 w-8" />
            Homepage Banners
          </h1>
          <p className="text-muted-foreground text-sm">Desktop (1200×450) and optional mobile (800×400). One banner = no carousel; 2+ = carousel.</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Banner
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Banners ({banners.length})</CardTitle>
          <CardDescription>Order by sort order. Active banners appear on homepage.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : banners.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No banners yet. Add one to show on the homepage hero.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Title / Link</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="flex gap-1">
                        {b.imageUrl ? (
                          <div className="relative w-20 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                            <Image src={b.imageUrl} alt={b.title || 'Banner'} fill className="object-cover" unoptimized />
                          </div>
                        ) : (
                          <div className="w-20 h-12 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">No</div>
                        )}
                        {b.imageUrlMobile ? (
                          <div className="relative w-12 h-8 rounded overflow-hidden bg-muted flex-shrink-0">
                            <Image src={b.imageUrlMobile} alt="" fill className="object-cover" unoptimized />
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        {b.title && <span className="font-medium">{b.title}</span>}
                        {b.link && <span className="text-xs text-muted-foreground truncate max-w-[200px]">{b.link}</span>}
                      </div>
                    </TableCell>
                    <TableCell>{b.sortOrder}</TableCell>
                    <TableCell>{b.isActive ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(b)}>Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => setDeleteId(b.id)}>Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
            <DialogDescription>Desktop (big screen) and mobile (small screen) sizes. One banner = no carousel; 2+ = carousel.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title (optional)</Label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Banner title" />
            </div>
            <div className="space-y-2">
              <Label>Desktop image (big screen) * — Size: {SIZE_DESKTOP}</Label>
              <div className="flex items-center gap-4">
                {(imagePreview || form.imageUrl) && (
                  <div className="relative w-40 h-[75px] rounded border bg-muted overflow-hidden flex-shrink-0">
                    <Image src={imagePreview || form.imageUrl} alt="Desktop" fill className="object-cover" unoptimized />
                  </div>
                )}
                <Button type="button" variant="outline" onClick={() => { setPickerFor('desktop'); setShowImagePicker(true); }}>
                  {imagePreview || form.imageUrl ? 'Change' : 'Select from Media'}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Mobile image (small screen) — Size: {SIZE_MOBILE} (optional)</Label>
              <div className="flex items-center gap-4">
                {(imageMobilePreview || form.imageUrlMobile) && (
                  <div className="relative w-32 h-16 rounded border bg-muted overflow-hidden flex-shrink-0">
                    <Image src={imageMobilePreview || form.imageUrlMobile} alt="Mobile" fill className="object-cover" unoptimized />
                  </div>
                )}
                <Button type="button" variant="outline" onClick={() => { setPickerFor('mobile'); setShowMobileImagePicker(true); }}>
                  {imageMobilePreview || form.imageUrlMobile ? 'Change' : 'Select from Media'}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Link (optional)</Label>
              <Input value={form.link} onChange={(e) => setForm((p) => ({ ...p, link: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input type="number" value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))} min={0} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))} />
              <Label>Active (show on homepage)</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <MediaPicker open={showImagePicker} onOpenChange={setShowImagePicker} onSelect={handleImageSelect} type="image" title="Select desktop banner" description={`Recommended size: ${SIZE_DESKTOP}`} />
      <MediaPicker open={showMobileImagePicker} onOpenChange={setShowMobileImagePicker} onSelect={handleImageSelect} type="image" title="Select mobile banner" description={`Recommended size: ${SIZE_MOBILE}`} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete banner?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
