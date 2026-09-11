// data/stateOpportunitiesData.ts
// Comprehensive opportunities and trend profiles across Indian States and UTs.

import {
  type Census2011Metrics,
  type ODOPMetrics,
  getStateRealData,
  STATE_REAL_DATA,
} from './stateCensusODOPData';

export type OpportunityLevel = 'High' | 'Medium' | 'Emerging' | 'Lower';

export interface StateMoverStat {
  readonly title: string;
  readonly percent: number;
  readonly direction: 'up' | 'down';
  readonly subtitle?: string;
}

export interface StateOpportunityProfile {
  readonly id: string;
  readonly name: string;
  readonly opportunityLevel: OpportunityLevel;
  readonly headline: string;
  readonly description: string;
  readonly topMovers: readonly StateMoverStat[];
  readonly topCategory: string;
  readonly activeSchemes: readonly string[];
  readonly feasibleUnitsCount: number;
  readonly recommendedCapital: string;
  readonly demandLevel: 'High' | 'Medium' | 'Emerging';
  readonly nearbyHubsCount: number;
  readonly census?: Census2011Metrics;
  readonly odop?: ODOPMetrics;
  readonly featuredArticle: {
    readonly badge: string;
    readonly title: string;
    readonly description: string;
    readonly capital: string;
  };
}

