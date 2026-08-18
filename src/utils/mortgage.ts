export interface MortgageTrackDefinition {
  id: string;
  label: string;
  shortLabel: string;
  labelEn: string;
  description: string;
  descriptionEn: string;
  pros: string;
  cons: string;
}

export interface CalculationMethodDefinition {
  id: string;
  label: string;
  labelEn: string;
  description: string;
}

export const MORTGAGE_TRACKS: MortgageTrackDefinition[] = [
  {
    id: 'kalatz',
    label: 'קל"צ - ריבית קבועה לא צמודה',
    shortLabel: 'קל"צ',
    labelEn: 'Fixed Rate (Non-Linked)',
    description: 'הלוואה בריבית קבועה שאינה משתנה לאורך כל חיי המשכנתא, וללא הצמדה למדד המחירים לצרכן. ההחזר החודשי יציב וקבוע מראש מהתשלום הראשון ועד האחרון.',
    descriptionEn: 'Fixed interest rate for the entire loan duration, with no CPI indexation. Monthly payments remain completely stable.',
    pros: 'וודאות מלאה, שקט נפשי והגנה מוחלטת מעליות ריבית ומדד.',
    cons: 'הריבית ההתחלתית עשויה להיות גבוהה יותר, וייתכנו עמלות פירעון מוקדם.'
  },
  {
    id: 'katz',
    label: 'ק"צ - ריבית קבועה צמודה',
    shortLabel: 'ק"צ',
    labelEn: 'Fixed Rate (CPI-Linked)',
    description: 'הלוואה בריבית קבועה לאורך כל התקופה, אך קרן ההלוואה צמודה למדד המחירים לצרכן. במידה והמדד עולה, יתרת הקרן והתשלום החודשי גדלים בהתאם.',
    descriptionEn: 'Fixed interest rate with loan principal linked to the Consumer Price Index (CPI).',
    pros: 'ריבית בסיסית התחלתית נמוכה יותר ממסלול קל"צ.',
    cons: 'ההחזר החודשי והקרן עולים ככל שמדד המחירים לצרכן עולה.'
  },
  {
    id: 'matz',
    label: 'מ"צ - משתנה צמודה',
    shortLabel: 'מ"צ',
    labelEn: 'Variable Rate (CPI-Linked)',
    description: 'הלוואה בריבית המשתנה בפרקי זמן ידועים מראש (לרוב כל 2.5 או 5 שנים) וצמודה למדד המחירים לצרכן. הריבית מתעדכנת על בסיס עוגן אג"ח ממשלתי.',
    descriptionEn: 'Variable interest rate updating at predefined intervals (e.g. every 5 years) and linked to CPI.',
    pros: 'החזר חודשי התחלתי נמוך ותחנות יציאה ללא עמלת פירעון מוקדם.',
    cons: 'חשיפה כפולה לעליות בריבית המשק וגם לעליות במדד המחירים.'
  },
  {
    id: 'malatz',
    label: 'מל"צ - משתנה לא צמודה',
    shortLabel: 'מל"צ',
    labelEn: 'Variable Rate (Non-Linked)',
    description: 'הלוואה בריבית המשתנה בפרקי זמן קבועים (לרוב כל 5 שנים) ללא כל הצמדה למדד המחירים לצרכן. שומרת על הקרן מפני אינפלציה.',
    descriptionEn: 'Variable interest rate adjusting periodically without any CPI indexation.',
    pros: 'קרן ההלוואה אינה צמודה למדד, עם נקודות יציאה מובנות.',
    cons: 'ההחזר החודשי עלול לקפוץ בנקודות השינוי במידה והריביות במשק יעלו.'
  },
  {
    id: 'prime',
    label: 'ריבית פריים',
    shortLabel: 'פריים',
    labelEn: 'Prime Rate',
    description: 'הלוואה בריבית הפריים (ריבית בנק ישראל + 1.5%) בתוספת או הפחתה של מרווח שנקבע מראש (כגון פריים מינוס 0.5%). אינה צמודה למדד.',
    descriptionEn: 'Loan linked to Bank of Israel Prime Rate plus/minus an agreed margin. No CPI linkage.',
    pros: 'גמישות מרבית, ללא עמלות פירעון מוקדם (למעט עמלה תפעולית זניחה) וללא הצמדה למדד.',
    cons: 'תנודתיות בהחזר החודשי בכל פעם שבנק ישראל משנה את גובה הריבית במשק.'
  },
  {
    id: 'balloon',
    label: 'הלוואת בלון (בוליט)',
    shortLabel: 'בלון / בוליט',
    labelEn: 'Balloon / Bullet Loan',
    description: 'הלוואת גישור לתקופה קצרה-בינונית (1-5 שנים). בבלון חלקי משלמים רק את הריבית החודשית ובסוף התקופה פורעים את כל הקרן בתשלום אחד (או בבלון מלא פורעים הכל בסוף).',
    descriptionEn: 'Short to medium-term bridge loan where only interest or entire amount is paid at maturity.',
    pros: 'תשלום חודשי נמוך מאוד או אפסי לתקופת ביניים עד למכירת נכס קיים.',
    cons: 'סכום הקרן אינו יורד במהלך התקופה ומחייב מקור סילוק מלא במועד הפירעון.'
  },
  {
    id: 'eligibility',
    label: 'הלוואת זכאות',
    shortLabel: 'זכאות',
    labelEn: 'Eligibility Loan',
    description: 'הלוואה ממשלתית מסובסדת הניתנת על ידי משרד הבינוי והשיכון לרוכשי דירה ראשונה בהתאם לניקוד אישי. ניתנת בריבית קבועה מופחתת וצמודה למדד.',
    descriptionEn: 'Government subsidized mortgage program granted based on qualification points.',
    pros: 'ריבית קבועה ומפוקחת (עד 0.5% מתחת לממוצע), ללא עמלות פירעון מוקדם והטבות פריסה.',
    cons: 'ההלוואה צמודה למדד המחירים לצרכן ומותנית בעמידה בקריטריונים ממשלתיים.'
  }
];

