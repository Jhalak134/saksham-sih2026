// data/stateCensusODOPData.ts
// Official Census 2011 demographics and Invest India ODOP (One District One Product, v32) dataset.

export interface Census2011Metrics {
  readonly population?: number;
  readonly growth_rate_percent?: number;
  readonly area_km2?: number;
  readonly density_per_km2?: number;
  readonly sex_ratio?: number;
  readonly literacy_percent?: number;
  readonly note?: string;
}

export interface ODOPMetrics {
  readonly districts_captured_in_odop_list: number;
  readonly leading_odop_sector: string;
  readonly leading_sector_district_count: number;
  readonly flagship_example_district_product: string;
  readonly note?: string;
}

export interface StateRealMetrics {
  readonly state_code: string;
  readonly state_name: string;
  readonly census_2011: Census2011Metrics;
  readonly odop: ODOPMetrics;
}

export const STATE_REAL_DATA: Record<string, StateRealMetrics> = {
  up: {
    state_code: 'up',
    state_name: 'Uttar Pradesh',
    census_2011: {
      population: 199812341,
      growth_rate_percent: 20.23,
      area_km2: 240928,
      density_per_km2: 829,
      sex_ratio: 912,
      literacy_percent: 67.68,
    },
    odop: {
      districts_captured_in_odop_list: 75,
      leading_odop_sector: 'Handicraft',
      leading_sector_district_count: 31,
      flagship_example_district_product: 'Agra Leather Products',
    },
  },
  mh: {
    state_code: 'mh',
    state_name: 'Maharashtra',
    census_2011: {
      population: 112374333,
      growth_rate_percent: 15.99,
      area_km2: 307713,
      density_per_km2: 365,
      sex_ratio: 929,
      literacy_percent: 82.34,
    },
    odop: {
      districts_captured_in_odop_list: 36,
      leading_odop_sector: 'Agriculture',
      leading_sector_district_count: 17,
      flagship_example_district_product: 'Ahmednagar Cane Sugar',
    },
  },
  br: {
    state_code: 'br',
    state_name: 'Bihar',
    census_2011: {
      population: 104099452,
      growth_rate_percent: 25.42,
      area_km2: 94163,
      density_per_km2: 1106,
      sex_ratio: 918,
      literacy_percent: 61.80,
    },
    odop: {
      districts_captured_in_odop_list: 38,
      leading_odop_sector: 'Agriculture',
      leading_sector_district_count: 20,
      flagship_example_district_product: 'Araria Makhana',
    },
  },
  wb: {
    state_code: 'wb',
    state_name: 'West Bengal',
    census_2011: {
      population: 91276115,
      growth_rate_percent: 13.84,
      area_km2: 88752,
      density_per_km2: 1028,
      sex_ratio: 950,
      literacy_percent: 76.26,
    },
    odop: {
      districts_captured_in_odop_list: 23,
      leading_odop_sector: 'Handicraft',
      leading_sector_district_count: 11,
      flagship_example_district_product: 'Alipurduar Wooden Furniture',
    },
  },
  ap: {
    state_code: 'ap',
    state_name: 'Andhra Pradesh',
    census_2011: {
      population: 84580777,
      growth_rate_percent: 10.98,
      area_km2: 275045,
      density_per_km2: 308,
      sex_ratio: 993,
      literacy_percent: 67.02,
    },
    odop: {
      districts_captured_in_odop_list: 26,
      leading_odop_sector: 'Handicraft',
      leading_sector_district_count: 8,
      flagship_example_district_product: 'Alluri Sitarama Raju Coffee (Araku)',
    },
  },
  mp: {
    state_code: 'mp',
    state_name: 'Madhya Pradesh',
    census_2011: {
      population: 72626809,
      growth_rate_percent: 20.35,
      area_km2: 308252,
      density_per_km2: 236,
      sex_ratio: 931,
      literacy_percent: 69.32,
    },
    odop: {
      districts_captured_in_odop_list: 52,
      leading_odop_sector: 'Agriculture',
      leading_sector_district_count: 30,
      flagship_example_district_product: 'Agar Malwa Oranges',
    },
  },
  tn: {
    state_code: 'tn',
    state_name: 'Tamil Nadu',
    census_2011: {
      population: 72147030,
      growth_rate_percent: 15.61,
      area_km2: 130060,
      density_per_km2: 555,
      sex_ratio: 996,
      literacy_percent: 80.09,
    },
    odop: {
      districts_captured_in_odop_list: 38,
      leading_odop_sector: 'Agriculture',
      leading_sector_district_count: 9,
      flagship_example_district_product: 'Ariyalur Cashew Processing',
    },
  },
  rj: {
    state_code: 'rj',
    state_name: 'Rajasthan',
    census_2011: {
      population: 68548437,
      growth_rate_percent: 21.31,
      area_km2: 342239,
      density_per_km2: 200,
      sex_ratio: 928,
      literacy_percent: 66.11,
    },
    odop: {
      districts_captured_in_odop_list: 41,
      leading_odop_sector: 'Manufacturing',
      leading_sector_district_count: 22,
      flagship_example_district_product: 'Ajmer Granite and Marble Products',
    },
  },
  ka: {
    state_code: 'ka',
    state_name: 'Karnataka',
    census_2011: {
      population: 61095297,
      growth_rate_percent: 15.60,
      area_km2: 191791,
      density_per_km2: 319,
      sex_ratio: 973,
      literacy_percent: 75.36,
    },
    odop: {
      districts_captured_in_odop_list: 31,
      leading_odop_sector: 'Agriculture',
      leading_sector_district_count: 10,
      flagship_example_district_product: 'Bagalkote Ilkal Saree',
    },
  },
  gj: {
    state_code: 'gj',
    state_name: 'Gujarat',
    census_2011: {
      population: 60439692,
      growth_rate_percent: 19.28,
      area_km2: 196244,
      density_per_km2: 308,
      sex_ratio: 919,
      literacy_percent: 78.03,
    },
    odop: {
      districts_captured_in_odop_list: 33,
      leading_odop_sector: 'Food Processing',
      leading_sector_district_count: 9,
      flagship_example_district_product: 'Ahmedabad Garments & Apparel',
    },
  },
  od: {
    state_code: 'od',
    state_name: 'Odisha',
    census_2011: {
      population: 41974218,
      growth_rate_percent: 14.05,
      area_km2: 155707,
      density_per_km2: 270,
      sex_ratio: 979,
      literacy_percent: 72.87,
    },
    odop: {
      districts_captured_in_odop_list: 30,
      leading_odop_sector: 'Agriculture',
      leading_sector_district_count: 12,
      flagship_example_district_product: 'Angul Terracotta',
    },
  },
  kl: {
    state_code: 'kl',
    state_name: 'Kerala',
    census_2011: {
      population: 33406061,
      growth_rate_percent: 4.91,
      area_km2: 38852,
      density_per_km2: 860,
      sex_ratio: 1084,
      literacy_percent: 94.00,
    },
    odop: {
      districts_captured_in_odop_list: 14,
      leading_odop_sector: 'Food Processing',
      leading_sector_district_count: 6,
      flagship_example_district_product: 'Alappuzha Coir products',
    },
  },
  jh: {
    state_code: 'jh',
    state_name: 'Jharkhand',
    census_2011: {
      population: 32988134,
      growth_rate_percent: 22.42,
      area_km2: 79716,
      density_per_km2: 414,
      sex_ratio: 948,
      literacy_percent: 66.41,
    },
    odop: {
      districts_captured_in_odop_list: 24,
      leading_odop_sector: 'Agriculture',
      leading_sector_district_count: 8,
      flagship_example_district_product: 'Bokaro Woodcraft',
    },
  },
  as: {
    state_code: 'as',
    state_name: 'Assam',
    census_2011: {
      population: 31205576,
      growth_rate_percent: 17.07,
      area_km2: 78438,
      density_per_km2: 398,
      sex_ratio: 958,
      literacy_percent: 72.19,
    },
    odop: {
      districts_captured_in_odop_list: 35,
      leading_odop_sector: 'Agriculture',
      leading_sector_district_count: 27,
      flagship_example_district_product: 'Bajali Rice',
    },
  },
  pb: {
    state_code: 'pb',
    state_name: 'Punjab',
    census_2011: {
      population: 27743338,
      growth_rate_percent: 13.89,
      area_km2: 50362,
      density_per_km2: 551,
      sex_ratio: 895,
      literacy_percent: 75.84,
    },
    odop: {
      districts_captured_in_odop_list: 23,
      leading_odop_sector: 'Manufacturing',
      leading_sector_district_count: 9,
      flagship_example_district_product: 'Amritsar Embroidery',
    },
  },
  cg: {
    state_code: 'cg',
    state_name: 'Chhattisgarh',
    census_2011: {
      population: 25545198,
      growth_rate_percent: 22.61,
      area_km2: 135192,
      density_per_km2: 189,
      sex_ratio: 991,
      literacy_percent: 70.28,
    },
    odop: {
      districts_captured_in_odop_list: 33,
      leading_odop_sector: 'Agriculture',
      leading_sector_district_count: 19,
      flagship_example_district_product: 'Balod Handloom',
    },
  },
  hr: {
    state_code: 'hr',
    state_name: 'Haryana',
    census_2011: {
      population: 25351462,
      growth_rate_percent: 19.90,
      area_km2: 44212,
      density_per_km2: 573,
      sex_ratio: 879,
      literacy_percent: 75.55,
    },
    odop: {
      districts_captured_in_odop_list: 22,
      leading_odop_sector: 'Manufacturing',
      leading_sector_district_count: 12,
      flagship_example_district_product: 'Ambala Scientific Equipment',
    },
  },
  dl: {
    state_code: 'dl',
    state_name: 'Delhi',
    census_2011: {
      population: 16787941,
      growth_rate_percent: 21.21,
      area_km2: 1483,
      density_per_km2: 11320,
      sex_ratio: 868,
      literacy_percent: 86.21,
    },
    odop: {
      districts_captured_in_odop_list: 11,
      leading_odop_sector: 'Manufacturing',
      leading_sector_district_count: 5,
      flagship_example_district_product: 'Central Dry Fruits & Spices',
    },
  },
  jk: {
    state_code: 'jk',
    state_name: 'Jammu & Kashmir',
    census_2011: {
      population: 12541302,
      growth_rate_percent: 23.64,
      area_km2: 222236,
      density_per_km2: 56,
      sex_ratio: 889,
      literacy_percent: 67.16,
    },
    odop: {
      districts_captured_in_odop_list: 20,
      leading_odop_sector: 'Agriculture',
      leading_sector_district_count: 13,
      flagship_example_district_product: 'Anantnag Trout Fish',
    },
  },
  uk: {
    state_code: 'uk',
    state_name: 'Uttarakhand',
    census_2011: {
      population: 10086292,
      growth_rate_percent: 18.81,
      area_km2: 53483,
      density_per_km2: 189,
      sex_ratio: 963,
      literacy_percent: 78.82,
    },
    odop: {
      districts_captured_in_odop_list: 13,
      leading_odop_sector: 'Food Processing',
      leading_sector_district_count: 4,
      flagship_example_district_product: 'Almora Bal Mithai',
    },
  },
  hp: {
    state_code: 'hp',
    state_name: 'Himachal Pradesh',
    census_2011: {
      population: 6864602,
      growth_rate_percent: 12.94,
      area_km2: 55673,
      density_per_km2: 123,
      sex_ratio: 972,
      literacy_percent: 82.80,
    },
    odop: {
      districts_captured_in_odop_list: 12,
      leading_odop_sector: 'Manufacturing',
      leading_sector_district_count: 4,
      flagship_example_district_product: 'Bilaspur Processing of Indian Gooseberry (Amla)',
    },
  },
  tr: {
    state_code: 'tr',
    state_name: 'Tripura',
    census_2011: {
      population: 3673917,
      growth_rate_percent: 14.84,
      area_km2: 10486,
      density_per_km2: 350,
      sex_ratio: 960,
      literacy_percent: 87.22,
    },
    odop: {
      districts_captured_in_odop_list: 8,
      leading_odop_sector: 'Agriculture',
      leading_sector_district_count: 4,
      flagship_example_district_product: 'Dhalai Queen Pineapple',
    },
  },
  ml: {
    state_code: 'ml',
    state_name: 'Meghalaya',
    census_2011: {
      population: 2966889,
      growth_rate_percent: 27.95,
      area_km2: 22429,
      density_per_km2: 132,
      sex_ratio: 989,
      literacy_percent: 74.43,
    },
    odop: {
      districts_captured_in_odop_list: 12,
      leading_odop_sector: 'Agriculture',
      leading_sector_district_count: 12,
      flagship_example_district_product: 'East Garo Hills Pineapple',
    },
  },
  mn: {
    state_code: 'mn',
    state_name: 'Manipur',
    census_2011: {
      population: 2855794,
      growth_rate_percent: 24.50,
      area_km2: 22327,
      density_per_km2: 128,
      sex_ratio: 985,
      literacy_percent: 76.94,
    },
    odop: {
      districts_captured_in_odop_list: 16,
      leading_odop_sector: 'Agriculture',
      leading_sector_district_count: 10,
      flagship_example_district_product: 'Bishnupur Moirang Fi Chanbi Fanek',
    },
  },
  nl: {
    state_code: 'nl',
    state_name: 'Nagaland',
    census_2011: {
      population: 1978502,
      growth_rate_percent: -0.58,
      area_km2: 16579,
      density_per_km2: 119,
      sex_ratio: 931,
      literacy_percent: 79.55,
    },
    odop: {
      districts_captured_in_odop_list: 16,
      leading_odop_sector: 'Agriculture',
      leading_sector_district_count: 14,
      flagship_example_district_product: 'Chumukedima Pineapple',
    },
  },
  ga: {
    state_code: 'ga',
    state_name: 'Goa',
    census_2011: {
      population: 1458545,
      growth_rate_percent: 8.23,
      area_km2: 3702,
      density_per_km2: 394,
      sex_ratio: 973,
      literacy_percent: 88.70,
    },
    odop: {
      districts_captured_in_odop_list: 2,
      leading_odop_sector: 'Agriculture',
      leading_sector_district_count: 1,
      flagship_example_district_product: 'North Goa Cashew Nuts',
    },
  },
  ar: {
    state_code: 'ar',
    state_name: 'Arunachal Pradesh',
    census_2011: {
      population: 1383727,
      growth_rate_percent: 26.03,
      area_km2: 83743,
      density_per_km2: 17,
      sex_ratio: 938,
      literacy_percent: 65.38,
    },
    odop: {
      districts_captured_in_odop_list: 27,
      leading_odop_sector: 'Agriculture',
      leading_sector_district_count: 21,
      flagship_example_district_product: 'Anjaw Large Cardamom',
    },
  },
  py: {
    state_code: 'py',
    state_name: 'Puducherry',
    census_2011: {
      population: 1247953,
      growth_rate_percent: 28.08,
      area_km2: 490,
      density_per_km2: 2547,
      sex_ratio: 1037,
      literacy_percent: 85.85,
    },
    odop: {
      districts_captured_in_odop_list: 4,
      leading_odop_sector: 'Others',
      leading_sector_district_count: 2,
      flagship_example_district_product: 'Karaikal Chemicals and Allied Products',
    },
  },
  mz: {
    state_code: 'mz',
    state_name: 'Mizoram',
    census_2011: {
      population: 1097206,
      growth_rate_percent: 23.48,
      area_km2: 21081,
      density_per_km2: 52,
      sex_ratio: 976,
      literacy_percent: 91.33,
    },
    odop: {
      districts_captured_in_odop_list: 11,
      leading_odop_sector: 'Agriculture',
      leading_sector_district_count: 11,
      flagship_example_district_product: 'Aizawl Dragon Fruit',
    },
  },
  ch: {
    state_code: 'ch',
    state_name: 'Chandigarh',
    census_2011: {
      population: 1055450,
      growth_rate_percent: 17.19,
      area_km2: 114,
      density_per_km2: 9258,
      sex_ratio: 818,
      literacy_percent: 86.05,
    },
    odop: {
      districts_captured_in_odop_list: 1,
      leading_odop_sector: 'Tourism',
      leading_sector_district_count: 1,
      flagship_example_district_product: 'Chandigarh Tourism',
    },
  },
  sk: {
    state_code: 'sk',
    state_name: 'Sikkim',
    census_2011: {
      population: 610577,
      growth_rate_percent: 12.89,
      area_km2: 7096,
      density_per_km2: 86,
      sex_ratio: 890,
      literacy_percent: 81.42,
    },
    odop: {
      districts_captured_in_odop_list: 6,
      leading_odop_sector: 'Agriculture',
      leading_sector_district_count: 4,
      flagship_example_district_product: 'East Sikkim (Gangtok) Tourism',
    },
  },
  an: {
    state_code: 'an',
    state_name: 'Andaman & Nicobar Islands',
    census_2011: {
      population: 380581,
      growth_rate_percent: 6.86,
      area_km2: 8249,
      density_per_km2: 46,
      sex_ratio: 876,
      literacy_percent: 86.63,
    },
    odop: {
      districts_captured_in_odop_list: 3,
      leading_odop_sector: 'Marine',
      leading_sector_district_count: 2,
      flagship_example_district_product: 'Nicobars Coconut & Coconut based products',
    },
  },
  ld: {
    state_code: 'ld',
    state_name: 'Lakshadweep',
    census_2011: {
      population: 64473,
      growth_rate_percent: 6.30,
      area_km2: 30,
      density_per_km2: 2149,
      sex_ratio: 946,
      literacy_percent: 91.85,
    },
    odop: {
      districts_captured_in_odop_list: 1,
      leading_odop_sector: 'Food Processing',
      leading_sector_district_count: 1,
      flagship_example_district_product: 'Lakshadweep Coconut Derived Products',
    },
  },
  tg: {
    state_code: 'tg',
    state_name: 'Telangana',
    census_2011: {
      population: 35003674,
      growth_rate_percent: 13.58,
      area_km2: 112077,
      density_per_km2: 312,
      sex_ratio: 988,
      literacy_percent: 66.54,
      note: 'Carved out of AP in 2014; post-demarcation 2011 district baseline.',
    },
    odop: {
      districts_captured_in_odop_list: 33,
      leading_odop_sector: 'Agriculture',
      leading_sector_district_count: 14,
      flagship_example_district_product: 'Adilabad Cotton Bales',
    },
  },
  dnhdd: {
    state_code: 'dnhdd',
    state_name: 'Dadra & Nagar Haveli and Daman & Diu',
    census_2011: {
      population: 586956,
      growth_rate_percent: 55.10,
      area_km2: 602,
      density_per_km2: 975,
      sex_ratio: 709,
      literacy_percent: 81.0,
      note: 'Merged UT 2020; composite 2011 census sum.',
    },
    odop: {
      districts_captured_in_odop_list: 3,
      leading_odop_sector: 'Textile',
      leading_sector_district_count: 1,
      flagship_example_district_product: 'Dadra & Nagar Haveli Textile (Yarn)',
    },
  },
  la: {
    state_code: 'la',
    state_name: 'Ladakh',
    census_2011: {
      population: 274289,
      growth_rate_percent: 14.12,
      area_km2: 59146,
      density_per_km2: 5,
      sex_ratio: 690,
      literacy_percent: 77.2,
      note: 'Carved out of J&K in 2019 (Leh & Kargil census 2011 sum).',
    },
    odop: {
      districts_captured_in_odop_list: 2,
      leading_odop_sector: 'Agriculture',
      leading_sector_district_count: 2,
      flagship_example_district_product: 'Kargil Apricot',
    },
  },
};