export const STATE_OPPORTUNITY_PROFILES: Record<string, StateOpportunityProfile> = {
  up: {
    id: 'up',
    name: 'Uttar Pradesh',
    opportunityLevel: 'High',
    headline: 'Highest rural dairy & agro processing growth nationwide',
    description: 'Active state dairy subsidies, ODOP clusters, and PMFME micro-enterprise support have accelerated food and dairy enterprise creation.',
    topMovers: [
      { title: 'Dairy registrations', percent: 34, direction: 'up', subtitle: 'Registrations up in your region' },
      { title: 'Textile demand', percent: 21, direction: 'up', subtitle: 'Steady handloom demand' },
      { title: 'Agri processing', percent: 18, direction: 'up', subtitle: 'Growing with new schemes' },
    ],
    topCategory: 'Dairy & Livestock',
    activeSchemes: [
      'PMFME Scheme (35% Capital Subsidy up to ₹10L)',
      'UP State Dairy Development & Cattle Subsidy',
      'One District One Product (ODOP) Credit Support',
    ],
    feasibleUnitsCount: 1420,
    recommendedCapital: '₹50,000 – ₹2,00,000',
    demandLevel: 'High',
    nearbyHubsCount: 8,
    census: STATE_REAL_DATA.up.census_2011,
    odop: STATE_REAL_DATA.up.odop,
    featuredArticle: {
      badge: 'Rising in Uttar Pradesh',
      title: 'Dairy registrations are up 34% this year',
      description: 'More than any other category in your state, following the expanded state dairy subsidy in March.',
      capital: '₹1,00,000',
    },
  },
  rj: {
    id: 'rj',
    name: 'Rajasthan',
    opportunityLevel: 'High',
    headline: 'Surging clean energy & traditional handicraft exports',
    description: 'Solar micro-grids, desert spice processing, and artisanal stone & leather craft have seen major credit guarantees.',
    topMovers: [
      { title: 'Solar & Clean Energy', percent: 28, direction: 'up', subtitle: 'Rooftop & pump schemes' },
      { title: 'Handicrafts & Pottery', percent: 19, direction: 'up', subtitle: 'Export & tourism surge' },
      { title: 'Spice Processing', percent: 16, direction: 'up', subtitle: 'Cumin & coriander units' },
    ],
    topCategory: 'Solar & Clean Energy',
    activeSchemes: [
      'PM-KUSUM Component-A Solar Subsidy',
      'Rajasthan Rural Non-Farm Development (RUDA)',
      'Mukhyamantri Laghu Udyog Protsahan Yojana',
    ],
    feasibleUnitsCount: 980,
    recommendedCapital: '₹75,000 – ₹2,50,000',
    demandLevel: 'High',
    nearbyHubsCount: 6,
    featuredArticle: {
      badge: 'Rising in Rajasthan',
      title: 'Solar & Clean Energy micro-units up 28%',
      description: 'Decentralized agricultural solar pumps and clean cold-storage seeing record rural adoption.',
      capital: '₹1,50,000',
    },
  },
  mh: {
    id: 'mh',
    name: 'Maharashtra',
    opportunityLevel: 'High',
    headline: 'Agri-logistics, food processing & rural retail corridor',
    description: 'High connectivity between rural nodes and western markets driving strong value-addition in horticulture and kirana supply chains.',
    topMovers: [
      { title: 'Agri Processing & Cold Chain', percent: 32, direction: 'up', subtitle: 'Horticulture corridors' },
      { title: 'Retail & FMCG Hubs', percent: 24, direction: 'up', subtitle: 'Tier 3/4 semi-urban demand' },
      { title: 'Services & Farm Repair', percent: 17, direction: 'up', subtitle: 'Machinery workshops' },
    ],
    topCategory: 'Agri Processing',
    activeSchemes: [
      'SMART Maharashtra Agri Project Subsidy',
      'PMEGP 35% Margin Money Subsidy',
      'CM Employment Generation Programme (CMEGP)',
    ],
    feasibleUnitsCount: 1680,
    recommendedCapital: '₹1,00,000 – ₹3,00,000',
    demandLevel: 'High',
    nearbyHubsCount: 11,
    featuredArticle: {
      badge: 'Rising in Maharashtra',
      title: 'Agri Processing value units surge 32%',
      description: 'Farmer Producer Companies and micro processors capturing high margins in onion & fruit drying.',
      capital: '₹2,00,000',
    },
  },
  gj: {
    id: 'gj',
    name: 'Gujarat',
    opportunityLevel: 'High',
    headline: 'Textile value chain & cooperative dairy expansion',
    description: 'Cooperative procurement networks and modern handloom technology grants give rural entrepreneurs immediate market linkage.',
    topMovers: [
      { title: 'Textiles & Handloom', percent: 30, direction: 'up', subtitle: 'Weaving & garment units' },
      { title: 'Dairy & Allied Products', percent: 22, direction: 'up', subtitle: 'Cooperative milk chilling' },
      { title: 'Retail & Kirana', percent: 16, direction: 'up', subtitle: 'Modernized village stores' },
    ],
    topCategory: 'Textiles & Handloom',
    activeSchemes: [
      'Gujarat Cottage & Village Industries Scheme (VBY)',
      'Cooperative Dairy Infrastructure Fund',
      'Shree Vajpayee Bankable Yojana',
    ],
    feasibleUnitsCount: 1250,
    recommendedCapital: '₹80,000 – ₹2,50,000',
    demandLevel: 'High',
    nearbyHubsCount: 9,
    featuredArticle: {
      badge: 'Rising in Gujarat',
      title: 'Textiles & Handloom micro-units up 30%',
      description: 'Integration of solar charkhas and digital market orders empowering rural artisan clusters.',
      capital: '₹1,25,000',
    },
  },
  mp: {
    id: 'mp',
    name: 'Madhya Pradesh',
    opportunityLevel: 'Medium',
    headline: 'Organic pulse milling & bio-fertilizer ventures',
    description: 'Abundant pulse and wheat production offers strong margin opportunities in decentralized mini-flour and dal mills.',
    topMovers: [
      { title: 'Grain & Pulse Processing', percent: 27, direction: 'up', subtitle: 'Mini dal mills' },
      { title: 'Organic Bio-Fertilizers', percent: 20, direction: 'up', subtitle: 'Vermi-compost units' },
      { title: 'Handicrafts & Chanderi', percent: 16, direction: 'up', subtitle: 'Heritage craft clusters' },
    ],
    topCategory: 'Agri Processing',
    activeSchemes: [
      'Mukhyamantri Udyam Kranti Yojana',
      'PMFME Pulse Milling Assistance',
      'MP Rural Livelihoods Mission',
    ],
    feasibleUnitsCount: 890,
    recommendedCapital: '₹60,000 – ₹1,80,000',
    demandLevel: 'Medium',
    nearbyHubsCount: 7,
    featuredArticle: {
      badge: 'Rising in Madhya Pradesh',
      title: 'Mini Pulse Mills registration up 27%',
      description: 'Local milling and branded packaging yielding 40% higher returns than selling raw produce.',
      capital: '₹1,20,000',
    },
  },
  br: {
    id: 'br',
    name: 'Bihar',
    opportunityLevel: 'Medium',
    headline: 'Makhana processing, maize flakes & honey packaging',
    description: 'GI-tagged Mithila Makhana and maize processing corridors are receiving special credit subsidies from state development funds.',
    topMovers: [
      { title: 'Makhana & Food Processing', percent: 26, direction: 'up', subtitle: 'Snack roasting units' },
      { title: 'Poultry & Livestock', percent: 18, direction: 'up', subtitle: 'Broiler & egg farms' },
      { title: 'Retail & Rural Logistics', percent: 14, direction: 'up', subtitle: 'District mini vans' },
    ],
    topCategory: 'Food & Beverages',
    activeSchemes: [
      'Bihar Udyami Yojana (50% grant up to ₹5 Lakhs)',
      'Makhana Vikas Yojana Subsidy',
      'PMFME Maize & Honey Cluster Support',
    ],
    feasibleUnitsCount: 840,
    recommendedCapital: '₹50,000 – ₹1,50,000',
    demandLevel: 'Medium',
    nearbyHubsCount: 6,
    featuredArticle: {
      badge: 'Rising in Bihar',
      title: 'Makhana & Food units grow 26%',
      description: 'State startup grants driving rapid establishment of mini roasting and nitrogen-packing units.',
      capital: '₹1,00,000',
    },
  },
  ka: {
    id: 'ka',
    name: 'Karnataka',
    opportunityLevel: 'Medium',
    headline: 'Silk reeling, coffee roasting & solar agri-tech',
    description: 'High technology adoption in southern districts coupled with sericulture subsidies creating steady rural incomes.',
    topMovers: [
      { title: 'Silk & Textile Weaving', percent: 29, direction: 'up', subtitle: 'Automatic reeling units' },
      { title: 'Solar Agro-Pumps', percent: 21, direction: 'up', subtitle: 'Micro cold rooms' },
      { title: 'Food & Spices', percent: 15, direction: 'up', subtitle: 'Cardamom & pepper pack' },
    ],
    topCategory: 'Textiles & Handloom',
    activeSchemes: [
      'Karnataka Silk Reeling Incentive Scheme',
      'Chief Minister Self Employment Scheme (CMEGP)',
      'Gram Panchayat Solar Microgrid Grant',
    ],
    feasibleUnitsCount: 920,
    recommendedCapital: '₹80,000 – ₹2,20,000',
    demandLevel: 'Medium',
    nearbyHubsCount: 8,
    featuredArticle: {
      badge: 'Rising in Karnataka',
      title: 'Silk & Handloom units increase by 29%',
      description: 'Modern motorized charkhas boosting productivity for home-based weaver cooperatives.',
      capital: '₹1,40,000',
    },
  },
  tn: {
    id: 'tn',
    name: 'Tamil Nadu',
    opportunityLevel: 'Medium',
    headline: 'Powerloom garments, auto repair & coir fiber',
    description: 'Deep industrial linkages in western and southern districts supporting equipment repair workshops and coir product enterprises.',
    topMovers: [
      { title: 'Textiles & Apparel', percent: 31, direction: 'up', subtitle: 'Knitting & powerloom' },
      { title: 'Services & Auto Repair', percent: 23, direction: 'up', subtitle: 'Two-wheeler & pump repair' },
      { title: 'Coir & Eco-Products', percent: 18, direction: 'up', subtitle: 'Pith blocks & ropes' },
    ],
    topCategory: 'Services & Repairs',
    activeSchemes: [
      'Unemployed Youth Employment Generation (UYEGP)',
      'Coir Industry Modernization Subsidy',
      'NEEDS State Entrepreneur Scheme',
    ],
    feasibleUnitsCount: 1100,
    recommendedCapital: '₹70,000 – ₹2,00,000',
    demandLevel: 'Medium',
    nearbyHubsCount: 10,
    featuredArticle: {
      badge: 'Rising in Tamil Nadu',
      title: 'Textile & Garment micro-clusters up 31%',
      description: 'Decentralized tailoring and garment sub-contracting hubs thriving in rural taluks.',
      capital: '₹1,10,000',
    },
  },
  pb: {
    id: 'pb',
    name: 'Punjab',
    opportunityLevel: 'Emerging',
    headline: 'Farm mechanization custom hiring & dairy automation',
    description: 'High tractor density creating high demand for specialized custom hiring centers and silage preparation units.',
    topMovers: [
      { title: 'Services & Farm Repairs', percent: 28, direction: 'up', subtitle: 'Tractor implement centers' },
      { title: 'Dairy & Silage Packing', percent: 22, direction: 'up', subtitle: 'Baled silage production' },
      { title: 'Food & Bakery', percent: 15, direction: 'up', subtitle: 'Wheat value addition' },
    ],
    topCategory: 'Services & Repairs',
    activeSchemes: [
      'Custom Hiring Centre (CHC) 40% Subsidy',
      'Punjab Dairy Development Board Grants',
      'PMEGP Micro Industrial Loans',
    ],
    feasibleUnitsCount: 650,
    recommendedCapital: '₹1,00,000 – ₹3,50,000',
    demandLevel: 'Emerging',
    nearbyHubsCount: 7,
    featuredArticle: {
      badge: 'Rising in Punjab',
      title: 'Machinery Services & CHC hubs up 28%',
      description: 'Custom machinery leasing proving highly profitable during crop harvesting cycles.',
      capital: '₹1,80,000',
    },
  },
  wb: {
    id: 'wb',
    name: 'West Bengal',
    opportunityLevel: 'Medium',
    headline: 'Jute handicrafts, fisheries & sweets packaging',
    description: 'Rapid growth in eco-friendly jute packaging, inland fish breeding, and packaged traditional sweets with cold chain support.',
    topMovers: [
      { title: 'Handicrafts & Jute Bags', percent: 27, direction: 'up', subtitle: 'Eco-carry bags' },
      { title: 'Fisheries & Aquaculture', percent: 20, direction: 'up', subtitle: 'Biofloc fish farming' },
      { title: 'Retail & Kirana', percent: 14, direction: 'up', subtitle: 'Rural distribution' },
    ],
    topCategory: 'Handicrafts',
    activeSchemes: [
      'Banglashree Scheme for Micro Enterprises',
      'Matsya Setu Biofloc Aquaculture Subsidy',
      'Jute Board Skill & Machinery Grants',
    ],
    feasibleUnitsCount: 880,
    recommendedCapital: '₹40,000 – ₹1,50,000',
    demandLevel: 'Medium',
    nearbyHubsCount: 6,
    featuredArticle: {
      badge: 'Rising in West Bengal',
      title: 'Jute Handicrafts & Bags expand by 27%',
      description: 'Single-use plastic bans opening huge regional markets for village jute tailoring units.',
      capital: '₹90,000',
    },
  },
  ap: {
    id: 'ap',
    name: 'Andhra Pradesh',
    opportunityLevel: 'Medium',
    headline: 'Aqua-farming logistics, chilly drying & retail stores',
    description: 'Coastal aquaculture inputs and solar crop dryers leading rapid rural self-employment.',
    topMovers: [
      { title: 'Agri Processing & Spices', percent: 25, direction: 'up', subtitle: 'Chilli & turmeric powder' },
      { title: 'Solar Drying Units', percent: 21, direction: 'up', subtitle: 'Clean post-harvest tech' },
      { title: 'Retail & Kirana', percent: 16, direction: 'up', subtitle: 'Village micro markets' },
    ],
    topCategory: 'Agri Processing',
    activeSchemes: [
      'YSR Cheyutha Enterprise Support',
      'AP Food Processing Policy 35% Capital Grant',
      'PMFME Chilly Cluster Scheme',
    ],
    feasibleUnitsCount: 760,
    recommendedCapital: '₹60,000 – ₹2,00,000',
    demandLevel: 'Medium',
    nearbyHubsCount: 8,
    featuredArticle: {
      badge: 'Rising in Andhra Pradesh',
      title: 'Solar Crop Drying micro-units up 21%',
      description: 'Reduced spoilage in chillies and mango pulp unlocking export grade local pricing.',
      capital: '₹1,20,000',
    },
  },
  ts: {
    id: 'ts',
    name: 'Telangana',
    opportunityLevel: 'Emerging',
    headline: 'Cotton ginning, turmeric processing & dairy kiosks',
    description: 'Cluster-based incentives in rural districts spurring farmer-owned micro enterprises.',
    topMovers: [
      { title: 'Textiles & Cotton Ginning', percent: 26, direction: 'up', subtitle: 'Micro ginning units' },
      { title: 'Food & Turmeric Processing', percent: 19, direction: 'up', subtitle: 'High-curcumin powder' },
      { title: 'Dairy Outlets', percent: 14, direction: 'up', subtitle: 'Vijaya Dairy kiosks' },
    ],
    topCategory: 'Textiles & Handloom',
    activeSchemes: [
      'T-IDEA State Capital Subsidy Scheme',
      'Telangana Food Processing Zones Grant',
      'Dalit Bandhu Enterprise Support',
    ],
    feasibleUnitsCount: 620,
    recommendedCapital: '₹75,000 – ₹2,20,000',
    demandLevel: 'Emerging',
    nearbyHubsCount: 6,
    featuredArticle: {
      badge: 'Rising in Telangana',
      title: 'Turmeric & Spice processing up 19%',
      description: 'Direct procurement kiosks connecting rural farmers with consumer brands.',
      capital: '₹1,30,000',
    },
  },
  hr: {
    id: 'hr',
    name: 'Haryana',
    opportunityLevel: 'Medium',
    headline: 'Murrah dairy genetics, mushroom farming & repair services',
    description: 'Proximity to NCR creates massive daily demand for fresh A2 milk, paneer, and button mushrooms.',
    topMovers: [
      { title: 'Dairy & Livestock (Murrah)', percent: 31, direction: 'up', subtitle: 'Value added paneer' },
      { title: 'Mushroom Cultivation', percent: 23, direction: 'up', subtitle: 'Controlled chamber units' },
      { title: 'Services & Vehicle Spares', percent: 18, direction: 'up', subtitle: 'Highway corridor repair' },
    ],
    topCategory: 'Dairy & Livestock',
    activeSchemes: [
      'Haryana Dairy Development Subsidy (25-35%)',
      'Mushroom Cultivation Mission Subsidy',
      'PMEGP Rural Service Unit Loans',
    ],
    feasibleUnitsCount: 710,
    recommendedCapital: '₹1,00,000 – ₹3,00,000',
    demandLevel: 'Medium',
    nearbyHubsCount: 9,
    featuredArticle: {
      badge: 'Rising in Haryana',
      title: 'Dairy & High-Yield Cattle units up 31%',
      description: 'Daily fresh paneer and curd delivery to NCR metro retail netting steady positive cashflow.',
      capital: '₹1,50,000',
    },
  },
  kl: {
    id: 'kl',
    name: 'Kerala',
    opportunityLevel: 'Emerging',
    headline: 'Spices packaging, organic coconut oil & eco-tourism services',
    description: 'High consumer purchasing power and tourism favoring premium organic packaged commodities.',
    topMovers: [
      { title: 'Agri Processing (Coconut/Spice)', percent: 24, direction: 'up', subtitle: 'Virgin coconut oil' },
      { title: 'Services & Eco Tourism', percent: 20, direction: 'up', subtitle: 'Homestay services' },
      { title: 'Food & Beverages', percent: 16, direction: 'up', subtitle: 'Traditional snacks' },
    ],
    topCategory: 'Agri Processing',
    activeSchemes: [
      'Kerala State Entrepreneurship Support (ESS)',
      'Kudumbashree Micro Enterprise Grant',
      'Coconut Development Board Capital Subsidy',
    ],
    feasibleUnitsCount: 540,
    recommendedCapital: '₹60,000 – ₹2,50,000',
    demandLevel: 'Emerging',
    nearbyHubsCount: 7,
    featuredArticle: {
      badge: 'Rising in Kerala',
      title: 'Virgin Coconut Oil & Spices up 24%',
      description: 'Cold-pressed organic oils capturing premium export and domestic supermarket shelves.',
      capital: '₹1,10,000',
    },
  },
  or: {
    id: 'or',
    name: 'Odisha',
    opportunityLevel: 'Emerging',
    headline: 'Millet processing, handloom ikat & poultry clusters',
    description: 'The Odisha Millets Mission and Mission Shakti SHG credit links are creating thousands of micro ventures.',
    topMovers: [
      { title: 'Millet & Food Processing', percent: 28, direction: 'up', subtitle: 'Ragi snacks & cookies' },
      { title: 'Handicrafts & Handlooms', percent: 21, direction: 'up', subtitle: 'Sambalpuri Ikat' },
      { title: 'Poultry & Allied', percent: 15, direction: 'up', subtitle: 'Layer farming units' },
    ],
    topCategory: 'Food & Beverages',
    activeSchemes: [
      'Odisha Millets Mission Enterprise Grant',
      'Mission Shakti 0% Interest Micro Loans',
      'Mukhyamantri Krushi Udyog Yojana (MKUY)',
    ],
    feasibleUnitsCount: 680,
    recommendedCapital: '₹40,000 – ₹1,60,000',
    demandLevel: 'Emerging',
    nearbyHubsCount: 5,
    featuredArticle: {
      badge: 'Rising in Odisha',
      title: 'Millet Food Processing units up 28%',
      description: 'Nutri-cereal value addition supported by government procurement and urban stores.',
      capital: '₹80,000',
    },
  },
  jh: {
    id: 'jh',
    name: 'Jharkhand',
    opportunityLevel: 'Emerging',
    headline: 'Lac cultivation, lac bangles, honey & poultry hubs',
    description: 'Forest produce value-addition and decentralized solar irrigation enabling round-the-year entrepreneurship.',
    topMovers: [
      { title: 'Forest Produce & Lac Processing', percent: 25, direction: 'up', subtitle: 'Lac bangle workshops' },
      { title: 'Honey & Food Packaging', percent: 18, direction: 'up', subtitle: 'Raw forest honey' },
      { title: 'Retail & Kirana', percent: 13, direction: 'up', subtitle: 'Block level stores' },
    ],
    topCategory: 'Handicrafts',
    activeSchemes: [
      'Jharkhand State Livelihoods Promotion (JSLPS)',
      'National Beekeeping & Honey Mission Grant',
      'PMEGP Tribal Margin Subsidy (35%)',
    ],
    feasibleUnitsCount: 490,
    recommendedCapital: '₹35,000 – ₹1,20,000',
    demandLevel: 'Emerging',
    nearbyHubsCount: 5,
    featuredArticle: {
      badge: 'Rising in Jharkhand',
      title: 'Forest Honey & Lac units expand by 25%',
      description: 'Branded raw honey and handicraft cooperative orders creating stable local employment.',
      capital: '₹75,000',
    },
  },
  ct: {
    id: 'ct',
    name: 'Chhattisgarh',
    opportunityLevel: 'Emerging',
    headline: 'Kodo-Kutki processing, bell metal crafts & organic dairy',
    description: 'Minor forest produce collection centers providing raw materials for high-value organic food units.',
    topMovers: [
      { title: 'Millets & Forest Processing', percent: 26, direction: 'up', subtitle: 'Minor millets cleaning' },
      { title: 'Handicrafts & Bell Metal', percent: 19, direction: 'up', subtitle: 'Bastar art casting' },
      { title: 'Solar & Clean Energy', percent: 15, direction: 'up', subtitle: 'Solar cold storage' },
    ],
    topCategory: 'Food & Beverages',
    activeSchemes: [
      'Chhattisgarh Millet Mission Subsidies',
      'Godhan Nyay Yojana Bio-Compost Fund',
      'Chief Minister Youth Self-Employment (CMYSE)',
    ],
    feasibleUnitsCount: 510,
    recommendedCapital: '₹40,000 – ₹1,40,000',
    demandLevel: 'Emerging',
    nearbyHubsCount: 5,
    featuredArticle: {
      badge: 'Rising in Chhattisgarh',
      title: 'Minor Millet Processing up 26%',
      description: 'Direct procurement at Minimum Support Prices incentivizing local milling investments.',
      capital: '₹85,000',
    },
  },
  uk: {
    id: 'uk',
    name: 'Uttarakhand',
    opportunityLevel: 'Emerging',
    headline: 'Himalayan herbs, fruit jams & homestay tourism',
    description: 'Hill agriculture subsidies and organic spice processing benefiting from mountain brand equity.',
    topMovers: [
      { title: 'Food & Herbal Processing', percent: 27, direction: 'up', subtitle: 'Rhododendron & apple jam' },
      { title: 'Services & Eco Homestays', percent: 22, direction: 'up', subtitle: 'Pilgrim & trekking stays' },
      { title: 'Handicrafts & Woolens', percent: 14, direction: 'up', subtitle: 'Hand-knitted items' },
    ],
    topCategory: 'Food & Beverages',
    activeSchemes: [
      'Veer Chandra Singh Garhwali Tourism Subsidy',
      'Uttarakhand Organic Commodity Board Grant',
      'MSME Policy Hill Area Interest Subvention',
    ],
    feasibleUnitsCount: 460,
    recommendedCapital: '₹50,000 – ₹2,00,000',
    demandLevel: 'Emerging',
    nearbyHubsCount: 5,
    featuredArticle: {
      badge: 'Rising in Uttarakhand',
      title: 'Herbal & Fruit processing up 27%',
      description: 'Mountain farm produce capturing high retail margins in national wellness chains.',
      capital: '₹1,00,000',
    },
  },
  hp: {
    id: 'hp',
    name: 'Himachal Pradesh',
    opportunityLevel: 'Emerging',
    headline: 'Apple grading & packing, trout fish & cold room storage',
    description: 'Cold climate horticulture and trout fish farming backed by state horticulture development projects.',
    topMovers: [
      { title: 'Agri Processing & Apple Grading', percent: 29, direction: 'up', subtitle: 'Carton packing & cider' },
      { title: 'Services & Tourism Maintenance', percent: 20, direction: 'up', subtitle: 'Equipment & transport' },
      { title: 'Handicrafts & Kullu Shawls', percent: 16, direction: 'up', subtitle: 'Weaving cooperatives' },
    ],
    topCategory: 'Agri Processing',
    activeSchemes: [
      'Himachal Pradesh Horticulture Development Project (HPHDP)',
      'Mukhya Mantri Swavalamban Yojana (MMSY 25-35% subsidy)',
      'Trout Aquaculture Subsidies',
    ],
    feasibleUnitsCount: 430,
    recommendedCapital: '₹80,000 – ₹2,50,000',
    demandLevel: 'Emerging',
    nearbyHubsCount: 5,
    featuredArticle: {
      badge: 'Rising in Himachal Pradesh',
      title: 'Apple grading & storage units up 29%',
      description: 'Decentralized corrugated packaging and grading centers reducing transit fruit loss.',
      capital: '₹1,50,000',
    },
  },
  as: {
    id: 'as',
    name: 'Assam',
    opportunityLevel: 'Emerging',
    headline: 'Specialty tea processing, bamboo craft & eri silk',
    description: 'Boutique green/orthodox tea packaging and bamboo cane furniture seeing strong multi-state demand.',
    topMovers: [
      { title: 'Agri Processing (Tea/Ginger)', percent: 26, direction: 'up', subtitle: 'Mini tea processing' },
      { title: 'Handicrafts & Bamboo', percent: 21, direction: 'up', subtitle: 'Cane furniture & decor' },
      { title: 'Textiles (Eri & Muga Silk)', percent: 17, direction: 'up', subtitle: 'Natural silk reeling' },
    ],
    topCategory: 'Agri Processing',
    activeSchemes: [
      'Assam Agribusiness & Rural Transformation Project (APART)',
      'Chief Minister Atmanirbhar Asom Abhijan',
      'National Bamboo Mission Grants',
    ],
    feasibleUnitsCount: 580,
    recommendedCapital: '₹50,000 – ₹1,80,000',
    demandLevel: 'Emerging',
    nearbyHubsCount: 6,
    featuredArticle: {
      badge: 'Rising in Assam',
      title: 'Mini Tea & Ginger Processing up 26%',
      description: 'Small tea growers establishing local processing units to gain direct consumer sales.',
      capital: '₹1,20,000',
    },
  },
};

