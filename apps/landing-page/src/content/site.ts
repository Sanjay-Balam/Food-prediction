/**
 * Logeeca Foresight — Content Dictionary
 * High-end editorial and data-rich copy inspired by MaestroClass, Awwwards, and Indian culinary workflows.
 */

export type FeatureIcon = "calendar" | "box" | "bin" | "bell" | "trend" | "check";

export const hero = {
  eyebrow: "RESTAURANT INTELLIGENCE · POWERED BY LIGHTGBM & LLM",
  title: "The kitchen has a brain.",
  titleAccent: "Now give it sight.",
  text: "Know what’s coming. Prep what matters. Waste nothing. Logeeca transforms POS sales history, weather dynamics, and local events into daily prep sheets your kitchen team can act on — before the morning rush begins.",
};

export const manifesto = {
  eyebrow: "THE ARTISAN'S DILEMMA",
  lines: [
    { text: "Every morning, across India's restaurant kitchens, the day begins with an expensive guess." },
    { text: "Too much biryani cooked, and pristine food ends in the bin.", accent: true },
    { text: "Too little prepped, and high-margin tables hear 'sold out'." },
    { text: "Logeeca turns historical instinct into mathematical certainty.", accent: true },
  ],
};

export const problems = [
  {
    num: "01",
    title: "Prep by Guesswork",
    tag: "Operational Blindspot",
    text: "Weekends, festive spikes, rainfall, and match nights swing demand far wider than human memory can track. Every single morning’s prep becomes a high-stakes gamble.",
    metric: "18–22%",
    metricLabel: "Average daily prep variance in high-volume kitchens",
  },
  {
    num: "02",
    title: "Stock Surprises & Stockouts",
    tag: "Inventory Friction",
    text: "Perishable items like chicken, mutton, and paneer are ordered on gut feeling. Premium cuts run out mid-Sunday dinner, while perishable dairy spoils quietly by Tuesday afternoon.",
    metric: "14%",
    metricLabel: "Walkouts caused by sold-out signature bestsellers",
  },
  {
    num: "03",
    title: "Invisible Kitchen Waste",
    tag: "Profit Drain",
    text: "Leftovers vanish into the disposal bin without an audit trail. Restaurateurs discover their real food cost only when the monthly P&L reveals bleeding margins.",
    metric: "₹1.8L–4.2L",
    metricLabel: "Monthly avoidable food waste per multi-outlet branch",
  },
  {
    num: "04",
    title: "Friction-Heavy Kitchen Software",
    tag: "Adoption Failure",
    text: "Chefs and prep cooks refuse complex ERP dashboards with 40 dropdowns. If a system doesn't speak their language and arrive directly on WhatsApp, it gathers dust.",
    metric: "60 sec",
    metricLabel: "Daily touchpoint time required by Logeeca",
  },
];

export type Feature = {
  icon: FeatureIcon;
  title: string;
  solves: string;
  text: string;
  outcomes: string[];
};

export const features: Feature[] = [
  {
    icon: "calendar",
    title: "Automated Evening Prep Guide",
    solves: "Nightly guesswork and morning panic",
    text: "Every evening at 9:00 PM, your head chef receives a crisp WhatsApp card specifying the exact portion ranges for tomorrow’s prep — segmented by rush windows.",
    outcomes: ["Confidence intervals (P10–P90)", "Zero complex app logins", "Native WhatsApp delivery"],
  },
  {
    icon: "box",
    title: "Recipe-Exploded Ingredient Purchasing",
    solves: "Over-ordering and stockout crises",
    text: "Forecasted dish sales are instantly translated into raw ingredient requirements — precise kilograms of biryani cut chicken, basmati rice, onions, and dairy.",
    outcomes: ["Exact kg shopping lists", "Perishable order splitting", "Vendor dispatch ready"],
  },
  {
    icon: "trend",
    title: "Hyperlocal Demand Shaping",
    solves: "Rainfall, festival & match night anomalies",
    text: "Our LightGBM model ingests real-time weather forecasts, regional festivals (Diwali, Eid, Sankranti), and local events to calibrate portions automatically.",
    outcomes: ["Rainfall surge detection", "IPL match night boost", "Long weekend calibration"],
  },
  {
    icon: "bell",
    title: "Midday Demand Calibration",
    solves: "Intraday trajectory shifts",
    text: "After the lunch shift concludes, Logeeca compares actual orders against morning estimates and delivers a dinner-prep revision to keep night stock razor-sharp.",
    outcomes: ["Intraday adjustment", "Prevents dinner shortages", "Reduces midnight disposal"],
  },
  {
    icon: "bin",
    title: "60-Second Closing Feedback Loop",
    solves: "Lost data and untracked leftovers",
    text: "At kitchen closing, the manager taps 3 buttons on WhatsApp: leftovers count, stockouts, and weather notes. The forecast retrains overnight and sharpens for tomorrow.",
    outcomes: ["Self-learning AI model", "Audited waste tracking", "Monthly savings reconciliation"],
  },
];