/**
 * Normalizes state name or code for robust lookup.
 */
export function getStateRealData(stateNameOrCode: string | null | undefined): StateRealMetrics {
  if (!stateNameOrCode) {
    return STATE_REAL_DATA.up;
  }

  const clean = stateNameOrCode.trim().toLowerCase();

  // 1. Direct ID match
  if (STATE_REAL_DATA[clean]) {
    return STATE_REAL_DATA[clean];
  }

  // 2. Exact or substring name match
  const matchedKey = Object.keys(STATE_REAL_DATA).find((k) => {
    const item = STATE_REAL_DATA[k];
    const nameLower = item.state_name.toLowerCase();
    return (
      nameLower === clean ||
      clean.includes(nameLower) ||
      nameLower.includes(clean)
    );
  });

  if (matchedKey && STATE_REAL_DATA[matchedKey]) {
    return STATE_REAL_DATA[matchedKey];
  }

  // 3. Fallback to UP
  return STATE_REAL_DATA.up;
}

/**
 * Searches for a matching state by code or name without falling back to UP.
 * Returns null if the query does not specify a real Indian state/UT.
 */
export function findStateByQuery(query: string): StateRealMetrics | null {
  const clean = query.trim().toLowerCase();
  if (!clean || clean.length < 2) return null;

  // 1. Direct state code match (e.g. 'up', 'mh', 'rj', 'dl')
  if (STATE_REAL_DATA[clean]) {
    return STATE_REAL_DATA[clean];
  }

  // 2. Exact or included state name match
  const matchedKey = Object.keys(STATE_REAL_DATA).find((k) => {
    const item = STATE_REAL_DATA[k];
    const nameLower = item.state_name.toLowerCase();
    return nameLower === clean || clean.includes(nameLower);
  });

  if (matchedKey && STATE_REAL_DATA[matchedKey]) {
    return STATE_REAL_DATA[matchedKey];
  }

  return null;
}

/**
 * Formats large population numbers into readable Indian notation (e.g. 19.98 Cr or 38.05 L).
 */
export function formatPopulationIndian(pop: number | undefined): { value: number; unit: string; full: string } {
  if (!pop || pop <= 0) return { value: 0, unit: '', full: 'N/A' };

  if (pop >= 10000000) {
    const cr = pop / 10000000;
    const rounded = Math.round(cr * 100) / 100;
    return {
      value: rounded,
      unit: 'Cr',
      full: `${rounded.toFixed(2)} Cr`,
    };
  }

  if (pop >= 100000) {
    const lakh = pop / 100000;
    const rounded = Math.round(lakh * 10) / 10;
    return {
      value: rounded,
      unit: 'Lakh',
      full: `${rounded.toFixed(1)} Lakh`,
    };
  }

  return {
    value: pop,
    unit: '',
    full: pop.toLocaleString('en-IN'),
  };
}
