'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { courseAPI, categoryAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RichTextEditor from '@/components/RichTextEditor';
import { Loader2, ArrowLeft, X, BookOpen, Video, FileText, ChevronRight, ImageIcon, Upload } from 'lucide-react';
import MediaPicker from '@/components/admin/MediaPicker';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';

export default function CreateCoursePage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    language: 'ENGLISH',
    price: '0',
    salePrice: '',
    isFree: false,
    isPublished: false,
  });
  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  const [removeCoverImage, setRemoveCoverImage] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // MediaPicker state
  const [showImagePicker, setShowImagePicker] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchCategories();
    }
  }, [isAdmin]);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getCategories({ activeOnly: false });
      if (response.success) {
        setCategories(response.data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load categories');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    router.push('/auth');
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });

    // Auto-generate slug from title (only if slug hasn't been manually edited)
    if (name === 'title' && !slugManuallyEdited) {
      const slug = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }

    // Track if slug is manually edited
    if (name === 'slug') {
      setSlugManuallyEdited(true);
    }
  };


  const removeImage = () => {
    setCoverImage(null);
    setCoverImagePreview(null);
    setRemoveCoverImage(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      toast.error('Title and description are required');
      return;
    }

    try {
      setLoading(true);
      const submitData = new FormData();

      submitData.append('title', formData.title);
      if (formData.slug) submitData.append('slug', formData.slug);
      submitData.append('description', formData.description);
      submitData.append('language', formData.language);
      submitData.append('price', formData.price);
      if (formData.salePrice) submitData.append('salePrice', formData.salePrice);
      submitData.append('isFree', formData.isFree);
      submitData.append('isPublished', formData.isPublished);

      if (selectedCategories.length === 0) {
        toast.error('Please select at least one category');
        setLoading(false);
        return;
      }
      submitData.append('categoryIds', JSON.stringify(selectedCategories));

      if (coverImage) {
        // File upload
        submitData.append('coverImage', coverImage);
      } else if (coverImagePreview && !coverImage) {
        // URL from MediaPicker
        submitData.append('coverImageUrl', coverImagePreview);
      }
      if (removeCoverImage) {
        submitData.append('removeCoverImage', 'true');
      }

      const response = await courseAPI.createCourse(submitData);
      if (response.success) {
        toast.success('Course created successfully!');
        router.push(`/admin/courses/${response.data.course.id}/edit`);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/admin/courses">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </Link>
      </div>

      {/* Course Structure Schema */}
      <Card className="mb-6 bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Course Structure Schema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-1 p-4 bg-background rounded-lg border-2 border-brand-600">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-5 w-5 text-brand-600" />
                  <h3 className="font-semibold text-lg">1 Course</h3>
                </div>
                <p className="text-sm text-muted-foreground">Contains basic info: Title, Description, Cover Image, Price, Categories</p>
              </div>
              <ChevronRight className="h-6 w-6 text-muted-foreground mt-4" />
              <div className="flex-1 p-4 bg-background rounded-lg border-2 border-blue-600">
                <div className="flex items-center gap-2 mb-2">
                  <Video className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-lg">Multiple Sessions</h3>
                </div>
                <p className="text-sm text-muted-foreground">Each session has: Title, Description, Order, PDF Resources</p>
              </div>
              <ChevronRight className="h-6 w-6 text-muted-foreground mt-4" />
              <div className="flex-1 p-4 bg-background rounded-lg border-2 border-green-600">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-lg">Multiple Chapters</h3>
                </div>
                <p className="text-sm text-muted-foreground">Each chapter has: Title, Video URL (YouTube), Duration, Free Preview toggle</p>
              </div>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Note:</strong> After creating the course, you can add Sessions and Chapters from the course edit page.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create New Course</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Complete Trading Mastery Course"
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug (Auto-generated, editable)</Label>
                <Input
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="e.g., complete-trading-mastery-course"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  URL-friendly version of the title. Leave empty to auto-generate.
                </p>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                />
              </div>

              <div>
                <Label htmlFor="language">Language</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData({ ...formData, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENGLISH">English</SelectItem>
                    <SelectItem value="HINDI">Hindi</SelectItem>
                    <SelectItem value="MIXED">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="categories">Categories *</Label>
                <div className="mt-2 space-y-2">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`category-${category.id}`}
                        checked={selectedCategories.includes(category.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, category.id]);
                          } else {
                            setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={`category-${category.id}`} className="text-sm font-medium">
                        {category.name}
                      </label>
                    </div>
                  ))}
                </div>
                {selectedCategories.length === 0 && (
                  <p className="text-xs text-destructive mt-1">At least one category is required</p>
                )}
              </div>
            </div>

            {/* Cover Image */}
            <div>
              <Label>Cover Image</Label>
              <div className="mt-2">
                {coverImagePreview ? (
                  <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden border">
                    <Image
                      src={coverImagePreview}
                      alt="Cover preview"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowImagePicker(true)}
                      >
                        Change
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted hover:border-brand-500 transition-colors"
                    onClick={() => setShowImagePicker(true)}
                  >
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground block">Click to select cover image</span>
                    <span className="text-xs text-muted-foreground">Recommended: 16:9 aspect ratio</span>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isFree"
                    checked={formData.isFree}
                    onCheckedChange={(checked) => setFormData({ ...formData, isFree: checked })}
                  />
                  <Label htmlFor="isFree">Free Course</Label>
                </div>

                {!formData.isFree && (
                  <>
                    <div>
                      <Label htmlFor="price">Price (₹ INR) *</Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={handleInputChange}
                        required
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="salePrice">Sale Price (₹ INR) - Optional</Label>
                      <Input
                        id="salePrice"
                        name="salePrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.salePrice}
                        onChange={handleInputChange}
                        placeholder="Leave empty if no sale"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Publish Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="isPublished"
                checked={formData.isPublished}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
              />
              <Label htmlFor="isPublished">Publish Course</Label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Course'
                )}
              </Button>
              <Link href="/admin/courses">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* MediaPicker Dialog */}
      <MediaPicker
        open={showImagePicker}
        onOpenChange={setShowImagePicker}
        onSelect={(url) => {
          setCoverImagePreview(url);
          setCoverImage(null);
          setRemoveCoverImage(false);
        }}
        type="image"
        title="Select Cover Image"
        description="Choose an image from your media library"
      />
    </div>
  );
}

