import React from 'react';
import { Check, Star, ArrowRight, Clock, BookOpen, Truck, Package } from 'lucide-react';

const PricingSection = () => {
  const scrollToForm = () => {
    document.getElementById('email-capture')?.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    'Completely custom content synthesis',
    '200+ pages of professional content',
    'Comprehensive research & citations',
    'Professional formatting & layout',
    'Professional cover design',
    'Draft delivered in 24 hours',
    '2 professionally-bound printed books',
    'Digital PDF copy included',
    'Free shipping included',
    'Two revision rounds included',
    'No royalties - you own everything',
    'Additional copies just $5 each (plus shipping)'
  ];

  const process = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: '24 Hours',
      description: 'Draft outline & first chapters'
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: '1 Week',
      description: 'Complete manuscript ready'
    },
    {
      icon: <Truck className="w-6 h-6" />,
      title: '2 Weeks',
      description: '2 professionally-bound books delivered'
    }
  ];

  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Professional Book Generation Service
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-sans">
            Transform your expertise into a comprehensive, professionally-bound book with our streamlined process.
          </p>
          <div className="mt-4 inline-flex items-center bg-blue-50 border border-blue-200 rounded-full px-4 py-2">
            <span className="text-blue-800 font-medium font-sans">🇺🇸 USA Only (for now)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Pricing Card */}
          <div className="relative">
            <div className="glass-card p-8 border-2 border-blue-200">
              {/* Special Offer Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg font-sans">
                  LIMITED TIME: 50% OFF
                </span>
              </div>

              <div className="text-center mb-8 pt-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full mb-6">
                  <Star className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Professional Book Service</h3>
                
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <span className="text-3xl text-gray-500 line-through">$199</span>
                  <span className="text-5xl font-bold text-gray-900">$99</span>
                </div>
                <p className="text-gray-600 text-lg font-sans">Complete book generation service</p>
                
                <div className="glass-card p-3 mt-4 border border-green-200">
                  <div className="flex items-center justify-center text-green-800 font-medium font-sans">
                    <Package className="w-5 h-5 mr-2" />
                    Includes 2 copies + free shipping
                  </div>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 font-sans">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={scrollToForm}
                className="cta-button w-full space-x-2"
              >
                <span>Start Your Book Today</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Process Timeline */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h3>
              <p className="text-gray-600 mb-8 font-sans">
                Our streamlined process delivers professional results faster than traditional publishing methods.
              </p>
            </div>

            <div className="space-y-6">
              {process.map((step, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 glass-card text-blue-600 rounded-full flex items-center justify-center border border-blue-200">
                      {step.icon}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-1">{step.title}</h4>
                    <p className="text-gray-600 font-sans">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-card p-6 mt-8 border border-blue-200">
              <h4 className="font-bold text-gray-900 mb-3">What You Get:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-600 mr-2" />
                  <span className="font-sans">200+ page book</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-600 mr-2" />
                  <span className="font-sans">Professional cover design</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-600 mr-2" />
                  <span className="font-sans">2 bound copies</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-600 mr-2" />
                  <span className="font-sans">Digital PDF copy</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-600 mr-2" />
                  <span className="font-sans">Free shipping</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-600 mr-2" />
                  <span className="font-sans">No royalties</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-sm text-blue-800 font-medium font-sans">
                  Need more copies? Additional books are just $5 each (plus shipping)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Guarantee Section */}
        <div className="mt-16 glass-card p-8 text-center border border-gray-200">
          <h3 className="text-2xl font-light text-gray-800 mb-4">100% Satisfaction Guarantee</h3>
          <p className="text-gray-600 max-w-2xl mx-auto font-sans">
            If you're not completely satisfied with your book, we'll revise it until it meets your standards. 
            Your success is our priority.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;