export const reasons = [
  {
    title: "Plan with Absolute Certainty",
    text: "Turn erratic customer arrivals into clean statistical ranges so prep cooks and line chefs move with calm, deliberate confidence.",
  },
  {
    title: "Order Stock Closer to the Knife",
    text: "Shift from bulk weekly hoarding to lean, frequent deliveries of high-cost proteins and delicate greens without risking a single stockout.",
  },
  {
    title: "Engineered for Indian Kitchen Realities",
    text: "Built specifically around biryani dum batches, marination lead times, curried gravies, and WhatsApp communications in English, Telugu, and Hindi.",
  },
  {
    title: "Human Chefs Remain in Total Control",
    text: "We present transparent assumptions and clear recommendations — your executive chef always retains the final override and approval.",
  },
];

export const pillars = reasons;

/**
 * MaestroClass-style Stacking Timeline Milestones
 * Replicating the aesthetic from the user's reference screenshot:
 * Numbered badges (001, 002, 003, 004), editorial serif typography, alternating layout,
 * and high-resolution culinary photography.
 */
export const timelineMilestones = [
  {
    milestone: "001",
    tag: "THE EVENING DISPATCH · 9:00 PM",
    title: "The Nightly Kitchen Dispatch",
    subtitle: "Tomorrow's rush, decoded before the stoves cool down.",
    text: "While the dining room finishes dessert, Logeeca crunches two years of historical POS transactions, tomorrow's temperature forecast, and local banquet bookings. A concise WhatsApp prep card arrives directly in the Head Chef's hands with recommended batch sizes.",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Head chef inspecting artisanal dishes at the heated kitchen pass",
    stat: "9:00 PM",
    statLabel: "Automated Daily Dispatch",
    highlight: "Biryani, Gravies, Tandoor & Curries mapped in 60 seconds",
  },
  {
    milestone: "002",
    tag: "THE MARKET IMMERSION · 7:30 AM",
    title: "The Morning Market Immersion",
    subtitle: "Source flour, poultry, and spices with mathematical precision.",
    text: "Walk the wholesale markets or dispatch supplier POs with zero hesitation. Logeeca's recipe explosion converts 185 expected biryani portions into 24.2 kg chicken, 18.0 kg aged basmati rice, and 4.1 kg desi ghee. You stop buying on vague fear and start purchasing to exact consumption.",
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Vibrant spices and fresh market produce in wooden artisanal containers",
    stat: "100% In-Step",
    statLabel: "Raw Ingredients to Menu Ratio",
    highlight: "Split perishable deliveries for peak freshness",
  },
  {
    milestone: "003",
    tag: "THE FLAME & TANDOOR · 11:30 AM",
    title: "Wood-Fired & Dum Precision",
    subtitle: "Calibrate marination lead times and slow-cook volumes.",
    text: "High-value menu items like Dum Biryani and Marinated Kebabs require 4 to 8 hours of marination and slow cooking. Logeeca provides minimum and maximum batch thresholds so the kitchen never under-steams during lunch or over-cooks for a slow afternoon.",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Authentic copper handi of Hyderabadi Dum Biryani with saffron and fresh herbs",
    stat: "35% Less",
    statLabel: "Nightly End-of-Day Waste",
    highlight: "Pre-marination quantities locked by 11:30 AM",
  },
  {
    milestone: "004",
    tag: "THE MIDDAY CALIBRATION · 3:30 PM",
    title: "The Midday Shift Calibration",
    subtitle: "Sudden monsoon rain? Dinner prep adjusts automatically.",
    text: "If lunch showed a sudden weather swing or an unexpected corporate banquet arrived, Logeeca cross-checks midday sales against the initial curve. By 3:30 PM, the evening line receives a live delta update: add +12 portions of Chicken Tikka, reduce Dal Makhani by -6 portions.",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Warmly lit modern restaurant dining room bustling with evening dinner guests",
    stat: "+14% Net",
    statLabel: "Protected Dinner Revenue",
    highlight: "Dynamic re-forecast before dinner prep commences",
  },
  {
    milestone: "005",
    tag: "THE 60-SECOND CLOSE · 11:15 PM",
    title: "The 60-Second Closing Ritual",
    subtitle: "Every day's close trains tomorrow's intelligence.",
    text: "No cumbersome ERP spreadsheets. The night manager taps three quick tallies on WhatsApp: remaining unsold portions, any stockout incidents, and an anomaly tag (e.g., Heavy Rain or Local Festival). The machine learning weights update overnight, sharpening tomorrow's forecast.",
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Clean chef prep station with copper cookware and precision plating tools",
    stat: "86% to 92%",
    statLabel: "Model Accuracy Gain in 30 Days",
    highlight: "Feedback loop continuously refines kitchen weights",
  },
];

