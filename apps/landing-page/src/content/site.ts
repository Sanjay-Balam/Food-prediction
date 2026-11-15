/** All page copy in one place, so sections only handle layout. Wording from logeeca.com (problems: from the brochure). */

export const hero = {
  eyebrow: "Restaurant intelligence, reimagined",
  title: "The kitchen has a brain.",
  titleAccent: "Now give it sight.",
  text: "Know what’s coming. Prep what matters. Waste less. Logeeca turns restaurant data into decisions your team can act on — before the rush begins.",
};

/** The four photo cards. Drop a photo at public/areas/<slug>.jpg and it replaces the plain card. */
export const areas = [
  { slug: "floor", name: "The Floor" },
  { slug: "pass", name: "The Pass" },
  { slug: "stockroom", name: "The Stockroom" },
  { slug: "numbers", name: "The Numbers" },
];

export const problems = [
  { title: "Prep by guesswork", text: "Weekends, festivals and rainy days move demand far more than memory can track, so every day’s prep is a gamble." },
  { title: "Stock surprises", text: "Ingredients are ordered on instinct. Mutton runs out on Sunday while vegetables and dairy spoil by Tuesday." },
  { title: "Invisible waste", text: "Leftovers go in the bin without a record, so nobody knows which dishes are over-prepared or what that costs each month." },
  { title: "Problems found too late", text: "You learn a bestseller has sold out when a guest asks for it — not the night before, when you could still act." },
  { title: "Revenue left on the table", text: "Sold-out bestsellers, slow dishes and quiet weekdays cap your takings without anyone noticing." },
];

type SampleRow = { label: string; value?: string; done?: boolean };

export type PlatformModule = {
  label: string;
  title: [string, string];
  text: string;
  comingSoon?: boolean;
  /** The small product card shown next to the text. */
  sample: { title: string; badge?: string; highlight?: { value: string; caption: string }; rows: SampleRow[]; footer?: string };
};

