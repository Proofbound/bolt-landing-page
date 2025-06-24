import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Hero from './components/Hero';
import EmailCapture from './components/EmailCapture';
import PricingSection from './components/PricingTiers';
import ProcessOverview from './components/ProcessOverview';
import Footer from './components/Footer';
import FloatingElements from './components/FloatingElements';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import Dashboard from './components/dashboard/Dashboard';
import SuccessPage from './components/SuccessPage';
import AIBookGenerator from './components/AIBookGenerator';
import ProtectedRoute from './components/auth/ProtectedRoute';

function LandingPage() {
  return (
    <div className="min-h-screen relative">
      <FloatingElements />
      <div className="content-layer">
        <Hero />
        <EmailCapture />
        <PricingSection />
        <ProcessOverview />
        <Footer />
      </div>
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();

  // Check if environment variables are missing
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-lg border border-red-200">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Configuration Error</h1>
          <p className="text-red-700 mb-4">
            Missing Supabase environment variables. Please set:
          </p>
          <ul className="list-disc list-inside text-sm text-red-600 mb-4">
            <li>VITE_SUPABASE_URL</li>
            <li>VITE_SUPABASE_ANON_KEY</li>
          </ul>
          <p className="text-sm text-gray-600">
            If you're seeing this on Netlify, add these environment variables in your site settings.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/ai-generator" 
          element={
            <ProtectedRoute>
              <AIBookGenerator />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
        />
        <Route 
          path="/signup" 
          element={user ? <Navigate to="/dashboard" replace /> : <SignupPage />} 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        {/* Success page should be accessible without authentication for Stripe redirects */}
        <Route 
          path="/success" 
          element={<SuccessPage />} 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;