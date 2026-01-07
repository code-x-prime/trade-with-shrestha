'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { ebookAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import RichTextEditor from '@/components/RichTextEditor';
import { Upload, X, Loader2, ArrowLeft, ImageIcon } from 'lucide-react';
import MediaPicker from '@/components/admin/MediaPicker';
import Link from 'next/link';
import Image from 'next/image';

// Simple Progress component
const Progress = ({ value, className = '' }) => (
  <div className={`w-full bg-muted rounded-full h-2 ${className}`}>
    <div
      className="bg-brand-600 h-2 rounded-full transition-all duration-300"
      style={{ width: `${value}%` }}
    />
  </div>
);

export default function EditEbookPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    description: '',
    price: '',
    salePrice: '',
    isFree: false,
    pages: '',
    curriculum: [],
  });
  const [images, setImages] = useState({
    image1: null,
    image2: null,
    image3: null,
  });
  const [imagePreviews, setImagePreviews] = useState({
    image1: null,
    image2: null,
    image3: null,
  });
  const [existingImages, setExistingImages] = useState({
    image1: null,
    image2: null,
    image3: null,
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [existingPdf, setExistingPdf] = useState(null);
  const [curriculumPoint, setCurriculumPoint] = useState('');
  const [removeFlags, setRemoveFlags] = useState({
    image1: false,
    image2: false,
    image3: false,
    pdf: false,
  });

  // MediaPicker state
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [activeImageKey, setActiveImageKey] = useState(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/auth');
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    if (user && isAdmin && id) {
      fetchEbook();
    }
  }, [user, isAdmin, id]);

  const fetchEbook = async () => {
    try {
      setLoading(true);
      const response = await ebookAPI.getEbookById(id);
      if (response.success) {
        const ebook = response.data.ebook;
        setFormData({
          title: ebook.title || '',
          shortDescription: ebook.shortDescription || '',
          description: ebook.description || '',
          price: ebook.price?.toString() || '',
          salePrice: ebook.salePrice?.toString() || '',
          isFree: ebook.isFree || false,
          pages: ebook.pages?.toString() || '',
          curriculum: ebook.curriculum || [],
        });
        setExistingImages({
          image1: ebook.image1Url,
          image2: ebook.image2Url,
          image3: ebook.image3Url,
        });
        setExistingPdf(ebook.pdfUrl);
      }
    } catch (error) {
      setError(error.message || 'Failed to load e-book');
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


  const removeImage = (imageKey) => {
    setImages({ ...images, [imageKey]: null });
    setImagePreviews({ ...imagePreviews, [imageKey]: null });
    // Only set remove flag if there's an existing image to remove
    if (existingImages[imageKey]) {
      setRemoveFlags({ ...removeFlags, [imageKey]: true });
    } else {
      setRemoveFlags({ ...removeFlags, [imageKey]: false });
    }
    // Clear existing image reference
    setExistingImages({ ...existingImages, [imageKey]: null });
  };

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        return;
      }
      setPdfFile(file);
      setPdfPreview(file.name);
      setRemoveFlags({ ...removeFlags, pdf: false });
    }
  };

  const removePdf = () => {
    setPdfFile(null);
    setPdfPreview(null);
    setExistingPdf(null);
    setRemoveFlags({ ...removeFlags, pdf: true });
  };

  const addCurriculumPoint = () => {
    if (curriculumPoint.trim()) {
      setFormData({
        ...formData,
        curriculum: [...formData.curriculum, curriculumPoint.trim()],
      });
      setCurriculumPoint('');
    }
  };

  const removeCurriculumPoint = (index) => {
    setFormData({
      ...formData,
      curriculum: formData.curriculum.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    setUploadProgress(0);

    try {
      const submitFormData = new FormData();
      submitFormData.append('title', formData.title);
      submitFormData.append('shortDescription', formData.shortDescription);
      submitFormData.append('description', formData.description);
      submitFormData.append('price', formData.price || '0');
      submitFormData.append('salePrice', formData.salePrice || '');
      submitFormData.append('isFree', formData.isFree.toString());
      submitFormData.append('pages', formData.pages || '0');
      submitFormData.append('curriculum', JSON.stringify(formData.curriculum));

      if (removeFlags.image1) submitFormData.append('removeImage1', 'true');
      if (removeFlags.image2) submitFormData.append('removeImage2', 'true');
      if (removeFlags.image3) submitFormData.append('removeImage3', 'true');
      if (removeFlags.pdf) submitFormData.append('removePdf', 'true');

      if (images.image1) {
        // File upload
        submitFormData.append('image1', images.image1);
      } else if (imagePreviews.image1 && !images.image1 && !removeFlags.image1) {
        // URL from MediaPicker
        submitFormData.append('image1Url', imagePreviews.image1);
      }
      if (images.image2) {
        // File upload
        submitFormData.append('image2', images.image2);
      } else if (imagePreviews.image2 && !images.image2 && !removeFlags.image2) {
        // URL from MediaPicker
        submitFormData.append('image2Url', imagePreviews.image2);
      }
      if (images.image3) {
        // File upload
        submitFormData.append('image3', images.image3);
      } else if (imagePreviews.image3 && !images.image3 && !removeFlags.image3) {
        // URL from MediaPicker
        submitFormData.append('image3Url', imagePreviews.image3);
      }
      if (pdfFile) {
        // File upload
        submitFormData.append('pdf', pdfFile);
      } else if (pdfPreview && !pdfFile && !removeFlags.pdf) {
        // URL from MediaPicker (if PDF URL is supported)
        submitFormData.append('pdfUrl', pdfPreview);
      }

      const response = await ebookAPI.updateEbook(id, submitFormData, (progress) => {
        setUploadProgress(progress);
      });

      if (response.success) {
        router.push('/admin/ebooks');
      }
    } catch (err) {
      setError(err.message || 'Failed to update e-book');
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/admin/ebooks">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to E-Books
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit E-Book</CardTitle>
          <CardDescription>Update e-book details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                {error}
              </div>
            )}

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="E-book title"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="shortDescription">Short Description</Label>
                <Input
                  id="shortDescription"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleInputChange}
                  placeholder="Brief description (shown in listings)"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Description *</Label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  placeholder="Enter detailed description..."
                  height={300}
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
                  required={!formData.isFree}
                  disabled={formData.isFree}
                />
              </div>

              <div>
                <Label htmlFor="salePrice">Sale Price (₹)</Label>
                <Input
                  id="salePrice"
                  name="salePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.salePrice}
                  onChange={handleInputChange}
                  disabled={formData.isFree}
                />
              </div>

              <div>
                <Label htmlFor="pages">Pages</Label>
                <Input
                  id="pages"
                  name="pages"
                  type="number"
                  min="0"
                  value={formData.pages}
                  onChange={handleInputChange}
                  placeholder="Number of pages"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isFree"
                  name="isFree"
                  checked={formData.isFree}
                  onChange={handleInputChange}
                  className="h-4 w-4"
                />
                <Label htmlFor="isFree">Free E-Book</Label>
              </div>
            </div>

            {/* Images Upload */}
            <div>
              <Label>Images (3 images max)</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                {[1, 2, 3].map((num) => {
                  const key = `image${num}`;
                  const preview = imagePreviews[key] || existingImages[key];
                  return (
                    <div key={num} className="space-y-2">
                      {preview ? (
                        <div className="relative">
                          <div className="aspect-video rounded-md overflow-hidden border">
                            <Image
                              src={preview}
                              alt={`Preview ${num}`}
                              className="h-full w-full object-cover"
                              width={200}
                              height={150}
                            />
                          </div>
                          <div className="absolute top-2 right-2 flex gap-1">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setActiveImageKey(key);
                                setShowImagePicker(true);
                              }}
                            >
                              Change
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeImage(key)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted hover:border-brand-500 transition-colors"
                          onClick={() => {
                            setActiveImageKey(key);
                            setShowImagePicker(true);
                          }}
                        >
                          <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">Image {num}</span>
                          <span className="text-xs text-muted-foreground">Click to select</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PDF Upload */}
            <div>
              <Label htmlFor="pdf">PDF File</Label>
              {pdfPreview || existingPdf ? (
                <div className="mt-2 p-4 border rounded-md flex items-center justify-between">
                  <span className="text-sm">{pdfPreview || 'Existing PDF'}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removePdf}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="mt-2 flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Upload PDF</span>
                  <input
                    type="file"
                    id="pdf"
                    className="hidden"
                    accept="application/pdf"
                    onChange={handlePdfChange}
                  />
                </label>
              )}
            </div>

            {/* Curriculum */}
            <div>
              <Label>Curriculum Points</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={curriculumPoint}
                  onChange={(e) => setCurriculumPoint(e.target.value)}
                  placeholder="Add curriculum point"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCurriculumPoint();
                    }
                  }}
                />
                <Button type="button" onClick={addCurriculumPoint}>
                  Add
                </Button>
              </div>
              {formData.curriculum.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {formData.curriculum.map((point, index) => (
                    <li key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{point}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCurriculumPoint(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={saving || uploadProgress > 0}
                className="bg-brand-600 hover:bg-brand-700"
              >
                {saving || uploadProgress > 0 ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uploadProgress > 0 ? 'Uploading...' : 'Saving...'}
                  </>
                ) : (
                  'Update E-Book'
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/ebooks">Cancel</Link>
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
          if (activeImageKey) {
            setImagePreviews(prev => ({ ...prev, [activeImageKey]: url }));
            setImages(prev => ({ ...prev, [activeImageKey]: null }));
            setExistingImages(prev => ({ ...prev, [activeImageKey]: null }));
            setRemoveFlags(prev => ({ ...prev, [activeImageKey]: false }));
          }
          setActiveImageKey(null);
        }}
        type="image"
        title={`Select ${activeImageKey ? activeImageKey.replace('image', 'Image ') : 'Image'}`}
        description="Choose an image from your media library or upload a new one"
      />
    </div>
  );
}

