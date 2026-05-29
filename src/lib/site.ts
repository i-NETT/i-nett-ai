// Site-wide constants. Single source of truth.

export const SITE = {
  name: 'Fortify AI',
  parent: 'i-NETT',
  domain: 'i-nett.ai',
  url: 'https://i-nett.ai',
  parentUrl: 'https://i-nett.com',
  tagline: 'Managed AI for mid-market business.',
  description:
    'Fortify AI is the managed AI offering from i-NETT. We deploy secure, compliance-ready AI for mid-market firms across Southern California, the United States, and Canada. Built for HIPAA, GDPR, SOC, and CCPA. Underwritten by Lloyd’s of London cybersecurity insurance policy.',
  shortDescription:
    'Managed AI for mid-market firms. HIPAA, GDPR, SOC, and CCPA ready. Underwritten by Lloyd’s of London cybersecurity insurance policy.',
  email: 'hello@i-nett.com',
  phone: '+1-805-918-6160',
  phoneDisplay: '(805) 918-6160',
  bookingUrl: 'https://meetings-na2.hubspot.com/ndreyfus/initial_call',
  podcastUrl:
    'https://podcasts.apple.com/us/podcast/the-digital-dilemma/id1764658911',
  podcastTitle: 'The Digital Dilemma',
  podcastHost: 'Nick Dreyfus',
  social: {
    linkedinPerson: 'https://www.linkedin.com/in/nicholasdreyfus/',
    parentSite: 'https://i-nett.com',
  },
  address: {
    locality: 'Ventura',
    region: 'CA',
    country: 'US',
    // Pending verification with Nick before launch. Replace with verified street + postal code.
    addressNote: 'Mailing address available on request.',
  },
  geo: {
    primaryLat: 32.7157,
    primaryLng: -117.1611, // San Diego primary service hub
  },
  // Google Search Console + Bing Webmaster placeholder. Nick replaces post-launch.
  verification: {
    google: 'REPLACE_WITH_GOOGLE_SEARCH_CONSOLE_TAG',
    bing: 'REPLACE_WITH_BING_WEBMASTER_TAG',
  },
} as const;

export const NAV_PRIMARY = [
  { label: 'Fortify AI', href: '/fortify-ai' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Industries', href: '/industries/healthcare' },
  { label: 'ROI Calculator', href: '/roi-calculator' },
  { label: 'Coverage', href: '/coverage' },
  { label: 'About', href: '/about' },
] as const;

export const NAV_INDUSTRIES = [
  { label: 'Healthcare', href: '/industries/healthcare' },
  { label: 'Legal', href: '/industries/legal' },
  { label: 'Financial Services', href: '/industries/financial-services' },
  { label: 'Professional Services', href: '/industries/professional-services' },
] as const;

export const NAV_LOCATIONS = [
  { label: 'Southern California', href: '/locations/southern-california' },
  { label: 'San Diego', href: '/locations/san-diego' },
  { label: 'Orange County', href: '/locations/orange-county' },
  { label: 'Los Angeles', href: '/locations/los-angeles' },
  { label: 'Ventura', href: '/locations/ventura' },
] as const;

export const NAV_FOOTER_RESOURCES = [
  { label: 'Case Studies', href: '/case-studies' },
  { label: 'Blog', href: '/blog' },
  { label: 'Resources', href: '/resources' },
  { label: 'Podcast', href: '/podcast' },
  { label: 'Contact', href: '/contact' },
] as const;

export const NAV_LEGAL = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Accessibility', href: '/accessibility' },
  { label: 'Terms', href: '/terms' },
] as const;

// Industry presets for ROI calculator. BLS Occupational Employment Statistics, May 2024.
export const INDUSTRY_PRESETS = [
  { id: 'healthcare', label: 'Healthcare', employees: 150, hourly: 52 },
  { id: 'legal', label: 'Legal', employees: 75, hourly: 95 },
  { id: 'financial-services', label: 'Financial Services', employees: 100, hourly: 68 },
  { id: 'professional-services', label: 'Professional Services', employees: 50, hourly: 72 },
  { id: 'real-estate', label: 'Real Estate', employees: 80, hourly: 48 },
  { id: 'manufacturing', label: 'Manufacturing', employees: 200, hourly: 42 },
  { id: 'construction', label: 'Construction', employees: 60, hourly: 55 },
  { id: 'nonprofit-education', label: 'Nonprofit / Education', employees: 100, hourly: 38 },
  { id: 'hospitality-retail', label: 'Hospitality / Retail', employees: 250, hourly: 32 },
] as const;

// Service areas. Used in LocalBusiness schema and footer.
export const SERVICE_AREAS = [
  'San Diego',
  'Del Mar',
  'Carlsbad',
  'Oceanside',
  'Poway',
  'La Mesa',
  'Chula Vista',
  'Orange County',
  'Los Angeles',
  'Ventura',
  'Southern California',
  'United States',
  'Canada',
] as const;
