'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Play, ArrowRight, CheckCircle2, Monitor, Zap, Shield } from 'lucide-react';
import Image from 'next/image';
import Breadcrumb from '@/components/Breadcrumb';
import ReactPlayer from 'react-player';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getPublicUrl } from '@/lib/imageUtils';
import SectionContainer from '@/components/detail/SectionContainer';

export default function IndicatorDetailClient({ indicator: initialIndicator }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [indicator] = useState(initialIndicator);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSubscribe = () => {
    if (!isAuthenticated) {
      router.push(`/auth?mode=login&redirect=/indicators/${indicator.slug}`);
      return;
    }
    router.push('/subscription');
  };

  if (!indicator) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Indicator not found</h2>
        <Button asChild>
          <a href="/indicators">Back to Indicators</a>
        </Button>
      </div>
    );
  }

  // Strip HTML and extract key points
  const descriptionText = indicator.description?.replace(/<[^>]*>/g, '').trim() || '';
  const descriptionPoints = descriptionText.split('\n').filter(Boolean).slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      {/* Product Hero - Tool/SaaS Style */}
      <div className="bg-gradient-to-br from-brand-50/50 via-white to-brand-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 border-b dark:border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-7xl">
          <Breadcrumb items={[
            { label: 'Home', href: '/' },
            { label: 'Indicators', href: '/indicators' },
            { label: indicator.name }
          ]} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 mt-8">
            {/* Left: Visual Preview */}
            <div className="space-y-4">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 shadow-xl bg-gradient-to-br from-brand-100 to-brand-200">
                {indicator.imageUrl ? (
                  <Image
                    src={getPublicUrl(indicator.imageUrl)}
                    alt={indicator.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <TrendingUp className="h-24 w-24 text-brand-400" />
                  </div>
                )}
                {indicator.videoUrl && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={() => setVideoDialogOpen(true)}
                      className="bg-white/90 hover:bg-white shadow-lg dark:bg-gray-800 dark:hover:bg-gray-700"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      Watch Demo
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Product Info */}
            <div className="space-y-6 flex flex-col justify-center">
              <div>
                <Badge className="mb-4 bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/30">
                  TradingView Indicator
                </Badge>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 dark:text-white">
                  {indicator.name}
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed dark:text-gray-300">
                  Professional TradingView indicator designed for precision technical analysis and market insights.
                </p>
              </div>

              {/* Key Features - Trading Focused */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <span className="text-sm font-medium dark:text-white">Real-time Signals</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium dark:text-white">TradingView Compatible</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium dark:text-white">Accurate Analysis</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                  <Monitor className="h-5 w-5 text-purple-500" />
                  <span className="text-sm font-medium dark:text-white">Easy Integration</span>
                </div>
              </div>

              {/* CTA */}
              <Button
                className="w-full bg-brand-600 hover:bg-brand-700 text-white h-12 text-base font-semibold"
                size="lg"
                onClick={handleSubscribe}
              >
                Get Access Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-12 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Features List */}
            {descriptionPoints.length > 0 && (
              <SectionContainer title="Key Features">
                <div className="grid gap-4">
                  {descriptionPoints.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-500 transition-colors">
                      <CheckCircle2 className="h-5 w-5 text-brand-600 dark:text-brand-400 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground dark:text-gray-300">{point.trim()}</span>
                    </div>
                  ))}
                </div>
              </SectionContainer>
            )}

            {/* Full Description */}
            <SectionContainer title="Indicator Details">
              <div
                className="prose prose-lg max-w-none text-muted-foreground dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: indicator.description }}
              />
            </SectionContainer>

            {/* TradingView Integration */}
            <SectionContainer title="TradingView Integration">
              <div className="space-y-4">
                <p className="text-muted-foreground dark:text-gray-300">
                  This indicator is designed specifically for TradingView platform. After subscription, you&apos;ll receive access to the indicator script that can be easily imported into your TradingView account.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="outline" className="px-4 py-2 text-sm font-medium bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700">
                    TradingView Compatible
                  </Badge>
                  {indicator.platform && indicator.platform.split(',').map((platform, idx) => (
                    <Badge key={idx} variant="outline" className="px-4 py-2 text-sm font-medium">
                      {platform.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            </SectionContainer>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-2 border-brand-100 dark:border-gray-700 dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="dark:text-white">Get Started</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground dark:text-gray-400">
                  Subscribe to get access to this TradingView indicator and enhance your trading analysis.
                </p>
                <Button
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white"
                  size="lg"
                  onClick={handleSubscribe}
                >
                  Subscribe Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <div className="pt-4 border-t dark:border-gray-700 space-y-3 text-sm dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span>Instant Access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span>Regular Updates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span>Expert Support</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Video Dialog */}
      <Dialog
        open={videoDialogOpen}
        onOpenChange={(open) => {
          setVideoDialogOpen(open);
          setIsPlaying(open);
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{indicator?.name} - Demo Video</DialogTitle>
            <DialogDescription>Watch how this TradingView indicator works</DialogDescription>
          </DialogHeader>
          {indicator?.videoUrl && (
            <div className="aspect-video rounded-lg overflow-hidden bg-black">
              <ReactPlayer
                url={indicator.videoUrl}
                width="100%"
                height="100%"
                controls
                playing={isPlaying}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                config={{
                  file: {
                    attributes: {
                      controlsList: 'nodownload',
                    },
                    hlsOptions: {
                      enableWorker: true,
                    },
                  },
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
