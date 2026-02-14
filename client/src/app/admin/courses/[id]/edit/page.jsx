'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { courseAPI, categoryAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import RichTextEditor from '@/components/RichTextEditor';
import { Loader2, ArrowLeft, X, Settings, ImageIcon } from 'lucide-react';
import MediaPicker from '@/components/admin/MediaPicker';
import CategoryManager from '@/components/admin/CategoryManager';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { getPublicUrl } from '@/lib/imageUtils';

export default function EditCoursePage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    language: 'ENGLISH',
    price: '0',
    salePrice: '',
    isFree: false,
    isPublished: false,
    deliveryMode: 'BOTH',
    curriculumText: '',
  });
  const [benefits, setBenefits] = useState([]);
  const [benefitInput, setBenefitInput] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  const [removeCoverImage, setRemoveCoverImage] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);

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

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/auth');
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    if (id && isAdmin) {
      fetchCourse();
    }
  }, [id, isAdmin]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await courseAPI.getCourseById(id);
      if (response.success) {
        const courseData = response.data.course;
        setCourse(courseData);
        setFormData({
          title: courseData.title || '',
          slug: courseData.slug || '',
          description: courseData.description || '',
          language: courseData.language || 'ENGLISH',
          price: courseData.price?.toString() || '0',
          salePrice: courseData.salePrice?.toString() || '',
          isFree: courseData.isFree || false,
          isPublished: courseData.isPublished || false,
          deliveryMode: courseData.deliveryMode || 'BOTH',
          curriculumText: courseData.curriculumText || '',
        });
        setBenefits(Array.isArray(courseData.benefits) ? courseData.benefits : []);
        if (courseData.coverImageUrl || courseData.coverImage) {
          setCoverImagePreview(getPublicUrl(courseData.coverImageUrl || courseData.coverImage) || courseData.coverImageUrl || courseData.coverImage);
        }
        // Set selected categories
        if (courseData.categories && courseData.categories.length > 0) {
          setSelectedCategories(courseData.categories.map(cat => cat.id));
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch course');
      router.push('/admin/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
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

    if (!formData.isFree && (!formData.price || parseFloat(formData.price) < 1)) {
      toast.error('Paid courses must have a price of at least 1');
      return;
    }

    try {
      setSaving(true);
      const submitData = new FormData();

      submitData.append('title', formData.title);
      submitData.append('slug', formData.slug);
      submitData.append('description', formData.description);
      submitData.append('language', formData.language);
      submitData.append('price', formData.price);
      if (formData.salePrice) {
        submitData.append('salePrice', formData.salePrice);
      } else {
        submitData.append('salePrice', '');
      }
      submitData.append('isFree', formData.isFree);
      submitData.append('isPublished', formData.isPublished);
      submitData.append('deliveryMode', formData.deliveryMode);
      submitData.append('curriculumText', formData.curriculumText);
      submitData.append('benefits', JSON.stringify(benefits));

      if (selectedCategories.length === 0) {
        toast.error('Please select at least one category');
        setSaving(false);
        return;
      }
      submitData.append('categoryIds', JSON.stringify(selectedCategories));

      if (coverImage) {
        // File upload
        submitData.append('coverImage', coverImage);
      } else if (coverImagePreview && !coverImage && !removeCoverImage) {
        // URL from MediaPicker
        submitData.append('coverImageUrl', coverImagePreview);
      }
      if (removeCoverImage) {
        submitData.append('removeCoverImage', 'true');
      }

      const response = await courseAPI.updateCourse(id, submitData);
      if (response.success) {
        toast.success('Course updated successfully!');
        fetchCourse();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!user || !isAdmin || !course) {
    return null;
  }

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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Edit Course</CardTitle>
            <Link href={`/admin/courses/${id}/sessions`}>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Manage Sessions & Chapters
              </Button>
            </Link>
          </div>
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
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                />
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
                <Label>Delivery mode</Label>
                <Select
                  value={formData.deliveryMode}
                  onValueChange={(value) => setFormData({ ...formData, deliveryMode: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ONLINE">Online classes (curriculum text, book demo)</SelectItem>
                    <SelectItem value="SELF_PACED">Self-paced (video + lecture names, purchase)</SelectItem>
                    <SelectItem value="BOTH">Both (book demo + self-paced purchase)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Benefits (one per line or add below)</Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    placeholder="Add a benefit..."
                    value={benefitInput}
                    onChange={(e) => setBenefitInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (benefitInput.trim()) {
                          setBenefits([...benefits, benefitInput.trim()]);
                          setBenefitInput('');
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (benefitInput.trim()) {
                        setBenefits([...benefits, benefitInput.trim()]);
                        setBenefitInput('');
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
                {benefits.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {benefits.map((b, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <span>{b}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive"
                          onClick={() => setBenefits(benefits.filter((_, i) => i !== idx))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <Label>Curriculum (text for online) – optional</Label>
                <RichTextEditor
                  value={formData.curriculumText}
                  onChange={(value) => setFormData({ ...formData, curriculumText: value })}
                  placeholder="Outline or curriculum text shown for online classes..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="categories">Categories *</Label>
                  <Dialog open={categoryManagerOpen} onOpenChange={setCategoryManagerOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" type="button">
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Categories
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Manage Course Categories</DialogTitle>
                      </DialogHeader>
                      <CategoryManager onUpdate={fetchCategories} />
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="space-y-2 border rounded-md p-3">
                  {categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No categories found. Click Manage Categories to create one.
                    </p>
                  ) : (
                    categories.map((category) => (
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
                        <label htmlFor={`category-${category.id}`} className="text-sm font-medium cursor-pointer select-none">
                          {category.name}
                        </label>
                      </div>
                    ))
                  )}
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
                      src={getPublicUrl(coverImagePreview) || coverImagePreview}
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
                    <span className="text-sm text-muted-foreground">Click to select cover image</span>
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
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
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

