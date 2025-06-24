import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, User, FileText, BookOpen, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useStripeCheckout } from '../hooks/useStripeCheckout';
import { useFormSubmission } from '../hooks/useFormSubmission';
import { stripeProducts } from '../stripe-config';
import ProofboundLogo from './Logo';

interface FormData {
  name: string;
  email: string;
  bookTopic: string;
  bookStyle: string;
  bookDescription: string;
  additionalNotes: string;
}

interface FormErrors {
  [key: string]: string;
}

const EmailCapture = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    bookTopic: '',
    bookStyle: '',
    bookDescription: '',
    additionalNotes: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const { user } = useAuth();
  const { createCheckoutSession, loading: checkoutLoading, error: checkoutError } = useStripeCheckout();
  const { submitForm, loading: formLoading, error: formError } = useFormSubmission();
  const navigate = useNavigate();

  const eliteProduct = stripeProducts[0]; // Proofbound Elite Service

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.bookTopic.trim()) {
      newErrors.bookTopic = 'Book topic is required';
    }

    if (!formData.bookDescription.trim()) {
      newErrors.bookDescription = 'Book description is required';
    } else if (formData.bookDescription.length > 1000) {
      newErrors.bookDescription = 'Description must be 1000 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!user) {
      // Store form data in localStorage and redirect to signup
      localStorage.setItem('proofbound_form_data', JSON.stringify(formData));
      navigate('/signup');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Submitting form data:', formData);
      
      // First, submit the form data to the database
      const { error: formSubmissionError } = await submitForm(formData);
      
      if (formSubmissionError) {
        console.error('Form submission error:', formSubmissionError);
        throw new Error(formSubmissionError);
      }

      console.log('Form submitted successfully, proceeding with checkout...');

      // Then proceed with checkout
      await createCheckoutSession({
        priceId: eliteProduct.priceId,
        mode: eliteProduct.mode,
        successUrl: `${window.location.origin}/success`,
        cancelUrl: window.location.href,
      });
    } catch (error) {
      console.error('Submission error:', error);
      // Show error to user but don't prevent them from continuing
      setErrors({ submit: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (isSubmitted) {
    return (
      <section id="email-capture" className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="glass-card p-12">
            <div className="flex justify-center mb-6">
              <ProofboundLogo className="w-16 h-16 text-green-600" size={64} />
            </div>
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h2>
            <p className="text-xl text-gray-600 mb-6 font-sans">
              Your book quote request has been received. Our team will manually review your requirements and get back to you within 24 hours with your draft outline and next steps.
            </p>
            <div className="glass-card p-6 mb-6 border border-blue-200">
              <h3 className="font-bold text-gray-900 mb-2">What happens next:</h3>
              <div className="space-y-2 text-left text-gray-700 font-sans">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <span>Draft outline delivered within 24 hours</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <span>Payment link sent after outline approval</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <span>2 professionally-bound books delivered in 2 weeks</span>
                </div>
              </div>
            </div>
            <p className="text-gray-500 font-sans">
              We'll contact you at <strong>{formData.email}</strong> with your draft outline.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="email-capture" className="py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <ProofboundLogo className="w-16 h-16 text-blue-600" size={64} />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Get Your Professional Book
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6 font-sans">
            Tell us about your expertise and book goals. {user ? 'Complete your purchase to get started.' : 'Create an account to proceed with your order.'}
          </p>
          
          {/* Pricing Display */}
          <div className="inline-flex items-center bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full px-8 py-4 mb-8">
            <span className="text-lg font-semibold mr-4 font-sans">Special Launch Price:</span>
            <span className="text-2xl line-through opacity-75 mr-2">$199</span>
            <span className="text-3xl font-bold">$99</span>
          </div>
          
          <div className="glass-card p-4 mb-8 max-w-2xl mx-auto border border-blue-200">
            <p className="text-blue-800 font-medium font-sans">
              ✓ Includes 2 professionally-bound copies + free shipping<br/>
              ✓ Professional cover design<br/>
              ✓ No royalties - you own everything<br/>
              ✓ Additional copies just $5 each (plus shipping)
            </p>
            <div className="mt-2 text-sm text-blue-600 font-medium font-sans">
              🇺🇸 USA Only (for now)
            </div>
          </div>
        </div>

        <div className="glass-card p-8 lg:p-12">
          {(checkoutError || formError || errors.submit) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <span className="text-red-700 font-sans">
                {checkoutError || formError || errors.submit}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2 font-sans">
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none ${
                    errors.name ? 'form-error' : ''
                  }`}
                  placeholder="Your full name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center font-sans">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2 font-sans">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none ${
                    errors.email ? 'form-error' : ''
                  }`}
                  placeholder="your.email@company.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center font-sans">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            {/* Book Topic */}
            <div>
              <label htmlFor="bookTopic" className="block text-sm font-semibold text-gray-700 mb-2 font-sans">
                <FileText className="w-4 h-4 inline mr-2" />
                Book Topic/Subject Area *
              </label>
              <input
                type="text"
                id="bookTopic"
                name="bookTopic"
                value={formData.bookTopic}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none ${
                  errors.bookTopic ? 'form-error' : ''
                }`}
                placeholder="e.g., Digital Health Technologies, Business Strategy, Technical Innovation"
              />
              {errors.bookTopic && (
                <p className="mt-1 text-sm text-red-600 flex items-center font-sans">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.bookTopic}
                </p>
              )}
            </div>

            {/* Book Style */}
            <div>
              <label htmlFor="bookStyle" className="block text-sm font-semibold text-gray-700 mb-2 font-sans">
                <BookOpen className="w-4 h-4 inline mr-2" />
                Book Style
              </label>
              <select
                id="bookStyle"
                name="bookStyle"
                value={formData.bookStyle}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none"
              >
                <option value="">Select a book style (optional)</option>
                <option value="practical-guide">Practical Guide - Step-by-step instructions and actionable advice</option>
                <option value="reference-manual">Reference Manual - Comprehensive resource with detailed information</option>
                <option value="academic">Academic - Scholarly approach with research and citations</option>
                <option value="narrative">Narrative - Story-driven approach with case studies and examples</option>
              </select>
            </div>

            {/* Book Description */}
            <div>
              <label htmlFor="bookDescription" className="block text-sm font-semibold text-gray-700 mb-2 font-sans">
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Book Description *
              </label>
              <textarea
                id="bookDescription"
                name="bookDescription"
                value={formData.bookDescription}
                onChange={handleInputChange}
                rows={6}
                maxLength={1000}
                className={`w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none ${
                  errors.bookDescription ? 'form-error' : ''
                }`}
                placeholder="Describe your book concept, target audience, key topics to cover, your expertise, and any specific goals. What knowledge do you want to share? What problems will this book solve? Include any existing materials or research you have."
              />
              <div className="flex justify-between items-center mt-1">
                {errors.bookDescription ? (
                  <p className="text-sm text-red-600 flex items-center font-sans">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.bookDescription}
                  </p>
                ) : (
                  <div></div>
                )}
                <span className="text-sm text-gray-500 font-sans">
                  {formData.bookDescription.length}/1000 characters
                </span>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label htmlFor="additionalNotes" className="block text-sm font-semibold text-gray-700 mb-2 font-sans">
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Additional Notes
              </label>
              <textarea
                id="additionalNotes"
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none"
                placeholder="Any specific requirements, deadlines, or additional information..."
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting || checkoutLoading || formLoading}
                className="cta-button w-full disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                {isSubmitting || checkoutLoading || formLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    {user ? 'Processing Payment...' : 'Processing Request...'}
                  </span>
                ) : (
                  user ? 'Complete Purchase - $99' : 'Create Account & Purchase - $99'
                )}
              </button>
              <p className="mt-3 text-sm text-gray-500 text-center font-sans">
                {user 
                  ? 'Secure payment processing • Your form details will be saved for our team'
                  : 'Create account to complete purchase • Your form details will be saved for our team'
                }
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default EmailCapture;