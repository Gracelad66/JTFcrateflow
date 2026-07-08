/**
 * SITE CONTENT CONFIG
 * ───────────────────
 * All user-facing copy lives here. Edit this file to update any text
 * shown on the site without touching the component files.
 */

import { Truck, TrendingDown, ShieldCheck } from 'lucide-react';

// ─── Brand ──────────────────────────────────────────────────────────────────

export const BRAND = {
  name: 'CrateFlow',
  tagline: 'Wholesale Drinks',
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
  headline: 'Wholesale soft drinks, delivered fast.',
  subheadline:
    'Order premium drinks by the crate at wholesale prices. Pay online or on delivery. Return empty crates to save more.',
  ctaBrowse: 'Browse Drinks',
  ctaRegister: 'Create Account',
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
  formSubtitle: 'Join CrateFlow to start ordering wholesale drinks.',
  ctaLabel: 'Create Account',
  ctaLoadingLabel: 'Creating account...',
  loginPrompt: 'Already have an account?',
  loginLink: 'Sign in',
};