export const CALCULATION_METHODS: CalculationMethodDefinition[] = [
  {
    id: 'spitzer',
    label: 'לוח שפיצר',
    labelEn: 'Spitzer Table',
    description: 'שיטת ההחזר הנפוצה ביותר בישראל. ההחזר החודשי הבסיסי קבוע (לפני הצמדות למדד או שינויי ריבית). בתחילת התקופה רוב ההחזר הוא ריבית ומעט קרן, ועם השנים החלק של הקרן הולך וגדל.'
  },
  {
    id: 'equal_principal',
    label: 'קרן שווה',
    labelEn: 'Equal Principal',
    description: 'בשיטה זו סכום הקרן הנפרע בכל חודש הוא קבוע ושווה לאורך כל חיי ההלוואה. הריבית מחושבת על היתרה הפוחתת, כך שההחזר החודשי מתחיל בסכום הגבוה ביותר והולך ויורד בהדרגה מדי חודש.'
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
  return MORTGAGE_TRACKS.find(t => t.id === trackId || t.label.includes(trackId) || t.shortLabel === trackId);
}

export function getCalculationMethodInfo(methodId?: string): CalculationMethodDefinition | undefined {
  if (!methodId) return undefined;
  return CALCULATION_METHODS.find(m => m.id === methodId || m.label.includes(methodId));
}

export function calculateEstimatedTotalCost(payment: number | string, durationYears: number | string): { total: number; formula: string } | null {
  const p = Number(payment);
  const years = Number(durationYears);
  if (!p || p <= 0 || !years || years <= 0) return null;
  const total = Math.round(p * 12 * years);
  const formula = `₪${p.toLocaleString()} × 12 × ${years} שנים`;
  return { total, formula };
}
