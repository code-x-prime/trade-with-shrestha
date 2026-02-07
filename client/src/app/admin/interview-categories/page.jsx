'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { interviewCategoryAPI } from '@/lib/api';
import {  Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FiEdit, FiTrash2, FiPlus, FiCheckCircle, FiXCircle, FiCode, FiDatabase, FiCloud, FiLayout, FiUsers, FiCpu, FiGitBranch, FiSettings, FiFolder, FiFileText } from 'react-icons/fi';

// Available icons for categories
const AVAILABLE_ICONS = [
  { value: 'FiCode', label: 'Code', icon: FiCode },
  { value: 'FiDatabase', label: 'Database', icon: FiDatabase },
  { value: 'FiCloud', label: 'Cloud', icon: FiCloud },
  { value: 'FiLayout', label: 'Layout', icon: FiLayout },
  { value: 'FiUsers', label: 'Users', icon: FiUsers },
  { value: 'FiCpu', label: 'CPU', icon: FiCpu },
  { value: 'FiGitBranch', label: 'Git Branch', icon: FiGitBranch },
  { value: 'FiSettings', label: 'Settings', icon: FiSettings },
  { value: 'FiFolder', label: 'Folder', icon: FiFolder },
  { value: 'FiFileText', label: 'File Text', icon: FiFileText },
];

export default function InterviewCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    sortOrder: 0,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await interviewCategoryAPI.getAllAdmin();
      if (res.success) {
        setCategories(res.data.categories || []);
      }
    } catch (error) {
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: '',
      sortOrder: 0,
    });
    setDialogOpen(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
      icon: category.icon || '',
      sortOrder: category.sortOrder || 0,
    });
    setDialogOpen(true);
  };

  const generateSlug = () => {
    const slug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setFormData({ ...formData, slug });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await interviewCategoryAPI.update(editingCategory.id, formData);
        toast.success('Category updated successfully');
      } else {
        await interviewCategoryAPI.create(formData);
        toast.success('Category created successfully');
      }
      setDialogOpen(false);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await interviewCategoryAPI.delete(deleteId);
      toast.success('Category deleted');
      fetchCategories();
      setDeleteId(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await interviewCategoryAPI.toggleActive(id);
      toast.success('Category status updated');
      fetchCategories();
    } catch (error) {
      toast.error('Toggle failed');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Interview Categories</h1>
          <p className="text-muted-foreground">Manage question categories</p>
        </div>
        <Button onClick={handleCreate}>
          <FiPlus className="mr-2" /> New Category
        </Button>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Questions</TableHead>
              <TableHead>Sort Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  Loading categories...
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  No categories found
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{category.slug}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{category._count?.questions || 0}</Badge>
                  </TableCell>
                  <TableCell>{category.sortOrder}</TableCell>
                  <TableCell>
                    <button onClick={() => handleToggleActive(category.id)}>
                      {category.isActive ? (
                        <Badge className="bg-green-600 hover:bg-green-700">
                          <FiCheckCircle className="mr-1" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <FiXCircle className="mr-1" /> Inactive
                        </Badge>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(category)}>
                      <FiEdit />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteId(category.id)}
                      disabled={category._count?.questions > 0}
                    >
                      <FiTrash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Update category details' : 'Create a new interview question category'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug *</Label>
                <div className="flex gap-2">
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g., python, java"
                    required
                  />
                  <Button type="button" variant="outline" onClick={generateSlug}>
                    Generate
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="icon">Icon</Label>
                  <Select value={formData.icon} onValueChange={(val) => setFormData({ ...formData, icon: val })}>
                    <SelectTrigger id="icon">
                      <SelectValue placeholder="Select icon">
                        {formData.icon && (() => {
                          const selectedIcon = AVAILABLE_ICONS.find(i => i.value === formData.icon);
                          if (selectedIcon) {
                            const IconComponent = selectedIcon.icon;
                            return (
                              <div className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4" />
                                <span>{selectedIcon.label}</span>
                              </div>
                            );
                          }
                          return formData.icon;
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_ICONS.map((iconItem) => {
                        const IconComponent = iconItem.icon;
                        return (
                          <SelectItem key={iconItem.value} value={iconItem.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              <span>{iconItem.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingCategory ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category and remove it from sorting.
              {/* Note: Backend checks if questions exist, so this is safe */}
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