// Fallback profile generator for all other states/UTs
export function getStateOpportunityProfile(stateNameOrId: string | null): StateOpportunityProfile {
  const clean = stateNameOrId ? stateNameOrId.trim().toLowerCase() : 'up';
  const realData = getStateRealData(clean);

  // Look up by ID directly
  let profile: StateOpportunityProfile | null = null;
  if (STATE_OPPORTUNITY_PROFILES[clean]) {
    profile = STATE_OPPORTUNITY_PROFILES[clean];
  } else {
    // Look up by name match
    const matchedKey = Object.keys(STATE_OPPORTUNITY_PROFILES).find((k) => {
      const p = STATE_OPPORTUNITY_PROFILES[k];
      return p.name.toLowerCase() === clean || p.name.toLowerCase().includes(clean) || clean.includes(p.name.toLowerCase());
    });
    if (matchedKey && STATE_OPPORTUNITY_PROFILES[matchedKey]) {
      profile = STATE_OPPORTUNITY_PROFILES[matchedKey];
    }
  }

  if (profile) {
    return {
      ...profile,
      census: profile.census ?? realData.census_2011,
      odop: profile.odop ?? realData.odop,
    };
  }

  // Default baseline for other regions
  const displayName = realData.state_name || (stateNameOrId && stateNameOrId.length <= 3 ? stateNameOrId.toUpperCase() : stateNameOrId || 'Uttar Pradesh');
  return {
    id: realData.state_code || clean.slice(0, 2),
    name: displayName,
    opportunityLevel: 'Emerging',
    headline: `Growing rural enterprises and micro services in ${displayName}`,
    description: `Official Census records show a population of ${realData.census_2011.population ? (realData.census_2011.population / 10000000).toFixed(1) + ' Cr' : 'high density'} and ${realData.odop.districts_captured_in_odop_list} ODOP mapped districts led by ${realData.odop.leading_odop_sector}.`,
    topMovers: [
      { title: `${realData.odop.leading_odop_sector} ODOP Units`, percent: Math.round((realData.odop.leading_sector_district_count / Math.max(realData.odop.districts_captured_in_odop_list, 1)) * 100), direction: 'up', subtitle: `${realData.odop.leading_sector_district_count} districts in ${displayName}` },
      { title: 'Demographic Growth', percent: Math.round(realData.census_2011.growth_rate_percent ?? 18), direction: 'up', subtitle: 'Census 2011 decadal rate' },
      { title: 'Literacy Rate', percent: Math.round(realData.census_2011.literacy_percent ?? 70), direction: 'up', subtitle: 'Workforce literacy' },
    ],
    topCategory: realData.odop.leading_odop_sector || 'Agri Processing',
    activeSchemes: [
      'PMFME Capital Subsidy (35%)',
      'PMEGP Credit Linked Capital Subsidy',
      'State Rural Livelihood Scheme',
    ],
    feasibleUnitsCount: realData.odop.districts_captured_in_odop_list * 20,
    recommendedCapital: '₹50,000 – ₹1,80,000',
    demandLevel: 'Emerging',
    nearbyHubsCount: 4,
    census: realData.census_2011,
    odop: realData.odop,
    featuredArticle: {
      badge: `Rising in ${displayName}`,
      title: `Micro-enterprise registrations growing in ${displayName}`,
      description: `State enterprise incentives and credit guarantees support new rural self-employment ventures.`,
      capital: '₹1,00,000',
    },
  };
}

