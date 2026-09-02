import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Halls from './pages/Halls';
import HallDetails from './pages/HallDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import Booking from './pages/Booking';
import Dashboard from './pages/Dashboard';
import Packages from './pages/Packages';
import ProtectedRoute from './components/ProtectedRoute';
import PageTransition from './components/PageTransition';
import About from './pages/About';
import Contact from './pages/Contact';
import Policy from './pages/Policy';
import AiPlanner from './pages/AiPlanner';

// Placeholder components for routes not yet implemented
const NotFound = () => <div className="p-20 text-center text-2xl">404 - Page Not Found</div>;

function AppRoutes() {
  const location = useLocation();

  React.useEffect(() => {
    if (location.hash) {
      const elementId = location.hash.replace('#', '');
      const element = document.getElementById(elementId);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

  return (
    <PageTransition>
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/policy" element={<Policy />} />
        <Route path="/halls" element={<Halls />} />
        <Route path="/halls/:id" element={<HallDetails />} />
        <Route path="/packages" element={<Packages />} />
        <Route path="/ai-planner" element={<AiPlanner />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/booking"
          element={
            <ProtectedRoute>
              <Booking />
            </ProtectedRoute>
          }
        />
          <Route
          path="/message"
          element={
            <ProtectedRoute>
              <Message />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </PageTransition>
  );
}

import ChatWidget from './components/ChatWidget';

import { Toaster } from 'react-hot-toast';
import Message from './components/Message';

function App() {
  return (
    <Router>
      <Layout>
        <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
        <AppRoutes />
        <ChatWidget />
      </Layout>
    </Router>
  );
}

export default App;
