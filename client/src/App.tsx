import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { AccountLayout } from '@/layouts/AccountLayout';
import { CustomerRoute, AdminRoute } from '@/routes/ProtectedRoutes';
import { HomePage } from '@/pages/HomePage';

const CollectionPage = lazy(() => import('@/pages/CollectionPage').then((m) => ({ default: m.CollectionPage })));
const CollectionsIndexPage = lazy(() => import('@/pages/CollectionsIndexPage').then((m) => ({ default: m.CollectionsIndexPage })));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const SearchPage = lazy(() => import('@/pages/SearchPage').then((m) => ({ default: m.SearchPage })));
const CartPage = lazy(() => import('@/pages/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const TrackOrderPage = lazy(() => import('@/pages/TrackOrderPage').then((m) => ({ default: m.TrackOrderPage })));
const BulkOrdersPage = lazy(() => import('@/pages/BulkOrdersPage').then((m) => ({ default: m.BulkOrdersPage })));
const BlogListPage = lazy(() => import('@/pages/BlogListPage').then((m) => ({ default: m.BlogListPage })));
const BlogPostPage = lazy(() => import('@/pages/BlogPostPage').then((m) => ({ default: m.BlogPostPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

const AboutPage = lazy(() => import('@/pages/static/AboutPage').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('@/pages/static/ContactPage').then((m) => ({ default: m.ContactPage })));
const ShippingPolicyPage = lazy(() => import('@/pages/static/ShippingPolicyPage').then((m) => ({ default: m.ShippingPolicyPage })));
const ReturnPolicyPage = lazy(() => import('@/pages/static/ReturnPolicyPage').then((m) => ({ default: m.ReturnPolicyPage })));
const PrivacyPolicyPage = lazy(() => import('@/pages/static/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })));
const TermsPage = lazy(() => import('@/pages/static/TermsPage').then((m) => ({ default: m.TermsPage })));

const AccountDashboardPage = lazy(() => import('@/pages/account/AccountDashboardPage').then((m) => ({ default: m.AccountDashboardPage })));
const OrdersPage = lazy(() => import('@/pages/account/OrdersPage').then((m) => ({ default: m.OrdersPage })));
const OrderDetailPage = lazy(() => import('@/pages/account/OrderDetailPage').then((m) => ({ default: m.OrderDetailPage })));
const WishlistPage = lazy(() => import('@/pages/account/WishlistPage').then((m) => ({ default: m.WishlistPage })));
const AddressesPage = lazy(() => import('@/pages/account/AddressesPage').then((m) => ({ default: m.AddressesPage })));
const ProfilePage = lazy(() => import('@/pages/account/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const ChangePasswordPage = lazy(() => import('@/pages/account/ChangePasswordPage').then((m) => ({ default: m.ChangePasswordPage })));

const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const AdminProductsPage = lazy(() => import('@/pages/admin/AdminProductsPage').then((m) => ({ default: m.AdminProductsPage })));
const AdminCategoriesPage = lazy(() => import('@/pages/admin/AdminCategoriesPage').then((m) => ({ default: m.AdminCategoriesPage })));
const AdminOrdersPage = lazy(() => import('@/pages/admin/AdminOrdersPage').then((m) => ({ default: m.AdminOrdersPage })));
const AdminOrderDetailPage = lazy(() => import('@/pages/admin/AdminOrderDetailPage').then((m) => ({ default: m.AdminOrderDetailPage })));
const AdminCustomersPage = lazy(() => import('@/pages/admin/AdminCustomersPage').then((m) => ({ default: m.AdminCustomersPage })));
const AdminCouponsPage = lazy(() => import('@/pages/admin/AdminCouponsPage').then((m) => ({ default: m.AdminCouponsPage })));
const AdminReviewsPage = lazy(() => import('@/pages/admin/AdminReviewsPage').then((m) => ({ default: m.AdminReviewsPage })));
const AdminBulkOrdersPage = lazy(() => import('@/pages/admin/AdminBulkOrdersPage').then((m) => ({ default: m.AdminBulkOrdersPage })));
const AdminBlogPage = lazy(() => import('@/pages/admin/AdminBlogPage').then((m) => ({ default: m.AdminBlogPage })));
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage })));

function PageFallback() {
  return <div className="container-app py-16"><div className="h-40 animate-pulse rounded-xl bg-gray-100" /></div>;
}

export function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="collections" element={<CollectionsIndexPage />} />
          <Route path="collections/:slug" element={<CollectionPage />} />
          <Route path="products/:slug" element={<ProductDetailPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="track-order" element={<TrackOrderPage />} />
          <Route path="bulk-orders" element={<BulkOrdersPage />} />
          <Route path="blog" element={<BlogListPage />} />
          <Route path="blog/:slug" element={<BlogPostPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="shipping-policy" element={<ShippingPolicyPage />} />
          <Route path="return-policy" element={<ReturnPolicyPage />} />
          <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />

          <Route element={<CustomerRoute />}>
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="account" element={<AccountLayout />}>
              <Route index element={<AccountDashboardPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:id" element={<OrderDetailPage />} />
              <Route path="wishlist" element={<WishlistPage />} />
              <Route path="addresses" element={<AddressesPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="change-password" element={<ChangePasswordPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="orders/:id" element={<AdminOrderDetailPage />} />
            <Route path="customers" element={<AdminCustomersPage />} />
            <Route path="coupons" element={<AdminCouponsPage />} />
            <Route path="reviews" element={<AdminReviewsPage />} />
            <Route path="bulk-orders" element={<AdminBulkOrdersPage />} />
            <Route path="blog" element={<AdminBlogPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
