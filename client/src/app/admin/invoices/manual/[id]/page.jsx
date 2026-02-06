'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { invoiceAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Printer } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

export default function ManualInvoiceViewPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const printRef = useRef(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/auth');
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    if (user && isAdmin && id) {
      fetchInvoice();
    }
  }, [user, isAdmin, id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const res = await invoiceAPI.manual.get(id);
      if (res.success && res.data) setData(res.data);
    } catch (e) {
      toast.error(e.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!printRef.current || !data) return;
    const printContent = printRef.current;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${data?.manual?.invoiceNumber || 'Invoice'}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', sans-serif; font-size: 12px; color: #111; padding: 24px; }
            .invoice { max-width: 210mm; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="invoice">${printContent.innerHTML}</div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  if (!user || !isAdmin) return null;

  if (loading || !data) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const { manual, settings } = data;
  const logoUrl = settings?.logoUrl || settings?.logo;
  const stampUrl = settings?.stampUrl || settings?.stamp;
  const items = manual?.items || [];

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 print:hidden">
        <Link href="/admin/invoices">
          <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4" />
            Back to Invoices
          </Button>
        </Link>
        <Button onClick={handlePrint} className="gap-2 w-full sm:w-auto">
          <Printer className="h-4 w-4" />
          Print / Save as PDF
        </Button>
      </div>

      <div ref={printRef} className="bg-white text-gray-900 rounded-lg border shadow-sm p-4 sm:p-6 md:p-8 print:shadow-none print:border-0 print:p-0" style={{ maxWidth: '210mm' }}>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-gray-900 pb-4 mb-6">
          <div className="min-w-0">
            {logoUrl && (
              <div className="relative w-32 sm:w-40 h-12 sm:h-14 mb-2">
                <Image src={logoUrl} alt="Logo" fill className="object-contain object-left" unoptimized />
              </div>
            )}
            <h1 className="text-lg sm:text-xl font-bold">{settings?.companyName || 'Company Name'}</h1>
            {(settings?.address || settings?.city) && (
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                {[settings.address, settings.city, settings.state, settings.pincode].filter(Boolean).join(', ')}
              </p>
            )}
            {settings?.gstNumber && <p className="text-xs sm:text-sm text-gray-600 mt-0.5">GSTIN: {settings.gstNumber}</p>}
            {(settings?.phone || settings?.email) && (
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                {[settings.phone, settings.email].filter(Boolean).join(' | ')}
              </p>
            )}
          </div>
          <div className="text-left sm:text-right shrink-0">
            <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight">Tax Invoice</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Invoice # {manual.invoiceNumber}</p>
            <p className="text-xs sm:text-sm text-gray-600">Date: {new Date(manual.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            {manual.dueDate && (
              <p className="text-xs sm:text-sm text-gray-600">Due: {new Date(manual.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">Bill To</h3>
          <p className="font-semibold">{manual.billToName}</p>
          {manual.billToEmail && <p className="text-sm text-gray-600">{manual.billToEmail}</p>}
          {manual.billToPhone && <p className="text-sm text-gray-600">{manual.billToPhone}</p>}
          {manual.billToAddress && <p className="text-sm text-gray-600">{manual.billToAddress}</p>}
        </div>

        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="w-full border-collapse mb-4 min-w-[320px]">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="text-left py-2 px-1 sm:px-2 text-xs sm:text-sm font-semibold">#</th>
                <th className="text-left py-2 px-1 sm:px-2 text-xs sm:text-sm font-semibold">Description</th>
                <th className="text-right py-2 px-1 sm:px-2 text-xs sm:text-sm font-semibold">Qty</th>
                <th className="text-right py-2 px-1 sm:px-2 text-xs sm:text-sm font-semibold">Unit Price (₹)</th>
                <th className="text-right py-2 px-1 sm:px-2 text-xs sm:text-sm font-semibold">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-200">
                  <td className="py-2 px-1 sm:px-2 text-xs sm:text-sm">{idx + 1}</td>
                  <td className="py-2 px-1 sm:px-2 text-xs sm:text-sm">{item.description}</td>
                  <td className="py-2 px-1 sm:px-2 text-right text-xs sm:text-sm">{item.quantity}</td>
                  <td className="py-2 px-1 sm:px-2 text-right text-xs sm:text-sm">{Number(item.unitPrice).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                  <td className="py-2 px-1 sm:px-2 text-right text-xs sm:text-sm">{Number(item.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <table className="w-64">
            <tbody>
              {manual.subtotal > 0 && manual.subtotal !== manual.total && (
                <tr>
                  <td className="py-1 px-2 text-right text-gray-600">Subtotal</td>
                  <td className="py-1 px-2 text-right">₹{Number(manual.subtotal).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                </tr>
              )}
              {manual.taxTotal > 0 && (
                <tr>
                  <td className="py-1 px-2 text-right text-gray-600">Tax</td>
                  <td className="py-1 px-2 text-right">₹{Number(manual.taxTotal).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                </tr>
              )}
              {manual.discount > 0 && (
                <tr>
                  <td className="py-1 px-2 text-right text-gray-600">Discount</td>
                  <td className="py-1 px-2 text-right">- ₹{Number(manual.discount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                </tr>
              )}
              <tr className="border-t-2 border-gray-900">
                <td className="py-2 px-2 text-right font-semibold">Total (INR)</td>
                <td className="py-2 px-2 text-right font-bold">₹{Number(manual.total).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {manual.notes && <div className="mt-4 text-xs text-gray-600 whitespace-pre-wrap">{manual.notes}</div>}

        {(settings?.bankName || settings?.bankAccount) && (
          <div className="mt-6 pt-4 border-t border-gray-200 text-sm">
            <h3 className="font-semibold text-gray-700 mb-1">Bank Details</h3>
            <p>{settings.bankName}</p>
            <p>Account: {settings.bankAccount} {settings.ifscCode && `| IFSC: ${settings.ifscCode}`}</p>
          </div>
        )}
        {settings?.terms && <div className="mt-4 text-xs text-gray-600 whitespace-pre-wrap">{settings.terms}</div>}
        {stampUrl && (
          <div className="mt-4 flex justify-end">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16">
              <Image src={stampUrl} alt="Stamp" fill className="object-contain" unoptimized />
            </div>
          </div>
        )}
        {settings?.footerText && (
          <div className="mt-6 pt-4 border-t border-gray-200 text-center text-xs sm:text-sm text-gray-600">{settings.footerText}</div>
        )}
      </div>
    </div>
  );
}
