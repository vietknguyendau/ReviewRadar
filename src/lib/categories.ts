/** Business types grouped for the Find leads dropdown. Edit freely — each value is sent to Google as "<type> in <area>". */
export const CATEGORY_GROUPS: { group: string; types: string[] }[] = [
  {
    group: "Home services",
    types: [
      "HVAC contractor",
      "plumber",
      "electrician",
      "roofing contractor",
      "general contractor",
      "garage door repair",
      "appliance repair",
      "pest control",
      "landscaping company",
      "snow removal service",
      "cleaning service",
      "moving company",
      "window installation",
      "flooring contractor",
    ],
  },
  {
    group: "Health & wellness",
    types: [
      "dentist",
      "orthodontist",
      "chiropractor",
      "physical therapy",
      "med spa",
      "urgent care",
      "optometrist",
      "veterinarian",
      "dermatologist",
      "massage therapist",
    ],
  },
  {
    group: "Automotive",
    types: ["auto repair shop", "auto body shop", "car dealership", "tire shop", "oil change service", "car wash", "towing service"],
  },
  {
    group: "Property & real estate",
    types: [
      "property management company",
      "HOA management company",
      "apartment complex",
      "real estate agency",
      "storage facility",
      "mortgage broker",
    ],
  },
  {
    group: "Food & hospitality",
    types: ["restaurant", "pizza restaurant", "catering service", "bakery", "coffee shop", "hotel", "event venue"],
  },
  {
    group: "Personal services",
    types: ["hair salon", "barber shop", "nail salon", "gym", "yoga studio", "daycare", "dry cleaner", "pet groomer"],
  },
  {
    group: "Professional services",
    types: ["law firm", "accounting firm", "insurance agency", "financial advisor", "IT services", "printing service"],
  },
];

export const CATEGORY_PRESETS = CATEGORY_GROUPS.flatMap((g) => g.types);
