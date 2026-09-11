// components/help/faq-data.ts

export interface FaqItem {
  id: string;
  number: number;
  question: string;
  answer: string;
}

export const FAQ_DATA: readonly FaqItem[] = [
  {
    id: 'what-is-saksham',
    number: 1,
    question: 'What is SAKSHAM?',
    answer:
      'SAKSHAM is an intelligent business planning platform designed specifically for rural and semi-urban entrepreneurs in India. It combines local census data, mandi prices, and government scheme eligibility to help you choose, plan, and fund viable business ventures.',
  },
  {
    id: 'fit-score',
    number: 2,
    question: 'How does the Fit Score work?',
    answer:
      'The Fit Score evaluates how well a business category matches your available capital, location demographics, local raw material supply, and demand trends. Scores range from 0 to 100, where higher scores indicate greater feasibility and lower risk.',
  },
  {
    id: 'confidence-levels',
    number: 3,
    question: 'What do the confidence levels mean?',
    answer:
      'Confidence levels (High, Medium, Low) reflect the depth and recency of underlying data points for your location, including village population, nearest mandi prices, and verified scheme criteria.',
  },
  {
    id: 'scheme-eligibility',
    number: 4,
    question: 'How is scheme eligibility calculated?',
    answer:
      'Scheme eligibility checks your required capital, category, and demographic profile against criteria for central and state programs like PMEGP, Mudra, NABARD, and State Rural Livelihood Missions.',
  },
  {
    id: 'suitability-vs-eligibility',
    number: 5,
    question: 'What is the difference between Suitability and Eligibility?',
    answer:
      'Eligibility means you meet the official government criteria to apply for a loan or subsidy. Suitability measures whether that scheme actually fits your business cash flow, collateral capacity, and repayment timelines.',
  },
  {
    id: 'data-collection',
    number: 6,
    question: 'What data do you collect and how is it used?',
    answer:
      'We do not sell personal data. Your preferences, capital, and assessment inputs are stored locally in your browser to personalize recommendations, calculate financial models, and compare categories.',
  },
  {
    id: 'change-language',
    number: 7,
    question: 'How do I change the app language?',
    answer:
      'You can switch your preferred language anytime using the language selector in the left sidebar (on desktop) or in your Profile and Drawer navigation (on mobile). SAKSHAM supports English, Hindi, and regional languages.',
  },
  {
    id: 'install-app',
    number: 8,
    question: 'How do I install the app on my phone?',
    answer:
      'SAKSHAM is a Progressive Web App (PWA). On mobile, tap the browser menu (or the Install App button in our navigation) and select "Add to Home screen" to install it without downloading from an app store.',
  },
  {
    id: 'save-compare',
    number: 9,
    question: 'Can I save and compare categories?',
    answer:
      'Yes. Click the bookmark icon on any category to save it to your Saved list. You can select multiple categories to compare capital needs, payback periods, and profit margins side-by-side in the Compare view.',
  },
  {
    id: 'more-info',
    number: 10,
    question: 'Where can I find more information about how SAKSHAM works?',
    answer:
      'Visit the "How SAKSHAM Works" guide via the sidebar navigation or the banner at the bottom of this page for an in-depth walkthrough of our methodology, data sources, and calculations.',
  },
] as const;
