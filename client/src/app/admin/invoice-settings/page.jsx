'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { invoiceAPI } from '@/lib/api';
import MediaPicker from '@/components/admin/MediaPicker';
import { Settings, Image as ImageIcon, Eye, EyeOff, Loader2, FileText, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

const defaultForm = {
  companyName: '',
  logo: '',
  stamp: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  gstNumber: '',
  gstRateCourse: '',
  gstRateNonCourse: '',
  phone: '',
  email: '',
  website: '',
  bankName: '',
  bankAccount: '',
  ifscCode: '',
  invoicePrefix: 'INV/',
  taxPresets: [], // [{ label: "Course (GST 18%)", rate: 18 }, ...]
  terms: '',
  footerText: '',
};

export default function AdminInvoiceSettingsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLogoPicker, setShowLogoPicker] = useState(false);
  const [showStampPicker, setShowStampPicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [logoPreview, setLogoPreview] = useState('');
  const [stampPreview, setStampPreview] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/auth');
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    if (user && isAdmin) fetchSettings();
  }, [user, isAdmin]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await invoiceAPI.getSettings();
      if (res.success && res.data) {
        const d = res.data;
        setForm({
          companyName: d.companyName ?? '',
          logo: d.logo ?? '',
          stamp: d.stamp ?? '',
          address: d.address ?? '',
          city: d.city ?? '',
          state: d.state ?? '',
          pincode: d.pincode ?? '',
          gstNumber: d.gstNumber ?? '',
          gstRateCourse: d.gstRateCourse != null ? String(d.gstRateCourse) : '',
          gstRateNonCourse: d.gstRateNonCourse != null ? String(d.gstRateNonCourse) : '',
          phone: d.phone ?? '',
          email: d.email ?? '',
          website: d.website ?? '',
          bankName: d.bankName ?? '',
          bankAccount: d.bankAccount ?? '',
          ifscCode: d.ifscCode ?? '',
          invoicePrefix: d.invoicePrefix ?? 'INV/',
          taxPresets: Array.isArray(d.taxPresets) ? d.taxPresets : [],
          terms: d.terms ?? '',
          footerText: d.footerText ?? '',
        });
        setLogoPreview(d.logoUrl || '');
        setStampPreview(d.stampUrl || '');
      }
    } catch (e) {
      toast.error(e.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoSelect = (url) => {
    setForm((prev) => ({ ...prev, logo: url }));
    setLogoPreview(url);
    setShowLogoPicker(false);
  };

  const handleStampSelect = (url) => {
    setForm((prev) => ({ ...prev, stamp: url }));
    setStampPreview(url);
    setShowStampPicker(false);
  };

  const addTaxPreset = () => {
    setForm((prev) => ({
      ...prev,
      taxPresets: [...(prev.taxPresets || []), { label: '', rate: '' }],
    }));
  };
  const updateTaxPreset = (index, field, value) => {
    setForm((prev) => {
      const arr = [...(prev.taxPresets || [])];
      arr[index] = { ...arr[index], [field]: value };
      return { ...prev, taxPresets: arr };
    });
  };
  const removeTaxPreset = (index) => {
    setForm((prev) => ({
      ...prev,
      taxPresets: (prev.taxPresets || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = { ...form };
      if (Array.isArray(form.taxPresets)) {
        payload.taxPresets = form.taxPresets
          .map((p) => ({ label: String(p.label || '').trim(), rate: p.rate === '' ? 0 : Number(p.rate) }))
          .filter((p) => p.label || p.rate !== 0);
      }
      const res = await invoiceAPI.updateSettings(payload);
      if (res.success) {
        toast.success('Invoice settings saved');
        if (res.data?.logoUrl) setLogoPreview(res.data.logoUrl);
        if (res.data?.stampUrl) setStampPreview(res.data.stampUrl);
      }
    } catch (e) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!user || !isAdmin) return null;

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const fullAddress = [form.address, form.city, form.state, form.pincode].filter(Boolean).join(', ');
  const invoiceNumberSample = (form.invoicePrefix || 'INV/') + 'ORD-001';

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-brand-600 flex items-center justify-center">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Invoice Settings</h1>
            <p className="text-muted-foreground text-sm">Company details, GST, bank & format — used for all order and manual invoices</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowPreview((p) => !p)}
          className="shrink-0"
        >
          {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
          {showPreview ? 'Hide preview' : 'View preview'}
        </Button>
      </div>

      {/* Real-time preview — collapsed by default */}
      {showPreview && (
        <Card className="mb-6 border-2 border-dashed border-muted-foreground/30 bg-muted/20">
          <CardHeader className="py-3">
            <CardTitle className="text-base">Live preview (sample)</CardTitle>
            <CardDescription>How the invoice will look with current settings</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="bg-white text-gray-900 rounded-lg border shadow-sm p-4 md:p-6 min-w-[280px] max-w-[210mm] mx-auto" style={{ maxWidth: '210mm' }}>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-gray-900 pb-3 mb-4">
                <div>
                  {logoPreview && (
                    <div className="relative w-32 h-12 mb-2">
                      <Image src={logoPreview} alt="Logo" fill className="object-contain object-left" unoptimized />
                    </div>
                  )}
                  <h2 className="text-lg font-bold">{form.companyName || 'Company Name'}</h2>
                  {fullAddress && <p className="text-xs text-gray-600">{fullAddress}</p>}
                  {form.gstNumber && <p className="text-xs text-gray-600">GSTIN: {form.gstNumber}</p>}
                  {(form.phone || form.email) && (
                    <p className="text-xs text-gray-600">{[form.phone, form.email].filter(Boolean).join(' | ')}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold uppercase">Tax Invoice</p>
                  <p className="text-xs text-gray-600">Invoice # {invoiceNumberSample}</p>
                  <p className="text-xs text-gray-600">Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Bill To</p>
                <p className="font-medium">Customer Name</p>
                <p className="text-xs text-gray-600">customer@example.com</p>
              </div>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-900">
                    <th className="text-left py-1">#</th>
                    <th className="text-left py-1">Description</th>
                    <th className="text-right py-1">Qty</th>
                    <th className="text-right py-1">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-1">1</td>
                    <td className="py-1">Sample Course / Ebook</td>
                    <td className="text-right py-1">1</td>
                    <td className="text-right py-1">1,000.00</td>
                  </tr>
                </tbody>
              </table>
              <div className="flex justify-end mt-2">
                <table className="w-48 text-xs">
                  <tr className="border-t-2 border-gray-900">
                    <td className="py-1 text-right text-gray-600">Total (INR)</td>
                    <td className="py-1 text-right font-bold">₹1,000.00</td>
                  </tr>
                </table>
              </div>
              {(form.gstRateCourse || form.gstRateNonCourse) && (
                <p className="text-xs text-gray-500 mt-2">
                  GST: Course {form.gstRateCourse ? form.gstRateCourse + '%' : '–'} | Other {form.gstRateNonCourse ? form.gstRateNonCourse + '%' : '–'}
                </p>
              )}
              {stampPreview && (
                <div className="mt-3 flex justify-end">
                  <div className="relative w-16 h-16">
                    <Image src={stampPreview} alt="Stamp" fill className="object-contain" unoptimized />
                  </div>
                </div>
              )}
              {(form.bankName || form.bankAccount) && (
                <div className="mt-3 pt-2 border-t border-gray-200 text-xs">
                  <p className="font-semibold">Bank: {form.bankName}</p>
                  <p>Account: {form.bankAccount} {form.ifscCode && `| IFSC: ${form.ifscCode}`}</p>
                </div>
              )}
              {form.footerText && <p className="mt-3 pt-2 border-t border-gray-200 text-center text-xs text-gray-600">{form.footerText}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        {/* Summary table — key settings at a glance */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Invoice format & GST</CardTitle>
            <CardDescription>Prefix for invoice number. GST % for course vs ebook/other (order-based). Add Tax presets below for manual / office / any invoice.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Setting</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Invoice number prefix</TableCell>
                    <TableCell>
                      <Input
                        name="invoicePrefix"
                        value={form.invoicePrefix}
                        onChange={handleChange}
                        placeholder="INV/"
                        className="max-w-[140px]"
                      />
                      <span className="ml-2 text-xs text-muted-foreground">e.g. {invoiceNumberSample}</span>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">GSTIN</TableCell>
                    <TableCell>
                      <Input
                        name="gstNumber"
                        value={form.gstNumber}
                        onChange={handleChange}
                        placeholder="22AAAAA0000A1Z5"
                        className="max-w-[220px]"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">GST % (Course)</TableCell>
                    <TableCell>
                      <Input
                        name="gstRateCourse"
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        value={form.gstRateCourse}
                        onChange={handleChange}
                        placeholder="18"
                        className="max-w-[80px]"
                      />
                      <span className="ml-2 text-xs text-muted-foreground">Applied on course orders</span>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">GST % (Ebook / Other)</TableCell>
                    <TableCell>
                      <Input
                        name="gstRateNonCourse"
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        value={form.gstRateNonCourse}
                        onChange={handleChange}
                        placeholder="0"
                        className="max-w-[80px]"
                      />
                      <span className="ml-2 text-xs text-muted-foreground">Ebook, webinar, etc.</span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Tax presets — for any invoice type */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Tax presets (for any item type)</CardTitle>
            <CardDescription>These taxes can be chosen per line when creating a manual invoice — e.g. Course, Ebook, Office work, Service. Add a label and rate %, then save.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Tax label (e.g. what it applies to)</TableHead>
                    <TableHead className="w-[120px]">Rate %</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(form.taxPresets || []).map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <Input
                          value={p.label || ''}
                          onChange={(e) => updateTaxPreset(i, 'label', e.target.value)}
                          placeholder="e.g. Course (GST 18%), Office 12%, Ebook 0%"
                          className="max-w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.01}
                          value={p.rate === '' ? '' : p.rate}
                          onChange={(e) => updateTaxPreset(i, 'rate', e.target.value)}
                          placeholder="0"
                          className="max-w-[80px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeTaxPreset(i)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={addTaxPreset}>
              <Plus className="h-4 w-4 mr-2" />
              Add tax preset
            </Button>
          </CardContent>
        </Card>

        {/* Company & Logo & Stamp */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Company, logo & stamp</CardTitle>
            <CardDescription>Used on every invoice — orders and manual invoices (course, ebook, office, service, etc.)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company name</Label>
                <Input name="companyName" value={form.companyName} onChange={handleChange} placeholder="Your Company / Academy" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex flex-wrap items-center gap-3">
                  {logoPreview ? (
                    <div className="relative w-20 h-20 rounded border bg-muted overflow-hidden shrink-0">
                      <Image src={logoPreview} alt="Logo" fill className="object-contain p-1" unoptimized />
                    </div>
                  ) : null}
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowLogoPicker(true)}>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    {logoPreview ? 'Change' : 'Select'}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Stamp (optional)</Label>
                <div className="flex flex-wrap items-center gap-3">
                  {stampPreview ? (
                    <div className="relative w-20 h-20 rounded border bg-muted overflow-hidden shrink-0">
                      <Image src={stampPreview} alt="Stamp" fill className="object-contain p-1" unoptimized />
                    </div>
                  ) : null}
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowStampPicker(true)}>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    {stampPreview ? 'Change' : 'Select'}
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea name="address" value={form.address} onChange={handleChange} placeholder="Street, Building" rows={2} className="resize-none" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input name="city" value={form.city} onChange={handleChange} placeholder="City" />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input name="state" value={form.state} onChange={handleChange} placeholder="State" />
              </div>
              <div className="space-y-2">
                <Label>Pincode</Label>
                <Input name="pincode" value={form.pincode} onChange={handleChange} placeholder="Pincode" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input name="email" type="email" value={form.email} onChange={handleChange} placeholder="billing@example.com" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Website</Label>
                <Input name="website" value={form.website} onChange={handleChange} placeholder="https://..." />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Bank details</CardTitle>
            <CardDescription>Shown on invoice for payment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Bank name</Label>
              <Input name="bankName" value={form.bankName} onChange={handleChange} placeholder="Bank Name" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account number</Label>
                <Input name="bankAccount" value={form.bankAccount} onChange={handleChange} placeholder="Account No." />
              </div>
              <div className="space-y-2">
                <Label>IFSC code</Label>
                <Input name="ifscCode" value={form.ifscCode} onChange={handleChange} placeholder="IFSC" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms & Footer */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Terms & footer</CardTitle>
            <CardDescription>Terms and footer text on invoice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Terms & conditions</Label>
              <Textarea name="terms" value={form.terms} onChange={handleChange} placeholder="Optional terms" rows={3} className="resize-none" />
            </div>
            <div className="space-y-2">
              <Label>Footer text</Label>
              <Textarea name="footerText" value={form.footerText} onChange={handleChange} placeholder="Thank you for your business" rows={2} className="resize-none" />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving} className="bg-brand-600 hover:bg-brand-700">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {saving ? 'Saving...' : 'Save settings'}
        </Button>
      </form>

      <MediaPicker open={showLogoPicker} onOpenChange={setShowLogoPicker} onSelect={handleLogoSelect} type="image" title="Select logo" description="Choose from media" />
      <MediaPicker open={showStampPicker} onOpenChange={setShowStampPicker} onSelect={handleStampSelect} type="image" title="Select stamp" description="Choose from media" />
    </div>
  );
}
