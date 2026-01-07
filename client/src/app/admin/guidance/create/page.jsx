'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { guidanceAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RichTextEditor from '@/components/RichTextEditor';
import { X, Loader2, ArrowLeft, Plus, Trash2, Upload, ImageIcon } from 'lucide-react';
import MediaPicker from '@/components/admin/MediaPicker';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';

export default function CreateGuidancePage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    expertName: '',
    expertBio: '',
    language: '',
    price: '',
    durationMinutes: '60',
    googleMeetLink: '',
    status: 'ACTIVE',
  });
  const [expertImage, setExpertImage] = useState(null);
  const [expertImagePreview, setExpertImagePreview] = useState(null);
  const [expertise, setExpertise] = useState(['']);

  // MediaPicker state
  const [showImagePicker, setShowImagePicker] = useState(false);

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
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };



  const removeImage = () => {
    setExpertImage(null);
    setExpertImagePreview(null);
  };

  const addExpertise = () => {
    setExpertise([...expertise, '']);
  };

  const removeExpertise = (index) => {
    setExpertise(expertise.filter((_, i) => i !== index));
  };

  const updateExpertise = (index, value) => {
    const updated = [...expertise];
    updated[index] = value;
    setExpertise(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.title || !formData.expertName || !formData.price || !formData.durationMinutes || !formData.googleMeetLink) {
        toast.error('Please fill all required fields');
        setLoading(false);
        return;
      }

      const submitFormData = new FormData();

      Object.keys(formData).forEach((key) => {
        if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
          submitFormData.append(key, formData[key]);
        }
      });

      if (expertImage) {
        // File upload
        submitFormData.append('expertImage', expertImage);
      } else if (expertImagePreview && !expertImage) {
        // URL from MediaPicker
        submitFormData.append('expertImageUrl', expertImagePreview);
      }

      // Add expertise as JSON
      const validExpertise = expertise.filter(e => e.trim() !== '');
      submitFormData.append('expertise', JSON.stringify(validExpertise));

      const response = await guidanceAPI.createGuidance(submitFormData);

      if (response.success) {
        toast.success('Guidance created successfully!');
        router.push('/admin/guidance');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create guidance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/guidance">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create 1:1 Guidance</h1>
          <p className="text-muted-foreground mt-1">Add a new guidance session</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Guidance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="1:1 Guidance"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                />
              </div>

              <div>
                <Label htmlFor="expertName">Expert Name *</Label>
                <Input
                  id="expertName"
                  name="expertName"
                  value={formData.expertName}
                  onChange={handleInputChange}
                  required
                  placeholder="Expert name"
                />
              </div>

              <div>
                <Label htmlFor="language">Language</Label>
                <Input
                  id="language"
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  placeholder="Hindi, English, etc."
                />
              </div>

              <div>
                <Label htmlFor="price">Price (₹) *</Label>
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
                <Label htmlFor="durationMinutes">Duration (Minutes) *</Label>
                <Select
                  value={formData.durationMinutes}
                  onValueChange={(value) => setFormData({ ...formData, durationMinutes: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                    <SelectItem value="120">120 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="googleMeetLink">Google Meet Link *</Label>
                <Input
                  id="googleMeetLink"
                  name="googleMeetLink"
                  value={formData.googleMeetLink}
                  onChange={handleInputChange}
                  required
                  placeholder="https://meet.google.com/..."
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Create your meeting at <a href="https://meet.google.com" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">https://meet.google.com</a> and paste the link here.
                </p>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="expertBio">Expert Bio</Label>
                <RichTextEditor
                  value={formData.expertBio}
                  onChange={(value) => setFormData({ ...formData, expertBio: value })}
                />
              </div>

              <div className="md:col-span-2">
                <Label>Expert Image</Label>
                {expertImagePreview ? (
                  <div className="relative mt-2">
                    <div className="w-48 h-48 rounded-lg overflow-hidden border">
                      <Image
                        src={expertImagePreview}
                        alt="Expert preview"
                        width={192}
                        height={192}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="mt-2 flex gap-2">
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
                    className="mt-2 w-48 h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted hover:border-brand-500 transition-colors"
                    onClick={() => setShowImagePicker(true)}
                  >
                    <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Click to select</span>
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <Label>Expertise Tags</Label>
                <div className="space-y-2 mt-2">
                  {expertise.map((tag, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={tag}
                        onChange={(e) => updateExpertise(index, e.target.value)}
                        placeholder="e.g., Options Trading, Risk Management"
                      />
                      {expertise.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => removeExpertise(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addExpertise}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expertise
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-brand-600 hover:bg-brand-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Guidance'
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/guidance">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* MediaPicker Dialog */}
      <MediaPicker
        open={showImagePicker}
        onOpenChange={setShowImagePicker}
        onSelect={(url) => {
          setExpertImagePreview(url);
          setExpertImage(null);
        }}
        type="image"
        title="Select Expert Image"
        description="Choose an image from your media library"
      />
    </div>
  );
}