export const modules: PlatformModule[] = [
  {
    label: "Evening prep guide", title: ["Tomorrow's prep.", "Known tonight."],
    text: "Every evening, your chef gets a simple prep sheet on WhatsApp with a low-to-high range for each item, based on your own sales history.",
    sample: {
      title: "Evening prep guide", badge: "WhatsApp",
      rows: [
        { label: "Chicken biryani", value: "38–44", done: true },
        { label: "Paneer tikka", value: "16–20", done: true },
        { label: "Dal makhani", value: "20–26" },
        { label: "Garlic naan", value: "54–62" },
      ],
      footer: "Based on your sales history",
    },
  },
  {
    label: "Weekly order list", title: ["Buy what you'll", "actually use."],
    text: "We turn the week's expected demand into a clear shopping list in kilograms, so you stop over-ordering and stop running short.",
    sample: {
      title: "Weekly order list", badge: "kg",
      rows: [{ label: "Chicken", value: "18 kg" }, { label: "Rice", value: "24 kg" }, { label: "Onion", value: "12 kg" }],
    },
  },
  {
    label: "Smart perishable orders", title: ["Fresh in.", "Fresh out."],
    text: "Meat, fish, paneer and other fast-spoiling items are split into smaller, more frequent orders, so less stock sits in the fridge and goes stale.",
    sample: {
      title: "Perishable plan", highlight: { value: "2–3×", caption: "smaller order cycles" },
      rows: [{ label: "Less stock sitting", done: true }, { label: "Order closer to need", done: true }],
    },
  },
  {
    label: "Ingredient-level planning", title: ["Plan ingredients,", "not just dishes."],
    text: "Using your recipes, we convert expected dish sales into the raw quantities you need — kilograms of chicken, rice, onion and more.",
    sample: {
      title: "Ingredient needs", badge: "Tomorrow",
      rows: [
        { label: "Chicken", value: "18 kg", done: true },
        { label: "Basmati rice", value: "12 kg", done: true },
        { label: "Onion", value: "8 kg" },
        { label: "Paneer", value: "4 kg" },
      ],
      footer: "Derived from recipe quantities",
    },
  },
  {
    label: "Midday update", title: ["Adjust before", "dinner."], comingSoon: true,
    text: "After the morning's orders come in, we check whether the day is running busy or slow and tell your kitchen how much more or less to prepare.",
    sample: {
      title: "Midday update", highlight: { value: "+14%", caption: "Demand" },
      rows: [{ label: "Dinner revised", done: true }, { label: "Prep adjusted", done: true }],
    },
  },
  {
    label: "One-minute closing check-in", title: ["One minute today.", "Smarter tomorrow."],
    text: "Log leftovers, items that ran out and anything unusual — like a wedding, rain or a match — in a few taps. The forecast learns your kitchen and improves over time.",
    sample: {
      title: "Closing check-in", badge: "60 sec",
      rows: [
        { label: "Leftovers logged", value: "4", done: true },
        { label: "Ran out of", value: "2", done: true },
        { label: "Unusual event", value: "Rain" },
      ],
      footer: "Every close makes tomorrow smarter",
    },
  },
  {
    label: "Festival & event awareness", title: ["Expect the", "unexpected."], comingSoon: true,
    text: "Festivals, holidays, local events and banquet bookings become part of your plan, so busy days are expected and prepped for.",
    sample: { title: "Event awareness", rows: [{ label: "Festival day" }, { label: "Local match" }, { label: "Banquet booking" }] },
  },
  {
    label: "Waste, savings & forecasting", title: ["See the waste.", "Know the savings."],
    text: "Every month, see what was wasted, which items cost you the most, and how much you saved compared with before — in rupees.",
    sample: {
      title: "Monthly savings", highlight: { value: "₹", caption: "measured, not guessed" },
      rows: [{ label: "Waste visibility", done: true }, { label: "Cost by item and category", done: true }],
    },
  },
  {
    label: "Works with your existing data", title: ["Start simple.", "Stay connected."],
    text: "Start with a daily sales sheet or POS export. No heavy setup and no complex integration required to get going.",
    sample: {
      title: "Sales import", badge: "CSV / POS",
      rows: [
        { label: "Daily sales sheet", value: "Ready", done: true },
        { label: "POS export", value: "Ready", done: true },
        { label: "Recipe file", value: "Optional" },
      ],
      footer: "Begin with the data you have",
    },
  },
  {
    label: "Built for Indian kitchens", title: ["Made for your", "way of working."],
    text: "Simple, familiar WhatsApp messages in a language your team understands — with no new app to learn.",
    sample: {
      title: "WhatsApp", badge: "Ready",
      rows: [{ label: "English", done: true }, { label: "తెలుగు · हिंदी", done: true }],
      footer: "Simple daily flow",
    },
  },
];

export const steps = [
  {
    title: "Connect the dots",
    text: "Bring in sales, menu, recipe and inventory data from the systems you already use — starting with simple imports where needed.",
    tags: ["POS data", "Menu items", "Recipes"],
  },
  {
    title: "Find the signal",
    text: "Logeeca turns historical patterns and fresh context into a forecast your team can understand, challenge and improve.",
    tags: ["Demand forecast", "Anomaly signals"],
  },
  {
    title: "Make the next move",
    text: "Turn the forecast into prep priorities, ingredient needs and purchasing suggestions — with people in control of approvals.",
    tags: ["Prep plan", "Order suggestions", "Feedback loop"],
  },
];

export const pillars = [
  { title: "Plan with confidence", text: "Make demand visible earlier, so teams can prepare for peaks instead of reacting to them." },
  { title: "Buy with context", text: "Connect projected usage with stock on hand and supplier realities before placing an order." },
  { title: "Waste less by design", text: "Make over-prep and excess stock easier to spot, measure and improve over time." },
  { title: "Keep humans in control", text: "Clear recommendations, visible assumptions and approval-first workflows — not a black box." },
];

export const demoPoints = ["Demand forecasting", "Prep & inventory intelligence", "Designed for real restaurant workflows"];

export const contact = { phone: "[Phone number]", email: "[Email address]", website: "[Website]" };
