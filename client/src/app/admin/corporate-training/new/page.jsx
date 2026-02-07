'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { corporateTrainingAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { Loader2, Plus, Trash2, GripVertical } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import MediaPicker from '@/components/admin/MediaPicker';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin" /></div>,
});

export default function NewCorporateTrainingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    image: '',
    duration: '',
    mode: '',
    price: '',
    features: [''], // Array of strings
    curriculum: [{ title: '', content: '' }], // Array of objects
    isActive: true,
    sortOrder: 0,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.slug || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await corporateTrainingAPI.create({
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null,
      });
      toast.success('Training program created successfully');
      router.push('/admin/corporate-training');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create training');
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

  // Features Helper
  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };
  const updateFeature = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };
  const removeFeature = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures });
  };

  // Curriculum Helper
  const addCurriculum = () => {
    setFormData({ ...formData, curriculum: [...formData.curriculum, { title: '', content: '' }] });
  };
  const updateCurriculum = (index, field, value) => {
    const newCurriculum = [...formData.curriculum];
    newCurriculum[index] = { ...newCurriculum[index], [field]: value };
    setFormData({ ...formData, curriculum: newCurriculum });
  };
  const removeCurriculum = (index) => {
    const newCurriculum = formData.curriculum.filter((_, i) => i !== index);
    setFormData({ ...formData, curriculum: newCurriculum });
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">New Training Program</h1>
        <p className="text-muted-foreground">Create a new corporate training offering</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Details */}
        <Card>
          <CardHeader>
            <CardTitle>Program Details</CardTitle>
            <CardDescription>Basic information about the training</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="title">Program Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Advanced React for Enterprise"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="slug">Slug *</Label>
                <div className="flex gap-2">
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="advanced-react-enterprise"
                    required
                  />
                  <Button type="button" variant="outline" onClick={generateSlug}>
                    Generate
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g. 4 Weeks / 2 Days"
                />
              </div>
              <div>
                <Label htmlFor="mode">Mode</Label>
                <Input
                  id="mode"
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                  placeholder="e.g. Online / On-site / Hybrid"
                />
              </div>
              <div>
                <Label htmlFor="price">Price (Optional)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="e.g. 49999"
                />
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
              
              <div className="flex items-center space-x-2 pt-8">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Active / Published</Label>
              </div>
            </div>

            <div>
              <Label>Cover Image</Label>
              <div className="mt-2">
                <MediaPicker
                  onSelect={(url) => setFormData({ ...formData, image: url })}
                  value={formData.image}
                />
              </div>
            </div>

            <div>
              <Label>Description *</Label>
              <div className="mt-2">
                <RichTextEditor
                  value={formData.description}
                  onChange={(content) => setFormData({ ...formData, description: content })}
                  placeholder="Detailed description of the program..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Key Features</CardTitle>
            <CardDescription>Highlights displayed as bullet points</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.features.map((feature, index) => (
              <div key={index} className="flex gap-2">
                <GripVertical className="mt-2.5 h-5 w-5 text-muted-foreground shrink-0" />
                <Input
                  value={feature}
                  onChange={(e) => updateFeature(index, e.target.value)}
                  placeholder="e.g. Hands-on labs included"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFeature(index)}
                  className="text-destructive hover:text-destructive/90"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addFeature}
              className="mt-2"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Feature
            </Button>
          </CardContent>
        </Card>

        {/* Curriculum */}
        <Card>
          <CardHeader>
            <CardTitle>Curriculum / Syllabus</CardTitle>
            <CardDescription>Modules covered in this training</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.curriculum.map((item, index) => (
              <div key={index} className="flex gap-4 p-4 border rounded-lg bg-card/50">
                <GripVertical className="mt-2 h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 space-y-3">
                  <Input
                    value={item.title}
                    onChange={(e) => updateCurriculum(index, 'title', e.target.value)}
                    placeholder="Module Title (e.g. Advanced Patterns)"
                  />
                  <Input
                    value={item.content}
                    onChange={(e) => updateCurriculum(index, 'content', e.target.value)}
                    placeholder="Description or Topics list"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCurriculum(index)}
                  className="text-destructive hover:text-destructive/90 mt-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCurriculum}
              className="mt-2"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Module
            </Button>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4 sticky bottom-6 bg-background/80 backdrop-blur p-4 rounded-lg border shadow-lg z-10">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} size="lg">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Program'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
