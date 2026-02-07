'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import RichTextEditor from '@/components/RichTextEditor';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { FiUpload, FiX } from 'react-icons/fi';
import Image from 'next/image';

const JOB_TYPES = [
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'INTERNSHIP',
  'FREELANCE',
  'REMOTE',
  'HYBRID',
  'ON_SITE',
];

export default function JobForm({ initialData = null, isAdmin = false }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(initialData?.companyLogoUrl || null);
  const [logoFile, setLogoFile] = useState(null);

  const { register, handleSubmit, control, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      title: initialData?.title || '',
      companyName: initialData?.companyName || '',
      description: initialData?.description || '',
      requirements: initialData?.requirements || '',
      location: initialData?.location || '',
      salary: initialData?.salary || '',
      currency: initialData?.currency || 'INR',
      salaryType: initialData?.salaryType || 'Range',
      experience: initialData?.experience || '',
      skills: initialData?.skills?.join(', ') || '',
      applyLink: initialData?.applyLink || '',
      allowsQuickApply: initialData?.allowsQuickApply ?? true,
      type: initialData?.type || [], // Array of job types
      isVerified: initialData?.isVerified ?? (isAdmin ? true : false),
      status: initialData?.status || (isAdmin ? 'PUBLISHED' : 'PENDING'),
    }
  });

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB');
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      
      // Append basic fields
      Object.keys(data).forEach(key => {
        if (key === 'image' || key === 'skills' || key === 'type') return; // Handle separately
        if (data[key] !== null && data[key] !== undefined) {
             formData.append(key, data[key]);
        }
      });

      // Handle Skills (comma separated string -> array if needed by backend, 
      // but our controller might expect JSON string or we parse it there? 
      // Let's check controller. Controller expects array of strings in body if JSON, 
      // but since we send FormData, we might need to send them as individual entries or JSON string.
      // Easiest is to send as JSON string if backend parses it, OR simple logic in backend.
      // Looking at controller: `const { skills, type ... } = req.body`. 
      // If we use multer for files, req.body fields are strings.
      // So we should format `skills` as an array or verify backend handles string splitting.
      // Backend controller: `skills: Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim())` (Assumption or Standard)
      // Actually my controller implementation: `skills: skills ? (Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim())) : []`
      // So passing the string directly is fine!
      formData.append('skills', data.skills);

      // Handle Type (Array)
      // If it's an array, we append each item
      if (Array.isArray(data.type)) {
        data.type.forEach(t => formData.append('type[]', t));
      }

      // Handle Logo
      if (logoFile) {
        formData.append('companyLogo', logoFile);
      }

      let res;
      if (initialData) {
        res = await api.patch(`/jobs/${initialData.id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await api.post('/jobs', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (res.data?.success) {
        toast.success(initialData ? 'Job updated!' : 'Job posted successfully!');
        if (isAdmin) {
             router.push('/admin/jobs');
        } else {
             // Reset or redirect
             router.push('/career/software-jobs'); 
        }
      }

    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
      
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold border-b pb-2 dark:text-white">Basic Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="title">Job Title <span className="text-red-500">*</span></Label>
                <Input id="title" {...register('title', { required: 'Job title is required' })} placeholder="e.g. Senior Frontend Engineer" />
                {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="companyName">Company Name <span className="text-red-500">*</span></Label>
                <Input id="companyName" {...register('companyName', { required: 'Company name is required' })} placeholder="e.g. Acme Corp" />
                {errors.companyName && <p className="text-red-500 text-sm">{errors.companyName.message}</p>}
            </div>
        </div>

        <div className="space-y-2">
            <Label>Company Logo</Label>
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 border rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden relative">
                    {logoPreview ? (
                        <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-gray-400 text-xs">No Logo</span>
                    )}
                </div>
                <div>
                     <Input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoChange} 
                        className="max-w-xs"
                    />
                    <p className="text-xs text-gray-500 mt-1">Recommended size: Square, max 2MB</p>
                </div>
            </div>
        </div>
      </div>

      {/* Job Details */}
      <div className="space-y-4">
         <h3 className="text-xl font-semibold border-b pb-2 dark:text-white">Job Details</h3>

         <div className="space-y-2">
            <Label>Job Description <span className="text-red-500">*</span></Label>
            <Controller
                name="description"
                control={control}
                rules={{ required: 'Description is required' }}
                render={({ field }) => (
                    <RichTextEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Detailed job description..."
                    />
                )}
            />
            {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
         </div>

         <div className="space-y-2">
            <Label>Requirements</Label>
            <Controller
                name="requirements"
                control={control}
                render={({ field }) => (
                    <RichTextEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Key responsibilities, skills, qualifications..."
                    />
                )}
            />
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" {...register('location')} placeholder="e.g. New York, Remote" />
             </div>
             <div className="space-y-2">
                <Label htmlFor="salary">Salary Range</Label>
                <Input id="salary" {...register('salary')} placeholder="e.g. $100k - $120k, Competitive" />
             </div>
             <div className="space-y-2">
                <Label htmlFor="experience">Experience</Label>
                <Input id="experience" {...register('experience')} placeholder="e.g. 3+ Years" />
             </div>
             <div className="space-y-2">
                <Label htmlFor="skills">Skills (Comma separated)</Label>
                <Input id="skills" {...register('skills')} placeholder="e.g. React, Node.js, TypeScript" />
             </div>
         </div>

         <div className="space-y-2">
            <Label>Job Type</Label>
            <Controller
                name="type"
                control={control}
                render={({ field }) => (
                    <div className="flex flex-wrap gap-3">
                        {JOB_TYPES.map(type => (
                            <div key={type} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={type} 
                                    checked={field.value.includes(type)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            field.onChange([...field.value, type]);
                                        } else {
                                            field.onChange(field.value.filter(t => t !== type));
                                        }
                                    }}
                                />
                                <label 
                                    htmlFor={type} 
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                    {type.replace('_', ' ')}
                                </label>
                            </div>
                        ))}
                    </div>
                )}
            />
         </div>
      </div>

      {/* Application */}
      <div className="space-y-4">
          <h3 className="text-xl font-semibold border-b pb-2 dark:text-white">Application Method</h3>
          
          <div className="flex items-center space-x-2 mb-4">
             <Controller
                name="allowsQuickApply"
                control={control}
                render={({ field }) => (
                    <Checkbox 
                        id="allowsQuickApply"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                    />
                )}
             />
             <label htmlFor="allowsQuickApply" className="text-sm font-medium cursor-pointer">
                Allow candidates to apply directly on this platform (Quick Apply)
             </label>
          </div>

          <div className="space-y-2">
             <Label htmlFor="applyLink">External Application Link</Label>
             <Input 
                id="applyLink" 
                {...register('applyLink')} 
                placeholder="https://company.com/careers/apply/123" 
                disabled={watch('allowsQuickApply')}
                className={watch('allowsQuickApply') ? 'opacity-50' : ''}
             />
             <p className="text-xs text-gray-500">Required if Quick Apply is disabled.</p>
          </div>
      </div>

      {/* Admin Only Fields */}
      {isAdmin && (
          <div className="space-y-4 bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg border border-indigo-100 dark:border-indigo-900">
              <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  Admin Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label>Status</Label>
                      <Controller
                          name="status"
                          control={control}
                          render={({ field }) => (
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <SelectTrigger>
                                      <SelectValue placeholder="Select Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="DRAFT">Draft</SelectItem>
                                      <SelectItem value="PENDING">Pending</SelectItem>
                                      <SelectItem value="PUBLISHED">Published</SelectItem>
                                      <SelectItem value="CLOSED">Closed</SelectItem>
                                      <SelectItem value="REJECTED">Rejected</SelectItem>
                                  </SelectContent>
                              </Select>
                          )}
                      />
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-8">
                     <Controller
                        name="isVerified"
                        control={control}
                        render={({ field }) => (
                            <Checkbox 
                                id="isVerified"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        )}
                     />
                     <label htmlFor="isVerified" className="text-sm font-medium cursor-pointer">
                        Mark as Verified
                     </label>
                  </div>
              </div>
          </div>
      )}

      <div className="flex justify-end pt-6">
        <Button size="lg" type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[200px]">
          {loading ? 'Saving...' : (initialData ? 'Update Job' : 'Post Job')}
        </Button>
      </div>

    </form>
  );
}
