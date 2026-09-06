import { lazy, Suspense } from 'react'
import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import StaffRoute from '@/components/StaffRoute'
import AdminRoute from '@/components/AdminRoute'
import AppErrorBoundary from '@/components/AppErrorBoundary'

// Keep the public landing page outside AuthProvider so it can render instantly
// even when Supabase is unavailable or has not been configured yet.
const Home = lazy(() => import('@/pages/Home'))
const Login = lazy(() => import('@/pages/Login'))
const Signup = lazy(() => import('@/pages/Signup'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Menu = lazy(() => import('@/pages/Menu'))
const Cart = lazy(() => import('@/pages/Cart'))
const Checkout = lazy(() => import('@/pages/Checkout'))
const OrderTracking = lazy(() => import('@/pages/OrderTracking'))
const OrderHistory = lazy(() => import('@/pages/OrderHistory'))
const StaffDashboard = lazy(() => import('@/pages/StaffDashboard'))
const StaffOrders = lazy(() => import('@/pages/StaffOrders'))
const CustomerCard = lazy(() => import('@/pages/CustomerCard'))
const StaffVerify = lazy(() => import('@/pages/StaffVerify'))
const IdentityVerificationPage = lazy(() => import('@/pages/IdentityVerification'))
const StaffVerificationQueue = lazy(() => import('@/pages/StaffVerificationQueue'))
const Notifications = lazy(() => import('@/pages/Notifications'))
const StaffInventory = lazy(() => import('@/pages/StaffInventory'))
const AdminAnalytics = lazy(() => import('@/pages/AdminAnalytics'))
const AdminPromotions = lazy(() => import('@/pages/AdminPromotions'))
const GiftCards = lazy(() => import('@/pages/GiftCards'))
const AdminStores = lazy(() => import('@/pages/AdminStores'))
const Referrals = lazy(() => import('@/pages/Referrals'))
const AiBarista = lazy(() => import('@/pages/AiBarista'))
const CoffeeLab = lazy(() => import('@/pages/CoffeeLab'))
const CoffeeDNA = lazy(() => import('@/pages/CoffeeDNA'))
const Community = lazy(() => import('@/pages/Community'))
const ScheduledOrders = lazy(() => import('@/pages/ScheduledOrders'))
const StoreLocator = lazy(() => import('@/pages/StoreLocator'))
const Reviews = lazy(() => import('@/pages/Reviews'))
const Achievements = lazy(() => import('@/pages/Achievements'))
const AdminProducts = lazy(() => import('@/pages/AdminProducts'))
const AiConcierge = lazy(() => import('@/pages/AiConcierge'))
const StaffCopilot = lazy(() => import('@/pages/StaffCopilot'))

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#100a07] text-[#f3e5d0]">
      <div className="text-center">
        <div className="skeleton h-1 w-28 mx-auto mb-5" />
        <p className="text-xs tracking-[.25em] opacity-60">PREPARING YOUR COFFEE</p>
      </div>
    </div>
  )
}

function AppProviders() {
  return (
    <AuthProvider>
      <CartProvider>
        <Outlet />
      </CartProvider>
    </AuthProvider>
  )
}

export default function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />

            <Route element={<AppProviders />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/menu" element={<ProtectedRoute><Menu /></ProtectedRoute>} />
              <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
              <Route path="/orders/:orderId" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
              <Route path="/card" element={<ProtectedRoute><CustomerCard /></ProtectedRoute>} />
              <Route path="/verify-identity" element={<ProtectedRoute><IdentityVerificationPage /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/gift-cards" element={<ProtectedRoute><GiftCards /></ProtectedRoute>} />
              <Route path="/referrals" element={<ProtectedRoute><Referrals /></ProtectedRoute>} />
              <Route path="/barista" element={<ProtectedRoute><AiBarista /></ProtectedRoute>} />
              <Route path="/ai" element={<ProtectedRoute><AiConcierge /></ProtectedRoute>} />
              <Route path="/lab" element={<ProtectedRoute><CoffeeLab /></ProtectedRoute>} />
              <Route path="/dna" element={<ProtectedRoute><CoffeeDNA /></ProtectedRoute>} />
              <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
              <Route path="/schedule" element={<ProtectedRoute><ScheduledOrders /></ProtectedRoute>} />
              <Route path="/stores" element={<ProtectedRoute><StoreLocator /></ProtectedRoute>} />
              <Route path="/reviews" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
              <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />

              <Route path="/staff" element={<StaffRoute><StaffOrders /></StaffRoute>} />
              <Route path="/staff/copilot" element={<StaffRoute><StaffCopilot /></StaffRoute>} />
              <Route path="/staff/verify" element={<StaffRoute><StaffVerify /></StaffRoute>} />
              <Route path="/staff/verification-queue" element={<StaffRoute><StaffVerificationQueue /></StaffRoute>} />
              <Route path="/staff/inventory" element={<StaffRoute><StaffInventory /></StaffRoute>} />

              <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
              <Route path="/admin/promotions" element={<AdminRoute><AdminPromotions /></AdminRoute>} />
              <Route path="/admin/stores" element={<AdminRoute><AdminStores /></AdminRoute>} />
              <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppErrorBoundary>
  )
}
