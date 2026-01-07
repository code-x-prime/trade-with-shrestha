'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Refund Policy & Cancellation Terms</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-2 font-medium">Course Fee & Refund Guidelines</p>
          <p className="text-lg text-slate-500 dark:text-slate-500 mb-8 font-medium">PLEASE READ CAREFULLY BEFORE ENROLLING</p>

          <div className="space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">1. Course Fees</h2>
              <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                All course fees are clearly communicated before enrollment. By enrolling, you acknowledge understanding the course structure, delivery mode, duration, and pricing.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">2. No Refund Policy</h2>
              <p className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                Course fees are non-refundable in the following cases:
              </p>
              <ul className="list-disc pl-6 text-lg text-slate-700 dark:text-slate-300 space-y-3">
                <li>After course access is granted</li>
                <li>After attending live classes</li>
                <li>After accessing or downloading recorded sessions</li>
                <li>Change of mind or personal scheduling issues</li>
                <li>Dissatisfaction related to job placement outcomes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">3. Placement & Refund Clarification</h2>
              <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                Non-placement or dissatisfaction related to job outcomes shall not be considered grounds for a refund, as Shrestha Academy provides job assistance but does not guarantee job placement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">4. Exceptional Refund Cases</h2>
              <p className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                Refunds may be considered only if:
              </p>
              <ul className="list-disc pl-6 text-lg text-slate-700 dark:text-slate-300 space-y-3 mb-4">
                <li>A course is cancelled by Shrestha Academy</li>
                <li>Technical issues from our side prevent course access</li>
              </ul>
              <p className="text-lg text-slate-700 dark:text-slate-300 italic">
                All refund approvals are at the sole discretion of management.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">5. Refund Processing Time</h2>
              <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                If approved, refunds will be processed within 7–10 working days to the original payment method.
              </p>
            </section>

            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 my-8 rounded-r-lg shadow-sm">
              <h2 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-4">⚠️ IMPORTANT DISCLAIMER</h2>
              <p className="text-lg text-red-700 dark:text-red-300 leading-relaxed mb-4">
                Shrestha Academy provides education and training only. We are not a financial advisory firm. Stock market and cryptocurrency trading involve market risk. Learners are advised to practice independently, responsibly, and at their own discretion.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

