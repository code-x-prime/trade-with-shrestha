'use client';

import { useState, useEffect, use } from 'react';
import { certificateAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, CheckCircle, XCircle, Calendar, User, BookOpen, Video, ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';

export default function VerifyCertificatePage({ params }) {
  const { certificateNo } = use(params);
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (certificateNo) {
      verifyCertificate();
    }
  }, [certificateNo]);

  const verifyCertificate = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await certificateAPI.verifyCertificate(certificateNo);
      if (response.success) {
        setCertificate(response);
      } else {
        setError(response.message || 'Certificate not found');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to verify certificate');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTypeIcon = (type) => {
    if (type === 'COURSE') return <BookOpen className="h-5 w-5" />;
    if (type === 'WEBINAR') return <Video className="h-5 w-5" />;
    return <Award className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-900/30 mb-4">
            <Shield className="h-8 w-8 text-brand-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Certificate Verification
          </h1>
          <p className="text-muted-foreground mt-2">
            Verify the authenticity of a certificate
          </p>
        </div>

        {/* Certificate Number Display */}
        <div className="text-center mb-6">
          <p className="text-sm text-muted-foreground mb-1">Certificate Number</p>
          <p className="font-mono text-lg font-medium text-foreground bg-muted px-4 py-2 rounded-lg inline-block">
            {certificateNo}
          </p>
        </div>

        {/* Result Card */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {error ? (
              /* Invalid/Not Found State */
              <div className="bg-red-50 dark:bg-red-950/30 p-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">
                  Certificate Not Valid
                </h2>
                <p className="text-red-600/80 dark:text-red-400/80 max-w-md mx-auto">
                  {error}
                </p>
              </div>
            ) : certificate?.valid === false ? (
              /* Revoked State */
              <div className="bg-amber-50 dark:bg-amber-950/30 p-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
                  <XCircle className="h-10 w-10 text-amber-600" />
                </div>
                <h2 className="text-xl font-semibold text-amber-700 dark:text-amber-400 mb-2">
                  Certificate Revoked
                </h2>
                <p className="text-amber-600/80 dark:text-amber-400/80">
                  This certificate has been revoked and is no longer valid.
                </p>
              </div>
            ) : certificate?.valid ? (
              /* Valid State */
              <>
                <div className="bg-green-50 dark:bg-green-950/30 p-8 text-center border-b">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-green-700 dark:text-green-400 mb-2">
                    Certificate Verified
                  </h2>
                  <p className="text-green-600/80 dark:text-green-400/80">
                    This certificate is authentic and valid.
                  </p>
                </div>

                <div className="p-6 space-y-4">
                  {/* Recipient */}
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30">
                      <User className="h-5 w-5 text-brand-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Issued To</p>
                      <p className="font-medium text-foreground">
                        {certificate.data.recipientName}
                      </p>
                    </div>
                  </div>

                  {/* Type & Title */}
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30">
                      {getTypeIcon(certificate.data.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        {certificate.data.type === 'COURSE' ? 'Course' : 'Webinar'} Completed
                      </p>
                      <p className="font-medium text-foreground">
                        {certificate.data.itemDetails?.title || 'N/A'}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {certificate.data.type}
                    </Badge>
                  </div>

                  {/* Issue Date */}
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30">
                      <Calendar className="h-5 w-5 text-brand-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Issue Date</p>
                      <p className="font-medium text-foreground">
                        {formatDate(certificate.data.issuedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Certificate Number */}
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30">
                      <Award className="h-5 w-5 text-brand-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Certificate Number</p>
                      <p className="font-mono font-medium text-foreground">
                        {certificate.data.certificateNo}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        {/* Footer Note */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          This verification service is provided by Shrestha Academy.
          <br />
          For any queries, please contact support.
        </p>
      </div>
    </div>
  );
}

