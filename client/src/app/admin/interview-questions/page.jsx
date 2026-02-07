'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { interviewQuestionAPI, interviewCategoryAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Link from 'next/link';
import { FiEdit, FiTrash2, FiPlus, FiExternalLink, FiCheckCircle, FiXCircle, FiLayers } from 'react-icons/fi';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminInterviewQuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({
    categoryId: 'all',
    difficulty: 'all',
    isPublished: 'all',
    search: '',
  });
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [pagination.page, filters]);

  const fetchCategories = async () => {
    try {
      const res = await interviewCategoryAPI.getAllAdmin();
      if (res.success) {
        setCategories(res.data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories');
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      
      // Add filters only if they're not 'all'
      if (filters.categoryId && filters.categoryId !== 'all') {
        params.categoryId = filters.categoryId;
      }
      if (filters.difficulty && filters.difficulty !== 'all') {
        params.difficulty = filters.difficulty;
      }
      if (filters.isPublished && filters.isPublished !== 'all') {
        params.isPublished = filters.isPublished;
      }
      if (filters.search) {
        params.search = filters.search;
      }

      const res = await interviewQuestionAPI.getAllAdmin(params);
      if (res.success) {
        setQuestions(res.data.questions || []);
        setPagination(prev => ({ ...prev, ...res.data.pagination }));
      }
    } catch (error) {
      toast.error('Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await interviewQuestionAPI.delete(deleteId);
      toast.success('Question deleted');
      fetchQuestions();
      setDeleteId(null);
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const handleTogglePublish = async (id) => {
    try {
      await interviewQuestionAPI.togglePublish(id);
      toast.success('Question status updated');
      fetchQuestions();
    } catch (error) {
      toast.error('Toggle failed');
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getDifficultyBadge = (difficulty) => {
    const colors = {
      Easy: 'bg-green-600',
      Medium: 'bg-yellow-600',
      Hard: 'bg-red-600',
    };
    return colors[difficulty] || 'bg-gray-600';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Interview Questions</h1>
          <p className="text-muted-foreground">Manage all interview questions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/interview-questions/bulk')}>
            <FiLayers className="mr-2" /> Bulk Add
          </Button>
          <Button onClick={() => router.push('/admin/interview-questions/new')}>
            <FiPlus className="mr-2" /> New Question
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Input
              placeholder="Search questions..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <Select value={filters.categoryId} onValueChange={(val) => setFilters({ ...filters, categoryId: val === 'all' ? '' : val })}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.difficulty || 'all'} onValueChange={(val) => setFilters({ ...filters, difficulty: val === 'all' ? '' : val })}>
            <SelectTrigger>
              <SelectValue placeholder="All Difficulties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.isPublished || 'all'} onValueChange={(val) => setFilters({ ...filters, isPublished: val === 'all' ? '' : val })}>
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Published</SelectItem>
              <SelectItem value="false">Unpublished</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  Loading questions...
                </TableCell>
              </TableRow>
            ) : questions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  No questions found
                </TableCell>
              </TableRow>
            ) : (
              questions.map((question) => (
                <TableRow key={question.id}>
                  <TableCell>
                    <div className="font-medium">{question.title}</div>
                    <code className="text-xs text-muted-foreground">{question.slug}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{question.category?.name}</Badge>
                  </TableCell>
                  <TableCell>
                    {question.difficulty && (
                      <Badge className={getDifficultyBadge(question.difficulty)}>
                        {question.difficulty}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <button onClick={() => handleTogglePublish(question.id)}>
                      {question.isPublished ? (
                        <Badge className="bg-green-600 hover:bg-green-700">
                          <FiCheckCircle className="mr-1" /> Published
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <FiXCircle className="mr-1" /> Draft
                        </Badge>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/interview-questions/${question.id}/edit`}>
                        <FiEdit />
                      </Link>
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleteId(question.id)}>
                      <FiTrash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {questions.length} of {pagination.total} questions
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the interview question.
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
