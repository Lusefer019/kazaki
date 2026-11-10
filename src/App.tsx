import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import {
  IntroScreen,
  Navbar,
  HeroSection,
  ProductsView,
  ProductCard,
  ProductDetailsModal,
  CartDrawer,
  CheckoutModal,
  OrdersModal,
  AuthModal,
  PhoneNotificationsModal,
  CustomerNotificationsModal,
  ManagerLiveAlerts,
  CustomerLiveAlerts,
  AdminDashboard,
  ContactView,
  LoginView,
  AboutView,
  Footer,
  ScrollLegoFlowerCanvas,
  ErrorBoundary,
  IOSInstallBanner,
} from './components';
import { ShieldAlert } from 'lucide-react';
import { Order } from './types';
import { setGlobalSpamNotifier } from './utils/antiSpam';

const StoreContent: React.FC = () => {
  const {
    activeView,
    setActiveView,
    currentUser,
    switchRole,
    products,
    setSelectedCategory,
    getBtnText,
    getText,
    isPhoneNotifsModalOpen,
    setIsPhoneNotifsModalOpen,
    isCustomerNotifsModalOpen,
    setIsCustomerNotifsModalOpen,
    isIntroActive,
  } = useStore();

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [spamToast, setSpamToast] = useState<string | null>(null);

  useEffect(() => {
    setGlobalSpamNotifier((msg) => {
      setSpamToast(msg);
      setTimeout(() => {
        setSpamToast(null);
      }, 3500);
    });
  }, []);

  // Strict route protection: Admin dashboard is accessible ONLY to logged-in admins
  useEffect(() => {
    if (activeView === 'admin' && currentUser?.role !== 'admin') {
      setActiveView('home');
    }
  }, [activeView, currentUser, setActiveView]);

  const handleOrderSuccess = (order: Order) => {
    // optional notification or redirect
  };

  return (
    <div className="min-h-screen flex flex-col bg-rose-50/20 text-stone-800 relative font-cairo" dir="rtl">
      {/* Global Anti-Spam / Rate-Limit Alert Pill */}
      {spamToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-stone-900/95 text-white border border-rose-500/50 shadow-2xl backdrop-blur-md text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-200 pointer-events-none">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
          <span>{spamToast}</span>
        </div>
      )}

      {/* Dynamic Intro Screen (Controlled by Admin: Image, Video, or Animation) */}
      <IntroScreen />

      {/* Interactive 3D Scroll Lego Flower Background (Assembles on scroll & rotates 360°) */}
      {activeView !== 'admin' && !isIntroActive && <ScrollLegoFlowerCanvas />}

      {/* Global Navigation */}
      <Navbar
        onOpenAuth={(mode) => {
          setAuthModalMode(mode || 'login');
          setIsAuthOpen(true);
        }}
        onOpenOrders={() => setIsOrdersOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {activeView === 'admin' && currentUser?.role === 'admin' ? (
          <AdminDashboard />
        ) : activeView === 'products' ? (
          <ProductsView />
        ) : activeView === 'contact' ? (
          <ContactView />
        ) : activeView === 'login' ? (
          <LoginView />
        ) : activeView === 'about' ? (
          <AboutView />
        ) : (
          /* Home View */
          <div>
            {/* Hero Section */}
            <HeroSection />
          </div>
        )}
      </main>

      {/* Global Modals & Drawers */}
      <ProductDetailsModal />

      <CartDrawer
        onOpenCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />

      <OrdersModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authModalMode}
      />

      {/* Global Phone Notifications Modal */}
      <PhoneNotificationsModal
        isOpen={isPhoneNotifsModalOpen}
        onClose={() => setIsPhoneNotifsModalOpen(false)}
      />

      {/* Customer Status Notifications & Manager Notifications Modal */}
      <CustomerNotificationsModal
        isOpen={isCustomerNotifsModalOpen}
        onClose={() => setIsCustomerNotifsModalOpen(false)}
        onOpenOrders={() => setIsOrdersOpen(true)}
      />

      {/* Floating Real-Time Manager Incoming Alerts (Orders & Support Chats) */}
      <ManagerLiveAlerts />

      {/* Floating Real-Time Customer Incoming Alerts (New Products & Order Status) */}
      <CustomerLiveAlerts />

      {/* iOS Safari Install Prompt (shows only on iPhone/iPad Safari, not standalone PWA) */}
      <IOSInstallBanner />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <StoreContent />
      </StoreProvider>
    </ErrorBoundary>
  );
}
