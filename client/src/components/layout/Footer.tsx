import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Youtube, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettings } from '@/hooks/useSettings';
import { subscribeNewsletterRequest } from '@/api/newsletter';
import { getErrorMessage } from '@/api/axios';

export function Footer() {
  const { data: settings } = useSettings();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    try {
      await subscribeNewsletterRequest(email);
      toast.success('Subscribed successfully!');
      setEmail('');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Subscription failed'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <footer className="mt-16 border-t border-gray-100 bg-brand-900 text-brand-100">
      <div className="container-app grid grid-cols-2 gap-8 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="col-span-2 sm:col-span-2 lg:col-span-1">
          <span className="flex items-center gap-2">
            <img src="/brand/greenkart-icon.webp" alt="" className="h-7 w-7 object-contain" />
            <span className="font-display text-xl font-bold text-white">GreenKart</span>
          </span>
          <p className="mt-3 text-sm text-brand-200">
            Premium gardening essentials delivered across India. Grow your green space with confidence.
          </p>
          <div className="mt-4 flex gap-3">
            {settings?.socialLinks.instagram && (
              <a href={settings.socialLinks.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={18} /></a>
            )}
            {settings?.socialLinks.facebook && (
              <a href={settings.socialLinks.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={18} /></a>
            )}
            {settings?.socialLinks.youtube && (
              <a href={settings.socialLinks.youtube} target="_blank" rel="noreferrer" aria-label="YouTube"><Youtube size={18} /></a>
            )}
            {settings?.socialLinks.linkedin && (
              <a href={settings.socialLinks.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={18} /></a>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">Shop</h3>
          <ul className="space-y-2 text-sm text-brand-200 [&>li>a]:transition-colors [&>li>a:hover]:text-white">
            <li><Link to="/collections/pots-and-planters">Planters</Link></li>
            <li><Link to="/collections/seeds">Seeds</Link></li>
            <li><Link to="/collections/soil-and-fertilizers">Fertilizers</Link></li>
            <li><Link to="/collections/gardening-tools">Tools</Link></li>
            <li><Link to="/collections/grow-bags">Grow Bags</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">Help</h3>
          <ul className="space-y-2 text-sm text-brand-200 [&>li>a]:transition-colors [&>li>a:hover]:text-white">
            <li><Link to="/contact">Contact Us</Link></li>
            <li><Link to="/track-order">Track Order</Link></li>
            <li><Link to="/shipping-policy">Shipping Policy</Link></li>
            <li><Link to="/return-policy">Return Policy</Link></li>
            <li><Link to="/privacy-policy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms &amp; Conditions</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">Company</h3>
          <ul className="space-y-2 text-sm text-brand-200 [&>li>a]:transition-colors [&>li>a:hover]:text-white">
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/bulk-orders">Bulk Orders</Link></li>
            <li><Link to="/blog">Blog</Link></li>
          </ul>
        </div>

        <div className="col-span-2 sm:col-span-2 lg:col-span-1">
          <h3 className="mb-3 text-sm font-semibold text-white">Stay in the Loop</h3>
          <p className="mb-3 text-sm text-brand-200">Gardening tips and offers, straight to your inbox.</p>
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="w-full rounded-lg bg-brand-800 px-3 py-2 text-sm text-white placeholder:text-brand-300 focus:outline-none"
            />
            <button type="submit" disabled={isSubmitting} className="flex shrink-0 items-center justify-center rounded-lg bg-accent-500 px-3 hover:bg-accent-600 disabled:opacity-50" aria-label="Subscribe">
              <Send size={16} />
            </button>
          </form>
          <div className="mt-4 text-xs text-brand-300">
            <p>{settings?.contactEmail}</p>
            <p>{settings?.contactPhone}</p>
            <p>{settings?.contactAddress}</p>
            <p>{settings?.workingHours}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-brand-800">
        <div className="container-app flex flex-col items-center justify-between gap-3 py-4 text-xs text-brand-300 sm:flex-row">
          <p>© {new Date().getFullYear()} GreenKart. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="rounded border border-brand-700 px-2 py-1 text-[10px] font-medium text-brand-200">
              Cash on Delivery
            </span>
            <span className="rounded border border-brand-700 px-2 py-1 text-[10px] font-medium text-brand-400">
              Online Payments — Coming Soon
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
