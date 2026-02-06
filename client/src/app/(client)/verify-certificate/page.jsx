'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { certificateAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, CheckCircle2, XCircle, Search, Calendar, Download, BookOpen, Video, Users, FileText } from 'lucide-react';

const TYPE_INFO = {
  COURSE: { label: 'Course', icon: BookOpen, color: 'bg-blue-500' },
  WEBINAR: { label: 'Webinar', icon: Video, color: 'bg-purple-500' },
  GUIDANCE: { label: '1:1 Guidance', icon: FileText, color: 'bg-green-500' },
  OFFLINE_BATCH: { label: 'Offline Batch', icon: Award, color: 'bg-orange-500' },
  BUNDLE: { label: 'Bundle', icon: Award, color: 'bg-pink-500' },
};

function VerifyCertificatePageContent() {
  const searchParams = useSearchParams();
  const [certificateNo, setCertificateNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const initial = searchParams.get('certificateNo') || searchParams.get('id');
    if (initial) {
      setCertificateNo(initial);
      handleVerify(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async (value) => {
    const certId = (value || certificateNo || '').trim();
    if (!certId) {
      setError('Please enter a certificate ID');
      setResult(null);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);
      const response = await certificateAPI.verifyCertificate(certId);
      if (response.success && response.valid) {
        setResult(response.data);
      } else {
        setError(response.message || 'Invalid certificate');
      }
    } catch {
      setError('Unable to verify certificate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    handleVerify();
  };

  const getTypeInfo = (type) => TYPE_INFO[type] || { label: type, icon: Award, color: 'bg-gray-500' };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="shadow-xl border border-slate-200 dark:border-gray-800 dark:bg-gray-900/50 backdrop-blur">
          <CardContent className="p-6 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                  Verify Certificate
                </h1>
                <p className="text-sm text-slate-500 dark:text-gray-400">
                  Enter the unique certificate ID to verify its authenticity
                </p>
              </div>
            </div>

            {/* Search Form */}
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-gray-500" />
                <Input
                  placeholder="Enter certificate ID (e.g. CERT-XXXX-YYYY)"
                  value={certificateNo}
                  onChange={(e) => setCertificateNo(e.target.value)}
                  className="pl-10 py-6 text-sm font-mono bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-700 font-semibold py-6"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify Certificate'}
              </Button>
            </form>

            {/* Error State */}
            {error && (
              <div className="mt-2 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 px-4 py-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-800/30 flex items-center justify-center flex-shrink-0">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">Certificate Not Found</p>
                  <p className="text-xs text-red-600 dark:text-red-300 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Success State */}
            {result && (
              <div className="mt-2 space-y-4">
                {/* Verified Badge */}
                <div className="rounded-xl border-2 border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-800/30 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                        ✓ Certificate Verified
                      </p>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400">
                        This is an authentic certificate issued by Shrestha Academy
                      </p>
                    </div>
                  </div>
                </div>

                {/* Certificate Details */}
                <div className="rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-800">
                    <p className="text-xs text-slate-500 dark:text-gray-400 uppercase tracking-wide">Certificate Details</p>
                  </div>
                  <div className="p-4 space-y-3">
                    <DetailRow label="Certificate ID" value={
                      <span className="font-mono text-xs bg-slate-100 dark:bg-gray-700 px-2 py-1 rounded border border-slate-200 dark:border-gray-600">
                        {result.certificateNo}
                      </span>
                    } />
                    <DetailRow label="Recipient" value={<span className="font-semibold">{result.recipientName}</span>} />
                    <DetailRow label="Program Type" value={
                      <Badge className={`${getTypeInfo(result.type).color} text-white border-0`}>
                        {getTypeInfo(result.type).label}
                      </Badge>
                    } />
                    <DetailRow label="Program Name" value={result.itemDetails?.title || 'N/A'} />
                    <DetailRow label="Issued On" value={
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {new Date(result.issuedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    } />
                    <DetailRow label="Status" value={<Badge variant="success">Active & Verified</Badge>} />
                  </div>
                </div>

                {/* Download Button */}
                {result.certificateUrlPublic && (
                  <Button asChild className="w-full py-5" variant="outline">
                    <a href={result.certificateUrlPublic} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Download Certificate PDF
                    </a>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 dark:text-gray-600 mt-6">
          © {new Date().getFullYear()} Shrestha Academy. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function VerifyCertificatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Skeleton className="h-96 w-full max-w-2xl" /></div>}>
      <VerifyCertificatePageContent />
    </Suspense>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-100 dark:border-gray-700 last:border-0">
      <span className="text-sm text-slate-500 dark:text-gray-400">{label}</span>
      <span className="text-sm text-slate-900 dark:text-white text-right">{value}</span>
    </div>
  );
}
