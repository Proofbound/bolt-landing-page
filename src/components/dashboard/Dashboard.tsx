import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import { useStripeCheckout } from '../../hooks/useStripeCheckout';
import { useFormSubmission } from '../../hooks/useFormSubmission';
import { stripeProducts } from '../../stripe-config';
import { BookOpen, User, CreditCard, Package, ArrowRight, CheckCircle, FileText, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import ProofboundLogo from '../Logo';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const { createCheckoutSession, loading: checkoutLoading, error: checkoutError } = useStripeCheckout();
  const { getUserSubmissions, loading: submissionsLoading, error: submissionsError } = useFormSubmission();

  const [submissions, setSubmissions] = React.useState<any[]>([]);
  const [submissionsLoadError, setSubmissionsLoadError] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);

  const fetchSubmissions = React.useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setSubmissionsLoadError(null);
      console.log('Dashboard: Fetching submissions for user:', user.id);
      
      const { data, error } = await getUserSubmissions(user.id);
      
      if (error) {
        console.error('Dashboard: Error fetching submissions:', error);
        setSubmissionsLoadError(error);
      } else {
        console.log('Dashboard: Successfully fetched submissions:', data);
        setSubmissions(data || []);
        setRetryCount(0); // Reset retry count on success
      }
    } catch (err) {
      console.error('Dashboard: Unexpected error:', err);
      setSubmissionsLoadError(err instanceof Error ? err.message : 'Unexpected error occurred');
    }
  }, [user?.id, getUserSubmissions]);

  React.useEffect(() => {
    if (user?.id) {
      fetchSubmissions();
    }
  }, [user?.id]); // Remove fetchSubmissions from dependencies to prevent infinite loop

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchSubmissions();
  };

  const handlePurchase = async (priceId: string, mode: 'payment' | 'subscription') => {
    await createCheckoutSession({
      priceId,
      mode,
      successUrl: `${window.location.origin}/success`,
      cancelUrl: window.location.href,
    });
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const eliteProduct = stripeProducts[0]; // Proofbound Elite Service

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="glass-card border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <ProofboundLogo className="w-10 h-10 text-blue-600" size={40} />
              <span className="text-2xl font-bold text-gray-900">Proofbound</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-700">
                <User className="w-5 h-5" />
                <span className="font-sans">{user?.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="button-secondary"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to your Dashboard</h1>
          <p className="text-gray-600 font-sans">Manage your book projects and account settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Subscription Status */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <CreditCard className="w-6 h-6 mr-3" />
                Account Status
              </h2>
              
              {subscriptionLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                </div>
              ) : subscription?.subscription_status === 'active' ? (
                <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-green-800 font-sans">Active Subscription</p>
                    <p className="text-green-600 font-sans">{subscription.product_name}</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 font-medium font-sans">No active subscription</p>
                  <p className="text-blue-600 font-sans">Purchase our Elite Service to get started</p>
                </div>
              )}
            </div>

            {/* Form Submissions */}
            <div className="glass-card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <FileText className="w-6 h-6 mr-3" />
                  Your Book Requests
                </h2>
                {!submissionsLoading && (submissionsLoadError || submissionsError) && (
                  <button
                    onClick={handleRetry}
                    className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Retry</span>
                  </button>
                )}
              </div>
              
              {submissionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="ml-3 text-gray-600 font-sans">Loading submissions...</span>
                </div>
              ) : submissionsLoadError || submissionsError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="font-medium text-red-800 font-sans">Error loading submissions</span>
                  </div>
                  <p className="text-red-700 text-sm font-sans mb-3">
                    {submissionsLoadError || submissionsError}
                  </p>
                  {retryCount > 0 && (
                    <p className="text-red-600 text-xs font-sans mb-3">
                      Retry attempt: {retryCount}
                    </p>
                  )}
                  <div className="flex space-x-2">
                    <button
                      onClick={handleRetry}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 font-sans"
                    >
                      Try Again
                    </button>
                    <a
                      href="/#email-capture"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 font-sans"
                    >
                      Submit New Request
                    </a>
                  </div>
                </div>
              ) : submissions.length > 0 ? (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{submission.book_topic}</h3>
                          <p className="text-sm text-gray-600 font-sans">
                            Submitted on {new Date(submission.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(submission.status)}`}>
                          {formatStatus(submission.status)}
                        </span>
                      </div>
                      <p className="text-gray-700 font-sans text-sm mb-3">
                        {submission.book_description.substring(0, 150)}
                        {submission.book_description.length > 150 ? '...' : ''}
                      </p>
                      {submission.book_style && (
                        <p className="text-sm text-gray-600 font-sans">
                          <strong>Style:</strong> {submission.book_style.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No book requests yet</h3>
                  <p className="text-gray-600 mb-6 font-sans">
                    Submit a book request to get started with your professional publication
                  </p>
                  <a
                    href="/#email-capture"
                    className="button-secondary"
                  >
                    Submit Book Request
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Elite Service Card */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 border-2 border-blue-200">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full mb-4">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{eliteProduct.name}</h3>
                <p className="text-gray-600 font-sans">{eliteProduct.description}</p>
              </div>

              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  ${eliteProduct.price}
                </div>
                <p className="text-gray-600 font-sans">One-time payment</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-3" />
                  <span className="font-sans">200+ page professional book</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-3" />
                  <span className="font-sans">Professional cover design</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-3" />
                  <span className="font-sans">2 bound copies included</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-3" />
                  <span className="font-sans">Digital PDF copy</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-3" />
                  <span className="font-sans">Free shipping</span>
                </div>
              </div>

              {checkoutError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm font-sans">{checkoutError}</p>
                </div>
              )}

              <button
                onClick={() => handlePurchase(eliteProduct.priceId, eliteProduct.mode)}
                disabled={checkoutLoading}
                className="cta-button w-full"
              >
                {checkoutLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </span>
                )}
              </button>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 font-sans">
                  Need to submit book details first?{' '}
                  <a href="/#email-capture" className="text-blue-600 hover:text-blue-700 font-medium">
                    Fill out the form
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;