'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { webinarAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Video, ArrowRight } from 'lucide-react';
import { getPublicUrl } from '@/lib/imageUtils';
import Image from 'next/image';

export default function EventsPage() {
  const [webinars, setWebinars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    webinarAPI.getWebinars({ limit: 50 }).then((res) => {
      if (res.success && res.data?.webinars) {
        const free = res.data.webinars.filter((w) => w.isFree);
        setWebinars(free);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const formatTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Free Webinars & Events</h1>
          <p className="text-muted-foreground">Join free sessions on various topics. Great way to start learning and join our community.</p>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : webinars.length === 0 ? (
          <Card className="border-2">
            <CardContent className="py-16 text-center text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No free webinars at the moment. Check back later or browse all webinars.</p>
              <Link href="/webinars" className="mt-4 inline-block">
                <Button>Browse Webinars</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {webinars.map((w) => (
              <Link key={w.id} href={`/webinars/${w.slug}`}>
                <Card className="border-2 h-full hover:border-primary/30 transition-colors overflow-hidden">
                  <div className="relative aspect-video bg-muted">
                    {(w.image || w.thumbnailUrl) ? (
                      <Image
                        src={getPublicUrl(w.image || w.thumbnailUrl)}
                        alt={w.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Video className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <Badge className="absolute top-2 right-2 bg-green-600">Free</Badge>
                  </div>
                  <CardContent className="p-4">
                    <h2 className="font-semibold text-foreground line-clamp-2">{w.title}</h2>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 shrink-0" />
                      {formatDate(w.startDate)} • {formatTime(w.startDate)}
                    </div>
                    <span className="inline-flex items-center gap-1 mt-3 text-sm text-primary font-medium">
                      Join webinar <ArrowRight className="h-4 w-4" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
