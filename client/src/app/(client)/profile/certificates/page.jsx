'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { certificateAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Award, Download, ExternalLink, BookOpen, Video, Calendar, CheckCircle, Users, FileText, GraduationCap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { getPublicUrl } from '@/lib/imageUtils';

const TYPE_CONFIG = {
  COURSE: { label: 'Course', icon: BookOpen, color: 'bg-blue-500' },
  WEBINAR: { label: 'Webinar', icon: Video, color: 'bg-purple-500' },
  GUIDANCE: { label: '1:1 Guidance', icon: FileText, color: 'bg-green-500' },
  OFFLINE_BATCH: { label: 'Offline Batch', icon: GraduationCap, color: 'bg-orange-500' },
  BUNDLE: { label: 'Bundle', icon: Award, color: 'bg-pink-500' },
};

export default function CertificatesPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth?redirect=/profile/certificates');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCertificates();
    }
  }, [isAuthenticated]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await certificateAPI.getMyCertificates();
      if (response.success) {
        setCertificates(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const filteredCertificates = certificates.filter(cert => {
    if (activeTab === 'all') return true;
    return cert.type === activeTab;
  });

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTypeConfig = (type) => TYPE_CONFIG[type] || { label: type, icon: Award, color: 'bg-gray-500' };

  // Get unique types from certificates for tab filtering
  const availableTypes = [...new Set(certificates.map(c => c.type))];

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Award className="h-7 w-7 text-brand-600" />
            My Certificates
          </h1>
          <p className="text-muted-foreground mt-1">
            Your earned certificates from completed programs
          </p>
        </div>
        <Badge variant="outline" className="self-start md:self-auto text-brand-600 border-brand-600 px-4 py-2">
          <Award className="h-4 w-4 mr-1" />
          {certificates.length} Certificate{certificates.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 flex-wrap">
        <Button
          variant={activeTab === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('all')}
          className={activeTab === 'all' ? 'bg-brand-600 hover:bg-brand-700' : ''}
        >
          All ({certificates.length})
        </Button>
        {Object.entries(TYPE_CONFIG).map(([type, config]) => {
          const count = certificates.filter(c => c.type === type).length;
          if (count === 0) return null;
          const Icon = config.icon;
          return (
            <Button
              key={type}
              variant={activeTab === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(type)}
              className={`gap-1 ${activeTab === type ? 'bg-brand-600 hover:bg-brand-700' : ''}`}
            >
              <Icon className="h-3 w-3" />
              {config.label} ({count})
            </Button>
          );
        })}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredCertificates.length === 0 ? (
        /* Empty State */
        <Card className="py-16">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Award className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Certificates Yet
            </h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Complete courses, mentorships, or other programs to earn your certificates.
              Start learning today!
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              <Link href="/courses">
                <Button className="bg-brand-600 hover:bg-brand-700">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse Courses
                </Button>
              </Link>
              <Link href="/mentorship">
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  View Mentorships
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Certificates Grid */
        <div className="grid gap-4">
          {filteredCertificates.map((cert) => {
            const typeConfig = getTypeConfig(cert.type);
            const TypeIcon = typeConfig.icon;
            return (
              <Card key={cert.id} className="overflow-hidden hover:shadow-lg transition-shadow border-l-4" style={{ borderLeftColor: typeConfig.color.replace('bg-', '').includes('500') ? '' : undefined }}>
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Certificate Logo/Preview */}
                    <div className={`md:w-48 h-32 md:h-auto ${typeConfig.color} flex items-center justify-center relative`}>
                      {cert.itemDetails?.coverImageUrl || cert.itemDetails?.imageUrl ? (
                        <Image
                          src={getPublicUrl(cert.itemDetails.coverImageUrl || cert.itemDetails.imageUrl)}
                          alt={cert.itemDetails.title || 'Certificate'}
                          fill
                          className="object-cover opacity-40"
                        />
                      ) : null}
                      <Award className="h-12 w-12 text-white relative z-10" />
                    </div>

                    {/* Certificate Details */}
                    <div className="flex-1 p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Type Badge */}
                          <Badge className={`${typeConfig.color} text-white border-0 mb-2`}>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {typeConfig.label}
                          </Badge>

                          {/* Title */}
                          <h3 className="text-lg font-semibold text-foreground mb-1">
                            {cert.itemDetails?.title || 'Certificate of Completion'}
                          </h3>

                          {/* Certificate Number */}
                          <p className="text-sm text-muted-foreground font-mono mb-2">
                            {cert.certificateNo}
                          </p>

                          {/* Issue Date */}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Issued on {formatDate(cert.issuedAt)}</span>
                          </div>

                          {/* Status */}
                          <div className="flex items-center gap-2 mt-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-600 font-medium">Verified & Active</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-row md:flex-col gap-2">
                          {cert.certificateUrl && (
                            <Button
                              asChild
                              className="bg-brand-600 hover:bg-brand-700 flex-1 md:flex-none"
                              size="sm"
                            >
                              <a href={cert.certificateUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </a>
                            </Button>
                          )}
                          <Link href={`/verify-certificate?certificateNo=${encodeURIComponent(cert.certificateNo)}`} target="_blank">
                            <Button variant="outline" size="sm" className="w-full">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Verify
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
