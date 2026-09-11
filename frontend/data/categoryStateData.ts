// data/categoryStateData.ts
// Category information and feasibility details categorized by sector and state.

export interface CategoryDetailData {
  readonly id: string;
  readonly name: string;
  readonly trendPercent: number;
  readonly direction: 'up' | 'down';
  readonly subtitle: string;
  readonly iconType: 'dairy' | 'textiles' | 'retail' | 'agri' | 'food' | 'handicrafts' | 'solar' | 'services';
  readonly feasibleLocations: number;
  readonly capitalBracket: string;
  readonly profitMargin: string;
  readonly demandSummary: string;
  readonly applicableSchemes: readonly string[];
  readonly rawMaterials: string;
}

export const ALL_CATEGORY_DETAILS: readonly CategoryDetailData[] = [
  {
    id: 'textiles',
    name: 'Textiles & Handloom',
    trendPercent: 21,
    direction: 'up',
    subtitle: 'Registrations up in your region',
    iconType: 'textiles',
    feasibleLocations: 3,
    capitalBracket: '₹40,000 – ₹1,50,000',
    profitMargin: '25% – 38%',
    demandSummary: 'Steady demand for handloom garments, school uniforms, religious attire, and embroidered fabrics in district markets.',
    applicableSchemes: [
      'ODOP Textile Cluster Support',
      'PMEGP 35% Rural Margin Money Subsidy',
      'National Handloom Development Programme',
    ],
    rawMaterials: 'Cotton/silk yarn, motorized looms, natural dyes, and sewing machinery.',
  },
  {
    id: 'retail',
    name: 'Retail & Kirana',
    trendPercent: 6,
    direction: 'up',
    subtitle: 'Steady demand in nearby districts',
    iconType: 'retail',
    feasibleLocations: 8,
    capitalBracket: '₹30,000 – ₹1,20,000',
    profitMargin: '12% – 18%',
    demandSummary: 'Consistent daily consumption of packaged FMCG, staples, personal care, and grain retail across rural hamlets.',
    applicableSchemes: [
      'PM SVANidhi Micro Credit Scheme',
      'Mudra Shishu Loan (up to ₹50,000 zero collateral)',
      'Digital Village POS Grant',
    ],
    rawMaterials: 'FMCG stock, digital billing POS, display racks, and storage bins.',
  },
  {
    id: 'agri',
    name: 'Agri Processing',
    trendPercent: 18,
    direction: 'up',
    subtitle: 'Growing with new schemes',
    iconType: 'agri',
    feasibleLocations: 4,
    capitalBracket: '₹75,000 – ₹2,50,000',
    profitMargin: '28% – 42%',
    demandSummary: 'Value addition in mustard oil expelling, mini flour milling, pulse de-husking, and local spice packaging.',
    applicableSchemes: [
      'PMFME 35% Capital Subsidy for Micro Food Units',
      'Agriculture Infrastructure Fund (AIF 3% Interest Subvention)',
      'UP Food Processing Industry Policy',
    ],
    rawMaterials: 'Locally grown mustard, wheat, gram, pulses, and mini expeller machinery.',
  },
  {
    id: 'food',
    name: 'Food & Beverages',
    trendPercent: 12,
    direction: 'up',
    subtitle: 'Local snack & beverage units',
    iconType: 'food',
    feasibleLocations: 6,
    capitalBracket: '₹40,000 – ₹1,60,000',
    profitMargin: '30% – 45%',
    demandSummary: 'High velocity sales for packaged namkeen, bakery rusk, roasted snacks, and regional beverage bottling.',
    applicableSchemes: [
      'PMFME Individual Micro Unit Subsidy',
      'FSSAI Rural Food Safety Grant',
      'Mudra Kishore Loan',
    ],
    rawMaterials: 'Flour, spices, edible oil, roasting pans, and nitrogen packaging machine.',
  },
  {
    id: 'dairy',
    name: 'Dairy & Livestock',
    trendPercent: 34,
    direction: 'up',
    subtitle: 'High demand in local milk unions',
    iconType: 'dairy',
    feasibleLocations: 5,
    capitalBracket: '₹50,000 – ₹2,00,000',
    profitMargin: '22% – 32%',
    demandSummary: 'High daily local demand for raw milk, paneer, curd, and sweets across village clusters and nearby mandi hubs.',
    applicableSchemes: [
      'UP State Dairy Incentive & Cattle Subsidy',
      'PMFME Scheme (35% capital subsidy up to ₹10L)',
      'National Livestock Mission Credit Support',
    ],
    rawMaterials: 'High yielding milch cattle, silage, green fodder, and chilling cans.',
  },
  {
    id: 'handicrafts',
    name: 'Handicrafts & Pottery',
    trendPercent: 15,
    direction: 'up',
    subtitle: 'Export and tourist demand',
    iconType: 'handicrafts',
    feasibleLocations: 3,
    capitalBracket: '₹35,000 – ₹1,30,000',
    profitMargin: '35% – 50%',
    demandSummary: 'Terracotta pottery, brass figurines, hand-painted wooden artifacts, and temple devotional accessories.',
    applicableSchemes: [
      'PM Vishwakarma Scheme (Toolkits + ₹3L collateral-free loans)',
      'ODOP Artisan Marketing & Exhibition Subsidy',
      'Ambedkar Hastshilp Vikas Yojana',
    ],
    rawMaterials: 'Specialized clay, brass scrap, carving tools, kiln, and packaging cartons.',
  },
  {
    id: 'solar',
    name: 'Solar & Clean Energy',
    trendPercent: 28,
    direction: 'up',
    subtitle: 'Rooftop & irrigation schemes',
    iconType: 'solar',
    feasibleLocations: 4,
    capitalBracket: '₹80,000 – ₹3,00,000',
    profitMargin: '20% – 30%',
    demandSummary: 'Surging installations of solar DC water pumps, mini cold storage, and battery maintenance services.',
    applicableSchemes: [
      'PM Surya Ghar Muft Bijli Yojana (up to ₹78,000 subsidy)',
      'PM-KUSUM Solar Agricultural Subsidy (up to 60%)',
      'IREDA Rural Renewable Energy Support',
    ],
    rawMaterials: 'Monocrystalline solar PV panels, hybrid inverters, batteries, and mounting structures.',
  },
  {
    id: 'services',
    name: 'Services & Repairs',
    trendPercent: 9,
    direction: 'up',
    subtitle: 'Farm machinery & electricals',
    iconType: 'services',
    feasibleLocations: 7,
    capitalBracket: '₹25,000 – ₹1,00,000',
    profitMargin: '40% – 60%',
    demandSummary: 'Critical maintenance for two-wheelers, tractor implements, submersible pumps, and domestic electrical wiring.',
    applicableSchemes: [
      'Skill India PMKVY Certification Grant',
      'PMEGP Service Sector Margin Money Subsidy',
      'Custom Hiring Centre Repair Assistance',
    ],
    rawMaterials: 'Multi-meter, welding kit, wrench sets, compressor, and replacement spare parts.',
  },
];

export function getCategoryDetail(idOrName: string): CategoryDetailData {
  const clean = idOrName.toLowerCase().trim();
  const found = ALL_CATEGORY_DETAILS.find(
    (c) => c.id.toLowerCase() === clean || c.name.toLowerCase().includes(clean) || clean.includes(c.id.toLowerCase())
  );
  return found ?? ALL_CATEGORY_DETAILS[0];
}
