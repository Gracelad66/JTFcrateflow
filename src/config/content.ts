/**
 * SITE CONTENT CONFIG
 * ───────────────────
 * All user-facing copy lives here. Edit this file to update any text
 * shown on the site without touching the component files.
 */

import { Truck, TrendingDown, ShieldCheck, Store, Package, CreditCard, Repeat } from 'lucide-react';

// ─── Brand ──────────────────────────────────────────────────────────────────

export const BRAND = {
  name: 'CrateFlow NG',
  tagline: 'Wholesale Drinks Marketplace',
  logo: 'Package', // lucide-react icon name used in headers
};

// ─── Trust / Feature Badges ──────────────────────────────────────────────────
// Shown on the Catalog hero row and the sidebar footer.
// Add, remove, or reorder items here freely.

export const TRUST_BADGES = [
  {
    icon: Truck,
    title: '24h Delivery',
    subtitle: 'Within Lagos & environs',
    colorClass: 'bg-success-50 text-success-600',
  },
  {
    icon: TrendingDown,
    title: 'Wholesale Pricing',
    subtitle: 'Buy more, pay less per crate',
    colorClass: 'bg-brand-50 text-brand-600',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Payments',
    subtitle: 'Card · Bank transfer · Cash',
    colorClass: 'bg-accent-100 text-accent-700',
  },
] as const;

// ─── Catalog Hero ────────────────────────────────────────────────────────────

export const CATALOG_HERO = {
  headline: 'Nigeria\'s wholesale drinks marketplace.',
  subheadline:
    'Order premium drinks by the crate from multiple sellers at wholesale prices. Pay online or on delivery. Return empty crates to save more.',
  ctaBrowse: 'Browse Drinks',
  ctaRegister: 'Create Account',
};

// ─── Landing Page ────────────────────────────────────────────────────────────

export const LANDING_PAGE = {
  heroHeadline: 'Nigeria\'s #1 wholesale drinks marketplace',
  heroSubheadline:
    'Order premium drinks by the crate from multiple sellers at wholesale prices. Pay online or on delivery. Return empty crates to save even more.',
  heroCtaBrowse: 'Browse Catalog',
  heroCtaRegister: 'Start Selling',
  stats: [
    { value: '500+', label: 'Products' },
    { value: '50+', label: 'Sellers' },
    { value: '24h', label: 'Delivery' },
    { value: '100%', label: 'Verified' },
  ],
  howItWorks: [
    {
      icon: Package,
      title: 'Browse & Order',
      description: 'Explore thousands of drinks from multiple sellers. Add to cart and order by the crate at wholesale prices.',
    },
    {
      icon: CreditCard,
      title: 'Pay Your Way',
      description: 'Pay securely online with card or bank transfer, or choose cash on delivery — whichever works for you.',
    },
    {
      icon: Truck,
      title: 'Fast Delivery',
      description: 'Get your crates delivered within 24 hours across Lagos and environs. Track your order every step of the way.',
    },
    {
      icon: Repeat,
      title: 'Return & Save',
      description: 'Return empty crates when you reorder to reduce waste and unlock additional savings on every purchase.',
    },
  ],
  sellerCtaHeadline: 'Become a seller on CrateFlow NG',
  sellerCtaBody: 'Reach thousands of buyers across Nigeria. List your products, manage orders, and grow your drinks business — all from one dashboard.',
  sellerCtaButton: 'Create Seller Account',
  features: [
    {
      icon: Store,
      title: 'Multi-Seller Marketplace',
      description: 'Buy from multiple verified sellers in one order. Compare prices, discover new brands, and support local businesses.',
    },
    {
      icon: TrendingDown,
      title: 'Wholesale Pricing',
      description: 'Buy in bulk and unlock automatic wholesale pricing. The more crates you order, the less you pay per unit.',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Payments',
      description: 'Pay online with confidence or choose cash on delivery. Every transaction is protected and trackable.',
    },
    {
      icon: Repeat,
      title: 'Crate Exchange',
      description: 'Return your empty crates on your next order and save. We refill them, you pay less — win-win.',
    },
  ],
};

// ─── Sidebar footer blurb ────────────────────────────────────────────────────

export const SIDEBAR_BLURB = {
  title: 'Delivery in 24h',
  subtitle: 'Lagos & environs',
};

// ─── Login page ──────────────────────────────────────────────────────────────

export const LOGIN_PAGE = {
  brandHeadline: 'Wholesale drinks, simplified.',
  brandSubheadline:
    'Sign in to order premium drinks by the crate at wholesale prices, track deliveries, and manage crate exchanges.',
  brandBullets: ['24h delivery', 'Wholesale prices'],
  formTitle: 'Welcome back',
  formSubtitle: 'Sign in to your account to continue ordering.',
  ctaLabel: 'Sign In',
  ctaLoadingLabel: 'Signing in...',
  registerPrompt: 'New here?',
  registerLink: 'Create an account',
};

// ─── Register page ───────────────────────────────────────────────────────────

export const REGISTER_PAGE = {
  brandHeadline: 'Start ordering in minutes.',
  brandSubheadline:
    'Create a free account to browse our wholesale catalog, unlock bulk pricing, and track your deliveries in real time.',
  brandHighlights: [
    { heading: 'Fast', description: '24h delivery' },
    { heading: 'Fair', description: 'Wholesale prices' },
    { heading: 'Easy', description: 'Crate exchanges' },
  ],
  formTitle: 'Create account',
  formSubtitle: 'Join CrateFlow NG to start ordering or selling wholesale drinks.',
  ctaLabel: 'Create Account',
  ctaLoadingLabel: 'Creating account...',
  loginPrompt: 'Already have an account?',
  loginLink: 'Sign in',
};
