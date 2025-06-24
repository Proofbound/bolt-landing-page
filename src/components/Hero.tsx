import React, { useEffect, useRef } from 'react';
import { ArrowRight, Clock, CheckCircle, Package } from 'lucide-react';
import ProofboundLogo from './Logo';

const Hero = () => {
  const typingRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Add typing-text class to the ref element for the animation
    if (typingRef.current) {
      typingRef.current.classList.add('typing-text');
    }
  }, []);

  const scrollToForm = () => {
    document.getElementById('email-capture')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center text-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Large Logo at Top */}
        <div className="flex justify-center mb-8">
          <div className="flex flex-col items-center">
            <ProofboundLogo 
              className="w-32 h-32 md:w-40 md:h-40 text-gray-600 mb-6 filter drop-shadow-lg animate-pulse" 
              size={160} 
            />
            <div className="inline-flex items-center space-x-2 glass-card px-6 py-3 animate-fade-in">
              <span className="text-gray-700 font-medium font-sans">AI-Powered Book Generation</span>
            </div>
          </div>
        </div>
        
        <h1 className="hero-title">Have you ever wanted to write a book?</h1>

        <p className="hero-subtitle">
          Proofbound makes it easy to write a <span ref={typingRef} className="typing-text">200-page book</span> and publish it online — in minutes!
        </p>

        <p className="hero-description">
          Transform your ideas into professionally formatted books with our AI-powered platform. 
          From concept to publication, we handle the technical details so you can focus on your story.
        </p>

        {/* Key Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-3xl mx-auto">
          <div className="flex items-center space-x-3 glass-card p-4 hover-lift animate-slide-up" style={{animationDelay: '0.2s'}}>
            <Clock className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <span className="text-gray-800 font-medium font-sans">Draft in 24 hours</span>
          </div>
          <div className="flex items-center space-x-3 glass-card p-4 hover-lift animate-slide-up" style={{animationDelay: '0.4s'}}>
            <Package className="w-6 h-6 text-green-600 flex-shrink-0" />
            <span className="text-gray-800 font-medium font-sans">2 copies included</span>
          </div>
          <div className="flex items-center space-x-3 glass-card p-4 hover-lift animate-slide-up" style={{animationDelay: '0.6s'}}>
            <CheckCircle className="w-6 h-6 text-orange-600 flex-shrink-0" />
            <span className="text-gray-800 font-medium font-sans">No royalties</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 animate-slide-up" style={{animationDelay: '0.8s'}}>
          <button
            onClick={scrollToForm}
            className="cta-button space-x-2 transform hover:scale-105 transition-all duration-300"
          >
            <span>Get Your Book Quote</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => document.getElementById('process')?.scrollIntoView({ behavior: 'smooth' })}
            className="button-secondary space-x-2 transform hover:scale-105 transition-all duration-300"
          >
            <span>See How It Works</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Special Pricing Banner */}
        <div className="glass-card p-6 mb-8 border-2 border-orange-300 animate-pulse-glow">
          <div className="text-center">
            <div className="text-sm font-bold text-orange-700 mb-2 font-sans animate-bounce">LIMITED TIME OFFER</div>
            <div className="flex items-center justify-center space-x-4">
              <span className="text-2xl text-gray-500 line-through">$199</span>
              <span className="text-4xl font-bold text-gray-900 animate-price-highlight">$99</span>
            </div>
            <div className="text-gray-700 mt-2 font-sans">Includes 2 copies + free shipping • Extra copies $5 each (plus shipping)</div>
            <div className="text-sm text-blue-600 font-medium mt-1 font-sans">🇺🇸 USA Only (for now)</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="glass-card p-6 hover-lift animate-slide-up" style={{animationDelay: '1.0s'}}>
            <div className="text-3xl font-bold text-orange-600 mb-2 animate-counter" data-target="24">24</div>
            <div className="text-gray-600 font-sans">Hours</div>
            <div className="text-sm text-gray-500 font-sans">Draft Delivery</div>
          </div>
          <div className="glass-card p-6 hover-lift animate-slide-up" style={{animationDelay: '1.2s'}}>
            <div className="text-3xl font-bold text-blue-600 mb-2 animate-counter" data-target="200">200+</div>
            <div className="text-gray-600 font-sans">Pages</div>
            <div className="text-sm text-gray-500 font-sans">Professional Quality</div>
          </div>
          <div className="glass-card p-6 hover-lift animate-slide-up" style={{animationDelay: '1.4s'}}>
            <div className="text-3xl font-bold text-green-600 mb-2 animate-counter" data-target="2">2</div>
            <div className="text-gray-600 font-sans">Weeks</div>
            <div className="text-sm text-gray-500 font-sans">Bound Book Delivery</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;