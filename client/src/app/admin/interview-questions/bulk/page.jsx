'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { interviewQuestionAPI, interviewCategoryAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin" /></div>,
});

export default function BulkAddInterviewQuestionsPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([
    { title: '', answer: '', categoryId: '', difficulty: '', tags: '' },
  ]);

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

  const addQuestion = () => {
    setQuestions([...questions, { title: '', answer: '', categoryId: '', difficulty: '', tags: '' }]);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    const validQuestions = questions.filter(q => q.title && q.answer && q.categoryId);
    if (validQuestions.length === 0) {
      toast.error('Please add at least one complete question');
      return;
    }

    if (validQuestions.length !== questions.length) {
      const invalid = questions.length - validQuestions.length;
      if (!confirm(`${invalid} question(s) are incomplete and will be skipped. Continue?`)) {
        return;
      }
    }

    try {
      setLoading(true);
      const res = await interviewQuestionAPI.createBulk(validQuestions);
      if (res.success) {
        toast.success(`${res.data.created} questions created successfully`);
        if (res.data.failed > 0) {
          toast.error(`${res.data.failed} questions failed`);
        }
        router.push('/admin/interview-questions');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Bulk creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Bulk Add Interview Questions</h1>
        <p className="text-muted-foreground">Add multiple questions at once</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {questions.map((question, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Question {index + 1}</CardTitle>
                  {questions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(index)}
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title */}
                <div>
                  <Label>Question Title *</Label>
                  <Input
                    value={question.title}
                    onChange={(e) => updateQuestion(index, 'title', e.target.value)}
                    placeholder="What is the difference between..."
                  />
                </div>

                {/* Category & Difficulty */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Category *</Label>
                    <Select 
                      value={question.categoryId} 
                      onValueChange={(val) => updateQuestion(index, 'categoryId', val)}
                    >
                      <SelectTrigger>
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
                    <Label>Difficulty</Label>
                    <Select 
                      value={question.difficulty} 
                      onValueChange={(val) => updateQuestion(index, 'difficulty', val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <Label>Tags (comma separated)</Label>
                  <Input
                    value={question.tags}
                    onChange={(e) => updateQuestion(index, 'tags', e.target.value)}
                    placeholder="async, await, promises"
                  />
                </div>

                {/* Answer */}
                <div>
                  <Label>Answer *</Label>
                  <div className="mt-2">
                    <RichTextEditor
                      value={question.answer}
                      onChange={(content) => updateQuestion(index, 'answer', content)}
                      placeholder="Write the detailed answer here..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add More Button */}
          <Button type="button" variant="outline" onClick={addQuestion} className="w-full">
            <FiPlus className="mr-2" /> Add Another Question
          </Button>

          {/* Actions */}
          <div className="flex justify-end gap-2">
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
                `Create ${questions.length} Question${questions.length > 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
