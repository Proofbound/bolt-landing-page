import React from 'react';
import { Clock, CheckCircle2, FileText, Truck } from 'lucide-react';

const ProcessOverview = () => {
  return (
    <section id="process" className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-sans">
            Our streamlined process transforms your expertise into a professional publication.
          </p>
        </div>

        {/* Simple Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 glass-card text-blue-600 rounded-full flex items-center justify-center border border-blue-200">
                  <FileText className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Submit Your Expertise</h3>
                <p className="text-gray-600 font-sans">Share your knowledge, notes, and vision through our simple form.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 glass-card text-green-600 rounded-full flex items-center justify-center border border-green-200">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Draft in 24 Hours</h3>
                <p className="text-gray-600 font-sans">Receive your draft outline and first chapters within 24 hours.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 glass-card text-orange-600 rounded-full flex items-center justify-center border border-orange-200">
                  <Truck className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Printed Copy in 2 Weeks</h3>
                <p className="text-gray-600 font-sans">Your professionally-bound book is printed and shipped to your door.</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">What You Get</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <CheckCircle2 className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-gray-700 font-sans">200+ page professionally-written book</span>
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-gray-700 font-sans">Professional cover design</span>
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-gray-700 font-sans">2 professionally-bound copies</span>
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-gray-700 font-sans">Digital PDF copy</span>
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-gray-700 font-sans">Free shipping included</span>
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-gray-700 font-sans">No royalties - you own everything</span>
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-gray-700 font-sans">Additional copies just $5 each (plus shipping)</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">Only $99</div>
                <div className="text-gray-500 line-through mb-2 font-sans">Regular price: $199</div>
                <div className="text-sm text-green-600 font-medium font-sans">Limited time launch pricing</div>
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
          <div className="mt-4 text-sm text-gray-500 font-sans">
            🇺🇸 Currently available in the USA only
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcessOverview;