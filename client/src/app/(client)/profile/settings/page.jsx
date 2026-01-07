'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { userAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, Camera, Save, CheckCircle2, XCircle } from 'lucide-react';
import { getPublicUrl } from '@/lib/imageUtils';
import { toast } from 'sonner';
import Image from 'next/image';

export default function SettingsPage() {
  const { user, updateUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      if (user.avatarUrl) {
        setAvatarPreview(user.avatarUrl);
      } else if (user.avatar) {
        const publicUrl = getPublicUrl(user.avatar);
        setAvatarPreview(publicUrl || '');
      } else {
        setAvatarPreview('');
      }
    }
  }, [user, authLoading, router]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await userAPI.uploadAvatar(avatarFile);
      if (response.success && response.data?.user) {
        const updatedUser = response.data.user;
        updateUser(updatedUser);
        if (updatedUser.avatarUrl) {
          setAvatarPreview(updatedUser.avatarUrl);
        } else if (updatedUser.avatar) {
          const publicUrl = getPublicUrl(updatedUser.avatar);
          setAvatarPreview(publicUrl || '');
        }
        setSuccess('Avatar updated successfully!');
        setAvatarFile(null);
        toast.success('Avatar updated successfully!');
      } else {
        setError('Failed to upload avatar');
        toast.error('Failed to upload avatar');
      }
    } catch (err) {
      setError(err.message || 'Failed to upload avatar');
      toast.error(err.message || 'Failed to upload avatar');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await userAPI.updateProfile(formData);
      if (response.success && response.data?.user) {
        updateUser(response.data.user);
        setSuccess('Profile updated successfully!');
        toast.success('Profile updated successfully!');
      } else {
        setError('Failed to update profile');
        toast.error('Failed to update profile');
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 text-green-600 text-sm p-3 rounded-md mb-6">
            {success}
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Picture */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Update your profile picture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {avatarPreview ? (
                    <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
                      <Image
                        src={avatarPreview}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                        width={96}
                        height={96}
                      />
                    </div>
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <User className="h-12 w-12 text-white" />
                    </div>
                  )}
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 bg-brand-600 text-white rounded-full p-2 cursor-pointer hover:bg-brand-700 transition"
                  >
                    <Camera className="h-4 w-4" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </label>
                </div>
                {avatarFile && (
                  <Button onClick={handleAvatarUpload} disabled={loading}>
                    {loading ? 'Uploading...' : 'Upload Avatar'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    <User className="inline h-4 w-4 mr-2" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="inline h-4 w-4 mr-2" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="inline h-4 w-4 mr-2" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <Button type="submit" disabled={saving} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Role:</span>
                <span className="font-semibold uppercase">{user.role}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground flex items-center gap-2">
                  Email Verified:
                </span>
                <div className="flex items-center gap-2">
                  {user.isVerified ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="font-semibold text-green-600">Yes</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="font-semibold text-red-600">No</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