export function getOpportunityLevelColor(level: OpportunityLevel): {
  readonly fill: string;
  readonly hoverFill: string;
  readonly stroke: string;
  readonly badgeBg: string;
  readonly badgeText: string;
  readonly badgeBorder: string;
} {
  switch (level) {
    case 'High':
      return {
        fill: '#15803D', // Green-700
        hoverFill: '#166534',
        stroke: '#14532D',
        badgeBg: 'bg-emerald-50',
        badgeText: 'text-emerald-800',
        badgeBorder: 'border-emerald-300',
      };
    case 'Medium':
      return {
        fill: '#4ADE80', // Green-400
        hoverFill: '#22C55E',
        stroke: '#16A34A',
        badgeBg: 'bg-emerald-50/80',
        badgeText: 'text-emerald-700',
        badgeBorder: 'border-emerald-200',
      };
    case 'Emerging':
      return {
        fill: '#BBF7D0', // Green-200 / Mint
        hoverFill: '#86EFAC',
        stroke: '#4ADE80',
        badgeBg: 'bg-green-50',
        badgeText: 'text-green-700',
        badgeBorder: 'border-green-200',
      };
    case 'Lower':
    default:
      return {
        fill: '#E2E8F0', // Slate-200
        hoverFill: '#CBD5E1',
        stroke: '#94A3B8',
        badgeBg: 'bg-slate-100',
        badgeText: 'text-slate-700',
        badgeBorder: 'border-slate-200',
      };
  }
}
