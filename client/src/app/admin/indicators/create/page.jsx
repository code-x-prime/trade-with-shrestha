'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { indicatorAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import RichTextEditor from '@/components/RichTextEditor';
import { Upload, X, Loader2, ArrowLeft, ImageIcon, Video } from 'lucide-react';
import MediaPicker from '@/components/admin/MediaPicker';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';

export default function CreateIndicatorPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    videoUrl: '',
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // MediaPicker dialogs
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showVideoPicker, setShowVideoPicker] = useState(false);

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
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.description) {
      setError('Name and description are required');
      return;
    }


    try {
      setLoading(true);
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      if (formData.videoUrl) formDataToSend.append('videoUrl', formData.videoUrl);
      if (image) {
        // File upload
        formDataToSend.append('image', image);
      } else if (imagePreview && !image) {
        // URL from MediaPicker
        formDataToSend.append('imageUrl', imagePreview);
      }

      const response = await indicatorAPI.createIndicator(formDataToSend);
      if (response.success) {
        toast.success('Indicator created successfully');
        router.push('/admin/indicators');
      }
    } catch (error) {
      setError(error.message || 'Failed to create indicator');
      toast.error(error.message || 'Failed to create indicator');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/admin/indicators">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Indicators
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Indicator</CardTitle>
          <CardDescription>Add a new trading indicator with subscription plans</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Indicator Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., RSI Trading Indicator"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Describe the indicator features and benefits..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL</Label>
              <div className="flex gap-2">
                <Input
                  id="videoUrl"
                  name="videoUrl"
                  type="url"
                  value={formData.videoUrl}
                  onChange={handleInputChange}
                  placeholder="https://vz-xxxx.b-cdn.net/xxxx/playlist.m3u8"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowVideoPicker(true)}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Browse
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Enter a Bunny.net video URL or click Browse to select from library</p>
            </div>

            <div className="space-y-2">
              <Label>Indicator Image</Label>
              {imagePreview ? (
                <div className="relative w-full max-w-md">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={400}
                    height={300}
                    className="rounded-lg object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
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
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-brand-500 transition-colors">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No image selected</p>
                  <div className="flex items-center justify-center gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowImagePicker(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Select from Media Library
                    </Button>
                    <span className="text-muted-foreground">or</span>
                    <Label htmlFor="image" className="cursor-pointer">
                      <span className="text-brand-600 hover:text-brand-700 underline">upload file</span>
                    </Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Subscription plans are managed globally.
                Go to <a href="/admin/subscription-plans" className="underline font-semibold">Subscription Plans</a> to configure pricing and features.
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Indicator'
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/indicators">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* MediaPicker Dialogs */}
      <MediaPicker
        open={showImagePicker}
        onOpenChange={setShowImagePicker}
        onSelect={(url) => {
          setImagePreview(url);
          setImage(null);
        }}
        type="image"
        title="Select Indicator Image"
        description="Choose an image from your media library or upload a new one"
      />
      <MediaPicker
        open={showVideoPicker}
        onOpenChange={setShowVideoPicker}
        onSelect={(url) => setFormData({ ...formData, videoUrl: url })}
        type="video"
        title="Select Video"
        description="Choose a video from Bunny.net or enter a URL"
      />
    </div>
  );
}

