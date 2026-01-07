'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2, GripVertical, Eye, EyeOff } from 'lucide-react';
import { footerAPI } from '@/lib/api';
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

const SOCIAL_ICONS = [
  { value: 'Facebook', label: 'Facebook', color: '#1877F2' },
  { value: 'X', label: 'X (Twitter)', color: '#000000' },
  { value: 'Instagram', label: 'Instagram', color: '#E4405F' },
  { value: 'LinkedIn', label: 'LinkedIn', color: '#0077B5' },
  { value: 'YouTube', label: 'YouTube', color: '#FF0000' },
  { value: 'WhatsApp', label: 'WhatsApp', color: '#25D366' },
  { value: 'Telegram', label: 'Telegram', color: '#0088CC' },
  { value: 'Discord', label: 'Discord', color: '#5865F2' },
  { value: 'GitHub', label: 'GitHub', color: '#181717' },
  { value: 'Email', label: 'Email', color: '#EA4335' },
];

export default function AdminFooterPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [formData, setFormData] = useState({
    label: '',
    url: '',
    icon: '',
    color: '#3b82f6',
    isActive: true,
  });
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/auth');
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchLinks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin]);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const response = await footerAPI.getAll();
      if (response.success) {
        setLinks(response.data);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch footer links');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      label: '',
      url: '',
      icon: 'none',
      color: '#3b82f6',
      isActive: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert "none" to empty string for API
      const submitData = {
        ...formData,
        icon: formData.icon === 'none' ? '' : formData.icon,
      };

      if (editingLink) {
        const response = await footerAPI.update(editingLink.id, submitData);
        if (response.success) {
          toast.success('Footer link updated successfully');
          fetchLinks();
          setShowForm(false);
          setEditingLink(null);
          resetForm();
        }
      } else {
        if (links.length >= 6) {
          toast.error('Maximum 6 footer links allowed');
          return;
        }
        const response = await footerAPI.create(submitData);
        if (response.success) {
          toast.success('Footer link created successfully');
          fetchLinks();
          setShowForm(false);
          resetForm();
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save footer link');
    }
  };

  const handleEdit = (link) => {
    setEditingLink(link);
    setShowForm(true);
    const selectedIcon = link.icon ? SOCIAL_ICONS.find(icon => icon.value === link.icon) : null;
    setFormData({
      label: link.label,
      url: link.url,
      icon: link.icon || 'none',
      color: link.color || selectedIcon?.color || '#3b82f6',
      isActive: link.isActive,
    });
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      const response = await footerAPI.delete(deleteDialog.id);
      if (response.success) {
        toast.success('Footer link deleted successfully');
        fetchLinks();
        setDeleteDialog(null);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete footer link');
    }
  };

  const handleToggleActive = async (link) => {
    try {
      const response = await footerAPI.update(link.id, { isActive: !link.isActive });
      if (response.success) {
        toast.success(`Link ${!link.isActive ? 'activated' : 'deactivated'}`);
        fetchLinks();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update link');
    }
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newLinks = [...links];
    const draggedLink = newLinks[draggedIndex];
    newLinks.splice(draggedIndex, 1);
    newLinks.splice(dropIndex, 0, draggedLink);

    // Update order values
    const reorderedLinks = newLinks.map((link, index) => ({
      id: link.id,
      order: index,
    }));

    try {
      const response = await footerAPI.reorder(reorderedLinks);
      if (response.success) {
        toast.success('Links reordered successfully');
        fetchLinks();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to reorder links');
      fetchLinks(); // Revert on error
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (authLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-10 w-40" />
        <Card className="border-2">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Footer Settings</h1>
          <p className="text-muted-foreground">Manage footer social media links (Max 6)</p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingLink(null);
            resetForm();
          }}
          className="bg-brand-600 hover:bg-brand-700"
          disabled={links.length >= 6}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Link {links.length >= 6 && '(Max 6)'}
        </Button>
      </div>

      {showForm && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle>{editingLink ? 'Edit Footer Link' : 'Create New Footer Link'}</CardTitle>
            <CardDescription>
              {editingLink ? 'Update footer link details' : 'Add a new footer link'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="label">Label *</Label>
                  <Input
                    id="label"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    required
                    placeholder="Facebook"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url">URL *</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    required
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="icon">Icon</Label>
                  <Select
                    value={formData.icon || 'none'}
                    onValueChange={(value) => {
                      const selectedIcon = SOCIAL_ICONS.find(icon => icon.value === value);
                      setFormData({ 
                        ...formData, 
                        icon: value,
                        color: selectedIcon ? selectedIcon.color : formData.color
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select icon" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {SOCIAL_ICONS.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value}>
                          {icon.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Show in footer</Label>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="bg-brand-600 hover:bg-brand-700">
                  {editingLink ? 'Update Link' : 'Create Link'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingLink(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Footer Links ({links.length}/6)</CardTitle>
          <CardDescription>Drag to reorder, click to edit</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : links.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No footer links yet. Create one to get started.</p>
          ) : (
            <div className="space-y-2">
              {links.map((link, index) => (
                <div
                  key={link.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-4 p-4 border rounded-lg cursor-move transition-colors ${
                    draggedIndex === index ? 'opacity-50' : ''
                  } ${dragOverIndex === index ? 'border-brand-600 bg-brand-50' : 'hover:bg-muted/50'}`}
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                    <div className="flex items-center gap-2">
                      {link.icon && (
                        <span className="text-sm font-medium text-muted-foreground">{link.icon}</span>
                      )}
                      <span className="font-medium">{link.label}</span>
                    </div>
                    <div className="text-sm text-muted-foreground truncate">{link.url}</div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: link.color || '#3b82f6' }}
                      />
                      <span className="text-xs text-muted-foreground">{link.color || '#3b82f6'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {link.isActive ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {link.isActive ? 'Visible' : 'Hidden'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(link)}
                    >
                      {link.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(link)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteDialog(link)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Footer Link</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteDialog?.label}&quot;? This action cannot be undone.
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