/** Four editorial cards for the asymmetric parallax showcase */
export const areas = [
  {
    slug: "floor",
    name: "The Floor",
    subtitle: "Never say 'sold out' to a guest again.",
    photo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "pass",
    name: "The Pass",
    subtitle: "Line cooks moving with quiet, orchestrated precision.",
    photo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "stockroom",
    name: "The Stockroom",
    subtitle: "Cold rooms stocked with what you'll actually cook today.",
    photo: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "numbers",
    name: "The Numbers",
    subtitle: "3.8% direct margin expansion straight to the bottom line.",
    photo: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80",
  },
];

/**
 * Interactive Simulation Cockpit Data:
 * Allows visitors to test real-world culinary scenarios and see live demand adjustments!
 */
export const simulationDishes = [
  {
    id: "biryani",
    name: "Hyderabadi Chicken Dum Biryani",
    category: "Signature Main",
    basePortions: 185,
    unitPrice: 380,
    prepLeadTime: "4.5 hours (Dum process)",
    ingredients: [
      { name: "Fresh Cut Chicken", qty: 24.5, unit: "kg" },
      { name: "Aged Basmati Rice", qty: 18.2, unit: "kg" },
      { name: "Pure Desi Ghee", qty: 4.2, unit: "kg" },
      { name: "Fried Golden Onions", qty: 6.0, unit: "kg" },
      { name: "Saffron & Whole Spices", qty: 0.8, unit: "kg" },
    ],
  },
  {
    id: "paneer",
    name: "Paneer Butter Masala",
    category: "Vegetarian Premium",
    basePortions: 74,
    unitPrice: 320,
    prepLeadTime: "1.5 hours",
    ingredients: [
      { name: "Malai Paneer Cubes", qty: 12.0, unit: "kg" },
      { name: "Cream & Fresh Butter", qty: 5.5, unit: "kg" },
      { name: "Tomato & Cashew Base", qty: 16.0, unit: "kg" },
      { name: "Kasuri Methi & Aromatics", qty: 0.4, unit: "kg" },
    ],
  },
  {
    id: "mutton",
    name: "Royal Mutton Rogan Josh",
    category: "Slow Cook Heritage",
    basePortions: 52,
    unitPrice: 520,
    prepLeadTime: "6 hours (Slow Braise)",
    ingredients: [
      { name: "Tender Mutton Shanks", qty: 15.6, unit: "kg" },
      { name: "Mustard Oil & Ghee", qty: 3.2, unit: "kg" },
      { name: "Kashmiri Mirch Gravy", qty: 9.5, unit: "kg" },
      { name: "Spiced Yoghurt Curd", qty: 4.8, unit: "kg" },
    ],
  },
  {
    id: "naan",
    name: "Butter Garlic Naan",
    category: "Tandoor Line",
    basePortions: 290,
    unitPrice: 85,
    prepLeadTime: "Continuous Clay Oven",
    ingredients: [
      { name: "Refined Flour Dough", qty: 28.0, unit: "kg" },
      { name: "Minced Golden Garlic", qty: 2.2, unit: "kg" },
      { name: "Clarified Butter Glaze", qty: 3.8, unit: "kg" },
      { name: "Fresh Coriander Leaves", qty: 1.0, unit: "kg" },
    ],
  },
];

