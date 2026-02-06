'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { invoiceAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

const emptyItem = () => ({ description: '', quantity: 1, unitPrice: '', taxLabel: '', taxRate: 0 });

export default function CreateInvoicePage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [taxPresets, setTaxPresets] = useState([]);
  const [billTo, setBillTo] = useState({ name: '', email: '', phone: '', address: '' });
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState([emptyItem()]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/auth');
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    if (user && isAdmin) {
      invoiceAPI.getSettings().then((res) => {
        if (res.success && res.data?.taxPresets) {
          setTaxPresets(Array.isArray(res.data.taxPresets) ? res.data.taxPresets : []);
        }
      });
    }
  }, [user, isAdmin]);

  const addRow = () => setItems((prev) => [...prev, emptyItem()]);
  const removeRow = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };
  const updateItem = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === 'taxLabel' && taxPresets.length) {
        const preset = taxPresets.find((p) => (p.label || '').trim() === String(value).trim());
        if (preset) next[index].taxRate = preset.rate ?? 0;
      }
      return next;
    });
  };

  const subtotal = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  const taxTotal = items.reduce((sum, it) => {
    const amt = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
    const rate = Number(it.taxRate) || 0;
    return sum + (amt * rate) / 100;
  }, 0);
  const discountVal = Number(discount) || 0;
  const total = Math.round((subtotal + taxTotal - discountVal) * 100) / 100;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!billTo.name.trim()) {
      toast.error('Bill to name required');
      return;
    }
    const validItems = items.filter((it) => (it.description || '').trim() || Number(it.unitPrice));
    if (validItems.length === 0) {
      toast.error('Add at least one item with description and price');
      return;
    }
    setLoading(true);
    try {
      const res = await invoiceAPI.manual.create({
        billToName: billTo.name.trim(),
        billToEmail: billTo.email.trim() || undefined,
        billToPhone: billTo.phone.trim() || undefined,
        billToAddress: billTo.address.trim() || undefined,
        invoiceDate,
        dueDate: dueDate || undefined,
        items: validItems.map((it) => ({
          description: (it.description || 'Item').trim(),
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          taxLabel: (it.taxLabel || '').trim() || null,
          taxRate: Number(it.taxRate) || 0,
        })),
        discount: discountVal,
        notes: notes.trim() || undefined,
        status: 'DRAFT',
      });
      if (res.success && res.data?.id) {
        toast.success('Invoice created');
        router.push(`/admin/invoices/manual/${res.data.id}`);
      } else {
        toast.error(res?.message || 'Failed to create');
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !isAdmin) return null;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link href="/admin/invoices">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Invoices
          </Button>
        </Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Create invoice
        </h1>
      </div>

      <p className="text-muted-foreground text-sm mb-6">
        Create an invoice for anything — courses, ebooks, office work, services. Add items, set prices and tax per line as needed.
      </p>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Bill to</CardTitle>
            <CardDescription>Customer / client details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={billTo.name}
                  onChange={(e) => setBillTo((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Client name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={billTo.email}
                  onChange={(e) => setBillTo((p) => ({ ...p, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={billTo.phone}
                  onChange={(e) => setBillTo((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="Phone"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Address</Label>
                <Textarea
                  value={billTo.address}
                  onChange={(e) => setBillTo((p) => ({ ...p, address: e.target.value }))}
                  placeholder="Billing address"
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Invoice date</Label>
                <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Due date (optional)</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Items</CardTitle>
              <CardDescription>Description, quantity, unit price, and tax (choose a preset or enter custom rate)</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <Plus className="h-4 w-4 mr-2" />
              Add row
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">#</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[80px]">Qty</TableHead>
                    <TableHead className="w-[100px]">Unit price (₹)</TableHead>
                    <TableHead className="w-[140px]">Tax</TableHead>
                    <TableHead className="w-[100px] text-right">Amount (₹)</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <Input
                          value={it.description}
                          onChange={(e) => updateItem(i, 'description', e.target.value)}
                          placeholder="Item / service"
                          className="min-w-[140px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          value={it.quantity}
                          onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                          className="w-16"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={it.unitPrice}
                          onChange={(e) => updateItem(i, 'unitPrice', e.target.value)}
                          placeholder="0"
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        {taxPresets.length > 0 ? (
                          <Select
                            value={it.taxLabel || ''}
                            onValueChange={(v) => {
                              updateItem(i, 'taxLabel', v);
                              const p = taxPresets.find((x) => (x.label || '') === v);
                              if (p) updateItem(i, 'taxRate', p.rate);
                            }}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue placeholder="Tax" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">No tax</SelectItem>
                              {taxPresets.map((p) => (
                                <SelectItem key={p.label || p.rate} value={String(p.label || '')}>
                                  {p.label || `${p.rate}%`} ({p.rate}%)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            step={0.01}
                            value={it.taxRate || ''}
                            onChange={(e) => updateItem(i, 'taxRate', e.target.value)}
                            placeholder="0%"
                            className="w-20"
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(i)} disabled={items.length <= 1} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              <span>Subtotal: ₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              {taxTotal > 0 && <span>Tax: ₹{taxTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>}
              <div className="flex items-center gap-2">
                <Label className="text-sm">Discount (₹)</Label>
                <Input type="number" min={0} step={0.01} value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-24" />
              </div>
              <span className="font-bold">Total: ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Notes (optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Terms, payment info, etc." rows={2} className="resize-none" />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="bg-brand-600 hover:bg-brand-700">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create & view invoice
          </Button>
          <Link href="/admin/invoices">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
