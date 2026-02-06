'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { expertPracticeAPI } from '@/lib/api';
import { toast } from 'sonner';
import { MessageCircle, Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';

export default function AdminExpertPracticePage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '0',
    isFree: false,
    isActive: true,
    sortOrder: '0',
  });

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await expertPracticeAPI.getAllAdmin();
      if (res?.success && Array.isArray(res.data)) setList(res.data);
      else setList([]);
    } catch (e) {
      toast.error('Failed to fetch');
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: 'Practice with expert feedback', description: '', price: '0', isFree: false, isActive: true, sortOrder: '0' });
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title || '',
      description: item.description || '',
      price: String(item.price ?? 0),
      isFree: !!item.isFree,
      isActive: item.isActive !== false,
      sortOrder: String(item.sortOrder ?? 0),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        price: Number(form.price) || 0,
        isFree: form.isFree,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (editing) {
        const res = await expertPracticeAPI.update(editing.id, payload);
        if (res?.success) {
          setList((prev) => prev.map((x) => (x.id === editing.id ? { ...x, ...payload } : x)));
          toast.success('Updated');
          setDialogOpen(false);
        } else toast.error(res?.message || 'Failed');
      } else {
        const res = await expertPracticeAPI.create(payload);
        if (res?.success) {
          setList((prev) => [res.data, ...prev]);
          toast.success('Created');
          setDialogOpen(false);
        } else toast.error(res?.message || 'Failed');
      }
    } catch (e) {
      toast.error('Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try {
      await expertPracticeAPI.delete(id);
      setList((prev) => prev.filter((x) => x.id !== id));
      toast.success('Deleted');
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Practice with expert feedback
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchList} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">Loading...</p>
          ) : list.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No items. Add one to list for users.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{item.isFree ? 'Free' : `₹${Number(item.price).toLocaleString('en-IN')}`}</TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? 'default' : 'secondary'}>{item.isActive ? 'Yes' : 'No'}</Badge>
                    </TableCell>
                    <TableCell>{item.sortOrder}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Add'} Practice with expert feedback</DialogTitle>
            <DialogDescription>This will appear in the career / services section for users.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Practice with expert feedback"
                required
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short description..."
                rows={3}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Price (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  disabled={form.isFree}
                />
              </div>
              <div className="flex items-center gap-2 pt-8">
                <Switch checked={form.isFree} onCheckedChange={(c) => setForm((f) => ({ ...f, isFree: c }))} />
                <Label>Free</Label>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2 pt-8">
                <Switch checked={form.isActive} onCheckedChange={(c) => setForm((f) => ({ ...f, isActive: c }))} />
                <Label>Active</Label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