export const simulationConditions = [
  {
    id: "normal",
    label: "Standard Thursday",
    desc: "Baseline historical demand",
    multiplier: 1.0,
    weatherText: "Fair weather, normal evening traffic",
    wasteSavings: "₹ 6,400",
  },
  {
    id: "rain",
    label: "Heavy Monsoon Rain",
    desc: "+28% Biryani delivery surge, -15% dine-in",
    multiplier: 1.28,
    weatherText: "Torrential Hyderabad evening downpour (42mm)",
    wasteSavings: "₹ 14,800",
  },
  {
    id: "weekend",
    label: "Friday & Saturday Rush",
    desc: "+42% family packs & premium kebabs",
    multiplier: 1.42,
    weatherText: "Peak weekend dine-in + family takeout clusters",
    wasteSavings: "₹ 21,500",
  },
  {
    id: "match",
    label: "IPL Match Night",
    desc: "+55% late-night delivery orders (8-11 PM)",
    multiplier: 1.55,
    weatherText: "High-voltage cricket evening, delivery peak",
    wasteSavings: "₹ 27,200",
  },
];

export type PlatformModule = {
  label: string;
  title: [string, string];
  text: string;
  comingSoon?: boolean;
  sample: {
    title: string;
    badge?: string;
    highlight?: { value: string; caption: string };
    rows: { label: string; value?: string; done?: boolean }[];
    footer?: string;
  };
};

export const modules: PlatformModule[] = [
  {
    label: "Evening Prep Guide",
    title: ["Tomorrow's Prep.", "Known Tonight."],
    text: "Every evening at 9:00 PM, your head chef receives a clean WhatsApp card with low-to-high portion ranges for every menu item, derived from LightGBM forecasting.",
    sample: {
      title: "Evening Prep Sheet",
      badge: "WhatsApp Dispatch",
      rows: [
        { label: "Chicken Dum Biryani", value: "160–210", done: true },
        { label: "Paneer Butter Masala", value: "68–80", done: true },
        { label: "Mutton Rogan Josh", value: "48–56", done: true },
        { label: "Butter Garlic Naan", value: "260–310", done: true },
      ],
      footer: "Historical sales + weather calibrated",
    },
  },
  {
    label: "Raw Ingredient Sourcing",
    title: ["Buy What You'll", "Actually Cook."],
    text: "Transform projected dish portions into an exact kilogram purchase order, so your kitchen stops hoarding frozen stock and eliminates spoilage.",
    sample: {
      title: "Morning Market PO",
      badge: "Kilograms",
      rows: [
        { label: "Farm Fresh Chicken", value: "24.5 kg", done: true },
        { label: "Aged Basmati Rice", value: "18.0 kg", done: true },
        { label: "Desi Ghee", value: "4.2 kg", done: true },
        { label: "Malai Paneer", value: "12.0 kg", done: true },
      ],
      footer: "Direct vendor WhatsApp export",
    },
  },
  {
    label: "Perishable Order Cycles",
    title: ["Fresh In.", "Fresh Out."],
    text: "Meat, seafood, dairy, and microgreens are split into 2 to 3 smaller delivery windows, ensuring top tier taste and near-zero refrigeration decay.",
    sample: {
      title: "Perishable Cycle",
      highlight: { value: "2.8×", caption: "shorter refrigeration hold" },
      rows: [
        { label: "Morning dairy delivery", done: true },
        { label: "Afternoon poultry top-up", done: true },
        { label: "Zero freeze-thaw degradation", done: true },
      ],
    },
  },
  {
    label: "Intraday Shift Adjustment",
    title: ["Recalibrate Before", "The Evening Rush."],
    text: "After the lunch shift concludes, Logeeca compares noon sales against expected velocity and suggests surgical adjustments for the evening service.",
    sample: {
      title: "Midday Delta",
      highlight: { value: "+14%", caption: "Evening Trajectory" },
      rows: [
        { label: "Lunch actuals reconciled", done: true },
        { label: "Dinner biryani adjusted (+16)", done: true },
        { label: "Curry prep locked by 4:00 PM", done: true },
      ],
      footer: "Prevents midnight stockouts",
    },
  },
  {
    label: "60-Second Closing Ritual",
    title: ["One Minute Tonight.", "Smarter Tomorrow."],
    text: "Log leftovers, stockout incidents, and unusual occurrences in 3 taps on WhatsApp. The model incorporates today's variance into tomorrow's weights.",
    sample: {
      title: "Nightly Check-In",
      badge: "60 Seconds",
      rows: [
        { label: "Unsold biryani portions", value: "4", done: true },
        { label: "Stockout items recorded", value: "0", done: true },
        { label: "Context: Heavy monsoon rain", value: "Saved", done: true },
      ],
      footer: "Continuous back-tested learning",
    },
  },
  {
    label: "Multi-Lingual Kitchen Support",
    title: ["Engineered for", "Your Team's Voice."],
    text: "No English-only barriers. Deliver clear, localized WhatsApp guidance in English, Telugu (తెలుగు), and Hindi (हिंदी) so every line cook feels empowered.",
    sample: {
      title: "Language Options",
      badge: "Native Scripts",
      rows: [
        { label: "English Dispatch", value: "Active", done: true },
        { label: "తెలుగు (Telugu) Sheets", value: "Active", done: true },
        { label: "हिंदी (Hindi) Sheets", value: "Active", done: true },
      ],
      footer: "Zero app download required",
    },
  },
];

