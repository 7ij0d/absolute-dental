import React, { useEffect } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AnnouncementBar from './components/AnnouncementBar';

// Public Storefront Pages
import Home from './pages/Home';
import YearPage from './pages/YearPage';
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
import { runPrefetch } from './prefetch';

// Public Layout Wrapper
const PublicLayout = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AnnouncementBar />
      <Navbar />
      <main style={{ flexGrow: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export const App = () => {
  // Warm the cache immediately on app startup (non-blocking)
  useEffect(() => { runPrefetch(); }, []);

  return (
    <Routes>

      {/* 1. PUBLIC STOREFRONT ROUTES */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<Home />} />
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
        <Route path="invoice/:id" element={<InvoicePage />} />

        {/* Policy & Static Pages */}
        <Route path="about" element={<StaticPages pageKey="about_us" />} />
        <Route path="faq" element={<StaticPages pageKey="faq" />} />
        <Route path="shipping-returns" element={<StaticPages pageKey="shipping_refunds" />} />
      </Route>

      {/* 2. ADMIN DASHBOARD SECURE ROUTES */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="products" element={<Products />} />
        <Route path="subjects" element={<Subjects />} />
        <Route path="banners" element={<Banners />} />
        <Route path="settings" element={<Settings />} />
        <Route path="messages" element={<Messages />} />
        <Route path="users" element={<Users />} />
      </Route>

    </Routes>
  );
};

export default App;
