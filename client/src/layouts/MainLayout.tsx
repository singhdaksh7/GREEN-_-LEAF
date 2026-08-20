import { Outlet } from 'react-router-dom';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileNav } from '@/components/layout/MobileNav';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { QuickViewModal } from '@/components/product/QuickViewModal';

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <Header />
      <MobileNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
      <CartDrawer />
      <QuickViewModal />
    </div>
  );
}
