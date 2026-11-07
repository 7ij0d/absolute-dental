import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Outlet, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import FloatingCart from './components/FloatingCart';

// Core Above-the-Fold Storefront Entry (Eager for instant LCP on Home)
import Home from './pages/Home';
import { runPrefetch } from './prefetch';
import { clearStaleCache } from './cache';

// Resilient dynamic import helper (auto-recovers if chunk hashes update after deploy)
const lazyPage = (importFn) =>
  lazy(() =>
    importFn().catch((err) => {
      console.warn('Chunk load retry:', err);
      return importFn();
    })
  );

// Public Storefront Pages (Code-Split per Route)
const YearPage = lazyPage(() => import('./pages/YearPage'));
const StudyToolsPage = lazyPage(() => import('./pages/StudyToolsPage'));
const SubjectPage = lazyPage(() => import('./pages/SubjectPage'));
const ProductDetails = lazyPage(() => import('./pages/ProductDetails'));
const CartPage = lazyPage(() => import('./pages/CartPage'));
const CheckoutPage = lazyPage(() => import('./pages/CheckoutPage'));
const OrderTracking = lazyPage(() => import('./pages/OrderTracking'));
const Favorites = lazyPage(() => import('./pages/Favorites'));
const StaticPages = lazyPage(() => import('./pages/StaticPages'));
const ContactPage = lazyPage(() => import('./pages/ContactPage'));
const SignInPage = lazyPage(() => import('./pages/SignInPage'));
const ProfilePage = lazyPage(() => import('./pages/ProfilePage'));
const SearchPage = lazyPage(() => import('./pages/SearchPage'));
const InvoicePage = lazyPage(() => import('./pages/InvoicePage'));
const DonationsPage = lazyPage(() => import('./pages/DonationsPage'));
const AccessoriesPage = lazyPage(() => import('./pages/AccessoriesPage'));
const BoxesPage = lazyPage(() => import('./pages/BoxesPage'));
const CompleteProfileModal = lazyPage(() => import('./components/CompleteProfileModal'));

// Admin Pages (Isolated from Customer Storefront Bundle)
const AdminLayout = lazyPage(() => import('./pages/admin/AdminLayout'));
const Dashboard = lazyPage(() => import('./pages/admin/Dashboard'));
const Orders = lazyPage(() => import('./pages/admin/Orders'));
const Products = lazyPage(() => import('./pages/admin/Products'));
const Subjects = lazyPage(() => import('./pages/admin/Subjects'));
const Banners = lazyPage(() => import('./pages/admin/Banners'));
const Settings = lazyPage(() => import('./pages/admin/Settings'));
const Messages = lazyPage(() => import('./pages/admin/Messages'));
const Users = lazyPage(() => import('./pages/admin/Users'));
const AdminDonations = lazyPage(() => import('./pages/admin/AdminDonations'));
const AdminRequests = lazyPage(() => import('./pages/admin/Requests'));
const AdminAccessories = lazyPage(() => import('./pages/admin/AdminAccessories'));
const AdminQuickBoxes = lazyPage(() => import('./pages/admin/AdminQuickBoxes'));
const StandaloneBoxManager = lazyPage(() => import('./pages/admin/StandaloneBoxManager'));
const ProductRequests = lazyPage(() => import('./pages/admin/ProductRequests'));
const StudentExperiences = lazyPage(() => import('./pages/admin/StudentExperiences'));

// Lightweight Skeleton Fallback (Zero layout shift, no intrusive spinner)
const PageSkeleton = () => (
  <div
    style={{
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '1.5rem 1rem',
      minHeight: '65vh',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}
    aria-busy="true"
  >
    <div
      style={{
        height: '160px',
        borderRadius: '18px',
        background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
        backgroundSize: '200% 100%',
        animation: 'absSkeletonPulse 1.4s ease-in-out infinite'
      }}
    />
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '1rem'
      }}
    >
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div
          key={n}
          style={{
            height: '230px',
            borderRadius: '14px',
            background: '#f1f5f9',
            border: '1px solid #e2e8f0'
          }}
        />
      ))}
    </div>
    <style>{`
      @keyframes absSkeletonPulse {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  </div>
);

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
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <FloatingCart />
      {!isUnifiedStudyFlow && <BottomNav />}
    </div>
  );
};

export const App = () => {
  useEffect(() => {
    clearStaleCache();
    runPrefetch();
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <CompleteProfileModal />
      </Suspense>
      <Suspense fallback={<PageSkeleton />}>
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
      </Suspense>
    </>
  );
};

export default App;
