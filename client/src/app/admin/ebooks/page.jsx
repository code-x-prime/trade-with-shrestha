'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ebookAPI } from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Badge component inline since it might not exist
const Badge = ({ children, className = '' }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
    {children}
  </span>
);
import { Eye, EyeOff, Edit, Trash2, Plus, Loader2, MoreVertical, CheckCircle2, XCircle, Tag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function AdminEbooksPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [ebooks, setEbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedEbook, setSelectedEbook] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [savingCategories, setSavingCategories] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, ebookId: null, ebookTitle: null });

  const CATEGORIES = [
    { value: 'FEATURED', label: 'Featured Books' },
    { value: 'BESTSELLER', label: 'Bestsellers' },
    { value: 'NEW', label: 'New Releases' },
    { value: 'TRENDING', label: 'Trending' },
    { value: 'POPULAR', label: 'Popular' },
  ];

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/auth');
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchEbooks();
    }
  }, [user, isAdmin]);

  const fetchEbooks = async () => {
    try {
      setLoading(true);
      const response = await ebookAPI.getEbooks({ limit: 100 });
      if (response.success) {
        setEbooks(response.data.ebooks);
      }
    } catch (error) {
      console.error('Error fetching e-books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageCategories = (ebook) => {
    setSelectedEbook(ebook);
    setSelectedCategories(ebook.categories || []);
    setCategoryDialogOpen(true);
  };

  const handleSaveCategories = async () => {
    if (!selectedEbook) return;

    try {
      setSavingCategories(true);
      const response = await ebookAPI.updateEbookCategories(selectedEbook.id, selectedCategories);
      if (response.success) {
        toast.success('Categories updated successfully');
        setCategoryDialogOpen(false);
        fetchEbooks(); // Refresh list
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update categories');
    } finally {
      setSavingCategories(false);
    }
  };

  const toggleCategory = (category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        // Check limit (max 10 per category)
        const countInCategory = ebooks.filter(e => e.categories?.includes(category)).length;
        if (countInCategory >= 10) {
          toast.error(`Maximum 10 books allowed in ${CATEGORIES.find(c => c.value === category)?.label} category`);
          return prev;
        }
        return [...prev, category];
      }
    });
  };

  const handleTogglePublish = async (id, currentStatus) => {
    try {
      setToggling(id);
      const response = await ebookAPI.togglePublish(id, !currentStatus);
      if (response.success) {
        setEbooks(ebooks.map(ebook =>
          ebook.id === id ? response.data.ebook : ebook
        ));
      }
    } catch (error) {
      alert(error.message || 'Failed to update publish status');
    } finally {
      setToggling(null);
    }
  };

  const handleDeleteClick = (ebook) => {
    setDeleteDialog({ open: true, ebookId: ebook.id, ebookTitle: ebook.title });
  };

  const handleDelete = async () => {
    if (!deleteDialog.ebookId) return;

    try {
      setDeleting(deleteDialog.ebookId);
      const response = await ebookAPI.deleteEbook(deleteDialog.ebookId);
      if (response.success) {
        toast.success('E-book deleted successfully');
        setEbooks(ebooks.filter(ebook => ebook.id !== deleteDialog.ebookId));
        setDeleteDialog({ open: false, ebookId: null, ebookTitle: null });
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete e-book');
    } finally {
      setDeleting(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-brand-600 mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading e-books...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">E-Books Management</h1>
          <p className="text-muted-foreground mt-1">Manage all e-books</p>
        </div>
        <Button asChild className="bg-brand-600 hover:bg-brand-700">
          <Link href="/admin/ebooks/create">
            <Plus className="mr-2 h-4 w-4" />
            Create E-Book
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All E-Books</CardTitle>
          <CardDescription>Total: {ebooks.length} e-books</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cover</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Pages</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Purchases</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ebooks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No e-books found. Create your first e-book!
                    </TableCell>
                  </TableRow>
                ) : (
                  ebooks.map((ebook) => (
                    <TableRow key={ebook.id}>
                      <TableCell>
                        {ebook.image1Url ? (
                          <div className="h-16 w-16 rounded-md overflow-hidden border flex-shrink-0">
                            <Image
                              src={ebook.image1Url}
                              alt={ebook.title}
                              className="h-full w-full object-cover"
                              width={64}
                              height={64}
                            />
                          </div>
                        ) : (
                          <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">No Image</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{ebook.title}</p>
                          {ebook.shortDescription && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {ebook.shortDescription}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          {ebook.isFree ? (
                            <Badge className="bg-green-100 text-green-700 w-fit">Free</Badge>
                          ) : (
                            <>
                              {ebook.salePrice ? (
                                <>
                                  <span className="text-sm line-through text-muted-foreground">
                                    ₹{ebook.price}
                                  </span>
                                  <span className="font-semibold text-brand-600">
                                    ₹{ebook.salePrice}
                                  </span>
                                </>
                              ) : (
                                <span className="font-semibold">₹{ebook.price}</span>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{ebook.pages}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 hover:bg-transparent"
                              disabled={toggling === ebook.id}
                            >
                              {toggling === ebook.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Badge
                                  className={`cursor-pointer ${ebook.isPublished
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                  {ebook.isPublished ? (
                                    <span className="flex items-center gap-1">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Published
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <XCircle className="h-3 w-3" />
                                      Draft
                                    </span>
                                  )}
                                </Badge>
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleTogglePublish(ebook.id, ebook.isPublished)}
                              disabled={toggling === ebook.id}
                              className={ebook.isPublished ? 'text-red-600' : 'text-green-600'}
                            >
                              {ebook.isPublished ? (
                                <>
                                  <EyeOff className="mr-2 h-4 w-4" />
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Publish
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell>{ebook.purchaseCount}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleManageCategories(ebook)}
                            title="Manage Categories"
                          >
                            <Tag className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/ebooks/${ebook.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(ebook)}
                            disabled={deleting === ebook.id}
                            className="text-red-600 hover:text-red-700"
                          >
                            {deleting === ebook.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Category Management Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
            <DialogDescription>
              Select categories for &quot;{selectedEbook?.title}&quot;. Maximum 10 books per category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {CATEGORIES.map((category) => {
              const countInCategory = ebooks.filter(e =>
                e.id !== selectedEbook?.id && e.categories?.includes(category.value)
              ).length;
              const isChecked = selectedCategories.includes(category.value);
              const canAdd = countInCategory < 10 || isChecked;

              return (
                <div key={category.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={category.value}
                    checked={isChecked}
                    onCheckedChange={() => toggleCategory(category.value)}
                    disabled={!canAdd && !isChecked}
                  />
                  <Label
                    htmlFor={category.value}
                    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${!canAdd && !isChecked ? 'opacity-50' : ''
                      }`}
                  >
                    {category.label} ({countInCategory + (isChecked ? 1 : 0)}/10)
                  </Label>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategories} disabled={savingCategories}>
              {savingCategories ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Categories'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, ebookId: deleteDialog.ebookId, ebookTitle: deleteDialog.ebookTitle })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the e-book &quot;{deleteDialog.ebookTitle}&quot; and all its associated data.
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

