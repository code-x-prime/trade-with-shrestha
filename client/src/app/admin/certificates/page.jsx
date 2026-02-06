'use client';

import { useState, useEffect } from 'react';
import { certificateAPI, uploadAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Award, Search, XCircle, BookOpen, Video, ChevronLeft, ChevronRight,
  Plus, Upload, Palette, Users, FileText, Download, Loader2, Stamp, Check, Info, HelpCircle, Mail, Eye, EyeOff, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const CERTIFICATE_TYPES = [
  { value: 'COURSE', label: 'Course', icon: BookOpen, color: 'bg-blue-500' },
  { value: 'WEBINAR', label: 'Webinar', icon: Video, color: 'bg-purple-500' },
  { value: 'GUIDANCE', label: '1:1 Guidance', icon: FileText, color: 'bg-green-500' },
  { value: 'OFFLINE_BATCH', label: 'Offline Batch', icon: Award, color: 'bg-orange-500' },
  { value: 'BUNDLE', label: 'Bundle', icon: Award, color: 'bg-pink-500' },
];

const DESIGN_PRESETS = [
  { id: 'classic', name: 'Classic Violet', primaryColor: '#6366F1', secondaryColor: '#A5B4FC' },
  { id: 'gold', name: 'Royal Gold', primaryColor: '#B8860B', secondaryColor: '#FFD700' },
  { id: 'emerald', name: 'Emerald', primaryColor: '#059669', secondaryColor: '#34D399' },
  { id: 'navy', name: 'Navy Blue', primaryColor: '#1E3A5F', secondaryColor: '#3B82F6' },
  { id: 'rose', name: 'Rose Pink', primaryColor: '#BE185D', secondaryColor: '#F472B6' },
  { id: 'custom', name: 'Custom', primaryColor: '#6366F1', secondaryColor: '#A5B4FC' },
];

// Certificate Preview Component - Better Layout
function CertificatePreview({ userName, itemTitle, type, primaryColor, secondaryColor, issuerName, issuerTitle, logoUrl, signatureUrl, stampUrl }) {
  const typeLabel = CERTIFICATE_TYPES.find(t => t.value === type)?.label?.toUpperCase() || 'COURSE';

  return (
    <div
      className="relative w-full bg-white rounded-lg overflow-hidden shadow-2xl"
      style={{ aspectRatio: '1.414/1', border: `4px solid ${primaryColor}` }}
    >
      {/* Inner Border */}
      <div
        className="absolute inset-[8px] rounded pointer-events-none"
        style={{ border: `2px solid ${secondaryColor}` }}
      />

      {/* Corner Decorations */}
      {[[12, 12], [null, 12], [12, null], [null, null]].map(([left, top], i) => (
        <div
          key={i}
          className="absolute w-6 h-6"
          style={{
            left: left !== null ? left : undefined,
            right: left === null ? 12 : undefined,
            top: top !== null ? top : undefined,
            bottom: top === null ? 12 : undefined,
            border: `2px solid ${primaryColor}`
          }}
        />
      ))}

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center pt-[8%] px-4">
        {/* Logo */}
        {logoUrl && (
          <div className="h-[12%] mb-1 flex items-center justify-center">
            <Image width={160} height={160} src={logoUrl} alt="Logo" className="max-h-full max-w-[80px] object-contain" />
          </div>
        )}

        {/* Issuer Name */}
        <p className="text-[2.5vw] lg:text-sm font-bold tracking-wide" style={{ color: primaryColor }}>
          {issuerName}
        </p>

        {/* Title */}
        <h2 className="text-[5vw] lg:text-2xl font-bold text-gray-800 mt-[2%]">CERTIFICATE</h2>
        <p className="text-[2vw] lg:text-xs text-gray-500 tracking-widest">OF COMPLETION</p>

        {/* Decorative Line */}
        <div className="w-[30%] h-[2px] my-[2%]" style={{ backgroundColor: primaryColor }} />

        {/* Certify Text */}
        <p className="text-[1.8vw] lg:text-[10px] text-gray-500">This is to certify that</p>

        {/* Recipient Name */}
        <p className="text-[4vw] lg:text-xl font-bold text-gray-800 mt-[1%]">{userName || 'Recipient Name'}</p>
        <div className="w-[40%] h-[1px] bg-gray-300 mt-[1%]" />

        {/* Completion Text */}
        <p className="text-[1.8vw] lg:text-[10px] text-gray-500 mt-[2%]">has successfully completed the</p>
        <p className="text-[2vw] lg:text-xs font-bold mt-[0.5%]" style={{ color: primaryColor }}>{typeLabel}</p>
        <p className="text-[2.5vw] lg:text-sm font-bold text-gray-800 mt-[0.5%]">&quot;{itemTitle || 'Program Name'}&quot;</p>

        {/* Signature Area - Fixed Position at Bottom */}
        <div className="absolute bottom-[12%] left-0 right-0 flex justify-between px-[8%]">
          {/* Left - Signature */}
          <div className="text-center w-[35%]">
            {signatureUrl ? (
              <div className="h-[30px] mb-1 flex items-end justify-center">
                <Image width={160} height={160} src={signatureUrl} alt="Signature" className="max-h-full max-w-full object-contain" />
              </div>
            ) : (
              <div className="h-[30px] mb-1 flex items-end justify-center">
                <div className="w-full h-[1px] bg-gray-300" />
              </div>
            )}
            <p className="text-[1.8vw] lg:text-[9px] font-semibold text-gray-700">{issuerName}</p>
            <p className="text-[1.5vw] lg:text-[8px] text-gray-500">{issuerTitle}</p>
          </div>

          {/* Right - Stamp */}
          <div className="text-center w-[35%] flex flex-col items-center">
            {stampUrl ? (
              <div className="h-[40px] w-[40px] mb-1 flex items-center justify-center">
                <Image width={160} height={160} src={stampUrl} alt="Stamp" className="max-h-full max-w-full object-contain" />
              </div>
            ) : (
              <div className="h-[40px] w-[40px] rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center mb-1">
                <Stamp className="h-4 w-4 text-gray-300" />
              </div>
            )}
            <p className="text-[1.8vw] lg:text-[9px] font-semibold text-gray-700">Verified</p>
            <p className="text-[1.5vw] lg:text-[8px] text-gray-500">Digital Certificate</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoDialog({ title, children }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2"><Info className="h-4 w-4" /><span className="hidden sm:inline">Help</span></Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2 text-xl"><HelpCircle className="h-5 w-5 text-brand-600" />{title}</DialogTitle></DialogHeader>
        <div className="space-y-4 text-sm">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminCertificatesPage() {
  const [activeTab, setActiveTab] = useState('certificates');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Award className="h-6 w-6 text-brand-600" />
            Certificate Generator
          </h1>
          <p className="text-muted-foreground">Design templates and issue certificates to users</p>
        </div>
        <InfoDialog title="Certificate Generator Guide">
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <h3 className="font-bold text-blue-700 dark:text-blue-300 mb-2">📋 How it works</h3>
              <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                <li>Go to <strong>Design</strong> tab → Select a type (Course, Webinar, etc.)</li>
                <li>Choose colors, upload signature/stamp/logo</li>
                <li>Click <strong>Save Template</strong></li>
                <li>Go to <strong>Generate</strong> tab to create certificates</li>
                <li>User receives email with download link automatically!</li>
              </ol>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="font-medium text-green-700 dark:text-green-300">💡 Tip: Each product type has its own design!</p>
              <p className="text-sm text-muted-foreground">Course certificates can look different from Webinar certificates.</p>
            </div>
          </div>
        </InfoDialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
          <TabsTrigger value="certificates" className="gap-2"><Award className="h-4 w-4" />Issued</TabsTrigger>
          <TabsTrigger value="templates" className="gap-2"><Palette className="h-4 w-4" />Design</TabsTrigger>
          <TabsTrigger value="generate" className="gap-2"><Plus className="h-4 w-4" />Generate</TabsTrigger>
        </TabsList>

        <TabsContent value="certificates"><IssuedCertificatesTab /></TabsContent>
        <TabsContent value="templates"><TemplatesTab /></TabsContent>
        <TabsContent value="generate"><ManualGenerationTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ==================== ISSUED CERTIFICATES TAB ====================
function IssuedCertificatesTab() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, certificate: null });

  useEffect(() => { fetchCertificates(); }, [page, typeFilter]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (typeFilter !== 'all') params.type = typeFilter;
      if (search) params.search = search;
      const response = await certificateAPI.getAdminCertificates(params);
      if (response.success) { setCertificates(response.data.certificates || []); setPagination(response.data.pagination); }
    } catch (error) { toast.error('Failed to load'); } finally { setLoading(false); }
  };

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchCertificates(); };
  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  const getTypeInfo = (type) => CERTIFICATE_TYPES.find(t => t.value === type) || { label: type, color: 'bg-gray-500' };

  const handleRevoke = async (cert) => {
    if (!confirm(`Revoke certificate ${cert.certificateNo}? User won't be able to use it.`)) return;
    try {
      setActionLoading(cert.id);
      const response = await certificateAPI.revokeCertificate(cert.id);
      if (response.success) { toast.success('Certificate revoked'); fetchCertificates(); }
    } catch (error) { toast.error('Failed to revoke'); } finally { setActionLoading(null); }
  };

  const handleDeleteClick = (cert) => {
    setDeleteDialog({ open: true, certificate: cert });
  };

  const handleDelete = async () => {
    if (!deleteDialog.certificate) return;
    try {
      setActionLoading(deleteDialog.certificate.id);
      const response = await certificateAPI.deleteCertificate(deleteDialog.certificate.id);
      if (response.success) {
        toast.success('Certificate deleted successfully');
        fetchCertificates();
        setDeleteDialog({ open: false, certificate: null });
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete certificate');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async (cert) => {
    if (!confirm(`Restore certificate ${cert.certificateNo}? It will become active again.`)) return;
    try {
      setActionLoading(cert.id);
      const response = await certificateAPI.restoreCertificate(cert.id);
      if (response.success) { toast.success('Certificate restored'); fetchCertificates(); }
    } catch (error) { toast.error('Failed to restore'); } finally { setActionLoading(null); }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search certificate number..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-36"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {CERTIFICATE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button type="submit"><Search className="h-4 w-4" /></Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : certificates.length === 0 ? (
            <div className="p-12 text-center"><Award className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" /><p className="text-muted-foreground">No certificates found</p></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Certificate</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="hidden lg:table-cell">Item</TableHead>
                  <TableHead className="hidden md:table-cell">Issued</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {certificates.map((cert) => {
                    const typeInfo = getTypeInfo(cert.type);
                    const isLoading = actionLoading === cert.id;
                    return (
                      <TableRow key={cert.id} className={cert.status === 'REVOKED' ? 'opacity-60 bg-red-50 dark:bg-red-900/10' : ''}>
                        <TableCell>
                          <p className="font-mono text-xs">{cert.certificateNo}</p>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${typeInfo.color} text-white border-0 text-[10px]`}>{typeInfo.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{cert.user?.name || 'No name'}</p>
                            <p className="text-xs text-muted-foreground">{cert.user?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <p className="text-sm max-w-[200px] truncate">{cert.itemDetails?.title || 'N/A'}</p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{formatDate(cert.issuedAt)}</TableCell>
                        <TableCell>
                          <Badge variant={cert.status === 'GENERATED' ? 'success' : 'destructive'} className="text-[10px]">
                            {cert.status === 'GENERATED' ? 'Active' : 'Revoked'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* View Details */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Eye className="h-3 w-3" /></Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Certificate Details</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-3 text-sm">
                                  <DetailItem label="Certificate No" value={cert.certificateNo} mono />
                                  <DetailItem label="Type" value={<Badge className={`${typeInfo.color} text-white border-0`}>{typeInfo.label}</Badge>} />
                                  <DetailItem label="Status" value={<Badge variant={cert.status === 'GENERATED' ? 'success' : 'destructive'}>{cert.status}</Badge>} />
                                  <hr />
                                  <DetailItem label="User Name" value={cert.user?.name || 'N/A'} />
                                  <DetailItem label="User Email" value={cert.user?.email || 'N/A'} />
                                  <hr />
                                  <DetailItem label="Program" value={cert.itemDetails?.title || 'N/A'} />
                                  <DetailItem label="Issued Date" value={formatDate(cert.issuedAt)} />
                                  <hr />
                                  {cert.certificateUrlPublic && (
                                    <Button asChild className="w-full">
                                      <a href={cert.certificateUrlPublic} target="_blank"><Download className="h-4 w-4 mr-2" />Download PDF</a>
                                    </Button>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>

                            {/* Download */}
                            {cert.certificateUrlPublic && (
                              <Button asChild variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <a href={cert.certificateUrlPublic} target="_blank"><Download className="h-3 w-3" /></a>
                              </Button>
                            )}

                            {/* Revoke - only show for active certificates */}
                            {cert.status === 'GENERATED' && (
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-orange-500 hover:text-orange-600" onClick={() => handleRevoke(cert)} disabled={isLoading} title="Revoke">
                                <XCircle className="h-3 w-3" />
                              </Button>
                            )}

                            {/* Restore - only show for revoked certificates */}
                            {cert.status === 'REVOKED' && (
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-500 hover:text-green-600" onClick={() => handleRestore(cert)} disabled={isLoading} title="Restore">
                                <Check className="h-3 w-3" />
                              </Button>
                            )}

                            {/* Delete */}
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={() => handleDeleteClick(cert)} disabled={isLoading || actionLoading === cert.id} title="Delete">
                              {actionLoading === cert.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <span className="text-sm text-muted-foreground">Page {pagination.page}/{pagination.pages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= pagination.pages}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, certificate: deleteDialog.certificate })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the certificate &quot;{deleteDialog.certificate?.certificateNo}&quot; and all its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DetailItem({ label, value, mono }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono' : 'font-medium'}>{value}</span>
    </div>
  );
}

// ==================== TEMPLATES TAB ====================
function TemplatesTab() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('COURSE');
  const [selectedPreset, setSelectedPreset] = useState('classic');
  const [formData, setFormData] = useState({ name: 'Course Certificate', issuerName: 'Shrestha Academy', issuerTitle: 'Platform Director', primaryColor: '#6366F1', secondaryColor: '#A5B4FC' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({});
  const [previewVisible, setPreviewVisible] = useState(true);

  useEffect(() => { fetchTemplates(); }, []);
  useEffect(() => { if (templates.length > 0) handleSelectType(selectedType); }, [templates]);

  const fetchTemplates = async () => {
    try { setLoading(true); const response = await certificateAPI.getTemplates(); if (response.success) setTemplates(response.data || []); } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleSelectType = (type) => {
    setSelectedType(type);
    const existing = templates.find(t => t.type === type);
    if (existing) {
      setFormData({ name: existing.name, issuerName: existing.issuerName || 'Shrestha Academy', issuerTitle: existing.issuerTitle || 'Platform Director', primaryColor: existing.primaryColor || '#6366F1', secondaryColor: existing.secondaryColor || '#A5B4FC' });
      const matchingPreset = DESIGN_PRESETS.find(p => p.primaryColor === existing.primaryColor && p.secondaryColor === existing.secondaryColor);
      setSelectedPreset(matchingPreset?.id || 'custom');
    } else {
      const typeInfo = CERTIFICATE_TYPES.find(t => t.value === type);
      setFormData({ name: `${typeInfo?.label} Certificate`, issuerName: 'Shrestha Academy', issuerTitle: 'Platform Director', primaryColor: '#6366F1', secondaryColor: '#A5B4FC' });
      setSelectedPreset('classic');
    }
  };

  const handlePresetChange = (presetId) => {
    setSelectedPreset(presetId);
    const preset = DESIGN_PRESETS.find(p => p.id === presetId);
    if (preset && presetId !== 'custom') setFormData(prev => ({ ...prev, primaryColor: preset.primaryColor, secondaryColor: preset.secondaryColor }));
  };

  const handleSave = async () => {
    try { setSaving(true); const response = await certificateAPI.upsertTemplate({ type: selectedType, ...formData }); if (response.success) { toast.success('Template saved!'); fetchTemplates(); } } catch (error) { toast.error('Failed to save'); } finally { setSaving(false); }
  };

  const handleImageUpload = async (e, imageType) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(prev => ({ ...prev, [imageType]: true }));
      const uploadResponse = await uploadAPI.uploadFile(file, 'certificates/templates');
      if (uploadResponse.success) {
        await certificateAPI.updateTemplateImages(selectedType, { [imageType]: uploadResponse.data.filename });
        toast.success('Image uploaded! Old one deleted from storage.');
        fetchTemplates();
      }
    } catch (error) { toast.error('Upload failed'); } finally { setUploading(prev => ({ ...prev, [imageType]: false })); }
  };

  const currentTemplate = templates.find(t => t.type === selectedType);

  return (
    <div className="space-y-4">
      {/* Type Selection */}
      <div className="flex flex-wrap gap-2">
        {CERTIFICATE_TYPES.map(type => {
          const Icon = type.icon;
          const hasTemplate = templates.some(t => t.type === type.value);
          return (
            <Button
              key={type.value}
              variant={selectedType === type.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSelectType(type.value)}
              className="gap-1"
            >
              <Icon className="h-3 w-3" />{type.label}
              {hasTemplate && <Check className="h-3 w-3 text-green-500" />}
            </Button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{CERTIFICATE_TYPES.find(t => t.value === selectedType)?.label} Certificate Design</CardTitle>
            <CardDescription>Customize colors, issuer info, and upload images</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Color Presets */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">🎨 Color Theme</Label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {DESIGN_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetChange(preset.id)}
                    className={`p-2 rounded-lg border-2 transition-all ${selectedPreset === preset.id ? 'border-brand-500 ring-2 ring-brand-200 dark:ring-brand-800' : 'border-gray-200 dark:border-gray-700'}`}
                  >
                    <div className="h-6 rounded flex">
                      <div className="flex-1 rounded-l" style={{ backgroundColor: preset.primaryColor }} />
                      <div className="flex-1 rounded-r" style={{ backgroundColor: preset.secondaryColor }} />
                    </div>
                    <p className="text-[9px] mt-1 truncate">{preset.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            {selectedPreset === 'custom' && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <Label className="text-xs">Primary</Label>
                  <div className="flex gap-1 mt-1">
                    <Input type="color" value={formData.primaryColor} onChange={e => setFormData({ ...formData, primaryColor: e.target.value })} className="w-10 h-8 p-0.5 cursor-pointer" />
                    <Input value={formData.primaryColor} onChange={e => setFormData({ ...formData, primaryColor: e.target.value })} className="flex-1 text-xs font-mono" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Secondary</Label>
                  <div className="flex gap-1 mt-1">
                    <Input type="color" value={formData.secondaryColor} onChange={e => setFormData({ ...formData, secondaryColor: e.target.value })} className="w-10 h-8 p-0.5 cursor-pointer" />
                    <Input value={formData.secondaryColor} onChange={e => setFormData({ ...formData, secondaryColor: e.target.value })} className="flex-1 text-xs font-mono" />
                  </div>
                </div>
              </div>
            )}

            {/* Issuer Info */}
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Issuer Name</Label><Input value={formData.issuerName} onChange={e => setFormData({ ...formData, issuerName: e.target.value })} className="mt-1" placeholder="Shrestha Academy" /></div>
              <div><Label className="text-xs">Issuer Title</Label><Input value={formData.issuerTitle} onChange={e => setFormData({ ...formData, issuerTitle: e.target.value })} className="mt-1" placeholder="Platform Director" /></div>
            </div>

            {/* Image Uploads */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">🖼️ Images (PNG with transparent background recommended)</Label>
              <div className="grid grid-cols-3 gap-3">
                <ImageUploadCard label="Logo" hint="Top center" imageUrl={currentTemplate?.logoUrl} uploading={uploading.logoUrl} onUpload={(e) => handleImageUpload(e, 'logoUrl')} />
                <ImageUploadCard label="Signature" hint="Left bottom" imageUrl={currentTemplate?.signatureUrl} uploading={uploading.signatureUrl} onUpload={(e) => handleImageUpload(e, 'signatureUrl')} />
                <ImageUploadCard label="Stamp/Seal" hint="Right bottom" imageUrl={currentTemplate?.stampUrl} uploading={uploading.stampUrl} onUpload={(e) => handleImageUpload(e, 'stampUrl')} />
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : <><Check className="h-4 w-4 mr-2" />Save Template</>}
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><Eye className="h-5 w-5" />Live Preview</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setPreviewVisible(!previewVisible)}>
                {previewVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {previewVisible ? (
              <CertificatePreview
                userName="John Doe"
                itemTitle="Sample Course Title"
                type={selectedType}
                primaryColor={formData.primaryColor}
                secondaryColor={formData.secondaryColor}
                issuerName={formData.issuerName}
                issuerTitle={formData.issuerTitle}
                logoUrl={currentTemplate?.logoUrl}
                signatureUrl={currentTemplate?.signatureUrl}
                stampUrl={currentTemplate?.stampUrl}
              />
            ) : (
              <div className="aspect-[1.414/1] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Preview Hidden</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-3 text-center">
              This preview shows how your certificate will look. Upload images above to see them here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ImageUploadCard({ label, hint, imageUrl, uploading, onUpload }) {
  return (
    <div>
      <div className={`border-2 border-dashed rounded-lg p-3 transition-all hover:border-brand-400 cursor-pointer ${imageUrl ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-600'}`}>
        {imageUrl ? (
          <Image width={160} height={160} src={imageUrl} alt={label} className="h-12 mx-auto object-contain" />
        ) : (
          <Upload className="h-8 w-8 mx-auto text-gray-400" />
        )}
        <label className="block text-center mt-2 cursor-pointer">
          <span className={`text-xs font-medium ${uploading ? 'text-gray-400' : 'text-brand-600 hover:underline'}`}>
            {uploading ? 'Uploading...' : imageUrl ? 'Replace' : 'Upload'}
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={uploading} />
        </label>
      </div>
      <p className="text-[10px] text-center mt-1 font-medium">{label}</p>
      <p className="text-[9px] text-center text-muted-foreground">{hint}</p>
    </div>
  );
}

// ==================== MANUAL GENERATION TAB ====================
function ManualGenerationTab() {
  const [selectedType, setSelectedType] = useState('');
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedCert, setGeneratedCert] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(true);

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    try { const response = await certificateAPI.getTemplates(); if (response.success) setTemplates(response.data || []); } catch (error) { console.error(error); }
  };

  const fetchItems = async (type) => {
    try { setLoading(true); const response = await certificateAPI.getEligibleItems(type); if (response.success) setItems(response.data || []); } catch (error) { toast.error('Failed to load'); } finally { setLoading(false); }
  };

  const searchUsers = async (query) => {
    if (query.length < 2) { setUsers([]); return; }
    try { const response = await certificateAPI.searchUsers(query); if (response.success) setUsers(response.data || []); } catch (error) { console.error(error); }
  };

  const handleTypeChange = (type) => { setSelectedType(type); setSelectedItem(''); setItems([]); if (type) fetchItems(type); };

  const handleGenerate = async () => {
    if (!selectedType || !selectedItem || !selectedUser) { toast.error('Please fill all required fields'); return; }
    try {
      setGenerating(true);
      const response = await certificateAPI.generateManual({ userId: selectedUser.id, type: selectedType, referenceId: selectedItem, customName: customName || undefined });
      if (response.success) { toast.success('Certificate generated! Email sent.'); setGeneratedCert(response.data); }
    } catch (error) { toast.error(error.message || 'Failed'); } finally { setGenerating(false); }
  };

  const handleReset = () => { setSelectedType(''); setSelectedItem(''); setSelectedUser(null); setCustomName(''); setGeneratedCert(null); setItems([]); setUsers([]); setUserQuery(''); };

  const currentTemplate = templates.find(t => t.type === selectedType);
  const selectedItemData = items.find(i => i.id === selectedItem);

  if (generatedCert) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"><Award className="h-8 w-8 text-white" /></div>
          <h2 className="text-xl font-bold mb-2">🎉 Certificate Generated!</h2>
          <div className="flex items-center justify-center gap-2 mb-4"><Mail className="h-4 w-4 text-green-600" /><span className="text-green-600 text-sm">Email sent to {selectedUser?.email}</span></div>
          <p className="font-mono text-lg font-bold text-brand-600 mb-6">{generatedCert.certificateNo}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleReset}><Plus className="h-4 w-4 mr-1" />New</Button>
            <Button asChild><a href={generatedCert.certificateUrlPublic} target="_blank"><Download className="h-4 w-4 mr-1" />Download</a></Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Generate Certificate</CardTitle>
          <CardDescription>Fill in the details below to issue a certificate</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Type */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">1. Certificate Type</Label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {CERTIFICATE_TYPES.map(type => {
                const Icon = type.icon;
                const hasTemplate = templates.some(t => t.type === type.value);
                return (
                  <button key={type.value} onClick={() => handleTypeChange(type.value)} className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${selectedType === type.value ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                    <div className={`p-1 rounded ${type.color}`}><Icon className="h-3 w-3 text-white" /></div>
                    <span className="text-[9px] font-medium">{type.label}</span>
                    {hasTemplate && <span className="text-[8px] text-green-600">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Item */}
          {selectedType && (
            <div>
              <Label className="text-sm font-semibold mb-2 block">2. Select {CERTIFICATE_TYPES.find(t => t.value === selectedType)?.label}</Label>
              {loading ? <Skeleton className="h-10 w-full" /> : (
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger><SelectValue placeholder="Choose..." /></SelectTrigger>
                  <SelectContent>{items.length === 0 ? <SelectItem value="none" disabled>No items available</SelectItem> : items.map(item => <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* User Search */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">3. Select User</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={userQuery} onChange={e => { setUserQuery(e.target.value); searchUsers(e.target.value); setSelectedUser(null); }} placeholder="Search by name or email..." className={`pl-10 ${selectedUser ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : ''}`} />
            </div>
            {selectedUser && (
              <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /><span className="text-sm font-medium">{selectedUser.name || selectedUser.email}</span></div>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(null); setUserQuery(''); }}><XCircle className="h-4 w-4" /></Button>
              </div>
            )}
            {users.length > 0 && !selectedUser && (
              <div className="border rounded-lg mt-2 max-h-32 overflow-y-auto">
                {users.map(user => (
                  <button key={user.id} onClick={() => { setSelectedUser(user); setUserQuery(user.email); setUsers([]); }} className="w-full p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 border-b last:border-b-0">
                    <p className="text-sm font-medium">{user.name || 'No name'}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom Name */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">4. Custom Name (Optional)</Label>
            <Input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Leave empty to use registered name" />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setPreviewVisible(!previewVisible)} className="flex-1 gap-1">
              {previewVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {previewVisible ? 'Hide' : 'Show'} Preview
            </Button>
            <Button onClick={handleGenerate} disabled={generating || !selectedType || !selectedItem || !selectedUser} className="flex-1">
              {generating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Award className="h-4 w-4 mr-1" />}
              {generating ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {previewVisible && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2"><Eye className="h-5 w-5" />Certificate Preview</CardTitle>
            <CardDescription>Preview updates as you fill the form</CardDescription>
          </CardHeader>
          <CardContent>
            <CertificatePreview
              userName={customName || selectedUser?.name || 'Recipient Name'}
              itemTitle={selectedItemData?.title || 'Program Name'}
              type={selectedType || 'COURSE'}
              primaryColor={currentTemplate?.primaryColor || '#6366F1'}
              secondaryColor={currentTemplate?.secondaryColor || '#A5B4FC'}
              issuerName={currentTemplate?.issuerName || 'Shrestha Academy'}
              issuerTitle={currentTemplate?.issuerTitle || 'Platform Director'}
              logoUrl={currentTemplate?.logoUrl}
              signatureUrl={currentTemplate?.signatureUrl}
              stampUrl={currentTemplate?.stampUrl}
            />
            {!currentTemplate && selectedType && (
              <p className="text-xs text-amber-600 mt-3 text-center bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                ⚠️ No template configured for {CERTIFICATE_TYPES.find(t => t.value === selectedType)?.label}.
                Go to Design tab to upload logo/signature/stamp.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
