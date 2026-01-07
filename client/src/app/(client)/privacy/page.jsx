'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
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
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Privacy Policy</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 font-medium">
            Data Protection & User Privacy at Shrestha Academy
          </p>
          <p className="text-lg text-slate-700 dark:text-slate-300 mb-8">
            Shrestha Academy is committed to protecting the privacy and personal data of its users.
          </p>

          <div className="space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">1. Information We Collect</h2>
              <p className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                We may collect the following information:
              </p>
              <ul className="list-disc pl-6 text-lg text-slate-700 dark:text-slate-300 space-y-3 mb-4">
                <li>Name, email address, phone number</li>
                <li>Payment details (processed via secure third-party gateways)</li>
                <li>Course enrollment and learning activity data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">2. Use of Collected Information</h2>
              <p className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                Your information is used to:
              </p>
              <ul className="list-disc pl-6 text-lg text-slate-700 dark:text-slate-300 space-y-3">
                <li>Provide access to online and offline courses</li>
                <li>Communicate course updates, notifications, and support</li>
                <li>Improve learning experience and service quality</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">3. Data Security</h2>
              <p className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                We employ robust, industry-standard security protocols to protect your data:
              </p>
              <ul className="list-disc pl-6 text-lg text-slate-700 dark:text-slate-300 space-y-3">
                <li>We do not sell, rent, or trade personal data</li>
                <li>User information is stored securely</li>
                <li>Payments are processed only through trusted and secure payment gateways</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">4. Third-Party Services</h2>
              <p className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                We may use third-party services such as:
              </p>
              <ul className="list-disc pl-6 text-lg text-slate-700 dark:text-slate-300 space-y-3 mb-4">
                <li>Payment gateways</li>
                <li>Analytics tools</li>
                <li>Learning Management Systems (LMS)</li>
              </ul>
              <p className="text-lg text-slate-700 dark:text-slate-300">
                These services operate under their own privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">5. Communication Consent</h2>
              <p className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                By registering, you agree to receive:
              </p>
              <ul className="list-disc pl-6 text-lg text-slate-700 dark:text-slate-300 space-y-3 mb-4">
                <li>Course-related emails and messages</li>
                <li>Important updates and announcements</li>
              </ul>
              <p className="text-lg text-slate-700 dark:text-slate-300 italic">
                You may opt out of promotional communications at any time.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

