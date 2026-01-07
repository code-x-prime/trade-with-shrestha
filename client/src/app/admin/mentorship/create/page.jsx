'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { mentorshipAPI } from '@/lib/api';
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

export default function CreateMentorshipPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pricingType: 'PAID',
    price: '0',
    salePrice: '',
    isFree: false,
    status: 'DRAFT',
    totalSessions: '',
    startDate: '',
    endDate: '',
    googleMeetLink: '',
    instructorName: '',
    instructorBio: '',
  });
  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  const [instructorImage, setInstructorImage] = useState(null);
  const [instructorImagePreview, setInstructorImagePreview] = useState(null);
  const [programOverview, setProgramOverview] = useState(['']);
  const [whoIsThisFor, setWhoIsThisFor] = useState(['']);
  const [whatYouWillLearn, setWhatYouWillLearn] = useState(['']);
  const [keyConceptsRequired, setKeyConceptsRequired] = useState(['']);
  const [faqs, setFaqs] = useState([{ question: '', answer: '' }]);

  // MediaPicker state
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showInstructorPicker, setShowInstructorPicker] = useState(false);

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
    if (type === 'coverImage') {
      setCoverImage(null);
      setCoverImagePreview(null);
    } else {
      setInstructorImage(null);
      setInstructorImagePreview(null);
    }
  };

  const addArrayItem = (setter, current) => {
    setter([...current, '']);
  };

  const removeArrayItem = (setter, current, index) => {
    setter(current.filter((_, i) => i !== index));
  };

  const updateArrayItem = (setter, current, index, value) => {
    const updated = [...current];
    updated[index] = value;
    setter(updated);
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
      if (!formData.title || !formData.description || !formData.instructorName || !formData.googleMeetLink || !formData.totalSessions || !formData.startDate || !formData.endDate) {
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

      if (coverImage) {
        // File upload
        submitFormData.append('coverImage', coverImage);
      } else if (coverImagePreview && !coverImage) {
        // URL from MediaPicker
        submitFormData.append('coverImageUrl', coverImagePreview);
      }
      if (instructorImage) {
        // File upload
        submitFormData.append('instructorImage', instructorImage);
      } else if (instructorImagePreview && !instructorImage) {
        // URL from MediaPicker
        submitFormData.append('instructorImageUrl', instructorImagePreview);
      }

      submitFormData.append('programOverview', JSON.stringify(programOverview.filter(item => item.trim())));
      submitFormData.append('whoIsThisFor', JSON.stringify(whoIsThisFor.filter(item => item.trim())));
      submitFormData.append('whatYouWillLearn', JSON.stringify(whatYouWillLearn.filter(item => item.trim())));
      submitFormData.append('keyConceptsRequired', JSON.stringify(keyConceptsRequired.filter(item => item.trim())));
      submitFormData.append('faqs', JSON.stringify(faqs.filter(faq => faq.question.trim() && faq.answer.trim())));

      const response = await mentorshipAPI.createMentorship(submitFormData);

      if (response.success) {
        toast.success('Mentorship program created successfully');
        router.push('/admin/mentorship');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create mentorship program');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/mentorship">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Mentorship Program</h1>
          <p className="text-muted-foreground mt-1">Add a new mentorship program</p>
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
                placeholder="Mentorship program title"
              />
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
              <Label htmlFor="coverImage">Cover Image</Label>
              {coverImagePreview ? (
                <div className="mt-2 relative">
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                    <Image src={coverImagePreview} alt="Preview" fill className="object-cover" />
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowCoverPicker(true)}
                    >
                      Change
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeImage('coverImage')}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted hover:border-brand-500 transition-colors"
                  onClick={() => setShowCoverPicker(true)}
                >
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Click to select cover image</span>
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
            <CardTitle>Program Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="totalSessions">Total Sessions *</Label>
              <Input
                id="totalSessions"
                name="totalSessions"
                type="number"
                min="1"
                value={formData.totalSessions}
                onChange={handleInputChange}
                required
                placeholder="e.g., 10, 20, 30"
              />
            </div>

            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> After creating this mentorship program, you can add individual sessions with specific dates and times from the sessions management page.
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
              <Label htmlFor="instructorBio">Instructor Bio</Label>
              <RichTextEditor
                value={formData.instructorBio}
                onChange={(value) => setFormData({ ...formData, instructorBio: value })}
                placeholder="Enter instructor bio..."
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
                      onClick={() => setShowInstructorPicker(true)}
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
                  onClick={() => setShowInstructorPicker(true)}
                >
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
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
                onCheckedChange={(checked) => setFormData({ ...formData, isFree: checked, pricingType: checked ? 'FREE' : 'PAID' })}
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
            <CardTitle>Program Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {programOverview.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => updateArrayItem(setProgramOverview, programOverview, index, e.target.value)}
                  placeholder="Overview point"
                />
                {programOverview.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeArrayItem(setProgramOverview, programOverview, index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem(setProgramOverview, programOverview)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Point
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Who is this program for</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {whoIsThisFor.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => updateArrayItem(setWhoIsThisFor, whoIsThisFor, index, e.target.value)}
                  placeholder="Target audience point"
                />
                {whoIsThisFor.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeArrayItem(setWhoIsThisFor, whoIsThisFor, index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem(setWhoIsThisFor, whoIsThisFor)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Point
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>What you will learn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {whatYouWillLearn.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => updateArrayItem(setWhatYouWillLearn, whatYouWillLearn, index, e.target.value)}
                  placeholder="Learning point"
                />
                {whatYouWillLearn.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeArrayItem(setWhatYouWillLearn, whatYouWillLearn, index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem(setWhatYouWillLearn, whatYouWillLearn)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Point
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Key concepts you should know before joining</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {keyConceptsRequired.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => updateArrayItem(setKeyConceptsRequired, keyConceptsRequired, index, e.target.value)}
                  placeholder="Key concept"
                />
                {keyConceptsRequired.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeArrayItem(setKeyConceptsRequired, keyConceptsRequired, index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem(setKeyConceptsRequired, keyConceptsRequired)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Point
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>FAQs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
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
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Publish</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="UNPUBLISHED">Unpublished</SelectItem>
                </SelectContent>
              </Select>
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
              'Create Mentorship Program'
            )}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/mentorship">Cancel</Link>
          </Button>
        </div>
      </form>

      {/* MediaPicker Dialogs */}
      <MediaPicker
        open={showCoverPicker}
        onOpenChange={setShowCoverPicker}
        onSelect={(url) => {
          setCoverImagePreview(url);
          setCoverImage(null);
        }}
        type="image"
        title="Select Cover Image"
        description="Choose an image from your media library"
      />
      <MediaPicker
        open={showInstructorPicker}
        onOpenChange={setShowInstructorPicker}
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

