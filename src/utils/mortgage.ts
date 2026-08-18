export interface MortgageTrackDefinition {
  id: string;
  label: string;
  labelEn: string;
  shortLabel: string;
  shortLabelEn: string;
  description: string;
  descriptionEn: string;
  pros: string;
  prosEn: string;
  cons: string;
  consEn: string;
}

export interface CalculationMethodDefinition {
  id: string;
  label: string;
  labelEn: string;
  description: string;
  descriptionEn: string;
}

export const MORTGAGE_TRACKS: MortgageTrackDefinition[] = [
  {
    id: 'kalatz',
    label: 'קל"צ - ריבית קבועה לא צמודה',
    labelEn: 'Fixed Rate (Non-Linked)',
    shortLabel: 'קל"צ',
    shortLabelEn: 'Fixed Non-Linked',
    description: 'הלוואה בריבית קבועה שאינה משתנה לאורך כל חיי המשכנתא, וללא הצמדה למדד המחירים לצרכן. ההחזר החודשי יציב וקבוע מראש מהתשלום הראשון ועד האחרון.',
    descriptionEn: 'Fixed interest rate for the entire loan duration, with no CPI indexation. Monthly payments remain completely stable from start to finish.',
    pros: 'וודאות מלאה, שקט נפשי והגנה מוחלטת מעליות ריבית ומדד.',
    prosEn: 'Complete payment certainty, peace of mind, and total protection from rate and CPI increases.',
    cons: 'הריבית ההתחלתית עשויה להיות גבוהה יותר, וייתכנו עמלות פירעון מוקדם בעת ירידת ריבית.',
    consEn: 'Initial interest rate may be higher, and early repayment fees may apply if market rates fall.'
  },
  {
    id: 'katz',
    label: 'ק"צ - ריבית קבועה צמודה',
    labelEn: 'Fixed Rate (CPI-Linked)',
    shortLabel: 'ק"צ',
    shortLabelEn: 'Fixed Linked',
    description: 'הלוואה בריבית קבועה לאורך כל התקופה, אך קרן ההלוואה צמודה למדד המחירים לצרכן. במידה והמדד עולה, יתרת הקרן והתשלום החודשי גדלים בהתאם.',
    descriptionEn: 'Fixed interest rate with loan principal linked to the Consumer Price Index (CPI). If CPI increases, principal balance and monthly payment rise accordingly.',
    pros: 'ריבית בסיסית התחלתית נמוכה יותר ממסלול קל"צ.',
    prosEn: 'Lower initial base interest rate compared to fixed non-linked track.',
    cons: 'ההחזר החודשי והקרן עולים ככל שמדד המחירים לצרכן עולה לאורך השנים.',
    consEn: 'Monthly payment and outstanding balance increase whenever CPI rises.'
  },
  {
    id: 'matz',
    label: 'מ"צ - משתנה צמודה',
    labelEn: 'Variable Rate (CPI-Linked)',
    shortLabel: 'מ"צ',
    shortLabelEn: 'Variable Linked',
    description: 'הלוואה בריבית המשתנה בפרקי זמן ידועים מראש (לרוב כל 2.5 או 5 שנים) וצמודה למדד המחירים לצרכן. הריבית מתעדכנת על בסיס עוגן אג"ח ממשלתי.',
    descriptionEn: 'Variable interest rate adjusting at predefined intervals (e.g. every 5 years) and linked to CPI, benchmarked to government bond yields.',
    pros: 'החזר חודשי התחלתי נמוך ותחנות יציאה ללא עמלת פירעון מוקדם.',
    prosEn: 'Low initial monthly payments with built-in exit exit-points without early repayment fees.',
    cons: 'חשיפה כפולה לעליות בריבית במשק וגם לעליות במדד המחירים.',
    consEn: 'Dual exposure to both market interest rate hikes and CPI inflation increases.'
  },
  {
    id: 'malatz',
    label: 'מל"צ - משתנה לא צמודה',
    labelEn: 'Variable Rate (Non-Linked)',
    shortLabel: 'מל"צ',
    shortLabelEn: 'Variable Non-Linked',
    description: 'הלוואה בריבית המשתנה בפרקי זמן קבועים (לרוב כל 5 שנים) ללא כל הצמדה למדד המחירים לצרכן. שומרת על הקרן מפני אינפלציה.',
    descriptionEn: 'Variable interest rate adjusting at set intervals (typically every 5 years) without any CPI indexation, protecting principal from inflation.',
    pros: 'קרן ההלוואה אינה צמודה למדד, עם נקודות יציאה מובנות למיחזור.',
    prosEn: 'Principal is not index-linked, with regular refinancing exit windows.',
    cons: 'ההחזר החודשי עלול לקפוץ בנקודות השינוי במידה והריביות במשק יעלו.',
    consEn: 'Monthly payment can increase at adjustment dates if economic interest rates rise.'
  },
  {
    id: 'prime',
    label: 'ריבית פריים',
    labelEn: 'Prime Rate',
    shortLabel: 'פריים',
    shortLabelEn: 'Prime',
    description: 'הלוואה בריבית הפריים (ריבית בנק ישראל + 1.5%) בתוספת או הפחתה של מרווח שנקבע מראש (כגון פריים מינוס 0.5%). אינה צמודה למדד.',
    descriptionEn: 'Loan linked directly to the Bank of Israel Prime Rate (BOI rate + 1.5%) plus or minus an agreed margin (e.g., Prime - 0.5%). No CPI linkage.',
    pros: 'גמישות מרבית, ללא עמלות פירעון מוקדם (למעט עמלה תפעולית זניחה) וללא הצמדה למדד.',
    prosEn: 'Maximum flexibility, no early repayment penalty fees, and zero CPI linkage.',
    cons: 'תנודתיות בהחזר החודשי בכל פעם שבנק ישראל משנה את גובה הריבית במשק.',
    consEn: 'Immediate monthly payment fluctuation whenever central bank adjusts the base rate.'
  },
  {
    id: 'balloon',
    label: 'הלוואת בלון (בוליט)',
    labelEn: 'Balloon / Bullet Loan',
    shortLabel: 'בלון / בוליט',
    shortLabelEn: 'Balloon/Bullet',
    description: 'הלוואת גישור לתקופה קצרה-בינונית (1-5 שנים). בבלון חלקי משלמים רק את הריבית החודשית ובסוף התקופה פורעים את כל הקרן בתשלום אחד (או בבלון מלא פורעים הכל בסוף).',
    descriptionEn: 'Bridge loan for short-to-medium term (1-5 years). In partial balloon only interest is paid monthly while full principal is repaid at maturity.',
    pros: 'תשלום חודשי נמוך מאוד או אפסי לתקופת ביניים עד למכירת נכס קיים.',
    prosEn: 'Very low or zero monthly payment during bridge period until asset sale or refinancing.',
    cons: 'סכום הקרן אינו יורד במהלך התקופה ומחייב מקור סילוק מלא במועד הפירעון.',
    consEn: 'Principal balance does not decrease during term, requiring full liquidity at maturity.'
  },
  {
    id: 'eligibility',
    label: 'הלוואת זכאות',
    labelEn: 'Eligibility Loan',
    shortLabel: 'זכאות',
    shortLabelEn: 'Govt Eligibility',
    description: 'הלוואה ממשלתית מסובסדת הניתנת על ידי משרד הבינוי והשיכון לרוכשי דירה ראשונה בהתאם לניקוד אישי. ניתנת בריבית קבועה מופחתת וצמודה למדד.',
    descriptionEn: 'Government subsidized mortgage program granted by Ministry of Housing for eligible homebuyers, featuring fixed discounted rate linked to CPI.',
    pros: 'ריבית קבועה ומפוקחת (עד 0.5% מתחת לממוצע), ללא עמלות פירעון מוקדם והטבות פריסה.',
    prosEn: 'Discounted regulated interest rate, no early prepayment penalties, and flexible repayment terms.',
    cons: 'ההלוואה צמודה למדד המחירים לצרכן ומותנית בעמידה בקריטריונים ממשלתיים.',
    consEn: 'Linked to CPI and strictly conditional upon government eligibility criteria.'
  }
];

