'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { interviewQuestionAPI,  interviewCategoryAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin" /></div>,
});

export default function NewInterviewQuestionPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    answer: '',
    categoryId: '',
    difficulty: '',
    tags: '',
    isPublished: true,
    sortOrder: 0,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await interviewCategoryAPI.getAll();
      if (res.success) {
        setCategories(res.data.categories || []);
      }
    } catch (error) {
      toast.error('Failed to fetch categories');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.answer || !formData.categoryId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await interviewQuestionAPI.create(formData);
      toast.success('Question created successfully');
      router.push('/admin/interview-questions');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create question');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = () => {
    const slug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setFormData({ ...formData, slug });
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">New Interview Question</h1>
        <p className="text-muted-foreground">Create a new interview question</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Question Details</CardTitle>
            <CardDescription>Fill in the question information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title">Question Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="What is the difference between..."
                required
              />
            </div>

            {/* Slug */}
            <div>
              <Label htmlFor="slug">Slug</Label>
              <div className="flex gap-2">
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="what-is-the-difference-between"
                />
                <Button type="button" variant="outline" onClick={generateSlug}>
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Leave empty to auto-generate from title</p>
            </div>

            {/* Category & Difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.categoryId} onValueChange={(val) => setFormData({ ...formData, categoryId: val })}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={formData.difficulty} onValueChange={(val) => setFormData({ ...formData, difficulty: val })}>
                  <SelectTrigger id="difficulty">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="async, await, promises"
              />
            </div>

            {/* Answer */}
            <div>
              <Label htmlFor="answer">Answer *</Label>
              <div className="mt-2">
                <RichTextEditor
                  value={formData.answer}
                  onChange={(content) => setFormData({ ...formData, answer: content })}
                  placeholder="Write the detailed answer here..."
                />
              </div>
            </div>

            {/* Publish & Sort Order */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublished"
                  checked={formData.isPublished}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                />
                <Label htmlFor="isPublished">Publish immediately</Label>
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

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Question'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
