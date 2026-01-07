'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Terms of Service</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 font-medium">
            Shrestha Academy <span className="text-base font-normal opacity-80">(A brand operated by Shrestha EduTech Private Limited)</span>
          </p>

          <div className="space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                By accessing or using the website, online platforms, courses, training programs, services, or content provided by Shrestha Academy, you agree to comply with and be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">2. Services Offered</h2>
              <p className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                Shrestha Academy is a professional training institute offering education and skill-development programs in:
              </p>
              <ul className="list-disc pl-6 text-lg text-slate-700 dark:text-slate-300 space-y-2 mb-4">
                <li>Data Analytics Training</li>
                <li>Data Science Courses</li>
                <li>Python Programming Training</li>
                <li>Artificial Intelligence (GenAI & Agentic AI)</li>
                <li>Stock Market & Cryptocurrency Trading Education</li>
              </ul>
              <p className="text-lg text-slate-700 dark:text-slate-300 italic border-l-4 border-slate-300 dark:border-slate-700 pl-4 py-1 bg-slate-50 dark:bg-slate-900/50">
                All programs are strictly provided for educational and skill-development purposes only.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">3. No Guarantee of Results</h2>
              <p className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                Shrestha Academy does not guarantee:
              </p>
              <ul className="list-disc pl-6 text-lg text-slate-700 dark:text-slate-300 space-y-2 mb-6">
                <li>Job placement or employment</li>
                <li>Salary levels or income</li>
                <li>Trading profits or financial returns</li>
              </ul>
              <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                Trading and investment education involves market risk, and all decisions made by learners are at their own discretion and responsibility.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">4. Job Assistance & Placement Disclaimer</h2>
              <p className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                Shrestha Academy provides <strong>100% Job Assistance</strong> for eligible programs, which may include:
              </p>
              <ul className="list-disc pl-6 text-lg text-slate-700 dark:text-slate-300 space-y-2 mb-6">
                <li>Resume building and profile optimization</li>
                <li>Interview preparation and mock interviews</li>
                <li>Career guidance and mentoring</li>
                <li>Sharing relevant job openings and referrals</li>
              </ul>
              
              <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-6 rounded-r-lg shadow-sm mb-6">
                <h3 className="font-bold text-amber-800 dark:text-amber-200 text-lg mb-2">⚠️ Job placement is NOT guaranteed.</h3>
                <p className="text-amber-800/90 dark:text-amber-200/90 leading-relaxed mb-4">
                  Final placement depends on:
                </p>
                <ul className="list-disc pl-6 text-amber-800/90 dark:text-amber-200/90 space-y-1">
                  <li>Candidate’s skills and performance</li>
                  <li>Attendance and course completion</li>
                  <li>Interview results</li>
                  <li>Market demand and employer requirements</li>
                </ul>
              </div>
              <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                All hiring decisions are solely made by recruiting companies. Shrestha Academy shall not be held responsible for non-selection or employment outcomes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">5. User Responsibilities</h2>
              <p className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                By enrolling in any course, you agree:
              </p>
              <ul className="list-disc pl-6 text-lg text-slate-700 dark:text-slate-300 space-y-3">
                <li>Not to share login credentials or course access</li>
                <li>Not to copy, record, distribute, or resell any content</li>
                <li>To use all learning materials strictly for personal educational purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">6. Intellectual Property Rights</h2>
              <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                All website content, training materials, videos, logos, designs, curriculum, and branding are the exclusive intellectual property of <strong>Shrestha EduTech Private Limited</strong>. Unauthorized use, reproduction, or distribution is strictly prohibited.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">7. Termination of Access</h2>
              <p className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                Shrestha Academy reserves the right to suspend or terminate access to courses or services in case of:
              </p>
              <ul className="list-disc pl-6 text-lg text-slate-700 dark:text-slate-300 space-y-2">
                <li>Policy violations</li>
                <li>Misuse of content</li>
                <li>Unethical behavior</li>
                <li>Breach of these terms</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">8. Changes to Terms</h2>
              <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                We reserve the right to modify or update these Terms of Service at any time. Continued use of our services constitutes acceptance of the revised terms.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

