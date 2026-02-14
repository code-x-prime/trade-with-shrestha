'use client';

import { useState, useEffect } from 'react';
import { categoryAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Edit, Trash2, Loader2, Plus, Save, X } from 'lucide-react';
import { toast } from 'sonner';

export default function CategoryManager({ onUpdate }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [deleteDialog, setDeleteDialog] = useState({ open: false, category: null });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryAPI.getCategories({ activeOnly: false });
      if (response.success) {
        setCategories(response.data.categories || []);
      }
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;

    try {
      setSubmitting(true);
      const response = await categoryAPI.createCategory(newName);
      if (response.success) {
        toast.success('Category created');
        setNewName('');
        setCreating(false);
        fetchCategories();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (category) => {
    setEditingId(category.id);
    setEditName(category.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;

    try {
      const response = await categoryAPI.updateCategory(id, { name: editName });
      if (response.success) {
        toast.success('Category updated');
        setEditingId(null);
        fetchCategories();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update category');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.category) return;
    try {
      const response = await categoryAPI.deleteCategory(deleteDialog.category.id);
      if (response.success) {
        toast.success('Category deleted');
        fetchCategories();
        if (onUpdate) onUpdate();
        setDeleteDialog({ open: false, category: null });
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete category');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-muted/30 p-2 rounded-lg">
        <h3 className="font-medium text-sm">Manage Categories</h3>
        {!creating && (
          <Button size="sm" variant="secondary" onClick={() => setCreating(true)}>
            <Plus className="h-3 w-3 mr-1" /> New
          </Button>
        )}
      </div>

      {creating && (
        <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50 animate-in fade-in slide-in-from-top-2">
          <Input 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New Category Name"
            className="h-8 text-sm"
            autoFocus
          />
          <Button size="sm" onClick={handleCreate} disabled={submitting}>
            {submitting ? <Loader2 className="h-3 w-3 animate-spin"/> : <Save className="h-3 w-3" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setCreating(false); setNewName(''); }}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="border rounded-md max-h-[300px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="py-2">Name</TableHead>
              <TableHead className="py-2 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="py-2">
                  {editingId === category.id ? (
                    <Input 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-7 text-sm"
                    />
                  ) : (
                    <span className="text-sm font-medium">{category.name}</span>
                  )}
                </TableCell>
                <TableCell className="py-2 text-right">
                  <div className="flex justify-end gap-1">
                    {editingId === category.id ? (
                      <>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => handleUpdate(category.id)}>
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-500" onClick={cancelEdit}>
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7" 
                          onClick={() => startEdit(category)}
                          disabled={category.isDefault}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 text-destructive" 
                          onClick={() => setDeleteDialog({ open: true, category })}
                          disabled={category.isDefault || (category._count?.courses > 0)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground py-4">
                  No categories found. Create one!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, category: deleteDialog.category })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteDialog.category?.name}.
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
