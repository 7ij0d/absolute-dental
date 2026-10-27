import React, { useEffect } from 'react';
import { Routes, Route, Outlet, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';

// Public Storefront Pages
import Home from './pages/Home';
import YearPage from './pages/YearPage';
import StudyToolsPage from './pages/StudyToolsPage';
import SubjectPage from './pages/SubjectPage';
import ProductDetails from './pages/ProductDetails';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderTracking from './pages/OrderTracking';
import Favorites from './pages/Favorites';
import StaticPages from './pages/StaticPages';
import ContactPage from './pages/ContactPage';
import SignInPage from './pages/SignInPage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import InvoicePage from './pages/InvoicePage';
import DonationsPage from './pages/DonationsPage';
import AccessoriesPage from './pages/AccessoriesPage';
import BoxesPage from './pages/BoxesPage';
// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Orders from './pages/admin/Orders';
import Products from './pages/admin/Products';
import Subjects from './pages/admin/Subjects';
import Banners from './pages/admin/Banners';
import Settings from './pages/admin/Settings';
import Messages from './pages/admin/Messages';
import Users from './pages/admin/Users';
import AdminDonations from './pages/admin/AdminDonations';
import AdminRequests from './pages/admin/Requests';
import AdminAccessories from './pages/admin/AdminAccessories';
import AdminQuickBoxes from './pages/admin/AdminQuickBoxes';
import StandaloneBoxManager from './pages/admin/StandaloneBoxManager';
import ProductRequests from './pages/admin/ProductRequests';
import StudentExperiences from './pages/admin/StudentExperiences';
import { runPrefetch } from './prefetch';
import { clearStaleCache } from './cache';


import FloatingCart from './components/FloatingCart';
import CompleteProfileModal from './components/CompleteProfileModal';

// Public Layout Wrapper
const PublicLayout = () => {
  const location = useLocation();
  const isUnifiedStudyFlow =
    location.pathname === '/' ||
    location.pathname.startsWith('/study-tools') ||
    location.pathname.startsWith('/years') ||
    location.pathname.startsWith('/year') ||
    location.pathname.startsWith('/subject') ||
    location.pathname.startsWith('/other-supplies') ||
    location.pathname.startsWith('/product');

  return (
    <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
      
      <Navbar />
      <main style={{ flexGrow: 1, width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        <Outlet />
      </main>
      <Footer />
      <FloatingCart />
      {!isUnifiedStudyFlow && <BottomNav />}
    </div>
  );
};

export const App = () => {
  // Clear old Smylodent-era cache on first load, then prefetch fresh data
  useEffect(() => {
    clearStaleCache();
    runPrefetch();
  }, []);


  return (
    <>
      <CompleteProfileModal />
      <Routes>

      {/* 1. PUBLIC STOREFRONT ROUTES */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="study-tools" element={<StudyToolsPage />} />
        <Route path="years" element={<StudyToolsPage />} />
        <Route path="year/:slug" element={<YearPage />} />
        <Route path="subject/:slug" element={<SubjectPage />} />
        <Route path="product/:id" element={<ProductDetails />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="track" element={<OrderTracking />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="signin" element={<SignInPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="offers" element={<SearchPage categoryMode="offers" />} />
        <Route path="other-supplies" element={<SearchPage categoryMode="other-supplies" />} />
        <Route path="invoice/:id" element={<InvoicePage />} />
        <Route path="donations" element={<DonationsPage />} />
        <Route path="accessories" element={<AccessoriesPage />} />
        <Route path="boxes" element={<BoxesPage />} />
        <Route path="dental-boxes" element={<BoxesPage />} />
        {/* Policy & Static Pages */}
        <Route path="about" element={<StaticPages pageKey="about_us" />} />
        <Route path="faq" element={<StaticPages pageKey="faq" />} />
        <Route path="shipping-returns" element={<StaticPages pageKey="shipping_refunds" />} />
        {/* Wildcard fallback inside PublicLayout */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      {/* 2. ADMIN DASHBOARD SECURE ROUTES */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="product-requests" element={<ProductRequests />} />
        <Route path="experiences" element={<StudentExperiences />} />
        <Route path="products" element={<Products />} />
        <Route path="subjects" element={<Subjects />} />
        <Route path="banners" element={<Banners />} />
        <Route path="settings" element={<Settings />} />
        <Route path="messages" element={<Messages />} />
        <Route path="users" element={<Users />} />
        <Route path="donations" element={<AdminDonations />} />
        <Route path="requests" element={<AdminRequests />} />
        <Route path="accessories" element={<AdminAccessories />} />
        <Route path="boxes" element={<AdminQuickBoxes />} />
      </Route>

      {/* Standalone Dedicated Box Studio (Clean, no sidebar) */}
      <Route path="/box-manager" element={<StandaloneBoxManager />} />
      <Route path="/boxes-manager" element={<StandaloneBoxManager />} />
      <Route path="/box-studio" element={<StandaloneBoxManager />} />

      {/* Global Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
};

export default App;
