'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { webinarAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RichTextEditor from '@/components/RichTextEditor';
import { X, Loader2, ArrowLeft, Plus, Trash2, ImageIcon } from 'lucide-react';
import MediaPicker from '@/components/admin/MediaPicker';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';

export default function CreateWebinarPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'LIVE',
    description: '',
    instructorName: '',
    instructorDescription: '',
    instructorYearsExperience: '',
    price: '0',
    salePrice: '',
    isFree: false,
    seatType: 'UNLIMITED',
    maxSeats: '',
    startDate: '',
    duration: '',
    numberOfSessions: '',
    language: '',
    accessDuration: '',
    liveDoubtSolving: false,
    accessToRecordings: false,
    recordingsAccessDuration: '',
    thumbnailVideoUrl: '',
    googleMeetLink: '',
    isPublished: false,
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [instructorImage, setInstructorImage] = useState(null);
  const [instructorImagePreview, setInstructorImagePreview] = useState(null);
  const [whatYouWillLearn, setWhatYouWillLearn] = useState(['']);
  const [faqs, setFaqs] = useState([{ question: '', answer: '' }]);

  // MediaPicker state
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showInstructorImagePicker, setShowInstructorImagePicker] = useState(false);

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
  };

  const removeImage = (type) => {
    if (type === 'image') {
      setImage(null);
      setImagePreview(null);
    } else {
      setInstructorImage(null);
      setInstructorImagePreview(null);
    }
  };

  const addWhatYouWillLearn = () => {
    setWhatYouWillLearn([...whatYouWillLearn, '']);
  };

  const removeWhatYouWillLearn = (index) => {
    setWhatYouWillLearn(whatYouWillLearn.filter((_, i) => i !== index));
  };

  const updateWhatYouWillLearn = (index, value) => {
    const updated = [...whatYouWillLearn];
    updated[index] = value;
    setWhatYouWillLearn(updated);
  };

  const addFaq = () => {
    setFaqs([...faqs, { question: '', answer: '' }]);
  };

  const removeFaq = (index) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const updateFaq = (index, field, value) => {
    const updated = [...faqs];
    updated[index][field] = value;
    setFaqs(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.title || !formData.instructorName || !formData.startDate || !formData.duration || !formData.googleMeetLink) {
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

      if (image) {
        // File upload
        submitFormData.append('image', image);
      } else if (imagePreview && !image) {
        // URL from MediaPicker
        submitFormData.append('imageUrl', imagePreview);
      }
      if (instructorImage) {
        // File upload
        submitFormData.append('instructorImage', instructorImage);
      } else if (instructorImagePreview && !instructorImage) {
        // URL from MediaPicker
        submitFormData.append('instructorImageUrl', instructorImagePreview);
      }

      submitFormData.append('whatYouWillLearn', JSON.stringify(whatYouWillLearn.filter(item => item.trim())));
      submitFormData.append('faqs', JSON.stringify(faqs.filter(faq => faq.question.trim() && faq.answer.trim())));

      const response = await webinarAPI.createWebinar(submitFormData);

      if (response.success) {
        toast.success('Webinar created successfully');
        router.push('/admin/webinars');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create webinar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/webinars">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Webinar</h1>
          <p className="text-muted-foreground mt-1">Add a new webinar</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Webinar title"
              />
            </div>

            <div>
              <Label htmlFor="type">Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LIVE">LIVE</SelectItem>
                  <SelectItem value="WORKSHOP">WORKSHOP</SelectItem>
                  <SelectItem value="MASTERCLASS">MASTERCLASS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Enter description..."
                height={300}
              />
            </div>

            <div>
              <Label htmlFor="image">Image</Label>
              {imagePreview ? (
                <div className="mt-2 relative">
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                    <Image src={imagePreview} alt="Preview" fill className="object-cover" />
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
                      onClick={() => removeImage('image')}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted hover:border-brand-500 transition-colors"
                  onClick={() => setShowImagePicker(true)}
                >
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Click to select image</span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="googleMeetLink">Google Meet Link *</Label>
              <Input
                id="googleMeetLink"
                name="googleMeetLink"
                type="url"
                value={formData.googleMeetLink}
                onChange={handleInputChange}
                required
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Create your meeting at{' '}
                <a href="https://meet.google.com" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                  https://meet.google.com
                </a>{' '}
                and paste the link here.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="startDate">Start Date & Time *</Label>
              <Input
                id="startDate"
                name="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="duration">Duration (Minutes) *</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                min="1"
                value={formData.duration}
                onChange={handleInputChange}
                required
                placeholder="e.g., 45, 75, 90"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Enter duration in minutes (e.g., 45 for 45 minutes, 75 for 1 hour 15 minutes)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Instructor Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="instructorName">Instructor Name *</Label>
              <Input
                id="instructorName"
                name="instructorName"
                value={formData.instructorName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="instructorDescription">Instructor Description</Label>
              <RichTextEditor
                value={formData.instructorDescription}
                onChange={(value) => setFormData({ ...formData, instructorDescription: value })}
                placeholder="Enter instructor description..."
                height={200}
              />
            </div>

            <div>
              <Label htmlFor="instructorImage">Instructor Image</Label>
              {instructorImagePreview ? (
                <div className="mt-2 relative">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border">
                    <Image src={instructorImagePreview} alt="Preview" fill className="object-cover" />
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowInstructorImagePicker(true)}
                    >
                      Change
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeImage('instructorImage')}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="mt-2 w-32 h-32 border-2 border-dashed rounded-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted hover:border-brand-500 transition-colors"
                  onClick={() => setShowInstructorImagePicker(true)}
                >
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="instructorYearsExperience">Years of Experience</Label>
              <Input
                id="instructorYearsExperience"
                name="instructorYearsExperience"
                type="number"
                min="0"
                value={formData.instructorYearsExperience}
                onChange={handleInputChange}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="isFree"
                checked={formData.isFree}
                onCheckedChange={(checked) => setFormData({ ...formData, isFree: checked })}
              />
              <Label htmlFor="isFree">Is Free</Label>
            </div>

            {!formData.isFree && (
              <>
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
              </>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Seat Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="seatType">Seat Type</Label>
              <Select value={formData.seatType} onValueChange={(value) => setFormData({ ...formData, seatType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNLIMITED">UNLIMITED</SelectItem>
                  <SelectItem value="LIMITED">LIMITED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.seatType === 'LIMITED' && (
              <div>
                <Label htmlFor="maxSeats">Max Seats</Label>
                <Input
                  id="maxSeats"
                  name="maxSeats"
                  type="number"
                  min="1"
                  value={formData.maxSeats}
                  onChange={handleInputChange}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Course Meta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="numberOfSessions">Number of Sessions</Label>
              <Input
                id="numberOfSessions"
                name="numberOfSessions"
                type="number"
                min="1"
                value={formData.numberOfSessions}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="language">Language</Label>
              <Input
                id="language"
                name="language"
                value={formData.language}
                onChange={handleInputChange}
                placeholder="e.g., Hindi, English"
              />
            </div>

            <div>
              <Label htmlFor="accessDuration">Access Duration</Label>
              <Select value={formData.accessDuration} onValueChange={(value) => setFormData({ ...formData, accessDuration: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIX_MONTHS">6 Months</SelectItem>
                  <SelectItem value="ONE_YEAR">1 Year</SelectItem>
                  <SelectItem value="LIFETIME">Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="liveDoubtSolving"
                checked={formData.liveDoubtSolving}
                onCheckedChange={(checked) => setFormData({ ...formData, liveDoubtSolving: checked })}
              />
              <Label htmlFor="liveDoubtSolving">Live Doubt Solving</Label>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recording Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="accessToRecordings"
                checked={formData.accessToRecordings}
                onCheckedChange={(checked) => setFormData({ ...formData, accessToRecordings: checked })}
              />
              <Label htmlFor="accessToRecordings">Access To Recordings</Label>
            </div>

            {formData.accessToRecordings && (
              <div>
                <Label htmlFor="recordingsAccessDuration">Recordings Access Duration</Label>
                <Input
                  id="recordingsAccessDuration"
                  name="recordingsAccessDuration"
                  value={formData.recordingsAccessDuration}
                  onChange={handleInputChange}
                  placeholder="e.g., 1 Year Access to Recordings"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Marketing Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="thumbnailVideoUrl">Thumbnail Video URL</Label>
              <Input
                id="thumbnailVideoUrl"
                name="thumbnailVideoUrl"
                type="url"
                value={formData.thumbnailVideoUrl}
                onChange={handleInputChange}
                placeholder="YouTube video or shorts URL"
              />
            </div>

            <div>
              <Label>What You Will Learn</Label>
              {whatYouWillLearn.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    value={item}
                    onChange={(e) => updateWhatYouWillLearn(index, e.target.value)}
                    placeholder="Learning point"
                  />
                  {whatYouWillLearn.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWhatYouWillLearn(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addWhatYouWillLearn}>
                <Plus className="h-4 w-4 mr-2" />
                Add Point
              </Button>
            </div>

            <div>
              <Label>FAQs</Label>
              {faqs.map((faq, index) => (
                <div key={index} className="border rounded-lg p-4 mb-4 space-y-2">
                  <Input
                    value={faq.question}
                    onChange={(e) => updateFaq(index, 'question', e.target.value)}
                    placeholder="Question"
                  />
                  <Input
                    value={faq.answer}
                    onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                    placeholder="Answer"
                  />
                  {faqs.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFaq(index)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove FAQ
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addFaq}>
                <Plus className="h-4 w-4 mr-2" />
                Add FAQ
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Publish</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="isPublished"
                checked={formData.isPublished}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
              />
              <Label htmlFor="isPublished">Publish Webinar</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-6">
          <Button type="submit" disabled={loading} className="bg-brand-600 hover:bg-brand-700">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Webinar'
            )}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/webinars">Cancel</Link>
          </Button>
        </div>
      </form>

      {/* MediaPicker Dialogs */}
      <MediaPicker
        open={showImagePicker}
        onOpenChange={setShowImagePicker}
        onSelect={(url) => {
          setImagePreview(url);
          setImage(null);
        }}
        type="image"
        title="Select Webinar Image"
        description="Choose an image from your media library"
      />
      <MediaPicker
        open={showInstructorImagePicker}
        onOpenChange={setShowInstructorImagePicker}
        onSelect={(url) => {
          setInstructorImagePreview(url);
          setInstructorImage(null);
        }}
        type="image"
        title="Select Instructor Image"
        description="Choose an image from your media library"
      />
    </div>
  );
}

