import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, HelpCircle, Sparkles } from 'lucide-react';
import ProofboundLogo from './Logo';

const Footer = () => {
  const scrollToForm = () => {
    document.getElementById('email-capture')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Get current timestamp in PST
  const getVersionTimestamp = () => {
    const now = new Date();
    const pstTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
    return pstTime.toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <footer className="glass-card p-8 text-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-4 mb-6">
              <ProofboundLogo className="w-12 h-12 text-blue-600" size={48} />
              <span className="text-3xl font-bold text-gray-900">Proofbound</span>
            </div>
            <p className="text-gray-600 text-lg mb-6 max-w-md font-sans">
              Transform your domain expertise into professional publications. From concept to printed book in 2 weeks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={scrollToForm}
                className="button-secondary"
              >
                Get Started Today
              </button>
              <Link
                to="/ai-generator"
                className="button-secondary flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Want your book faster? Try our AI-generated version</span>
              </Link>
            </div>
          </div>

          {/* Questions Section with Logo */}
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <ProofboundLogo className="w-8 h-8 text-blue-600" size={32} />
              <div>
                <h3 className="text-lg font-semibold flex items-center text-gray-900">
                  <HelpCircle className="w-5 h-5 mr-2" />
                  Questions?
                </h3>
              </div>
            </div>
            <div className="space-y-4">
              <div className="glass-card p-4 border border-blue-200">
                <p className="text-sm mb-3 font-sans text-gray-700">
                  Have questions about the book generation process, pricing, or timeline?
                </p>
                <div className="flex items-center">
                  <Mail className="w-5 h-5 mr-3 text-blue-600" />
                  <a href="mailto:info@proofbound.com" className="hover:text-blue-600 transition-colors font-medium font-sans text-gray-800">
                    info@proofbound.com
                  </a>
                </div>
              </div>
              <div className="text-sm text-gray-500 font-sans">
                We typically respond within 24 hours
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-300 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-500 text-sm mb-4 md:mb-0 font-sans">
              © 2025 Proofbound. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm text-gray-500">
              <span className="hover:text-gray-800 transition-colors cursor-pointer font-sans">Privacy Policy</span>
              <span className="hover:text-gray-800 transition-colors cursor-pointer font-sans">Terms of Service</span>
              <span className="hover:text-gray-800 transition-colors cursor-pointer font-sans">Refund Policy</span>
            </div>
          </div>
          
          {/* Version Information */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <div className="text-xs text-gray-400 font-mono">
              Version: {getVersionTimestamp()} PST
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;