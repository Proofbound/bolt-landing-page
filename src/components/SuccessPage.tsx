import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, BookOpen, Mail, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import ProofboundLogo from './Logo';

const SuccessPage = () => {
  const { user, loading } = useAuth();
  const { refetch } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is authenticated, refetch subscription data after successful payment
    if (user) {
      const timer = setTimeout(() => {
        refetch();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [user, refetch]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full text-center">
        <div className="glass-card p-12">
          <div className="flex justify-center mb-6">
            <ProofboundLogo className="w-20 h-20 text-green-600" size={80} />
          </div>
          
          <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 font-sans">
            Thank you for purchasing the Proofbound Elite Service. Your book creation journey starts now!
          </p>

          <div className="glass-card p-6 mb-8 border border-green-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">What happens next:</h2>
            <div className="space-y-3 text-left">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-gray-700 font-sans">You'll receive a confirmation email within 5 minutes</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-gray-700 font-sans">Our team will contact you within 24 hours to start your project</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-gray-700 font-sans">Draft outline and first chapters delivered within 48 hours</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-gray-700 font-sans">2 professionally-bound books delivered in 2 weeks</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            {user ? (
              <Link to="/dashboard" className="cta-button space-x-2">
                <BookOpen className="w-5 h-5" />
                <span>Go to Dashboard</span>
              </Link>
            ) : (
              <Link to="/login" className="cta-button space-x-2">
                <LogIn className="w-5 h-5" />
                <span>Sign In to Dashboard</span>
              </Link>
            )}
            <a 
              href="mailto:info@proofbound.com" 
              className="button-secondary space-x-2"
            >
              <Mail className="w-5 h-5" />
              <span>Contact Support</span>
            </a>
          </div>

          {!user && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 font-medium font-sans">
                <strong>Don't have an account yet?</strong> Create one to track your project progress and access your dashboard.
              </p>
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 font-medium font-sans">
              Questions? Email us at{' '}
              <a href="mailto:info@proofbound.com" className="underline">
                info@proofbound.com
              </a>
              {user && (
                <>
                  {' '}or check your dashboard for project updates.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;