export const CALCULATION_METHODS: CalculationMethodDefinition[] = [
  {
    id: 'spitzer',
    label: 'לוח שפיצר',
    labelEn: 'Spitzer Table',
    description: 'שיטת ההחזר הנפוצה ביותר בישראל. ההחזר החודשי הבסיסי קבוע (לפני הצמדות למדד או שינויי ריבית). בתחילת התקופה רוב ההחזר הוא ריבית ומעט קרן, ועם השנים החלק של הקרן הולך וגדל.',
    descriptionEn: 'Most common amortization schedule. Base monthly payment is constant (before indexation or rate adjustments). Early payments consist mostly of interest, with principal share growing over time.'
  },
  {
    id: 'equal_principal',
    label: 'קרן שווה',
    labelEn: 'Equal Principal',
    description: 'בשיטה זו סכום הקרן הנפרע בכל חודש הוא קבוע ושווה לאורך כל חיי ההלוואה. הריבית מחושבת על היתרה הפוחתת, כך שההחזר החודשי מתחיל בסכום הגבוה ביותר והולך ויורד בהדרגה מדי חודש.',
    descriptionEn: 'Equal principal amount repaid each month. Interest is calculated on decreasing balance, resulting in higher initial monthly payments that decrease steadily over time.'
  }
];

export const ISRAELI_BANKS = [
  'בנק לאומי',
  'בנק הפועלים',
  'בנק מזרחי טפחות',
  'בנק דיסקונט',
  'הבנק הבינלאומי',
  'בנק יהב',
  'בנק מרכנתיל',
  'בנק ירושלים',
  'בנק מסד',
  'בנק אגוד'
];

export function getMortgageTrackInfo(trackId?: string): MortgageTrackDefinition | undefined {
  if (!trackId) return undefined;
  return MORTGAGE_TRACKS.find(t => t.id === trackId || t.label.includes(trackId) || t.shortLabel === trackId || t.labelEn.includes(trackId) || t.shortLabelEn === trackId);
}

export function getCalculationMethodInfo(methodId?: string): CalculationMethodDefinition | undefined {
  if (!methodId) return undefined;
  return CALCULATION_METHODS.find(m => m.id === methodId || m.label.includes(methodId) || m.labelEn.includes(methodId));
}

export function calculateEstimatedTotalCost(
  payment: number | string, 
  durationYears: number | string,
  currency: string = '₪',
  lang: string = 'he'
): { total: number; formula: string } | null {
  const p = Number(payment);
  const years = Number(durationYears);
  if (!p || p <= 0 || !years || years <= 0) return null;
  const total = Math.round(p * 12 * years);
  const yearWord = lang === 'en' ? (years === 1 ? 'year' : 'years') : 'שנים';
  const formula = `${currency}${p.toLocaleString()} × 12 × ${years} ${yearWord}`;
  return { total, formula };
}