export const steps = [
  {
    title: "Connect Your Existing POS",
    text: "Upload your daily POS exports or connect directly via API (Petpooja, POSist, DotPe, UrbanPiper). No kitchen hardware swaps required.",
    tags: ["CSV Import", "POS Integrations", "Menu Item Mapping"],
  },
  {
    title: "Machine Learning Extracts the Signal",
    text: "Our LightGBM engine parses weather patterns, day-of-week trends, holidays, and promotional velocity to build confidence-bounded forecasts.",
    tags: ["LightGBM", "Confidence Bands (P10–P90)", "Weather Impact"],
  },
  {
    title: "Daily WhatsApp Kitchen Action",
    text: "The head chef and store manager receive actionable prep quantities and ingredient lists directly on WhatsApp, with intuitive human overrides.",
    tags: ["WhatsApp Guides", "Recipe Explosion", "Approval Control"],
  },
];

export const testimonials = [
  {
    quote: "Before Logeeca, we cooked 40 extra biryani handis on rainy days out of sheer hope, only to dump 15 at midnight. Now our waste is down by 38% and our food cost dropped by 2.4 points.",
    author: "Chef Vikramaditya Rao",
    role: "Executive Culinary Director",
    restaurant: "Dakhani Heritage Kitchens, Jubilee Hills",
    city: "Hyderabad",
  },
  {
    quote: "Our chefs don't want another tablet or software to log into. Logeeca's WhatsApp message at 9 PM gives them exactly what to marinate and chop. It is the only kitchen tool they actually love.",
    author: "Ananya Reddi",
    role: "Managing Partner",
    restaurant: "Spice Route Hospitality Group",
    city: "Hyderabad",
  },
  {
    quote: "The recipe explosion feature alone saves our purchase manager two hours every morning. We know our chicken and mutton requirements down to the decimal point before market opens.",
    author: "Mohammed Farooq",
    role: "Operations Head",
    restaurant: "Al-Mazaq Royal Dining",
    city: "Secunderabad",
  },
];

export const faqs = [
  {
    q: "Do my kitchen chefs need to install a new mobile app?",
    a: "No. Logeeca delivers all daily prep sheets, ingredient shopping lists, and closing checklists directly through WhatsApp. There is zero software to install, no passwords to remember, and no tablets to charge.",
  },
  {
    q: "How does Logeeca handle rainy days and sudden festivals?",
    a: "Our model actively tracks hyperlocal meteorological forecasts, gazetted holidays, regional festivals (Diwali, Eid, Sankranti), and scheduled sporting events (like IPL matches). When rain hits, delivery-heavy items like Biryani automatically scale up while dine-in items adjust.",
  },
  {
    q: "What POS systems does Logeeca integrate with?",
    a: "We support direct integrations and simple CSV/Excel imports from all major restaurant systems including Petpooja, POSist, UrbanPiper, DotPe, and custom POS exports. You can get started with as little as 30 days of sales history.",
  },
  {
    q: "What if our Head Chef disagrees with the prediction?",
    a: "Logeeca is built on an approval-first workflow. The forecast gives a statistically safe minimum-to-maximum range (e.g., 160–210 portions), but your chef can adjust any number with a single tap. The model learns from chef adjustments over time.",
  },
];

export const demoPoints = [
  "Confidence-bounded demand forecasting (P10–P90)",
  "Recipe-level raw ingredient explosion in kilograms",
  "Zero-app WhatsApp delivery in English, Telugu & Hindi",
  "35%+ documented food waste reduction in 30 days",
];

export const contact = {
  phone: "+91 (040) 4892-0199",
  email: "foresight@logeeca.com",
  website: "www.logeeca.com",
  address: "HITEC City, Madhapur, Hyderabad, Telangana 500081",
};
