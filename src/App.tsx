import React, { useState, useEffect, useRef } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/analytics';
import 'firebase/compat/storage';
import confetti from 'canvas-confetti';
import firebaseConfig from '../firebase-applet-config.json';

import {
  Apartment,
  Payment,
  Repair,
  Provider,
  Tenant,
  TenantHistory,
  Neighbor,
  Mortgage,
  Expense,
  Inventory,
  RecurringBudget,
  DocumentItem
} from './types';

import { LucideIcon } from './components/LucideIcon';
import { AmbientSynth } from './utils/audio';

// Import modular screens
import { ApartmentDetailView } from './components/ApartmentDetailView';
import { TenantsList } from './components/TenantsList';
import { NeighborsList } from './components/NeighborsList';
import { MortgagesList } from './components/MortgagesList';
import { ProvidersList } from './components/ProvidersList';
import { AlertsView } from './components/AlertsView';
import { CalendarView } from './components/CalendarView';
import { ForecastView } from './components/ForecastView';
import { ChartsView } from './components/ChartsView';
import { ModalForm } from './components/ModalForm';
import { RentSegmentsModal } from './components/RentSegmentsModal';
import { CpiView } from './components/CpiView';
import { CpiIndex } from './types';
import { DEFAULT_CPI_LIST, DEFAULT_CONSTRUCTION_LIST } from './utils/cpi';

const MY_CUSTOM_CONFIG = {
  apiKey: "AIzaSyCU2uNgsbr3sR5IAH9sl5Zuz_ki3dRE9JQ",
  authDomain: "mypropertymanager-e5d43.firebaseapp.com",
  projectId: "mypropertymanager-e5d43",
  storageBucket: "mypropertymanager-e5d43.firebasestorage.app",
  messagingSenderId: "418981742569",
  appId: "1:418981742569:web:00c5bf1c6f32aa717f2d78",
  measurementId: "G-QZ2ZERHQV4"
};

const configToUse = MY_CUSTOM_CONFIG;

try {
  if (!firebase.apps.length) {
    firebase.initializeApp(configToUse);
  }
} catch (e) {
  console.error("Firebase Init Error", e);
}

const auth = firebase.auth();
const db = firebase.firestore();

let analytics: firebase.analytics.Analytics | null = null;
try {
  if (typeof window !== 'undefined' && firebase.apps.length) {
    analytics = firebase.analytics();
  }
} catch (e) {
  console.warn("Firebase Analytics could not be initialized:", e);
}

const logAnalyticsEvent = (eventName: string, params?: Record<string, any>) => {
  if (analytics) {
    try {
      analytics.logEvent(eventName, params);
      console.log(`[Analytics] Event logged: ${eventName}`, params);
    } catch (err) {
      console.error(`[Analytics] Failed to log event ${eventName}:`, err);
    }
  }
};

// Hebrew & English localized dictionaries
const TEXTS = {
  he: {
    app_title: "EasyRent Premium+ 👑",
    dashboard: "לוח בקרה",
    tenants: "שוכרים",
    neighbors: "שכנים",
    mortgages: "משכנתא",
    mortgage: "משכנתא",
    providers: "ספקים",
    settings: "הגדרות",
    my_properties: "הנכסים שלי",
    properties_count: "נכסים",
    no_properties: "אין נכסים להצגה",
    no_mortgage: "אין משכנתא להצגה",
    add_first_prop: "הוסף דירה ראשונה",
    add_prop: "הוסף נכס",
    reports_export: "דוחות ויצוא",
    help_credits: "עזרה, הוראות וקרדיטים",
    sync_devices: "סנכרון מכשירים",
    manage_list: "ניהול רשימת הנכסים",
    rent_monthly: "שכירות חודשית",
    net_income: "רווח נקי (YTD)",
    operating_income: "רווח תפעולי (NOI)",
    cash_flow: "תזרים (Cash Flow)",
    total_income: "סה״כ הכנסות",
    total_repairs: "סה״כ תיקונים",
    total_expenses: "סה״כ הוצאות שוטפות",
    total_mortgage_paid: "סה״כ משכנתא ששולמה",
    total_paid_ytd: "שולם השנה",
    global_summary: "סיכום כולל",
    financial_summary: "סיכום פיננסי YTD",
    summary: "סיכום",
    payments: "תקבולים",
    repairs: "תיקונים",
    history_payments: "היסטוריית תשלומים",
    repair_log: "יומן תיקונים",
    expenses: "הוצאות",
    inventory: "מלאי",
    add_new: "הוספה חדשה",
    add_payment: "הוסף תשלום",
    add_repair: "הוסף תיעוד",
    add_expense: "הוסף הוצאה",
    add_inventory: "הוסף פריט מלאי",
    save: "שמור",
    cancel: "ביטול",
    amount: "סכום (₪)",
    date: "תאריך",
    notes: "הערות",
    type: "סוג",
    cost: "עלות (₪)",
    description: "תיאור",
    provider: "ספק מבצע",
    add_tenant: "הוסף שוכר",
    add_neighbor: "הוסף שכן",
    add_mortgage: "הוסף משכנתא",
    add_provider: "הוסף ספק חדש",
    name: "שם",
    neighbor_name: "שם השכן",
    phone: "טלפון",
    spouse_phone: "טלפון בן/בת זוג",
    floor: "קומה",
    is_committee: "חבר ועד",
    committee_yes: "כן",
    committee_no: "לא",
    specialty: "תחום עיסוק",
    assigned_prop: "שיוך לנכס",
    sync_title: "סנכרון מכשירים",
    sync_desc: "כדי לראות את אותם הנתונים במחשב ובטלפון, ודא שקוד הסנכרון זהה בשני המכשירים.",
    sync_code: "קוד הסנכרון שלך",
    save_sync: "שמור וסנכרן",
    report_title: "יצוא דוח אקסל",
    from_date: "מתאריך",
    to_date: "עד תאריך",
    download_csv: "הורד קובץ CSV",
    help_title: "מדריך למשתמש",
    confirm_delete: "למחוק?",
    save_error: "שגיאה בשמירה",
    delete_error: "שגיאה במחיקה",
    prop_nickname: "כינוי לנכס",
    prop_icon: "סמל נכס",
    address: "כתובת מלאה",
    rent_target: "שכר דירה (₪)",
    size_sqm: 'גודל (מ"ר)',
    market_price_sqm: 'שווי שוק למ"ר (₪)',
    contract_start: "תאריך תחילת חוזה",
    provider_name: "שם הספק/עסק",
    perm_notes: "הערות קבועות",
    work_desc: "תיאור העבודה...",
    select: "בחר...",
    tenant_name: "שם מלא",
    id_notes: "ת.ז, מועד כניסה...",
    log_work: "תיעוד עבודה / תקלה",
    entry_date: "תאריך כניסה",
    import_contact: "ייבא מאנשי קשר",
    tax_percent: "אחוז מס (%)",
    taxable_rent: "שכר דירה למס (₪)",
    yield_after_tax: "תשואה לאחר מס",
    annual_yield: "תשואה שנתית",
    yield_sqm: "תשואה למ\"ר",
    cash_flow_ytd: "תזרים (CASH FLOW)",
    net_income_after_tax: "רווח נקי (YTD) נטו",
    toggle_tax_view: "הצג נטו/ברוטו",
    bank_name: "בנק",
    original_amount: "סכום משיכה מקורי (₪)",
    mortgage_interest: "אחוז ריבית (%)",
    drawdown_date: "תאריך משיכה",
    duration_years: "מספר שנים",
    end_date: "תאריך סיום צפוי",
    time_left: "נותר לסיום",
    years: "שנים",
    months: "חודשים",
    and: "ו-",
    ended: "הסתיימה",
    current_balance: "סכום יתרה (₪)",
    balance_date: "תאריך עדכון יתרה",
    payment_amount: "סכום תשלום (₪)",
    payment_date: "תשלום עד תאריך",
    actual_payment_date: "תאריך תשלום בפועל",
    payment_method: "אמצעי תשלום",
    pm_credit_card: "כרטיס אשראי",
    pm_bank_transfer: "העברה בנקאית",
    pm_cash: "מזומן",
    pm_check: "צ'ק",
    pm_app: "אפליקציה (ביט/פייבוקס)",
    pm_other: "אחר",
    insurance_company: "חברת ביטוח",
    policy_number: "מספר פוליסה",
    insurance_phone: "טלפון (ביטוח)",
    new_balance: "יתרה מעודכנת (₪)",
    expense_type: "סוג הוצאה",
    arnona: "ארנונה",
    electricity: "חשמל",
    water: "מים",
    gas: "גז",
    hoa: "ועד בית",
    mortgage_payment: "תשלום משכנתא",
    log_payment: "תעד תשלום",
    meter_from: "קריאה מ-",
    meter_to: "קריאה עד-",
    month_from: "מחודש",
    month_to: "עד חודש",
    payment_month: "חודש חיוב",
    is_paid: "שולם?",
    yes: "כן",
    no: "לא",
    paid: "שולם",
    unpaid: "לא שולם",
    edit: "עריכה",
    gross_amount: "סכום ארנונה ברוטו (₪)",
    discount_percent: "הנחה אחוזית (%)",
    security_levy: "היטל שמירה (₪)",
    net_amount: "סכום לתשלום (נטו)",
    item_type: "סוג פריט",
    ac: "מזגן",
    fridge: "מקרר",
    tv: "טלוויזיה",
    kettle: "קומקום",
    vacuum: "שואב אבק",
    toaster: "מצנם",
    stove: "כיריים",
    speakers: "רמקולים",
    other_appliance: "מכשיר/פריט אחר",
    model_details: "דגם ופרטים",
    purchase_date: "תאריך רכישה",
    store: "חנות / ספק",
    item_cost: "עלות הפריט (₪)",
    service_name: "שם נותן שירות (אחריות)",
    service_phone: "טלפון נותן שירות",
    help_welcome_title: "ברוכים הבאים!",
    help_welcome_desc: "אפליקציה זו נועדה לעזור לך לנהל את הנכסים שלך בקלות, לעקוב אחר הכנסות והוצאות ולסנכרן מידע בין מכשירים.",
    help_steps_title: "צעדים ראשונים:",
    help_step_1: "הוספת נכס: במסך זה (הגדרות), לחץ על \"הוסף נכס חדש\" והזן את פרטי הדירה.",
    help_step_2: "סנכרון: כדי לראות את המידע במכשיר נוסף, לחץ על כפתור הסנכרון, העתק את הקוד והזן אותו במכשיר השני.",
    help_ongoing_title: "ניהול שוטף:",
    help_ongoing_1: "תקבולים ותיקונים: במסך הראשי, לחץ על דירה כדי לנהל את הכספים.",
    help_ongoing_2: "כלים: נהל אנשי קשר וספקים בצורה מרוכזת.",
    help_ongoing_3: "דוחות: יצא את הנתונים לאקסל בלחיצת כפתור.",
    help_ongoing_4: "שוכרים ושכנים: ניהול רשימות דיירים ושכנים, פרטי קשר, ועד בית ושיוך לדירות.",
    help_ongoing_5: "משכנתא: מעקב אחר הלוואות, יתרות, ותשלומים חודשיים לפי נכס.",
    help_ongoing_6: "הוצאות: מעקב אחר חשבונות חשמל, מים, גז, ארנונה, משכנתא וועד בית.",
    help_ongoing_7: "מלאי ותכולה: תיעוד של כל מוצרי החשמל והריהוט בדירה.",
    help_ongoing_8: "שמירת מסמכים וקבצים: העלה ושמור מסמכים וחוזים חשובים ישירות בכל נכס.",
    help_ongoing_9: "תחזית שנתית: מסך ייעודי המציג צפי הכנסות והוצאות שנתי עם ניתוח תזרים מזומנים צפוי.",
    help_ongoing_10: "מסך התראות (Alerts): קבלת התראות חכמות על תשלומים בפיגור, תיקונים פתוחים וחשבונות שלא שולמו.",
    help_ongoing_11: "גרפים ופילוח: ניתוח ויזואלי של הכנסות מול הוצאות ופילוח הוצאות מפורט.",
    help_ongoing_12: "לוח שנה: תצוגה חודשית מרוכזת של מועדי תשלום צפויים, פקיעת חוזים, ואירועים שוטפים.",
    help_ongoing_13: "ניהול רב-מטבעי: כל נכס יכול להתנהל במטבע שלו (₪, $, €). ניתן לעבור בכל עת למטבע גלובלי אחר להמרה אוטומטית ברמות הסיכומים.",
    dev_credits: "פיתוח וניהול",
    electrician: "חשמלאי",
    plumber: "אינסטלטור",
    solar: "טכנאי דודים",
    ac_label: "מיזוג אוויר",
    renovation: "שיפוצים",
    paint: "צבע",
    pest: "הדברה",
    other: "אחר",
    all_types: "כל הסוגים",
    filter_expenses: "סינון הוצאות",
    filter_inventory: "סינון מלאי",
    clear_filters: "נקה סינון",
    total_filtered: "סה״כ מוצג",
    my_status: "הסטטוס שלי בנכס",
    landlord: "בעל הנכס",
    tenant: "שוכר",
    rent_expense: "שכר דירה",
    internet: "אינטרנט / תקשורת",
    insurance: "ביטוח",
    cleaning: "ניקיון ותחזוקה",
    management_fee: "דמי ניהול",
    gardening: "גינון",
    other_regular: "אחר (שוטף)",
    professional_services: "שירותים מקצועיים",
    taxes_fees: "מיסים ואגרות",
    supplies: "ציוד שוטף",
    regular_expenses_group: "הוצאות שוטפות",
    special_expenses_group: "הוצאות מיוחדות",
    alerts: "התראות",
    alerts_tab: "התראות",
    no_alerts: "אין התראות פעילות",
    alert_rent_due: "שכירות צפויה",
    alert_contract_expiry: "חוזה מסתיים בקרוב",
    alert_hoa_unpaid: "ועד בית לא שולם",
    alert_insurance_expiry: "ביטוח מסתיים בקרוב",
    days_left: "ימים לסיום",
    days_overdue: "ימים באיחור",
    urgent: "דחוף",
    soon: "בקרוב",
    dismiss: "סמן כטופל",
    alert_info_expenses: "הוצאות: מסומנות \"לא שולם\" — עדכן ל\"שולם\" וייעלמו אוטומטית.",
    alert_info_utilities: "חשמל / מים / גז: יש \"תשלום עד תאריך\" אבל עדיין אין \"תאריך בפועל\".",
    alert_info_repairs: "תיקונים: יש עלות אבל טרם הוזן תאריך תשלום בפועל.",
    alert_overdue: "פיגור",
    alert_planned: "מתוכנן",
    calendar_tab: "לוח שנה",
    calendar_view: "תצוגה חודשית",
    no_events: "אין אירועים בחודש זה",
    income_event: "הכנסה",
    expense_event: "הוצאה",
    charts_tab: "גרפים",
    monthly_chart: "הכנסות מול הוצאות",
    expense_breakdown: "פילוח הוצאות",
    income_label: "הכנסות",
    expenses_label: "הוצאות",
    no_chart_data: "אין נתונים להצגה",
    tenant_history: "ארכיון שוכרים",
    archive_tenant: "העבר לארכיון",
    exit_date: "תאריך יציאה",
    active_tenants: "שוכרים פעילים",
    past_tenants: "שוכרים לשעבר",
    restore_tenant: "שחזר כפעיל",
    contract_end: "סוף חוזה",
    today: "היום",
    currency: "מטבע",
    currency_ils: "ש\"ח  שקל ישראלי",
    currency_usd: "$  דולר אמריקאי",
    currency_eur: "€  אירו",
    currency_gbp: "£  פאונד בריטי",
    currency_thb: "฿  באט תאילנדי",
    currency_aed: "د.إ  דירהם אמירתי",
    currency_try: "₺  לירה טורקית",
    currency_pln: "zł  זלוטי פולני",
    display_order: "סדר תצוגה",
    annual_forecast: "תחזית שנתית",
    monthly_forecast: "תחזית חודש-חודש",
    income: "הכנסות",
    net_profit: "רווח נקי",
    recurring_expenses: "הוצאות שגרתיות",
    all_properties: "כל הנכסים",
    month_col: "חודש",
    income_col: "הכנסה",
    expense_col: "הוצאה",
    balance_col: "מאזן",
    select_prop_for_recurring: "בחר נכס ספציפי להגדרת הוצאות שגרתיות",
    click_plus_add_recurring: "לחץ + להוספת הוצאה שגרתית",
    month_jan: "ינואר", month_feb: "פברואר", month_mar: "מרץ", month_apr: "אפריל",
    month_may: "מאי", month_jun: "יוני", month_jul: "יולי", month_aug: "אוגוסט",
    month_sep: "ספטמבר", month_oct: "אוקטובר", month_nov: "נובמבר", month_dec: "דצמבר"
  },
  en: {
    app_title: "EasyRent Premium+ 👑",
    dashboard: "Dashboard",
    tenants: "Tenants",
    neighbors: "Neighbors",
    mortgages: "Mortgage",
    mortgage: "Mortgage",
    providers: "Providers",
    settings: "Settings",
    my_properties: "My Properties",
    properties_count: "Properties",
    no_properties: "No properties found",
    no_mortgage: "No mortgage found",
    add_first_prop: "Add First Property",
    add_prop: "Add Property",
    reports_export: "Reports & Export",
    help_credits: "Help, Instructions & Credits",
    sync_devices: "Sync Devices",
    manage_list: "Manage Property List",
    rent_monthly: "Monthly Rent",
    net_income: "Net Income (YTD)",
    operating_income: "Operating Income (NOI)",
    cash_flow: "Cash Flow",
    total_income: "Total Income",
    total_repairs: "Total Repairs",
    total_expenses: "Total Op. Expenses",
    total_mortgage_paid: "Total Mortgage Paid",
    total_paid_ytd: "Paid YTD",
    global_summary: "Global Summary",
    financial_summary: "Financial Summary YTD",
    summary: "Summary",
    payments: "Income",
    repairs: "Repairs",
    history_payments: "Payment History",
    repair_log: "Maintenance Log",
    expenses: "Expenses",
    inventory: "Inventory",
    add_new: "Add New",
    add_payment: "Add Payment",
    add_repair: "Add Record",
    add_expense: "Add Expense",
    add_inventory: "Add Item",
    save: "Save",
    cancel: "Cancel",
    amount: "Amount",
    date: "Date",
    notes: "Notes",
    type: "Type",
    cost: "Cost",
    description: "Description",
    provider: "Service Provider",
    add_tenant: "Add Tenant",
    add_neighbor: "Add Neighbor",
    add_mortgage: "Add Mortgage",
    add_provider: "Add Provider",
    name: "Name",
    neighbor_name: "Neighbor Name",
    phone: "Phone",
    spouse_phone: "Spouse Phone",
    floor: "Floor",
    is_committee: "Committee Member",
    committee_yes: "Yes",
    committee_no: "No",
    specialty: "Specialty",
    assigned_prop: "Assigned Property",
    sync_title: "Device Sync",
    sync_desc: "To see the same data on PC and Phone, ensure Sync Code matches.",
    sync_code: "Your Sync Code",
    save_sync: "Save & Sync",
    report_title: "Export Excel Report",
    from_date: "From Date",
    to_date: "To Date",
    download_csv: "Download CSV",
    help_title: "User Guide",
    confirm_delete: "Delete?",
    save_error: "Save Error",
    delete_error: "Delete Error",
    prop_nickname: "Property Nickname",
    prop_icon: "Icon",
    address: "Full Address",
    rent_target: "Rent Amount",
    size_sqm: "Size (Sqm)",
    market_price_sqm: "Market Price / Sqm",
    contract_start: "Contract Start Date",
    provider_name: "Provider/Business Name",
    perm_notes: "Permanent Notes",
    work_desc: "Work description...",
    select: "Select...",
    tenant_name: "Full Name",
    id_notes: "ID, Entry date...",
    log_work: "Log Work / Issue",
    entry_date: "Entry Date",
    import_contact: "Import from Contacts",
    tax_percent: "Tax (%)",
    taxable_rent: "Taxable Rent Amount",
    yield_after_tax: "Yield (After Tax)",
    annual_yield: "Annual Yield",
    yield_sqm: "Yield/Sqm",
    cash_flow_ytd: "CASH FLOW",
    net_income_after_tax: "Net Income YTD (After Tax)",
    toggle_tax_view: "Toggle Net/Gross",
    bank_name: "Bank",
    original_amount: "Original Amount",
    mortgage_interest: "Interest Rate (%)",
    drawdown_date: "Drawdown Date",
    duration_years: "Duration (Years)",
    end_date: "End Date",
    time_left: "Time left",
    years: "years",
    months: "months",
    and: "and",
    ended: "Ended",
    current_balance: "Current Balance",
    balance_date: "Balance Update Date",
    payment_amount: "Payment Amount",
    payment_date: "Pay By Date",
    actual_payment_date: "Actual Payment Date",
    payment_method: "Payment Method",
    pm_credit_card: "Credit Card",
    pm_bank_transfer: "Bank Transfer",
    pm_cash: "Cash",
    pm_check: "Check",
    pm_app: "Payment App",
    pm_other: "Other",
    insurance_company: "Insurance Company",
    policy_number: "Policy Number",
    insurance_phone: "Insurance Phone",
    new_balance: "Updated Balance",
    expense_type: "Expense Type",
    arnona: "Property Tax",
    electricity: "Electricity",
    water: "Water",
    gas: "Gas",
    hoa: "HOA / Building",
    mortgage_payment: "Mortgage Payment",
    log_payment: "Log Payment",
    meter_from: "Meter (From)",
    meter_to: "Meter (To)",
    month_from: "From Month",
    month_to: "To Month",
    payment_month: "Billing Month",
    is_paid: "Paid?",
    yes: "Yes",
    no: "No",
    paid: "Paid",
    unpaid: "Unpaid",
    edit: "Edit",
    gross_amount: "Gross Amount",
    discount_percent: "Discount (%)",
    security_levy: "Security Levy",
    net_amount: "Net Amount",
    item_type: "Item Type",
    ac: "Air Conditioner",
    fridge: "Refrigerator",
    tv: "TV",
    kettle: "Kettle",
    vacuum: "Vacuum Cleaner",
    toaster: "Toaster",
    stove: "Stove / Hob",
    speakers: "Speakers",
    other_appliance: "Other Appliance",
    model_details: "Model & Details",
    purchase_date: "Purchase Date",
    store: "Store / Vendor",
    item_cost: "Item Cost",
    service_name: "Service Provider (Warranty)",
    service_phone: "Service Phone",
    help_welcome_title: "Welcome!",
    help_welcome_desc: "This app is designed to help you manage your properties easily, track income and expenses, and sync data between devices.",
    help_steps_title: "First Steps:",
    help_step_1: "Add Property: In this screen (Settings), click \"Add New Property\" and enter details.",
    help_step_2: "Sync: To view data on another device, click the Sync button, copy the code, and enter it on the second device.",
    help_ongoing_title: "Ongoing Management:",
    help_ongoing_1: "Income & Repairs: On the main dashboard, click a property to manage finances.",
    help_ongoing_2: "Tools: Manage contacts and service providers centrally.",
    help_ongoing_3: "Reports: Export data to Excel with a click.",
    help_ongoing_4: "Tenants & Neighbors: Manage lists, contacts, committee members, and assignments.",
    help_ongoing_5: "Mortgage: Track loans, balances, and monthly payments by property.",
    help_ongoing_6: "Expenses: Track utility bills, property tax, HOA payments, meter readings, and levy fees.",
    help_ongoing_7: "Inventory: Log all appliances and furniture in the apartment.",
    help_ongoing_8: "Save Documents & Files: Upload and save important contracts and documents directly under each property.",
    help_ongoing_9: "Annual Forecast: Dedicated screen displaying projected annual income, expenses, and cash flow analysis.",
    help_ongoing_10: "Alerts Panel: Smart notifications for overdue payments, open repairs, and unpaid utility bills.",
    help_ongoing_11: "Charts & Breakdown: Visual analytics comparing income vs expenses, and detailed expense distribution.",
    help_ongoing_12: "Calendar: Monthly calendar view detailing expected payment dates, contract expirations, and active events.",
    help_ongoing_13: "Multi-Currency: Each property can be managed in its own currency (ILS, USD, EUR). Switch display currency anytime for dynamic conversion on summaries.",
    dev_credits: "Development & Management",
    electrician: "Electrician",
    plumber: "Plumber",
    solar: "Solar/Boiler",
    ac_label: "Air Conditioning",
    renovation: "Renovation",
    paint: "Painter",
    pest: "Pest Control",
    other: "Other",
    all_types: "All Types",
    filter_expenses: "Filter Expenses",
    filter_inventory: "Filter Inventory",
    clear_filters: "Clear Filters",
    total_filtered: "Total Filtered",
    my_status: "My Status",
    landlord: "Landlord",
    tenant: "Tenant",
    rent_expense: "Rent Payment",
    internet: "Internet / Telecom",
    insurance: "Insurance",
    cleaning: "Cleaning & Maintenance",
    management_fee: "Management Fee",
    gardening: "Gardening",
    other_regular: "Other (Regular)",
    professional_services: "Professional Services",
    taxes_fees: "Taxes & Fees",
    supplies: "Supplies",
    regular_expenses_group: "Regular Expenses",
    special_expenses_group: "Special Expenses",
    alerts: "Alerts",
    alerts_tab: "Alerts",
    no_alerts: "No active alerts",
    alert_rent_due: "Rent Due",
    alert_contract_expiry: "Contract Expiring Soon",
    alert_hoa_unpaid: "HOA Unpaid",
    alert_insurance_expiry: "Insurance Expiring Soon",
    days_left: "days left",
    days_overdue: "days overdue",
    urgent: "Urgent",
    soon: "Soon",
    dismiss: "Mark as handled",
    alert_info_expenses: "Expenses: Marked as \"unpaid\" — update to \"paid\" and they will disappear automatically.",
    alert_info_utilities: "Electricity / Water / Gas: Have a \"due date\" but no \"actual payment date\" yet.",
    alert_info_repairs: "Repairs: Cost exists but actual payment date has not been entered yet.",
    alert_overdue: "Overdue",
    alert_planned: "Planned",
    calendar_tab: "Calendar",
    calendar_view: "Monthly View",
    no_events: "No events this month",
    income_event: "Income",
    expense_event: "Expense",
    charts_tab: "Charts",
    monthly_chart: "Income vs Expenses",
    expense_breakdown: "Expense Breakdown",
    income_label: "Income",
    expenses_label: "Expenses",
    no_chart_data: "No data to display",
    tenant_history: "Tenant Archive",
    archive_tenant: "Move to Archive",
    exit_date: "Exit Date",
    active_tenants: "Active Tenants",
    past_tenants: "Past Tenants",
    restore_tenant: "Restore as Active",
    contract_end: "Contract End",
    today: "Today",
    currency: "Currency",
    currency_ils: "₪  Israeli Shekel",
    currency_usd: "$  US Dollar",
    currency_eur: "€  Euro",
    currency_gbp: "£  British Pound",
    currency_thb: "฿  Thai Baht",
    currency_aed: "د.إ  UAE Dirham",
    currency_try: "₺  Turkish Lira",
    currency_pln: "zł  Polish Zloty",
    display_order: "Display Order",
    annual_forecast: "Annual Forecast",
    monthly_forecast: "Month by Month",
    income: "Income",
    net_profit: "Net Profit",
    recurring_expenses: "Recurring Expenses",
    all_properties: "All Properties",
    month_col: "Month",
    income_col: "Income",
    expense_col: "Expense",
    balance_col: "Balance",
    select_prop_for_recurring: "Select a specific property to configure recurring expenses",
    click_plus_add_recurring: "Click + to add a recurring expense",
    month_jan: "January", month_feb: "February", month_mar: "March", month_apr: "April",
    month_may: "May", month_jun: "June", month_jul: "July", month_aug: "August",
    month_sep: "September", month_oct: "October", month_nov: "November", month_dec: "December"
  }
};

const ISRAELI_BANKS = [
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

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedAptId, setSelectedAptId] = useState<string | null>(null);
  const [globalCurrency, setGlobalCurrency] = useState<string>(() => {
    return localStorage.getItem('prop_app_global_currency') || 'ILS';
  });

  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>(() => {
    return (localStorage.getItem('prop_app_font_size') as 'normal' | 'large' | 'xlarge') || 'normal';
  });

  useEffect(() => {
    localStorage.setItem('prop_app_font_size', fontSize);
    const root = document.documentElement;
    if (fontSize === 'normal') {
      root.style.setProperty('font-size', '16px');
    } else if (fontSize === 'large') {
      root.style.setProperty('font-size', '18px');
    } else if (fontSize === 'xlarge') {
      root.style.setProperty('font-size', '20px');
    }
  }, [fontSize]);

  const [usdToIlsRate, setUsdToIlsRate] = useState<number>(() => {
    const saved = localStorage.getItem('prop_app_usd_rate');
    return saved ? parseFloat(saved) : 3.7;
  });
  const [eurToIlsRate, setEurToIlsRate] = useState<number>(() => {
    const saved = localStorage.getItem('prop_app_eur_rate');
    return saved ? parseFloat(saved) : 4.0;
  });
  const [gbpToIlsRate, setGbpToIlsRate] = useState<number>(() => {
    const saved = localStorage.getItem('prop_app_gbp_rate');
    return saved ? parseFloat(saved) : 4.8;
  });
  const [thbToIlsRate, setThbToIlsRate] = useState<number>(() => {
    const saved = localStorage.getItem('prop_app_thb_rate');
    return saved ? parseFloat(saved) : 0.10;
  });

  const [currencyNotice, setCurrencyNotice] = useState<string | null>(null);
  const noticeTimeoutRef = useRef<any>(null);
  const [isUpdatingRates, setIsUpdatingRates] = useState(false);

  const triggerCurrencyNotice = (msg: string) => {
    if (noticeTimeoutRef.current) {
      clearTimeout(noticeTimeoutRef.current);
    }
    setCurrencyNotice(msg);
    noticeTimeoutRef.current = setTimeout(() => {
      setCurrencyNotice(null);
    }, 1500);
  };

  const [isAptModalOpen, setIsAptModalOpen] = useState(false);
  const [editingApt, setEditingApt] = useState<Apartment | null>(null);
  const [showPremiumPrompt, setShowPremiumPrompt] = useState(false);
  const [premiumCodeInput, setPremiumCodeInput] = useState('');
  const [premiumPromptError, setPremiumPromptError] = useState('');
  const [syncCodeInput, setSyncCodeInput] = useState('');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isRatesModalOpen, setIsRatesModalOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [selectedLogoDesign, setSelectedLogoDesign] = useState<string>(() => {
    return localStorage.getItem('prop_app_logo_design') || '6';
  });
  useEffect(() => {
    localStorage.setItem('prop_app_logo_design', selectedLogoDesign);
  }, [selectedLogoDesign]);
  const [logoPreviewBg, setLogoPreviewBg] = useState<'light' | 'dark'>('dark');
  const [customUploadedLogo, setCustomUploadedLogo] = useState<string | null>(() => localStorage.getItem('prop_app_custom_logo_data') || null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target?.result as string;
        if (base64Data) {
          setCustomUploadedLogo(base64Data);
          localStorage.setItem('prop_app_custom_logo_data', base64Data);
          setSelectedLogoDesign('custom');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const [isPropListModalOpen, setIsPropListModalOpen] = useState(false);
  const [isRentSegmentsModalOpen, setIsRentSegmentsModalOpen] = useState(false);
  const [editingRentSegmentsApt, setEditingRentSegmentsApt] = useState<Apartment | null>(null);
  
  // Quick Actions dashboard states
  const [openQuickMenuId, setOpenQuickMenuId] = useState<string | null>(null);
  const [quickPaymentApt, setQuickPaymentApt] = useState<Apartment | null>(null);
  const [quickRepairApt, setQuickRepairApt] = useState<Apartment | null>(null);
  const [quickExpenseApt, setQuickExpenseApt] = useState<Apartment | null>(null);
  const [isQuickRentExpense, setIsQuickRentExpense] = useState(false);
  const [exportAptId, setExportAptId] = useState<string>('all');
  const [exportFromDate, setExportFromDate] = useState(() => `${new Date().getFullYear()}-01-01`);
  const [exportToDate, setExportToDate] = useState(() => `${new Date().getFullYear()}-12-31`);

  const [lang, setLang] = useState<'he' | 'en'>(() => {
    const saved = localStorage.getItem('prop_app_lang');
    if (saved === 'en' || saved === 'he') return saved;
    return (navigator.language || '').toLowerCase().startsWith('he') ? 'he' : 'en';
  });

  const t = (key: string) => (TEXTS[lang] as any)[key] || key;

  // Dark Mode / Night mode viewing (Requested!)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('prop_app_dark_mode') === 'true';
  });

  // Ambient relax lo-fi audio player states
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [synthVolume, setSynthVolume] = useState(0.4);
  const [audioFeedback, setAudioFeedback] = useState<string>('שקט / Muted');
  const synthRef = useRef<AmbientSynth | null>(null);

  // Scroll to Top state
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // App Synchronization Identifier
  const [appId, setAppId] = useState<string>(() => {
    const saved = localStorage.getItem('prop_app_id');
    return saved || Math.floor(100000 + Math.random() * 900000).toString();
  });

  // DB Synced States
  const [user, setUser] = useState<any>(null);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [neighbors, setNeighbors] = useState<Neighbor[]>([]);
  const [mortgages, setMortgages] = useState<Mortgage[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [tenantHistory, setTenantHistory] = useState<TenantHistory[]>([]);
  const [recurringBudgets, setRecurringBudgets] = useState<RecurringBudget[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [cpiHistory, setCpiHistory] = useState<CpiIndex[]>([]);
  const [cpiType, setCpiType] = useState<'cpi' | 'construction'>(() => {
    return (localStorage.getItem('prop_app_cpi_type') as 'cpi' | 'construction') || 'cpi';
  });
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('dismissed_alerts') || '[]');
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);

  // Premium License flags
  const [isPremium, setIsPremium] = useState(() => localStorage.getItem('prop_app_premium') === '1');
  const [licenseCode, setLicenseCode] = useState(() => localStorage.getItem('prop_app_license') || '');

  // Sound Synth init
  useEffect(() => {
    synthRef.current = new AmbientSynth();
    synthRef.current.registerOnNote((chordName, freq) => {
      setAudioFeedback(lang === 'he' ? `מנגן: ${chordName} (${freq.toFixed(1)}Hz)` : `Playing: ${chordName} (${freq.toFixed(1)}Hz)`);
    });
    return () => {
      if (synthRef.current) synthRef.current.stop();
    };
  }, [lang]);

  // Fetch exchange rates from free public API on mount to stay in sync with real-world rates (dynamic real-time tracking)
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/ILS');
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        if (data && data.result === 'success' && data.rates) {
          const usdPerIls = data.rates.USD;
          const eurPerIls = data.rates.EUR;
          const gbpPerIls = data.rates.GBP;
          const thbPerIls = data.rates.THB;
          
          if (usdPerIls) {
            const calculatedUsd = parseFloat((1 / usdPerIls).toFixed(4));
            setUsdToIlsRate(calculatedUsd);
            localStorage.setItem('prop_app_usd_rate', calculatedUsd.toString());
          }
          if (eurPerIls) {
            const calculatedEur = parseFloat((1 / eurPerIls).toFixed(4));
            setEurToIlsRate(calculatedEur);
            localStorage.setItem('prop_app_eur_rate', calculatedEur.toString());
          }
          if (gbpPerIls) {
            const calculatedGbp = parseFloat((1 / gbpPerIls).toFixed(4));
            setGbpToIlsRate(calculatedGbp);
            localStorage.setItem('prop_app_gbp_rate', calculatedGbp.toString());
          }
          if (thbPerIls) {
            const calculatedThb = parseFloat((1 / thbPerIls).toFixed(4));
            setThbToIlsRate(calculatedThb);
            localStorage.setItem('prop_app_thb_rate', calculatedThb.toString());
          }
          console.log('Updated exchange rates from API successfully');
        }
      } catch (err) {
        console.warn('Failed to fetch live exchange rates, using cached or fallback:', err);
      }
    };
    fetchExchangeRates();
  }, []);

  const toggleMusic = async () => {
    if (!synthRef.current) return;
    if (isMusicPlaying) {
      synthRef.current.stop();
      setIsMusicPlaying(false);
      setAudioFeedback(lang === 'he' ? 'שקט / Muted' : 'Muted');
    } else {
      await synthRef.current.start();
      synthRef.current.setVolume(synthVolume);
      setIsMusicPlaying(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setSynthVolume(vol);
    if (synthRef.current) {
      synthRef.current.setVolume(vol);
    }
  };

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    setSelectedAptId(null);
  };

  // Sync to body dark class
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('prop_app_dark_mode', 'true');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('prop_app_dark_mode', 'false');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('prop_app_lang', lang);
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('prop_app_id', appId);
    setSyncCodeInput(appId);
  }, [appId]);

  // Scroll Listener for Scroll-to-Top Button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollToTop(true);
      } else {
        setShowScrollToTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sign In anonymously to Firebase
  useEffect(() => {
    let unsubscribeAuth: any = () => {};
    const initFirebase = async () => {
      try {
        await auth.signInAnonymously();
        unsubscribeAuth = auth.onAuthStateChanged((u) => {
          setUser(u);
          setLoading(false);
        });
      } catch (err) {
        console.error("Firebase Auth Error", err);
        setLoading(false);
      }
    };
    initFirebase();
    return () => unsubscribeAuth();
  }, []);

  // Sync DB records
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setPermissionError(false);

    const baseRef = db.collection('artifacts').doc(appId).collection('public').doc('data');

    const listenToCollection = (subColl: string, setter: (arr: any[]) => void) => {
      return baseRef.collection(subColl).onSnapshot({
        next: (snap) => {
          const items = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          setter(items);
        },
        error: (err) => {
          console.error(`Collection ${subColl} listen error:`, err);
          if (err.code === 'permission-denied') setPermissionError(true);
          setLoading(false);
        }
      });
    };

    const unsubscribers = [
      listenToCollection('apartments', setApartments),
      listenToCollection('payments', setPayments),
      listenToCollection('repairs', setRepairs),
      listenToCollection('providers', setProviders),
      listenToCollection('tenants', setTenants),
      listenToCollection('neighbors', setNeighbors),
      listenToCollection('mortgages', setMortgages),
      listenToCollection('expenses', setExpenses),
      listenToCollection('inventory', setInventory),
      listenToCollection('tenant_history', setTenantHistory),
      listenToCollection('recurring_budgets', setRecurringBudgets),
      listenToCollection('documents', setDocuments),
      listenToCollection('cpi_history', setCpiHistory)
    ];

    setTimeout(() => setLoading(false), 800);

    return () => unsubscribers.forEach(u => u());
  }, [user, appId]);

  // Seeding CPI and Construction index data on first startup if empty
  useEffect(() => {
    if (!loading && user && cpiHistory.length === 0) {
      const seedCpi = async () => {
        try {
          // Double check if there are really no cpi entries
          const snapshot = await db.collection('cpi_history').where('appId', '==', appId).get();
          if (snapshot.empty) {
            // Seed CPI
            for (const item of DEFAULT_CPI_LIST) {
              const publishedAt = `${item.year}-${String(item.month === 12 ? 1 : item.month + 1).padStart(2, '0')}-15`;
              await saveDocument('cpi_history', {
                year: item.year,
                month: item.month,
                value: item.value,
                publishedAt,
                indexType: 'cpi'
              });
            }
            // Seed Construction Inputs
            for (const item of DEFAULT_CONSTRUCTION_LIST) {
              const publishedAt = `${item.year}-${String(item.month === 12 ? 1 : item.month + 1).padStart(2, '0')}-15`;
              await saveDocument('cpi_history', {
                year: item.year,
                month: item.month,
                value: item.value,
                publishedAt,
                indexType: 'construction'
              });
            }
          }
        } catch (e) {
          console.error("Error auto-seeding index history: ", e);
        }
      };
      seedCpi();
    }
  }, [loading, user, cpiHistory.length, appId]);

  // License check
  useEffect(() => {
    if (!user || !licenseCode) return;
    if (/^\d{4,}$/.test(licenseCode)) {
      db.collection('licenses').doc(licenseCode).get().then(doc => {
        if (doc.exists) {
          const data = doc.data();
          if (data && data.appId === appId && data.active !== false) {
            setIsPremium(true);
            localStorage.setItem('prop_app_premium', '1');
            return;
          }
        }
        setIsPremium(localStorage.getItem('prop_app_premium_master') === '1');
        if (localStorage.getItem('prop_app_premium_master') !== '1') {
          localStorage.removeItem('prop_app_premium');
        }
      }).catch(() => {});
    }
  }, [user, appId, licenseCode]);

  const activatePremium = async (code: string) => {
    const raw = (code || '').trim();
    if (!raw) return { ok: false, msg: lang === 'he' ? 'יש להזין סיסמה' : 'Please enter a code' };

    if (raw === 'Gavish-pro') {
      localStorage.setItem('prop_app_premium', '1');
      localStorage.setItem('prop_app_premium_master', '1');
      setIsPremium(true);
      triggerConfetti('entrance');
      return { ok: true, msg: lang === 'he' ? 'הרישיון הופעל בהצלחה (Master)' : 'License activated (Master)' };
    }

    const parsed = parseInt(raw, 10);
    const isFourDigitLicense = /^\d{4}$/.test(raw) && parsed >= 1001 && parsed <= 9999;

    if (isFourDigitLicense) {
      try {
        const docRef = db.collection('licenses').doc(raw);
        await docRef.set({ appId: appId, active: true, activatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        setIsPremium(true);
        setLicenseCode(raw);
        localStorage.setItem('prop_app_premium', '1');
        localStorage.setItem('prop_app_license', raw);
        triggerConfetti('entrance');
        return { ok: true, msg: lang === 'he' ? 'רישיון פרימיום הופעל בהצלחה!' : 'Premium license activated successfully!' };
      } catch (e) {
        setIsPremium(true);
        setLicenseCode(raw);
        localStorage.setItem('prop_app_premium', '1');
        localStorage.setItem('prop_app_license', raw);
        triggerConfetti('entrance');
        return { ok: true, msg: lang === 'he' ? 'רישיון פרימיום הופעל בהצלחה!' : 'Premium license activated successfully!' };
      }
    }

    if (!/^\d{4,}$/.test(raw)) {
      return { ok: false, msg: lang === 'he' ? 'קוד לא תקין. נא להזין קוד בן 4 ספרות (1001-9999) או סיסמת מאסטר.' : 'Invalid code format. Please enter a 4-digit code (1001-9999) or master password.' };
    }

    try {
      const docRef = db.collection('licenses').doc(raw);
      const doc = await docRef.get();
      if (doc.exists) {
        const data = doc.data();
        if (data && data.appId !== appId && data.appId) {
          return { ok: false, msg: lang === 'he' ? 'קוד זה כבר בשימוש במכשיר אחר' : 'Code already registered elsewhere' };
        }
        await docRef.set({ appId: appId, active: true, activatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        setIsPremium(true);
        setLicenseCode(raw);
        localStorage.setItem('prop_app_premium', '1');
        localStorage.setItem('prop_app_license', raw);
        triggerConfetti('entrance');
        return { ok: true, msg: lang === 'he' ? 'רישיון פרימיום הופעל בהצלחה!' : 'Premium license activated successfully!' };
      } else {
        return { ok: false, msg: lang === 'he' ? 'קוד שגוי או פג תוקף' : 'Invalid or expired code' };
      }
    } catch (e) {
      return { ok: false, msg: String(e) };
    }
  };

  const triggerConfetti = (type: 'save' | 'entrance' = 'save') => {
    if (type === 'save') {
      confetti({
        particleCount: 40,
        spread: 40,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#10b981']
      });
    } else {
      confetti({
        particleCount: 85,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#6366f1', '#a855f7', '#10b981', '#f59e0b']
      });
    }
  };

  const handleAddApartmentClick = () => {
    if (apartments.length >= 2 && !isPremium) {
      setPremiumPromptError('');
      setShowPremiumPrompt(true);
    } else {
      setEditingApt(null);
      setIsAptModalOpen(true);
    }
  };

  const handleEditApartmentClick = (apt: Apartment) => {
    setEditingApt(apt);
    setIsAptModalOpen(true);
  };

  const handleSaveApartment = async (data: any, id?: string) => {
    const payload = {
      ...data,
      targetRent: Number(data.targetRent) || 0,
      size: Number(data.size) || 0,
      pricePerSqm: Number(data.pricePerSqm) || 0,
      taxPercent: Number(data.taxPercent) || 0,
      taxableRent: Number(data.taxableRent) || 0,
      displayOrder: Number(data.displayOrder) || 1,
      status: data.status || 'landlord',
      isCpiLinked: data.isCpiLinked === 'true' || data.isCpiLinked === true,
      baseRentAmount: Number(data.baseRentAmount) || 0,
      baseCpiMonth: Number(data.baseCpiMonth) || 1,
      baseCpiYear: Number(data.baseCpiYear) || 2024,
    };

    await saveDocument('apartments', payload, id || null);
    setIsAptModalOpen(false);
    setEditingApt(null);
  };

  const handleActivatePremiumPrompt = async () => {
    setPremiumPromptError('');
    const res = await activatePremium(premiumCodeInput);
    if (res.ok) {
      setShowPremiumPrompt(false);
      setIsAptModalOpen(true);
    } else {
      setPremiumPromptError(res.msg);
    }
  };

  const handleExportCSV = () => {
    const from = new Date(exportFromDate);
    const to = new Date(exportToDate);
    
    let csvContent = "\uFEFF"; // UTF-8 BOM for Hebrew Excel support
    
    // Header
    csvContent += lang === 'he' 
      ? "סוג,נכס,סכום,תאריך,אמצעי תשלום,הערות\n" 
      : "Type,Property,Amount,Date,Payment Method,Notes\n";
    
    // Add Payments
    payments.forEach(p => {
      if (!p.date) return;
      if (exportAptId !== 'all' && p.aptId !== exportAptId) return;
      const d = new Date(p.date);
      if (d >= from && d <= to) {
        const apt = apartments.find(a => a.id === p.aptId);
        const aptName = apt ? apt.name : '';
        const notes = (p.notes || '').replace(/,/g, ' ');
        csvContent += lang === 'he'
          ? `הכנסה שכר דירה,${aptName},${p.amount},${p.date},העברה,${notes}\n`
          : `Rent Income,${aptName},${p.amount},${p.date},Transfer,${notes}\n`;
      }
    });

    // Add Repairs
    repairs.forEach(r => {
      if (!r.date) return;
      if (exportAptId !== 'all' && r.aptId !== exportAptId) return;
      const d = new Date(r.date);
      if (d >= from && d <= to) {
        const apt = apartments.find(a => a.id === r.aptId);
        const aptName = apt ? apt.name : '';
        const notes = (r.notes || '').replace(/,/g, ' ');
        const typeLabel = t(r.type) || r.type;
        csvContent += lang === 'he'
          ? `תיקון - ${typeLabel},${aptName},${r.cost},${r.date},${r.paymentMethod || ''},${notes}\n`
          : `Repair - ${typeLabel},${aptName},${r.cost},${r.date},${r.paymentMethod || ''},${notes}\n`;
      }
    });

    // Add Expenses
    expenses.forEach(e => {
      const dateStr = e.paymentDate || e.actualPaymentDate || e.createdAt;
      if (!dateStr) return;
      if (exportAptId !== 'all' && e.aptId !== exportAptId) return;
      const d = new Date(dateStr);
      if (d >= from && d <= to) {
        const apt = apartments.find(a => a.id === e.aptId);
        const aptName = apt ? apt.name : '';
        const notes = (e.notes || '').replace(/,/g, ' ');
        const typeLabel = t(e.type) || e.type;
        csvContent += lang === 'he'
          ? `הוצאה - ${typeLabel},${aptName},${e.amount},${dateStr},${e.paymentMethod || ''},${notes}\n`
          : `Expense - ${typeLabel},${aptName},${e.amount},${dateStr},${e.paymentMethod || ''},${notes}\n`;
      }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const downloadName = exportAptId === 'all' ? 'All_Properties' : (apartments.find(a => a.id === exportAptId)?.name || 'Property');
    link.setAttribute("download", `EasyRent_${downloadName}_${exportFromDate}_to_${exportToDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerConfetti('entrance');
  };

  const saveDocument = async (collectionName: string, data: any, id: string | null = null) => {
    if (!user) return;
    const ref = db.collection('artifacts').doc(appId).collection('public').doc('data').collection(collectionName);
    try {
      if (id) {
        await ref.doc(id).update({ ...data, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
        logAnalyticsEvent('update_document', { collection: collectionName, documentId: id });
      } else {
        const addedRef = await ref.add({ ...data, createdBy: user.uid, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
        logAnalyticsEvent('create_document', { collection: collectionName, documentId: addedRef.id });
      }
      triggerConfetti('save');
    } catch (e) {
      alert(t('save_error') + ": " + (e as any).message);
    }
  };

  const deleteDocument = async (collectionName: string, id: string) => {
    if (!user) return;
    try {
      await db.collection('artifacts').doc(appId).collection('public').doc('data').collection(collectionName).doc(id).delete();
      logAnalyticsEvent('delete_document', { collection: collectionName, documentId: id });
    } catch (e) {
      alert(t('delete_error') + ": " + (e as any).message);
    }
  };

  const sortedApartments = [...apartments].sort((a, b) => {
    const orderA = Number(a.displayOrder) || 999;
    const orderB = Number(b.displayOrder) || 999;
    if (orderA !== orderB) return orderA - orderB;
    return (a.name || '').localeCompare(b.name || '');
  });

  const isOnlyTenant = apartments.length > 0 && apartments.every(a => a.status === 'tenant');

  const navTabs = ['dashboard'];
  if (!isOnlyTenant) navTabs.push('tenants');
  navTabs.push('neighbors');
  if (!isOnlyTenant) navTabs.push('mortgages');
  navTabs.push('providers');

  // Alarm calculation logic
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const computeAlerts = () => {
    const alerts: any[] = [];
    const addAlert = (id: string, type: string, title: string, subtitle: string, urgency: string, aptName: string) => {
      if (!dismissedAlerts.includes(id)) {
        alerts.push({ id, type, title, subtitle, urgency, aptName });
      }
    };

    const getUrgency = (daysLeft: number) => {
      if (daysLeft < 0) return 'overdue';
      if (daysLeft <= 7) return 'urgent';
      if (daysLeft <= 14) return 'soon';
      return 'planned';
    };

    // 1. Unpaid expenses
    expenses.filter(e => e.isPaid === 'false').forEach(e => {
      const apt = apartments.find(a => a.id === e.aptId);
      const aptName = apt?.name || '';
      const dueDateStr = e.paymentDate || e.actualPaymentDate || (e.monthFrom ? e.monthFrom + '-01' : null);
      const dueDate = dueDateStr ? new Date(dueDateStr) : null;
      const daysLeft = dueDate ? Math.round((dueDate.getTime() - today.getTime()) / 86400000) : null;
      const urgency = daysLeft !== null ? getUrgency(daysLeft) : 'planned';
      const typeLabel = t(e.type) || e.type;
      const daysInfo = daysLeft !== null
        ? (daysLeft < 0 ? `${Math.abs(daysLeft)} ${t('days_overdue')}` : `${daysLeft} ${t('days_left')}`)
        : '';
      addAlert(
        `expense_${e.id}`, 'expense',
        `${typeLabel} — ${aptName}`,
        `₪${Number(e.amount || 0).toLocaleString()}${daysInfo ? ' · ' + daysInfo : ''}`,
        urgency, aptName
      );
    });

    // 2. Unpaid rent
    apartments.forEach(apt => {
      if (apt.status !== 'tenant' && Number(apt.targetRent) > 0 && today.getDate() >= 5) {
        const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        const paidThisMonth = payments.some(p => p.aptId === apt.id && p.date && p.date.startsWith(thisMonth));
        if (!paidThisMonth) {
          const daysLate = today.getDate() - 5;
          addAlert(
            `rent_${apt.id}_${thisMonth}`, 'rent',
            `${t('alert_rent_due')} — ${apt.name}`,
            `${apt.currency || '₪'}${Number(apt.targetRent).toLocaleString()} · ${daysLate} ${t('days_overdue')}`,
            today.getDate() >= 15 ? 'urgent' : 'soon', apt.name
          );
        }
      }

      if (apt.contractEnd) {
        const endDate = new Date(apt.contractEnd);
        const daysLeft = Math.round((endDate.getTime() - today.getTime()) / 86400000);
        if (daysLeft >= 0 && daysLeft <= 60) {
          addAlert(
            `contract_${apt.id}`, 'contract',
            `${t('alert_contract_expiry')} — ${apt.name}`,
            `${daysLeft} ${t('days_left')}`,
            daysLeft <= 14 ? 'urgent' : 'soon', apt.name
          );
        }
      }
    });

    const order: any = { overdue: 0, urgent: 1, soon: 2, planned: 3 };
    alerts.sort((a, b) => (order[a.urgency] ?? 3) - (order[b.urgency] ?? 3));
    return alerts;
  };

  const activeAlerts = computeAlerts();

  const dismissAlert = (alertId: string) => {
    const updated = [...dismissedAlerts, alertId];
    setDismissedAlerts(updated);
    localStorage.setItem('dismissed_alerts', JSON.stringify(updated));
  };

  const getSymbolForCurrency = (currencyCode: string): string => {
    const code = currencyCode || '₪';
    if (code === 'ILS' || code === '₪' || code === 'ש"ח') {
      return '₪';
    }
    if (code === 'USD' || code === '$') return '$';
    if (code === 'EUR' || code === '€') return '€';
    if (code === 'GBP' || code === '£') return '£';
    if (code === 'THB' || code === '฿') return '฿';
    return code;
  };

  const convertAmount = (value: number, fromCurrencyCode: string, toCurrencyCode: string) => {
    const fromSym = getSymbolForCurrency(fromCurrencyCode || '₪');
    const toSym = getSymbolForCurrency(toCurrencyCode || '₪');
    if (fromSym === toSym) return Math.round(value * 100) / 100;

    // Convert "from" to ILS (base)
    let valueInILS = value;
    if (fromSym === '$') {
      valueInILS = value * usdToIlsRate;
    } else if (fromSym === '€') {
      valueInILS = value * eurToIlsRate;
    } else if (fromSym === '£') {
      valueInILS = value * gbpToIlsRate;
    } else if (fromSym === '฿') {
      valueInILS = value * thbToIlsRate;
    }

    let converted = value;
    // Convert ILS to "to"
    if (toSym === '₪' || toSym === 'ש"ח') {
      converted = valueInILS;
    } else if (toSym === '$') {
      converted = valueInILS / usdToIlsRate;
    } else if (toSym === '€') {
      converted = valueInILS / eurToIlsRate;
    } else if (toSym === '£') {
      converted = valueInILS / gbpToIlsRate;
    } else if (toSym === '฿') {
      converted = valueInILS / thbToIlsRate;
    }
    return Math.round(converted * 100) / 100;
  };

  const globalCurrencySymbol = getSymbolForCurrency(globalCurrency);

  // General dashboard stats (ignore properties where status is 'tenant')
  const currentYear = new Date().getFullYear();
  const landlordAptIds = apartments.filter(a => a.status !== 'tenant').map(a => a.id);

  const globalPaymentsYTD = payments
    .filter(p => landlordAptIds.includes(p.aptId) && new Date(p.date).getFullYear() === currentYear)
    .reduce((acc, p) => {
      const apt = apartments.find(a => a.id === p.aptId);
      const val = convertAmount(Number(p.amount || 0), apt?.currency || '₪', globalCurrency);
      return acc + val;
    }, 0);

  const globalRepairsYTD = repairs
    .filter(r => landlordAptIds.includes(r.aptId) && new Date(r.date).getFullYear() === currentYear)
    .reduce((acc, r) => {
      const apt = apartments.find(a => a.id === r.aptId);
      const val = convertAmount(Number(r.cost || 0), apt?.currency || '₪', globalCurrency);
      return acc + val;
    }, 0);

  const globalOpExpensesYTD = expenses
    .filter(e => landlordAptIds.includes(e.aptId) && e.type !== 'mortgage' && !(['hoa', 'arnona'].includes(e.type) && e.isPaid === 'false') && new Date(e.paymentDate || e.actualPaymentDate || (e.monthFrom ? e.monthFrom + '-01' : null) || e.createdAt).getFullYear() === currentYear)
    .reduce((acc, e) => {
      const apt = apartments.find(a => a.id === e.aptId);
      const val = convertAmount(Number(e.amount || 0), apt?.currency || '₪', globalCurrency);
      return acc + val;
    }, 0);

  const globalMortgageYTD = expenses
    .filter(e => landlordAptIds.includes(e.aptId) && e.type === 'mortgage' && e.isPaid !== 'false' && new Date(e.paymentDate || e.actualPaymentDate || e.createdAt).getFullYear() === currentYear)
    .reduce((acc, e) => {
      const apt = apartments.find(a => a.id === e.aptId);
      const val = convertAmount(Number(e.amount || 0), apt?.currency || '₪', globalCurrency);
      return acc + val;
    }, 0);

  const globalNOI = globalPaymentsYTD - globalRepairsYTD - globalOpExpensesYTD;
  const globalCashFlow = globalNOI - globalMortgageYTD;

  if (permissionError) {
    return (
      <div className="flex h-screen items-center justify-center bg-rose-50 p-6 text-center">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-md border border-rose-100">
          <div className="text-rose-500 mb-4 flex justify-center"><LucideIcon name="Lock" size={48} /></div>
          <h2 className="text-2xl font-black mb-4 text-rose-600">שגיאת הרשאות פנימית</h2>
          <p className="text-slate-600 mb-6 text-sm leading-relaxed">אנא בדוק את הגדרות וכללי האבטחה של Firestore.</p>
          <button onClick={() => window.location.reload()} className="bg-rose-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-rose-700 transition-all">Reload</button>
        </div>
      </div>
    );
  }

  const selectedAptObject = selectedAptId ? apartments.find(a => a.id === selectedAptId) : null;

  return (
    <div className={`min-h-screen pb-28 transition-all duration-300 ${isDarkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Top Header */}
      <nav className={`backdrop-blur-lg shadow-sm sticky top-0 z-45 px-4 py-3 flex flex-col md:flex-row justify-between items-center border-b gap-3 transition-all duration-300 ${
        isDarkMode 
          ? 'bg-slate-900 border-slate-800' 
          : 'bg-white border-slate-100'
      }`}>
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3">
            {/* Dynamic Active App Logo */}
            <button 
              onClick={() => setIsLogoModalOpen(true)}
              className="w-10 h-10 rounded-xl overflow-hidden shadow-md flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800 hover:scale-105 active:scale-95 transition-transform"
              title={lang === 'he' ? 'שנה סמליל אפליקציה' : 'Change App Logo'}
            >
              {selectedLogoDesign === 'custom' && (
                <div className="w-full h-full bg-slate-950 flex items-center justify-center">
                  {customUploadedLogo ? (
                    <img src={customUploadedLogo} className="w-full h-full object-cover" alt="Custom Logo" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-[14px] text-slate-500 font-black">🖼️</span>
                  )}
                </div>
              )}
              {selectedLogoDesign === '6' && (
                <div className="w-full h-full bg-[#0f172a] flex items-center justify-center">
                  <img src="/logo.svg" className="w-full h-full object-cover" alt="EasyRent Premium Logo" referrerPolicy="no-referrer" />
                </div>
              )}
              {selectedLogoDesign === '5' && (
                <div className="w-full h-full bg-[#1B355A] flex items-center justify-center">
                  <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
                    <rect width="100" height="100" rx="26" fill="#1B355A" />
                    <circle cx="50" cy="50" r="16" fill="#FFFFFF" />
                    <path d="M15 56 C 18 74, 40 82, 75 78" stroke="#E5A93B" strokeWidth="12" fill="none" />
                    <rect x="62" y="45" width="22" height="30" rx="2" fill="#FFFFFF" stroke="#23426B" strokeWidth="6" />
                  </svg>
                </div>
              )}
              {selectedLogoDesign === '4' && (
                <div className="w-full h-full bg-[#0E487F] flex items-center justify-center">
                  <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
                    <rect width="100" height="100" fill="#0E487F" />
                    <circle cx="50" cy="50" r="22" fill="#FFFFFF" />
                    <path d="M22 65 C 25 80, 48 88, 78 84" stroke="#DCA241" strokeWidth="10" fill="none" />
                  </svg>
                </div>
              )}
              {selectedLogoDesign === '1' && (
                <div className="w-full h-full bg-[#1E293B] flex items-center justify-center">
                  <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
                    <rect width="100" height="100" rx="26" fill="#1E293B" />
                    <path d="M22 44 L50 21 L78 44" stroke="#F8FAFC" strokeWidth="10" strokeLinecap="round" />
                    <path d="M50 35 L50 78" stroke="#EAB308" strokeWidth="10" strokeLinecap="round" />
                  </svg>
                </div>
              )}
              {selectedLogoDesign === '2' && (
                <div className="w-full h-full bg-[#065F46] flex items-center justify-center">
                  <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
                    <rect width="100" height="100" rx="26" fill="#065F46" />
                    <circle cx="50" cy="50" r="16" stroke="#FFFFFF" strokeWidth="8" fill="none" />
                    <path d="M50 60 L50 82" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
                  </svg>
                </div>
              )}
              {selectedLogoDesign === '3' && (
                <div className="w-full h-full bg-[#0B0F19] flex items-center justify-center">
                  <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
                    <rect width="100" height="100" rx="26" fill="#0B0F19" />
                    <path d="M18 46 L50 20 L82 46" stroke="#06B6D4" strokeWidth="10" strokeLinecap="round" filter="url(#neonCyanGlow)" />
                  </svg>
                </div>
              )}
              {!['1', '2', '3', '4', '5', '6', 'custom'].includes(selectedLogoDesign || '') && (
                <div className="bg-gradient-to-tr from-indigo-600 to-violet-600 w-full h-full flex items-center justify-center text-white shadow-lg animate-pulse-glow">
                  <LucideIcon name="Building2" size={20} />
                </div>
              )}
            </button>
            <div className="text-start">
              <h1 className="text-xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">{t('app_title')}</h1>
              {isMusicPlaying && <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold block leading-none mt-0.5">{audioFeedback}</span>}
            </div>
          </div>
          
          {/* Audio controls for small screen if needed, else kept in settings */}
          {isMusicPlaying && (
            <div className="md:hidden flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
              <button onClick={toggleMusic} className="text-emerald-500"><LucideIcon name="Volume2" size={14} /></button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={synthVolume}
                onChange={handleVolumeChange}
                className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Action Controls for Desktop (volume, etc.) */}
        <div className="hidden md:flex items-center gap-2">
          {isMusicPlaying && (
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700">
              <button
                onClick={toggleMusic}
                className="p-2 rounded-lg bg-emerald-500 text-white"
                title={lang === 'he' ? 'מוזיקת לופיי מרגיעה' : 'Relaxing lo-fi chords'}
              >
                <div className="flex items-end gap-0.5 h-3">
                  <span className="w-0.5 bg-white audio-bar-anim-1"></span>
                  <span className="w-0.5 bg-white audio-bar-anim-2"></span>
                  <span className="w-0.5 bg-white audio-bar-anim-3"></span>
                </div>
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={synthVolume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Tab Selection Row (Solid Block Cube Active states as requested!) */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl overflow-x-auto hide-scrollbar w-full md:w-auto">
          {/* 1. Dashboard (Assets Dashboard) tab */}
          <button
            onClick={() => handleNavClick('dashboard')}
            className={`p-2.5 rounded-xl transition-all flex-shrink-0 relative flex items-center justify-center border ${
              activeTab === 'dashboard' 
                ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-950/50 border-indigo-700 dark:border-indigo-450 scale-105 font-black ring-4 ring-indigo-600/20 dark:ring-indigo-500/25' 
                : 'bg-transparent text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-250 border-transparent'
            }`}
            id="nav-tab-dashboard"
            title={t('dashboard')}
          >
            <LucideIcon name="Layout" size={activeTab === 'dashboard' ? 22 : 20} strokeWidth={activeTab === 'dashboard' ? 3 : 2} />
          </button>

          {/* 2. Tenants tab */}
          {!isOnlyTenant && (
            <button
              onClick={() => handleNavClick('tenants')}
              className={`p-2.5 rounded-xl transition-all flex-shrink-0 relative flex items-center justify-center border ${
                activeTab === 'tenants' 
                  ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-950/50 border-indigo-700 dark:border-indigo-450 scale-105 font-black ring-4 ring-indigo-600/20 dark:ring-indigo-500/25' 
                  : 'bg-transparent text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-250 border-transparent'
              }`}
              id="nav-tab-tenants"
              title={t('tenants')}
            >
              <LucideIcon name="Users" size={activeTab === 'tenants' ? 22 : 20} strokeWidth={activeTab === 'tenants' ? 3 : 2} />
            </button>
          )}

          {/* 3. Neighbors tab */}
          <button
            onClick={() => handleNavClick('neighbors')}
            className={`p-2.5 rounded-xl transition-all flex-shrink-0 relative flex items-center justify-center border ${
              activeTab === 'neighbors' 
                ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-950/50 border-indigo-700 dark:border-indigo-450 scale-105 font-black ring-4 ring-indigo-600/20 dark:ring-indigo-500/25' 
                : 'bg-transparent text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-250 border-transparent'
            }`}
            id="nav-tab-neighbors"
            title={t('neighbors')}
          >
            <LucideIcon name="Handshake" size={activeTab === 'neighbors' ? 22 : 20} strokeWidth={activeTab === 'neighbors' ? 3 : 2} />
          </button>

          {/* 4. Charts tab */}
          <button
            onClick={() => handleNavClick('charts')}
            className={`p-2.5 rounded-xl transition-all flex-shrink-0 relative flex items-center justify-center border ${
              activeTab === 'charts' 
                ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-950/50 border-indigo-700 dark:border-indigo-450 scale-105 font-black ring-4 ring-indigo-600/20 dark:ring-indigo-500/25' 
                : 'bg-transparent text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-250 border-transparent'
            }`}
            id="nav-tab-charts"
            title={t('charts_tab')}
          >
            <LucideIcon name="BarChart2" size={activeTab === 'charts' ? 22 : 20} strokeWidth={activeTab === 'charts' ? 3 : 2} />
          </button>

          {/* 5. Alerts tab with badge (companion to settings) */}
          <button
            onClick={() => handleNavClick('alerts')}
            className={`p-2.5 rounded-xl transition-all flex-shrink-0 relative flex items-center justify-center border ${
              activeTab === 'alerts' 
                ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-950/50 border-indigo-700 dark:border-indigo-450 scale-105 font-black ring-4 ring-indigo-600/20 dark:ring-indigo-500/25' 
                : 'bg-transparent text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-250 border-transparent'
            }`}
            id="nav-tab-alerts"
            title={t('alerts')}
          >
            <LucideIcon name="Bell" size={activeTab === 'alerts' ? 22 : 20} strokeWidth={activeTab === 'alerts' ? 3 : 2} />
            {activeAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {activeAlerts.length}
              </span>
            )}
          </button>

          {/* 6. Providers tab */}
          <button
            onClick={() => handleNavClick('providers')}
            className={`p-2.5 rounded-xl transition-all flex-shrink-0 relative flex items-center justify-center border ${
              activeTab === 'providers' 
                ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-950/50 border-indigo-700 dark:border-indigo-450 scale-105 font-black ring-4 ring-indigo-600/20 dark:ring-indigo-500/25' 
                : 'bg-transparent text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-250 border-transparent'
            }`}
            id="nav-tab-providers"
            title={t('providers')}
          >
            <LucideIcon name="Wrench" size={activeTab === 'providers' ? 22 : 20} strokeWidth={activeTab === 'providers' ? 3 : 2} />
          </button>

          {/* 7. Calendar tab */}
          <button
            onClick={() => handleNavClick('calendar')}
            className={`p-2.5 rounded-xl transition-all flex-shrink-0 relative flex items-center justify-center border ${
              activeTab === 'calendar' 
                ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-950/50 border-indigo-700 dark:border-indigo-450 scale-105 font-black ring-4 ring-indigo-600/20 dark:ring-indigo-500/25' 
                : 'bg-transparent text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-250 border-transparent'
            }`}
            id="nav-tab-calendar"
            title={t('calendar_tab')}
          >
            <LucideIcon name="CalendarDays" size={activeTab === 'calendar' ? 22 : 20} strokeWidth={activeTab === 'calendar' ? 3 : 2} />
          </button>

          {/* 8. Forecast tab */}
          <button
            onClick={() => handleNavClick('forecast')}
            className={`p-2.5 rounded-xl transition-all flex-shrink-0 relative flex items-center justify-center border ${
              activeTab === 'forecast' 
                ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-950/50 border-indigo-700 dark:border-indigo-450 scale-105 font-black ring-4 ring-indigo-600/20 dark:ring-indigo-500/25' 
                : 'bg-transparent text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-250 border-transparent'
            }`}
            id="nav-tab-forecast"
            title={t('annual_forecast')}
          >
            <LucideIcon name="TrendingUp" size={activeTab === 'forecast' ? 22 : 20} strokeWidth={activeTab === 'forecast' ? 3 : 2} />
          </button>

          {/* 9. CPI/Index tab */}
          <button
            onClick={() => handleNavClick('cpi')}
            className={`p-2.5 rounded-xl transition-all flex-shrink-0 relative flex items-center justify-center border ${
              activeTab === 'cpi' 
                ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-950/50 border-indigo-700 dark:border-indigo-450 scale-105 font-black ring-4 ring-indigo-600/20 dark:ring-indigo-500/25' 
                : 'bg-transparent text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-250 border-transparent'
            }`}
            id="nav-tab-cpi"
            title={lang === 'he' ? 'מדד והצמדה' : 'CPI & Linkage'}
          >
            <LucideIcon name="Scale" size={activeTab === 'cpi' ? 22 : 20} strokeWidth={activeTab === 'cpi' ? 3 : 2} />
          </button>

          {/* 10. Mortgages tab */}
          {!isOnlyTenant && (
            <button
              onClick={() => handleNavClick('mortgages')}
              className={`p-2.5 rounded-xl transition-all flex-shrink-0 relative flex items-center justify-center border ${
                activeTab === 'mortgages' 
                  ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-950/50 border-indigo-700 dark:border-indigo-450 scale-105 font-black ring-4 ring-indigo-600/20 dark:ring-indigo-500/25' 
                  : 'bg-transparent text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-250 border-transparent'
              }`}
              id="nav-tab-mortgages"
              title={t('mortgages')}
            >
              <LucideIcon name="Landmark" size={activeTab === 'mortgages' ? 22 : 20} strokeWidth={activeTab === 'mortgages' ? 3 : 2} />
            </button>
          )}

          {/* 11. Settings tab */}
          <button
            onClick={() => handleNavClick('properties')}
            className={`p-2.5 rounded-xl transition-all flex-shrink-0 relative flex items-center justify-center border ${
              activeTab === 'properties' 
                ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-950/50 border-indigo-700 dark:border-indigo-450 scale-105 font-black ring-4 ring-indigo-600/20 dark:ring-indigo-500/25' 
                : 'bg-transparent text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-250 border-transparent'
            }`}
            id="nav-tab-properties"
            title={lang === 'he' ? 'ניהול נכסים' : 'Manage Properties'}
          >
            <LucideIcon name="Building" size={activeTab === 'properties' ? 22 : 20} strokeWidth={activeTab === 'properties' ? 3 : 2} />
          </button>

          {/* 12. Settings tab */}
          <button
            onClick={() => handleNavClick('settings')}
            className={`p-2.5 rounded-xl transition-all flex-shrink-0 relative flex items-center justify-center border ${
              activeTab === 'settings' 
                ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-950/50 border-indigo-700 dark:border-indigo-450 scale-105 font-black ring-4 ring-indigo-600/20 dark:ring-indigo-500/25' 
                : 'bg-transparent text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-250 border-transparent'
            }`}
            id="nav-tab-settings"
            title={t('settings')}
          >
            <LucideIcon name="Settings" size={activeTab === 'settings' ? 22 : 20} strokeWidth={activeTab === 'settings' ? 3 : 2} />
          </button>

          {/* 12. Dark Mode toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 rounded-xl transition-all flex-shrink-0 text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-white flex items-center justify-center"
            title={isDarkMode ? 'תצוגת יום' : 'תצוגת לילה'}
          >
            <LucideIcon name={isDarkMode ? 'Sun' : 'Moon'} size={20} />
          </button>

          {/* 13. Language toggle */}
          <button
            onClick={() => setLang(lang === 'he' ? 'en' : 'he')}
            className="p-2.5 rounded-xl transition-all flex-shrink-0 text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-white flex items-center justify-center text-lg leading-none"
            title={lang === 'he' ? 'English' : 'עברית'}
          >
            {lang === 'he' ? '🇺🇸' : '🇮🇱'}
          </button>

          {/* 14. Font size scaling toggle */}
          <button
            onClick={() => {
              setFontSize(prev => prev === 'normal' ? 'large' : prev === 'large' ? 'xlarge' : 'normal');
            }}
            className="p-2.5 rounded-xl transition-all flex-shrink-0 text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-white flex flex-col items-center justify-center"
            title={lang === 'he' ? 'גודל טקסט' : 'Text Size'}
          >
            <div className="flex items-baseline gap-[2px] font-extrabold leading-none">
              <span className="text-[10px]">A</span>
              <span className="text-[12px]">A</span>
              <span className="text-[15px]">A</span>
            </div>
          </button>
        </div>
      </nav>

      {/* Main Core Container */}
      <main className="max-w-2xl mx-auto p-5 space-y-6">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600"></div>
          </div>
        ) : selectedAptObject ? (
          <ApartmentDetailView
            apt={selectedAptObject}
            payments={payments.filter(p => p.aptId === selectedAptId)}
            repairs={repairs.filter(r => r.aptId === selectedAptId)}
            providers={providers}
            mortgages={mortgages.filter(m => m.aptId === selectedAptId)}
            expenses={expenses.filter(e => e.aptId === selectedAptId)}
            inventory={inventory.filter(i => i.aptId === selectedAptId)}
            cpiHistory={cpiHistory}
            onSavePayment={(d, id) => saveDocument('payments', { ...d, aptId: selectedAptId }, id)}
            onDeletePayment={(id) => deleteDocument('payments', id)}
            onSaveRepair={(d, id) => saveDocument('repairs', { ...d, aptId: selectedAptId }, id)}
            onDeleteRepair={(id) => deleteDocument('repairs', id)}
            onSaveExpense={(d, id) => saveDocument('expenses', { ...d, aptId: selectedAptId }, id)}
            onDeleteExpense={(id) => deleteDocument('expenses', id)}
            onSaveMortgage={(d, id) => saveDocument('mortgages', d, id)}
            onSaveInventory={(d, id) => saveDocument('inventory', { ...d, aptId: selectedAptId }, id)}
            onDeleteInventory={(id) => deleteDocument('inventory', id)}
            documents={documents.filter(d => d.aptId === selectedAptId)}
            onSaveDocument={(d, id) => saveDocument('documents', { ...d, aptId: selectedAptId }, id)}
            onDeleteDocument={async (id, storagePath) => {
              if (storagePath && storagePath !== 'database_fallback_base64') {
                try {
                  await firebase.storage().ref().child(storagePath).delete();
                } catch (e) {
                  console.warn("Storage deletion failed or file already deleted:", e);
                }
              }
              await deleteDocument('documents', id);
            }}
            onBack={() => setSelectedAptId(null)}
            t={t}
            onEditRentSegments={(apt) => {
              setEditingRentSegmentsApt(apt);
              setIsRentSegmentsModalOpen(true);
            }}
            lang={lang}
            appId={appId}
            globalCurrency={globalCurrency}
            usdToIlsRate={usdToIlsRate}
            eurToIlsRate={eurToIlsRate}
            cpiType={cpiType}
          />
        ) : (
          <div className="text-start">
            {activeTab === 'dashboard' && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="flex justify-between items-center px-2">
                  <div className="text-start">
                    <h2 className="text-2xl font-black">{t('my_properties')}</h2>
                    <span className="text-xs font-bold text-slate-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-full shadow-sm mt-1 inline-block">{apartments.length} {t('properties_count')}</span>
                  </div>
                  <button 
                    onClick={handleAddApartmentClick}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-indigo-100 dark:shadow-none hover:scale-105 transition-all"
                  >
                    <LucideIcon name="Plus" size={16} />
                    <span>{t('add_prop')}</span>
                  </button>
                </div>

                {!isOnlyTenant && apartments.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="font-black text-slate-800 dark:text-white mb-4">{t('global_summary')}</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-3xl border border-emerald-100 dark:border-emerald-900/40 overflow-hidden flex flex-col justify-center min-h-[85px]">
                        <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase mb-1 truncate" title={t('operating_income')}>{t('operating_income')}</div>
                        <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 truncate" title={`${globalCurrencySymbol}${globalNOI.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}>{globalCurrencySymbol}{globalNOI.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-3xl border border-blue-100 dark:border-blue-900/40 overflow-hidden flex flex-col justify-center min-h-[85px]">
                        <div className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase mb-1 truncate" title={t('cash_flow')}>{t('cash_flow')}</div>
                        <div className="text-xl font-black text-blue-700 dark:text-blue-400 truncate" title={`${globalCurrencySymbol}${globalCashFlow.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}>{globalCurrencySymbol}{globalCashFlow.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Empty list screen */}
                {apartments.length === 0 ? (
                  <div className="bg-white dark:bg-slate-800 p-12 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-700 text-center space-y-4">
                    <div className="bg-indigo-50 dark:bg-indigo-950/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-indigo-300 mb-4">
                      <LucideIcon name="Home" size={40} />
                    </div>
                    <div className="text-slate-400 font-medium">{t('no_properties')}</div>
                    <button onClick={() => setActiveTab('settings')} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:scale-105 transition-transform">{t('add_first_prop')}</button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {sortedApartments.map(a => (
                      <div
                        key={a.id}
                        onClick={() => setSelectedAptId(a.id)}
                        className={`clickable-card w-full p-5 rounded-[2rem] shadow-sm flex items-center justify-between border hover:shadow-md transition-all duration-300 group ${
                          a.status === 'tenant' ? 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-100/50 dark:border-rose-900/20' :
                          Number(a.targetRent) > 0 ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100/50 dark:border-emerald-900/20' :
                          'bg-blue-50/60 dark:bg-blue-950/10 border-blue-100/50 dark:border-blue-900/20'
                        }`}
                      >
                        <div className="flex items-center gap-5 pointer-events-none">
                          <div className={`p-4 rounded-2xl transition-colors shadow-sm ${
                            a.status === 'tenant' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300' :
                            Number(a.targetRent) > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' :
                            'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                          }`}>
                            <LucideIcon name={a.icon || 'Home'} size={26} />
                          </div>
                          <div className="text-start">
                            <div className="font-black text-lg text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                              {a.name}
                              {a.status === 'tenant' && <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[10px] px-2 py-0.5 rounded-full">{t('tenant')}</span>}
                              {mortgages.some(m => m.aptId === a.id) && (
                                <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <LucideIcon name="Landmark" size={10} />
                                  <span>{lang === 'he' ? 'משכנתא' : 'Mortgage'}</span>
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-300">{a.address}</div>
                            <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                              {globalCurrencySymbol || getSymbolForCurrency(a.currency || '₪')}{Math.round(convertAmount(Number(a.targetRent), a.currency || '₪', globalCurrency)).toLocaleString()} / {lang === 'he' ? 'חודש' : 'month'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Quick Action Button & Dropdown */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenQuickMenuId(openQuickMenuId === a.id ? null : a.id);
                              }}
                              className="p-3 bg-indigo-50 dark:bg-indigo-950/40 hover:scale-110 text-indigo-600 dark:text-indigo-400 rounded-2xl active:scale-95 transition-all shadow-sm"
                              title={lang === 'he' ? 'פעולות מהירות' : 'Quick Actions'}
                            >
                              <LucideIcon name="Plus" size={16} />
                            </button>
                            
                            {openQuickMenuId === a.id && (
                              <div 
                                onClick={(e) => e.stopPropagation()}
                                className={`absolute ${lang === 'he' ? 'left-0' : 'right-0'} top-12 mt-1 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-150 dark:border-slate-700 p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 text-start`}
                              >
                                {a.status === 'tenant' ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenQuickMenuId(null);
                                      setIsQuickRentExpense(true);
                                      setQuickExpenseApt(a);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-black rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                                  >
                                    <LucideIcon name="ArrowUpRight" size={14} />
                                    <span>{lang === 'he' ? 'רשום הוצאת שכירות' : 'Log Rent Expense'}</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenQuickMenuId(null);
                                      setQuickPaymentApt(a);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-black rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all"
                                  >
                                    <LucideIcon name="ArrowDownLeft" size={14} />
                                    <span>{lang === 'he' ? 'רשום תשלום שכירות' : 'Log Rent Payment'}</span>
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenQuickMenuId(null);
                                    setIsQuickRentExpense(false);
                                    setQuickExpenseApt(a);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-black rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all"
                                >
                                  <LucideIcon name="Coins" size={14} />
                                  <span>{lang === 'he' ? 'רשום הוצאה חדשה' : 'Log New Expense'}</span>
                                </button>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingRentSegmentsApt(a);
                              setIsRentSegmentsModalOpen(true);
                            }}
                            className="p-3 bg-amber-50 dark:bg-amber-950/40 hover:scale-110 text-amber-600 dark:text-amber-400 rounded-2xl active:scale-95 transition-all shadow-sm"
                            title={lang === 'he' ? 'אירועי שכירות' : 'Rent Events'}
                          >
                            <LucideIcon name="Zap" size={16} />
                          </button>
                          <LucideIcon name="ChevronLeft" size={20} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tenants' && (
              <TenantsList
                apartments={sortedApartments}
                tenants={tenants}
                tenantHistory={tenantHistory}
                onSave={(d, id) => saveDocument('tenants', d, id)}
                onDelete={id => deleteDocument('tenants', id)}
                onArchive={async (t, date) => {
                  if (!t.id) return;
                  const { id, ...tenantData } = t;
                  await saveDocument('tenant_history', { ...tenantData, exitDate: date });
                  await deleteDocument('tenants', t.id);
                }}
                onRestore={async (h) => {
                  if (!h.id) return;
                  const { id, exitDate, ...tenantData } = h;
                  await saveDocument('tenants', tenantData);
                  await deleteDocument('tenant_history', h.id);
                }}
                onSaveHistory={(d, id) => saveDocument('tenant_history', d, id)}
                onDeleteHistory={id => deleteDocument('tenant_history', id)}
                t={t}
              />
            )}

            {activeTab === 'neighbors' && (
              <NeighborsList apartments={sortedApartments} neighbors={neighbors} onSave={(d, id) => saveDocument('neighbors', d, id)} onDelete={id => deleteDocument('neighbors', id)} t={t} />
            )}

            {activeTab === 'mortgages' && (
              <MortgagesList apartments={sortedApartments} mortgages={mortgages} onSave={(d, id) => saveDocument('mortgages', d, id)} onDelete={id => deleteDocument('mortgages', id)} t={t} />
            )}

            {activeTab === 'providers' && (
              <ProvidersList providers={providers} apartments={sortedApartments} onSave={(d, id) => saveDocument('providers', d, id)} onDelete={id => deleteDocument('providers', id)} onLogWork={d => saveDocument('repairs', d)} t={t} />
            )}

            {activeTab === 'alerts' && (
              <AlertsView alerts={activeAlerts} onDismiss={dismissAlert} t={t} />
            )}

            {activeTab === 'calendar' && (
              <CalendarView apartments={sortedApartments} payments={payments} expenses={expenses} repairs={repairs} t={t} lang={lang} />
            )}

            {activeTab === 'forecast' && (
              <ForecastView apartments={sortedApartments} recurringBudgets={recurringBudgets} onSave={(d, id) => saveDocument('recurring_budgets', d, id)} onDelete={id => deleteDocument('recurring_budgets', id)} t={t} lang={lang} />
            )}

            {activeTab === 'cpi' && (
              <CpiView
                cpiHistory={cpiHistory}
                onSaveCpi={async (data, id) => {
                  await saveDocument('cpi_history', { ...data, indexType: cpiType, appId }, id);
                }}
                onDeleteCpi={async (id) => {
                  await deleteDocument('cpi_history', id);
                }}
                apartments={apartments}
                t={t}
                lang={lang}
                cpiType={cpiType}
                onCpiTypeChange={(newType) => {
                  setCpiType(newType);
                  localStorage.setItem('prop_app_cpi_type', newType);
                }}
              />
            )}

            {activeTab === 'charts' && (
              <ChartsView apartments={sortedApartments} payments={payments} expenses={expenses} repairs={repairs} t={t} lang={lang} />
            )}

            {/* Custom Properties screen */}
            {activeTab === 'properties' && (
              <div className="space-y-6 animate-in fade-in duration-300 text-start">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700/60 shadow-sm">
                  <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                      <span className="text-indigo-600 dark:text-indigo-400">🏢</span>
                      {lang === 'he' ? 'ניהול רשימת נכסים' : 'Manage Property List'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                      {lang === 'he' 
                        ? 'הוסף נכסים חדשים לרשימה, ערוך את פרטי הנכס, או קבע את המטבע ורכיבי השכירות.' 
                        : 'Add new properties to the list, edit property details, or manage primary currencies and rent components.'}
                    </p>
                  </div>
                  
                  {/* הוסף נכס */}
                  <button 
                    onClick={handleAddApartmentClick} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 px-6 rounded-2xl font-black active:scale-95 transition-all shadow-md shadow-indigo-100 dark:shadow-none text-xs flex items-center gap-2 self-start sm:self-auto shrink-0"
                  >
                    <LucideIcon name={isPremium || apartments.length < 2 ? 'Plus' : 'Lock'} size={18} />
                    <span>{t('add_prop')}</span>
                    {!isPremium && (
                      <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full">{apartments.length}/2</span>
                    )}
                  </button>
                </div>

                {/* רשימת הנכסים */}
                <div className="space-y-3">
                  {sortedApartments.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 p-12 rounded-[2rem] border border-slate-150 dark:border-slate-750 text-center space-y-4">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-750 rounded-full flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
                        <LucideIcon name="Building" size={32} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-black text-slate-800 dark:text-white">{lang === 'he' ? 'אין נכסים להצגה' : 'No properties found'}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {lang === 'he' ? 'לחץ על כפתור "הוסף נכס" כדי להתחיל בניהול הנכסים שלך.' : 'Click "Add Property" to start managing your assets.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    sortedApartments.map(a => (
                      <div key={a.id} className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center shadow-sm border border-slate-100 dark:border-slate-700/60 hover:shadow-md transition-all">
                        <div className="flex gap-2 justify-start items-center">
                          {/* כפתור מחיקה */}
                          <button 
                            onClick={() => confirm(t('confirm_delete')) && deleteDocument('apartments', a.id)} 
                            className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors flex items-center justify-center shrink-0"
                            title={lang === 'he' ? 'מחק' : 'Delete'}
                          >
                            <LucideIcon name="Trash2" size={18} />
                          </button>
                          
                          {/* כפתור עריכה */}
                          <button 
                            onClick={() => handleEditApartmentClick(a)} 
                            className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors flex items-center justify-center shrink-0"
                            title={lang === 'he' ? 'ערוך' : 'Edit'}
                          >
                            <LucideIcon name="Pencil" size={18} />
                          </button>

                          {/* כפתור אירועי שכירות */}
                          <button 
                            onClick={() => {
                              setEditingRentSegmentsApt(a);
                              setIsRentSegmentsModalOpen(true);
                            }} 
                            className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors flex items-center justify-center shrink-0" 
                            title={lang === 'he' ? 'אירועי שכירות' : 'Rent events'}
                          >
                            <LucideIcon name="TrendingUp" size={18} />
                          </button>
                        </div>

                        <div className="flex items-center gap-4 text-start justify-between sm:justify-end flex-1">
                          <div className="text-start sm:text-end shrink-0 order-2 sm:order-1">
                            <div className="font-black text-base sm:text-lg text-slate-800 dark:text-white flex items-center gap-2 sm:justify-end">
                              {a.name}
                              {a.status === 'tenant' && <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[10px] px-2 py-0.5 rounded-full">{t('tenant')}</span>}
                            </div>
                            <div className="text-xs sm:text-sm text-slate-400 dark:text-slate-350">{a.address}</div>
                            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5 sm:justify-end">
                              <span>{getSymbolForCurrency(a.currency || '₪')}{(Number(a.targetRent) || 0).toLocaleString()}</span>
                              {a.rentSegments && a.rentSegments.length > 1 && (
                                <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full text-[10px]">
                                  {a.rentSegments.length} {lang === 'he' ? 'תקופות' : 'periods'}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-750 text-indigo-600 dark:text-indigo-400 p-4 rounded-2xl order-1 sm:order-2 shadow-inner">
                            <LucideIcon name={a.icon || 'Home'} size={24} />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Custom Settings screen */}
            {activeTab === 'settings' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* 1. סנכרון מכשירים */}
                <button 
                  onClick={() => {
                    setSyncCodeInput(appId);
                    setIsSyncModalOpen(true);
                  }} 
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-4 rounded-2xl font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                >
                  <LucideIcon name="Link" size={20} className="text-indigo-700 dark:text-indigo-400" /> 
                  <span>{t('sync_devices')}</span>
                </button>

                {/* 2. פניה למפתח */}
                <button 
                  onClick={() => setIsContactModalOpen(true)} 
                  className="w-full bg-white dark:bg-slate-800 border border-indigo-150 dark:border-indigo-950/40 text-indigo-700 dark:text-indigo-400 py-4 rounded-2xl font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                >
                  <LucideIcon name="Mail" size={20} className="text-indigo-700 dark:text-indigo-400" /> 
                  <span>{lang === 'he' ? 'פניה למפתח' : 'Contact Developer'}</span>
                </button>


                {/* 2.5 שנה סמליל אפליקציה */}
                <button 
                  onClick={() => setIsLogoModalOpen(true)} 
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-4 rounded-2xl font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                >
                  <LucideIcon name="Palette" size={20} className="text-indigo-700 dark:text-indigo-400" /> 
                  <span>{lang === 'he' ? 'שנה סמליל אפליקציה' : 'Change App Logo'}</span>
                </button>

                {/* 3. עזרה והנחיות */}
                <button 
                  onClick={() => setIsHelpModalOpen(true)} 
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-4 rounded-2xl font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                >
                  <LucideIcon name="HelpCircle" size={20} className="text-indigo-700 dark:text-indigo-400" /> 
                  <span>{t('help_credits')}</span>
                </button>

                {/* 4. דוחות ויצוא (רוחב מלא ונקי) */}
                <button 
                  onClick={() => setIsExportModalOpen(true)} 
                  className="w-full bg-white dark:bg-slate-800 border border-emerald-150 dark:border-emerald-950/45 text-emerald-700 dark:text-emerald-400 py-4 rounded-2xl font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/15 transition-colors"
                >
                  <LucideIcon name="FileSpreadsheet" size={20} className="text-emerald-700 dark:text-emerald-450" /> 
                  <span>{t('reports_export')}</span>
                </button>

                {/* 5. עדכון שערי חליפין (כפתור POPUP) */}
                <button 
                  onClick={() => setIsRatesModalOpen(true)} 
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-4 rounded-2xl font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                >
                  <LucideIcon name="Globe" size={20} className="text-indigo-700 dark:text-indigo-400" /> 
                  <span>{lang === 'he' ? 'עדכון שערי חליפין (בנק ישראל)' : 'Update Exchange Rates (Live)'}</span>
                </button>

                {/* Global Currency Switcher */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm space-y-4 text-start">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 p-2 rounded-xl font-bold">
                      <LucideIcon name="Coins" size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-slate-800 dark:text-white leading-tight">
                        {lang === 'he' ? 'מטבע תצוגה גלובלי' : 'Global Display Currency'}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                        {lang === 'he' 
                          ? 'ממיר אוטומטית את כל ערכי השכירות והכספים באפליקציה' 
                          : 'Automatically converts all rent and financial values in the app'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-2 pt-1">
                    {[
                      { code: 'ILS', label: '₪' },
                      { code: 'USD', label: '$' },
                      { code: 'EUR', label: '€' },
                      { code: 'GBP', label: '£' },
                      { code: 'THB', label: '฿' }
                    ].map(curOpt => {
                      const isActive = globalCurrency === curOpt.code;
                      return (
                        <button
                          key={curOpt.code}
                          onClick={() => {
                            setGlobalCurrency(curOpt.code);
                            localStorage.setItem('prop_app_global_currency', curOpt.code);
                            triggerCurrencyNotice(
                              lang === 'he' 
                                ? 'שים לב: עדכון מטבע התצוגה הגלובלי משפיע רק ברמת הסיכומים באפליקציה. שינוי המטבע הראשי של נכס מתבצע בעריכת הנכס.' 
                                : 'Notice: Changing the global display currency only affects summaries. To change a property\'s primary currency, edit the property itself.'
                            );
                          }}
                          className={`py-3 px-1 rounded-2xl font-black text-sm transition-all duration-200 active:scale-95 shadow-sm border ${
                            isActive 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100 dark:shadow-none' 
                              : 'bg-slate-50 dark:bg-slate-750 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {curOpt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Global Text Size Adjustment */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm space-y-4 text-start">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 p-2 rounded-xl font-bold">
                      <LucideIcon name="Type" size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-slate-800 dark:text-white leading-tight">
                        {lang === 'he' ? 'גודל הגופן באפליקציה' : 'App Font Size'}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                        {lang === 'he' 
                          ? 'התאם את גודל הכיתוב לנוחות קריאה מרבית בכל מסכי האפליקציה' 
                          : 'Adjust the text size for maximum readability across all app screens'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {[
                      { value: 'normal', label: lang === 'he' ? 'רגיל' : 'Normal', size: 'A' },
                      { value: 'large', label: lang === 'he' ? 'גדול' : 'Large', size: 'A+' },
                      { value: 'xlarge', label: lang === 'he' ? 'גדול מאוד' : 'Extra Large', size: 'A++' }
                    ].map(fontOpt => {
                      const isActive = fontSize === fontOpt.value;
                      return (
                        <button
                          key={fontOpt.value}
                          onClick={() => setFontSize(fontOpt.value as 'normal' | 'large' | 'xlarge')}
                          className={`py-3 px-1 rounded-2xl font-black text-xs transition-all duration-200 active:scale-95 shadow-sm border flex flex-col items-center justify-center gap-1 ${
                            isActive 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100 dark:shadow-none' 
                              : 'bg-slate-50 dark:bg-slate-750 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <span className="text-sm font-extrabold">{fontOpt.size}</span>
                          <span className="text-[10px] opacity-90">{fontOpt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Apartment Creation & Edit Modal Overlay */}
      {isAptModalOpen && (() => {
        const apartmentFields = [
          { key: 'name', label: t('prop_nickname'), placeholder: lang === 'he' ? 'לדוגמה: הדירה ברוטשילד' : 'e.g. Rothschild Apt' },
          { key: 'address', label: t('address'), placeholder: lang === 'he' ? 'רחוב, עיר, מספר דירה' : 'Street, City, Apt No.' },
          { 
            key: 'icon', 
            label: t('prop_icon'), 
            type: 'select', 
            options: [
              { id: 'Home', name: lang === 'he' ? 'בית' : 'Home' },
              { id: 'Building', name: lang === 'he' ? 'בניין' : 'Building' },
              { id: 'Building2', name: lang === 'he' ? 'מגדל' : 'Tower' },
              { id: 'Store', name: lang === 'he' ? 'חנות / משרד' : 'Store / Office' },
              { id: 'Warehouse', name: lang === 'he' ? 'מחסן' : 'Warehouse' },
            ],
            placeholder: t('select')
          },
          { 
            key: 'currency', 
            label: t('currency'), 
            type: 'select', 
            options: [
              { id: '₪', name: t('currency_ils') },
              { id: '$', name: t('currency_usd') },
              { id: '€', name: t('currency_eur') },
              { id: '£', name: t('currency_gbp') },
              { id: '฿', name: t('currency_thb') },
            ],
            placeholder: t('select')
          },
          { key: 'targetRent', label: t('rent_target'), type: 'number', placeholder: '0' },
          { key: 'size', label: t('size_sqm'), type: 'number', placeholder: '0' },
          { key: 'pricePerSqm', label: t('market_price_sqm'), type: 'number', placeholder: '0' },
          { key: 'taxPercent', label: t('tax_percent'), type: 'number', placeholder: '0' },
          { key: 'taxableRent', label: t('taxable_rent'), type: 'number', placeholder: '0' },
          { key: 'contractEnd', label: t('contract_end'), type: 'date' },
          { 
            key: 'status', 
            label: t('my_status'), 
            type: 'select', 
            options: [
              { id: 'landlord', name: t('landlord') },
              { id: 'tenant', name: t('tenant') },
            ],
            placeholder: t('select')
          },
          { 
            key: 'isCpiLinked', 
            label: lang === 'he' ? 'צמוד למדד המחירים?' : 'Linked to CPI?', 
            type: 'select', 
            options: [
              { id: 'false', name: lang === 'he' ? 'לא' : 'No' },
              { id: 'true', name: lang === 'he' ? 'כן' : 'Yes' },
            ],
            placeholder: t('select')
          },
          { key: 'baseRentAmount', label: lang === 'he' ? 'סכום בסיס / קרן (₪)' : 'Base rent (principal) (₪)', type: 'number', placeholder: '0' },
          { 
            key: 'baseCpiMonth', 
            label: lang === 'he' ? 'חודש מדד בסיס' : 'Base CPI Month', 
            type: 'select', 
            options: [
              { id: '1', name: lang === 'he' ? 'ינואר' : 'January' },
              { id: '2', name: lang === 'he' ? 'פברואר' : 'February' },
              { id: '3', name: lang === 'he' ? 'מרץ' : 'March' },
              { id: '4', name: lang === 'he' ? 'אפריל' : 'April' },
              { id: '5', name: lang === 'he' ? 'מאי' : 'May' },
              { id: '6', name: lang === 'he' ? 'יוני' : 'June' },
              { id: '7', name: lang === 'he' ? 'יולי' : 'July' },
              { id: '8', name: lang === 'he' ? 'אוגוסט' : 'August' },
              { id: '9', name: lang === 'he' ? 'ספטמבר' : 'September' },
              { id: '10', name: lang === 'he' ? 'אוקטובר' : 'October' },
              { id: '11', name: lang === 'he' ? 'נובמבר' : 'November' },
              { id: '12', name: lang === 'he' ? 'דצמבר' : 'December' },
            ],
            placeholder: t('select')
          },
          { 
            key: 'baseCpiYear', 
            label: lang === 'he' ? 'שנת מדד בסיס' : 'Base CPI Year', 
            type: 'select', 
            options: [
              { id: '2024', name: '2024' },
              { id: '2025', name: '2025' },
              { id: '2026', name: '2026' },
            ],
            placeholder: t('select')
          },
          { key: 'displayOrder', label: t('display_order'), type: 'number', placeholder: '1' },
        ];

        return (
          <ModalForm 
            title={editingApt ? (lang === 'he' ? 'ערוך נכס' : 'Edit Property') : (lang === 'he' ? 'הוסף נכס חדש' : 'Add New Property')}
            fields={apartmentFields}
            initialData={editingApt || undefined}
            onSave={handleSaveApartment}
            onCancel={() => {
              setIsAptModalOpen(false);
              setEditingApt(null);
            }}
            t={t}
          />
        );
      })()}

      {/* Premium Activation Warning Prompt Modal Overlay */}
      {showPremiumPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 modal-overlay bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 relative text-start">
            {/* Close button at top-left/top-right */}
            <div className="flex justify-start mb-2">
              <button 
                onClick={() => setShowPremiumPrompt(false)} 
                className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <LucideIcon name="X" size={18} />
              </button>
            </div>

            {/* Title with Crown */}
            <h3 className="font-black text-2xl text-center text-amber-600 dark:text-amber-400 mb-3 flex items-center justify-center gap-2">
              <LucideIcon name="Crown" size={24} className="text-amber-500" />
              <span>{lang === 'he' ? 'שדרוג לגרסת פרימיום' : 'Upgrade to Premium'}</span>
            </h3>

            {/* Body Text */}
            <p className="text-slate-600 dark:text-slate-350 text-center text-sm mb-6 leading-relaxed">
              {lang === 'he' 
                ? 'הגרסה החינמית מאפשרת ניהול של עד 2 נכסים בלבד. לניהול נכסים נוספים וקבלת גישה ללא הגבלה, אנא פנה למפתח המערכת להסדרת תשלום וקבלת קישור ייעודי.' 
                : 'The free version allows managing up to 2 properties only. To manage more properties and get unlimited access, please contact the developer to arrange payment and receive a dedicated link.'}
            </p>

            {/* Action Buttons */}
            <div className="space-y-3 mb-6">
              <a 
                href={`https://wa.me/972532504253?text=${encodeURIComponent(lang === 'he' ? 'שלום! ברצוני לשדרג את EasyRent לגרסת פרימיום' : 'Hello, I want to upgrade EasyRent to premium')}`}
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center gap-2 w-full bg-emerald-500 text-white py-3.5 rounded-2xl font-bold hover:bg-emerald-600 transition-colors text-sm shadow-sm"
              >
                <LucideIcon name="MessageCircle" size={20} />
                <span>{lang === 'he' ? 'שליחת הודעה ב-WhatsApp' : 'Send WhatsApp message'}</span>
              </a>
              <a 
                href={`mailto:gavishdr@gmail.com?subject=${encodeURIComponent('EasyRent Premium Request')}`}
                className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white py-3.5 rounded-2xl font-bold hover:bg-indigo-700 transition-colors text-sm shadow-sm"
              >
                <LucideIcon name="Mail" size={20} />
                <span>{lang === 'he' ? 'שליחת מייל למפתח' : 'Email the developer'}</span>
              </a>
            </div>

            {/* License Activation Section */}
            <div className="bg-slate-50 dark:bg-slate-750 p-5 rounded-3xl border border-slate-100 dark:border-slate-700/50 space-y-3">
              <div className="text-slate-500 dark:text-slate-400 font-bold text-xs text-center">
                {lang === 'he' ? 'הזנת קוד רישיון' : 'Enter license code'}
              </div>
              <input 
                type="password" 
                placeholder={lang === 'he' ? 'קוד / סיסמה' : 'Code / Password'}
                value={premiumCodeInput}
                onChange={e => {
                  setPremiumCodeInput(e.target.value);
                  setPremiumPromptError('');
                }}
                className="w-full p-4 bg-white dark:bg-slate-800 rounded-2xl font-bold text-center outline-none border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-base shadow-sm"
              />
              {premiumPromptError && (
                <div className="text-rose-500 text-xs font-black bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-xl text-center">
                  {premiumPromptError}
                </div>
              )}
              <button 
                onClick={handleActivatePremiumPrompt}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3.5 rounded-2xl font-black text-center shadow-md active:scale-95 transition-all text-sm"
              >
                {lang === 'he' ? 'הפעלת רישיון' : 'Activate License'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP: Quick Action Backdrop */}
      {openQuickMenuId && (
        <div 
          className="fixed inset-0 z-40 bg-transparent cursor-default" 
          onClick={(e) => {
            e.stopPropagation();
            setOpenQuickMenuId(null);
          }}
        />
      )}

      {/* POPUP: Quick Rent Payment Modal */}
      {quickPaymentApt && (
        <ModalForm
          title={`${lang === 'he' ? 'רישום תשלום מהיר' : 'Quick Rent Payment'} - ${quickPaymentApt.name}`}
          fields={[
            { key: 'amount', label: t('amount'), type: 'number' },
            { key: 'date', label: t('date'), type: 'date' },
            { key: 'notes', label: t('notes'), type: 'textarea', placeholder: '...' }
          ]}
          initialData={{
            amount: quickPaymentApt.targetRent || '',
            date: new Date().toISOString().split('T')[0],
            notes: lang === 'he' ? 'תשלום שכר דירה מהיר' : 'Quick rent payment'
          }}
          onSave={async (data) => {
            const payload = {
              ...data,
              aptId: quickPaymentApt.id,
              amount: Number(data.amount) || 0
            };
            await saveDocument('payments', payload);
            setQuickPaymentApt(null);
          }}
          onCancel={() => setQuickPaymentApt(null)}
          t={t}
        />
      )}

      {/* POPUP: Quick Repair Modal */}
      {quickRepairApt && (() => {
        const SERVICE_TYPES_KEYS = ['electrician', 'plumber', 'solar', 'ac_label', 'renovation', 'paint', 'pest', 'other'];
        const PAYMENT_METHODS_KEYS = ['pm_credit_card', 'pm_bank_transfer', 'pm_cash', 'pm_check', 'pm_app', 'pm_other'];
        return (
          <ModalForm
            title={`${lang === 'he' ? 'רישום תיקון מהיר' : 'Quick Repair'} - ${quickRepairApt.name}`}
            fields={[
              { key: 'type', label: t('type'), type: 'select', options: SERVICE_TYPES_KEYS.map(k => ({ id: t(k), name: t(k) })) },
              { key: 'providerName', label: t('provider'), type: 'select', options: providers.map(p => ({ id: p.name, name: p.name })) },
              { key: 'date', label: t('date'), type: 'date' },
              { key: 'cost', label: t('cost'), type: 'number' },
              { key: 'actualPaymentDate', label: t('actual_payment_date'), type: 'date' },
              { key: 'paymentMethod', label: t('payment_method'), type: 'select', options: PAYMENT_METHODS_KEYS.map(k => ({ id: t(k), name: t(k) })) },
              { key: 'notes', label: t('description'), type: 'textarea' }
            ]}
            initialData={{
              date: new Date().toISOString().split('T')[0],
              actualPaymentDate: new Date().toISOString().split('T')[0],
              type: t('other'),
              paymentMethod: t('pm_bank_transfer')
            }}
            onSave={async (data) => {
              const payload = {
                ...data,
                aptId: quickRepairApt.id,
                cost: Number(data.cost) || 0
              };
              await saveDocument('repairs', payload);
              setQuickRepairApt(null);
            }}
            onCancel={() => setQuickRepairApt(null)}
            t={t}
          />
        );
      })()}

      {/* POPUP: Quick Expense Modal */}
      {quickExpenseApt && (() => {
        const EXPENSE_TYPES_KEYS = [
          'arnona', 'electricity', 'water', 'gas', 'hoa', 'mortgage_payment',
          'rent_expense', 'internet', 'insurance', 'cleaning', 'management_fee',
          'gardening', 'professional_services', 'taxes_fees', 'supplies', 'other_regular'
        ];
        const PAYMENT_METHODS_KEYS = ['pm_credit_card', 'pm_bank_transfer', 'pm_cash', 'pm_check', 'pm_app', 'pm_other'];
        
        return (
          <ModalForm
            title={isQuickRentExpense 
              ? `${lang === 'he' ? 'רישום מהיר של הוצאת שכירות' : 'Quick Rent Expense Log'} - ${quickExpenseApt.name}`
              : `${lang === 'he' ? 'רישום הוצאה מהירה' : 'Quick Expense Log'} - ${quickExpenseApt.name}`
            }
            fields={[
              { key: 'type', label: t('expense_type') || t('type'), type: 'select', options: EXPENSE_TYPES_KEYS.map(k => ({ id: t(k), name: t(k) })) },
              { key: 'amount', label: t('amount'), type: 'number' },
              { key: 'actualPaymentDate', label: t('actual_payment_date'), type: 'date' },
              { key: 'paymentMethod', label: t('payment_method'), type: 'select', options: PAYMENT_METHODS_KEYS.map(k => ({ id: t(k), name: t(k) })) },
              { 
                key: 'isPaid', 
                label: t('is_paid'), 
                type: 'select', 
                options: [
                  { id: 'true', name: t('yes') },
                  { id: 'false', name: t('no') }
                ] 
              },
              { key: 'notes', label: t('notes'), type: 'textarea' }
            ]}
            initialData={{
              type: isQuickRentExpense ? (t('rent_expense') || 'שכר דירה') : (t('other_regular') || 'אחר (שוטף)'),
              amount: isQuickRentExpense ? (quickExpenseApt.targetRent || '') : '',
              actualPaymentDate: new Date().toISOString().split('T')[0],
              paymentMethod: t('pm_bank_transfer'),
              isPaid: 'true',
              notes: isQuickRentExpense 
                ? (lang === 'he' ? 'הוצאת שכר דירה מהירה' : 'Quick rent expense') 
                : ''
            }}
            onSave={async (data) => {
              const payload = {
                ...data,
                aptId: quickExpenseApt.id,
                amount: Number(data.amount) || 0,
                isPaid: data.isPaid || 'true',
                paymentDate: data.actualPaymentDate || new Date().toISOString().split('T')[0]
              };
              await saveDocument('expenses', payload);
              setQuickExpenseApt(null);
            }}
            onCancel={() => setQuickExpenseApt(null)}
            t={t}
          />
        );
      })()}

      {/* POPUP: Device Sync */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 modal-overlay bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] p-7 shadow-2xl animate-in zoom-in-95 text-start">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 rounded-xl">
                  <LucideIcon name="RefreshCw" size={20} />
                </div>
                <h3 className="font-black text-lg text-slate-800 dark:text-white">{t('sync_devices')}</h3>
              </div>
              <button onClick={() => setIsSyncModalOpen(false)} className="text-slate-400 hover:text-slate-650">
                <LucideIcon name="X" size={18} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="p-4 bg-slate-50 dark:bg-slate-750 rounded-2xl flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center text-xs">
                <div className="text-start">
                  <span className="text-slate-400 dark:text-slate-300 block text-start">{t('sync_code')}</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-base">{appId}</span>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(appId);
                    alert(lang === 'he' ? 'הקוד הועתק ללוח!' : 'Code copied to clipboard!');
                  }} 
                  className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-100 transition-colors w-full sm:w-auto text-center"
                >
                  {lang === 'he' ? 'העתק קוד' : 'Copy'}
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mr-1 mb-1 block">
                  {lang === 'he' ? 'הזן קוד סנכרון של המכשיר השני:' : 'Enter sync code of the second device:'}
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input 
                    type="text" 
                    placeholder="e.g. 123456" 
                    value={syncCodeInput}
                    onChange={e => setSyncCodeInput(e.target.value.trim())}
                    className="flex-1 w-full p-4 bg-slate-50 dark:bg-slate-750 rounded-2xl font-mono font-bold outline-none border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white text-center text-lg"
                  />
                  <button 
                    onClick={() => {
                      if (!syncCodeInput) return;
                      setAppId(syncCodeInput);
                      localStorage.setItem('prop_app_id', syncCodeInput);
                      triggerConfetti('entrance');
                      setIsSyncModalOpen(false);
                      alert(lang === 'he' ? 'הסנכרון הופעל בהצלחה!' : 'Sync activated successfully!');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white py-4 px-6 rounded-2xl font-black active:scale-95 transition-all shadow-md shadow-indigo-100 dark:shadow-none text-sm shrink-0 w-full sm:w-auto text-center"
                  >
                    {lang === 'he' ? 'סנכרן' : 'Sync'}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button 
                onClick={() => setIsSyncModalOpen(false)}
                className="w-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-3 rounded-xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-650 transition-colors"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP: Contact Developer */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 modal-overlay bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-end mb-2">
              <button onClick={() => setIsContactModalOpen(false)} className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
                <LucideIcon name="X" size={18} />
              </button>
            </div>
            <h3 className="font-black text-2xl text-center text-indigo-600 dark:text-indigo-400 mb-3 flex items-center justify-center gap-2">
              <LucideIcon name="Mail" size={24} />
              <span>{lang === 'he' ? 'פניה למפתח' : 'Contact Developer'}</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-350 text-center text-sm mb-6 leading-relaxed">
              {lang === 'he' 
                ? 'אם ברצונך לפנות למפתח לצורך שיפורים, הצעות או תמיכה — אפשר ליצור קשר באחת מהדרכים הבאות:' 
                : 'To contact the developer for improvements, suggestions, or support, please use one of the following:'}
            </p>
            <div className="space-y-3">
              <a 
                href="https://wa.me/972532504253" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center gap-2 w-full bg-emerald-500 text-white py-3 rounded-2xl font-bold hover:bg-emerald-600 transition-colors"
              >
                <LucideIcon name="MessageCircle" size={20} />
                <span>{lang === 'he' ? 'שליחת הודעה ב-WhatsApp' : 'Send WhatsApp message'}</span>
              </a>
              <a 
                href="mailto:gavishdr@gmail.com" 
                className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-colors"
              >
                <LucideIcon name="Mail" size={20} />
                <span>{lang === 'he' ? 'שליחת מייל למפתח' : 'Email the developer'}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* POPUP: Logo Selection Modal */}
      {isLogoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 modal-overlay bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] p-7 shadow-2xl animate-in zoom-in-95 text-start flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <LucideIcon name="Palette" size={20} />
                </div>
                <h3 className="font-black text-lg text-slate-800 dark:text-white">{lang === 'he' ? 'בחירת סמליל האפליקציה' : 'Select App Logo'}</h3>
              </div>
              <button onClick={() => setIsLogoModalOpen(false)} className="text-slate-400 hover:text-slate-650">
                <LucideIcon name="X" size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-bold">
                {lang === 'he' 
                  ? 'בחר סמליל יוקרתי ומעוצב מבין הגרסאות המובנות, או העלה תמונה אישית מהמכשיר שלך שתהפוך לסמליל האפליקציה הרשמי.' 
                  : 'Select a premium designed logo from the built-in designs, or upload a custom image from your device to become the official app icon.'}
              </p>

              {/* Grid of presets */}
              <div className="grid grid-cols-3 gap-3">
                {/* Preset 6 - NEW Premium Gold Key Logo */}
                <button
                  onClick={() => setSelectedLogoDesign('6')}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-2 border transition-all relative ${
                    selectedLogoDesign === '6' 
                      ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/20 scale-105 shadow-md' 
                      : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden shadow bg-[#0f172a] flex items-center justify-center">
                    <img src="/logo.svg" className="w-full h-full object-cover" alt="Preset 6" referrerPolicy="no-referrer" />
                  </div>
                  <span className="font-black text-[10px] text-amber-500">{lang === 'he' ? 'פרימיום זהב' : 'Premium Gold'}</span>
                </button>

                {/* Preset 4 */}
                <button
                  onClick={() => setSelectedLogoDesign('4')}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-2 border transition-all ${
                    selectedLogoDesign === '4' 
                      ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/20 scale-105 shadow-md' 
                      : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden shadow bg-[#0E487F] flex items-center justify-center">
                    <svg width="48" height="48" viewBox="0 0 100 100" fill="none" className="w-full h-full">
                      <rect width="100" height="100" fill="#0E487F" />
                      <circle cx="50" cy="50" r="22" fill="#FFFFFF" />
                      <path d="M22 65 C 25 80, 48 88, 78 84" stroke="#DCA241" strokeWidth="10" fill="none" />
                    </svg>
                  </div>
                  <span className="font-bold text-[10px] text-slate-500 dark:text-slate-400">{lang === 'he' ? 'איזי כחול' : 'Easy Blue'}</span>
                </button>

                {/* Preset 5 */}
                <button
                  onClick={() => setSelectedLogoDesign('5')}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-2 border transition-all ${
                    selectedLogoDesign === '5' 
                      ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/20 scale-105 shadow-md' 
                      : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden shadow bg-[#1B355A] flex items-center justify-center">
                    <svg width="48" height="48" viewBox="0 0 100 100" fill="none" className="w-full h-full">
                      <rect width="100" height="100" rx="26" fill="#1B355A" />
                      <circle cx="50" cy="50" r="16" fill="#FFFFFF" />
                      <path d="M15 56 C 18 74, 40 82, 75 78" stroke="#E5A93B" strokeWidth="12" fill="none" />
                      <rect x="62" y="45" width="22" height="30" rx="2" fill="#FFFFFF" stroke="#23426B" strokeWidth="6" />
                    </svg>
                  </div>
                  <span className="font-bold text-[10px] text-slate-500 dark:text-slate-400">{lang === 'he' ? 'מפתחות ונכס' : 'Key & Property'}</span>
                </button>

                {/* Preset 1 */}
                <button
                  onClick={() => setSelectedLogoDesign('1')}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-2 border transition-all ${
                    selectedLogoDesign === '1' 
                      ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/20 scale-105 shadow-md' 
                      : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden shadow bg-[#1E293B] flex items-center justify-center">
                    <svg width="48" height="48" viewBox="0 0 100 100" fill="none" className="w-full h-full">
                      <rect width="100" height="100" rx="26" fill="#1E293B" />
                      <path d="M22 44 L50 21 L78 44" stroke="#F8FAFC" strokeWidth="10" strokeLinecap="round" />
                      <path d="M50 35 L50 78" stroke="#EAB308" strokeWidth="10" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="font-bold text-[10px] text-slate-500 dark:text-slate-400">{lang === 'he' ? 'קלאסי סלייט' : 'Classic Slate'}</span>
                </button>

                {/* Preset 2 */}
                <button
                  onClick={() => setSelectedLogoDesign('2')}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-2 border transition-all ${
                    selectedLogoDesign === '2' 
                      ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/20 scale-105 shadow-md' 
                      : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden shadow bg-[#065F46] flex items-center justify-center">
                    <svg width="48" height="48" viewBox="0 0 100 100" fill="none" className="w-full h-full">
                      <rect width="100" height="100" rx="26" fill="#065F46" />
                      <circle cx="50" cy="50" r="16" stroke="#FFFFFF" strokeWidth="8" fill="none" />
                      <path d="M50 60 L50 82" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="font-bold text-[10px] text-slate-500 dark:text-slate-400">{lang === 'he' ? 'ירוק אמרלד' : 'Emerald Green'}</span>
                </button>

                {/* Preset 3 */}
                <button
                  onClick={() => setSelectedLogoDesign('3')}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-2 border transition-all ${
                    selectedLogoDesign === '3' 
                      ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/20 scale-105 shadow-md' 
                      : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden shadow bg-[#0B0F19] flex items-center justify-center">
                    <svg width="48" height="48" viewBox="0 0 100 100" fill="none" className="w-full h-full">
                      <rect width="100" height="100" rx="26" fill="#0B0F19" />
                      <path d="M18 46 L50 20 L82 46" stroke="#06B6D4" strokeWidth="10" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="font-bold text-[10px] text-slate-500 dark:text-slate-400">{lang === 'he' ? 'ניאון סייבר' : 'Neon Cyber'}</span>
                </button>

                {/* Custom uploaded option */}
                <button
                  onClick={() => customUploadedLogo && setSelectedLogoDesign('custom')}
                  disabled={!customUploadedLogo}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-2 border transition-all relative ${
                    selectedLogoDesign === 'custom' 
                      ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/20 scale-105 shadow-md' 
                      : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                  } ${!customUploadedLogo ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden shadow bg-slate-900 flex items-center justify-center">
                    {customUploadedLogo ? (
                      <img src={customUploadedLogo} className="w-full h-full object-cover" alt="Custom Upload" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-[14px]">🖼️</span>
                    )}
                  </div>
                  <span className="font-bold text-[10px] text-slate-500 dark:text-slate-400">{lang === 'he' ? 'לוגו אישי' : 'Custom Image'}</span>
                </button>
              </div>

              {/* File upload section */}
              <div className="bg-slate-50 dark:bg-slate-750 p-5 rounded-3xl border border-slate-100 dark:border-slate-700/50 space-y-3">
                <div className="text-slate-800 dark:text-white font-bold text-xs text-center">
                  {lang === 'he' ? 'העלאת תמונה מותאמת אישית' : 'Upload custom logo image'}
                </div>
                <div className="flex justify-center">
                  <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-2xl text-xs active:scale-95 transition-all shadow-sm flex items-center gap-2">
                    <LucideIcon name="UploadCloud" size={16} />
                    <span>{lang === 'he' ? 'בחר קובץ תמונה' : 'Select Image File'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleLogoUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>
                {customUploadedLogo && (
                  <div className="text-center">
                    <button 
                      onClick={() => {
                        setCustomUploadedLogo(null);
                        localStorage.removeItem('prop_app_custom_logo_data');
                        setSelectedLogoDesign('6');
                      }} 
                      className="text-[10px] font-black text-rose-500 hover:underline"
                    >
                      {lang === 'he' ? 'מחק תמונה אישית והחזר לברירת מחדל' : 'Delete custom image & reset'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button 
                onClick={() => setIsLogoModalOpen(false)}
                className="w-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-3 rounded-xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-650 transition-colors"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP: Reports & Export */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 modal-overlay bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] p-7 shadow-2xl animate-in zoom-in-95 text-start">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <LucideIcon name="FileSpreadsheet" size={20} />
                </div>
                <h3 className="font-black text-lg text-slate-800 dark:text-white">{t('reports_export')}</h3>
              </div>
              <button onClick={() => setIsExportModalOpen(false)} className="text-slate-400 hover:text-slate-650">
                <LucideIcon name="X" size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              {lang === 'he' ? 'בחר נכס וטווחי תאריכים להורדת דוח הוצאות והכנסות לקובץ CSV התואם לאקסל.' : 'Select a property and date range to download an expense and income Excel-compatible CSV report.'}
            </p>
            
            <div className="space-y-4">
              {/* לחצן הבחירה נכסים */}
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">{t('assigned_prop')}</label>
                <select 
                  value={exportAptId} 
                  onChange={e => setExportAptId(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-750 rounded-xl font-bold outline-none border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white text-xs"
                >
                  <option value="all">{lang === 'he' ? 'כל הנכסים' : 'All Properties'}</option>
                  {apartments.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">{t('from_date')}</label>
                  <input 
                    type="date" 
                    value={exportFromDate} 
                    onChange={e => setExportFromDate(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-750 rounded-xl font-bold outline-none border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white text-xs text-center"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">{t('to_date')}</label>
                  <input 
                    type="date" 
                    value={exportToDate} 
                    onChange={e => setExportToDate(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-750 rounded-xl font-bold outline-none border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white text-xs text-center"
                  />
                </div>
              </div>

              <button 
                onClick={() => {
                  handleExportCSV();
                  setIsExportModalOpen(false);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-emerald-100 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
              >
                <LucideIcon name="Download" size={16} />
                <span>{lang === 'he' ? 'ייצא דוח CSV' : 'Export CSV Report'}</span>
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="w-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-3 rounded-xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-650 transition-colors"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP: Help & Credits */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 modal-overlay bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] p-7 shadow-2xl animate-in zoom-in-95 text-start flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-xl">
                  <LucideIcon name="HelpCircle" size={20} />
                </div>
                <h3 className="font-black text-lg text-slate-800 dark:text-white">{t('help_credits')}</h3>
              </div>
              <button onClick={() => setIsHelpModalOpen(false)} className="text-slate-400 hover:text-slate-650">
                <LucideIcon name="X" size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300 pr-1">
              <div className="p-4 bg-slate-50 dark:bg-slate-750 rounded-2xl">
                <h4 className="font-black text-sm text-indigo-600 dark:text-indigo-400 mb-2">{t('help_welcome_title')}</h4>
                <p>{t('help_welcome_desc')}</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-750 rounded-2xl space-y-2">
                <h4 className="font-black text-sm text-indigo-600 dark:text-indigo-400">{t('help_steps_title')}</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>{t('help_step_1')}</li>
                  <li>{t('help_step_2')}</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-750 rounded-2xl space-y-2">
                <h4 className="font-black text-sm text-indigo-600 dark:text-indigo-400">{t('help_ongoing_title')}</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>{t('help_ongoing_1')}</li>
                  <li>{t('help_ongoing_2')}</li>
                  <li>{t('help_ongoing_3')}</li>
                  <li>{t('help_ongoing_4')}</li>
                  <li>{t('help_ongoing_5')}</li>
                  <li>{t('help_ongoing_6')}</li>
                  <li>{t('help_ongoing_7')}</li>
                  <li>{t('help_ongoing_8')}</li>
                  <li>{t('help_ongoing_9')}</li>
                  <li>{t('help_ongoing_10')}</li>
                  <li>{t('help_ongoing_11')}</li>
                  <li>{t('help_ongoing_12')}</li>
                  <li>{t('help_ongoing_13')}</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-750 rounded-2xl flex justify-between items-center">
                <div>
                  <span className="font-bold block text-slate-800 dark:text-white">{t('dev_credits')}</span>
                  <span className="text-slate-400">EasyRent v2.5 Pro</span>
                </div>
                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold text-xs">Gavish Software</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button 
                onClick={() => setIsHelpModalOpen(false)}
                className="w-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-3 rounded-xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-650 transition-colors"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP: Property List & Management */}
      {isPropListModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 modal-overlay bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] p-7 shadow-2xl animate-in zoom-in-95 text-start flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <LucideIcon name="Home" size={20} />
                </div>
                <h3 className="font-black text-lg text-slate-800 dark:text-white">{lang === 'he' ? 'ניהול רשימת הנכסים' : 'Manage Property List'}</h3>
              </div>
              <button onClick={() => setIsPropListModalOpen(false)} className="text-slate-400 hover:text-slate-650">
                <LucideIcon name="X" size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {lang === 'he' ? 'הוספת עד 2 נכסים פתוחה בחינם לכל משתמש' : 'Adding up to 2 properties is completely free for everyone'}
                </p>
                <button 
                  onClick={() => {
                    setIsPropListModalOpen(false);
                    handleAddApartmentClick();
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3.5 rounded-xl font-black text-xs hover:scale-105 transition-all flex items-center gap-1 shrink-0"
                >
                  <LucideIcon name="Plus" size={14} />
                  <span>{t('add_prop')}</span>
                </button>
              </div>

              {apartments.length === 0 ? (
                <p className="text-sm text-slate-400 font-bold py-10 text-center">{t('no_properties')}</p>
              ) : (
                <div className="space-y-2.5">
                  {sortedApartments.map(apt => (
                    <div key={apt.id} className="p-4 bg-slate-50 dark:bg-slate-750 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                          <LucideIcon name={apt.icon || 'Home'} size={18} />
                        </div>
                        <div className="text-start">
                          <span className="font-black text-sm block text-slate-800 dark:text-white flex items-center gap-2">
                            {apt.name}
                            {mortgages.some(m => m.aptId === apt.id) && (
                              <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                <LucideIcon name="Landmark" size={8} />
                                <span>{lang === 'he' ? 'משכנתא' : 'Mortgage'}</span>
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] text-slate-400 block">{apt.address}</span>
                          <span className="text-[10px] text-indigo-500 font-bold block mt-0.5">
                            {getSymbolForCurrency(apt.currency || '₪')}{Number(apt.targetRent).toLocaleString()} / {lang === 'he' ? 'חודש' : 'Month'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        {/* כפתור עריכת אירועי שכירות */}
                        {apt.status !== 'tenant' && (
                          <button 
                            onClick={() => {
                              setEditingRentSegmentsApt(apt);
                              setIsRentSegmentsModalOpen(true);
                            }}
                            className="p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-xl hover:scale-110 transition-transform"
                            title={lang === 'he' ? 'אירועי שכירות' : 'Rent Events'}
                          >
                            <LucideIcon name="Zap" size={14} />
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setIsPropListModalOpen(false);
                            handleEditApartmentClick(apt);
                          }}
                          className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl hover:scale-110 transition-transform"
                          title={t('edit')}
                        >
                          <LucideIcon name="Pencil" size={14} />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm(lang === 'he' ? 'האם למחוק נכס זה לצמיתות ואת כל הנתונים שלו?' : 'Are you sure you want to delete this property?')) {
                              deleteDocument('apartments', apt.id);
                            }
                          }}
                          className="p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl hover:scale-110 transition-transform"
                          title={t('confirm_delete')}
                        >
                          <LucideIcon name="Trash2" size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button 
                onClick={() => setIsPropListModalOpen(false)}
                className="w-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-3 rounded-xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-650 transition-colors"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Scroll-To-Top Button */}
      {showScrollToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-6 z-50 p-3.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 cursor-pointer flex items-center justify-center border border-indigo-500/30 dark:border-indigo-400/20"
          title={lang === 'he' ? 'גלול למעלה' : 'Scroll to top'}
        >
          <LucideIcon name="ArrowUp" size={20} />
        </button>
      )}

      {/* POPUP: Rent Segments (Zap) */}
      {isRentSegmentsModalOpen && editingRentSegmentsApt && (
        <RentSegmentsModal
          apt={editingRentSegmentsApt}
          lang={lang}
          t={t}
          onClose={() => {
            setIsRentSegmentsModalOpen(false);
            setEditingRentSegmentsApt(null);
          }}
          onSave={async (newSegments) => {
            await saveDocument('apartments', { ...editingRentSegmentsApt, rentSegments: newSegments }, editingRentSegmentsApt.id);
            setEditingRentSegmentsApt({ ...editingRentSegmentsApt, rentSegments: newSegments });
          }}
        />
      )}

      {/* POPUP: Update Exchange Rates (Bank of Israel) */}
      {isRatesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 modal-overlay bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] p-7 shadow-2xl animate-in zoom-in-95 text-start">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 rounded-xl">
                  <LucideIcon name="RefreshCw" size={20} />
                </div>
                <h3 className="font-black text-lg text-slate-800 dark:text-white">
                  {lang === 'he' ? 'עדכון שערי חליפין' : 'Update Exchange Rates'}
                </h3>
              </div>
              <button onClick={() => setIsRatesModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <LucideIcon name="X" size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed font-bold">
              {lang === 'he' 
                ? 'השערים במערכת הם שערים דינמיים המנותרים ומתעדכנים בזמן אמת לפי השוק הגלובלי, ולכן עשויים להיות שונים מהשער היציג היומי הסטטי שמפרסם בנק ישראל (שמתעדכן פעם ביום בלבד). שערים אלו משמשים להמרה אוטומטית של נכסים ברמות הסיכום הכלליות.' 
                : 'The exchange rates in the system are dynamic, monitored and updated in real-time based on the global market. They may therefore differ from the daily static official rates published by the Bank of Israel (which are updated only once a day). These rates are used for automatic conversion of properties in the global summaries.'}
            </p>

            <div className="bg-slate-50 dark:bg-slate-750 p-5 rounded-3xl border border-slate-100 dark:border-slate-700/60 flex flex-col gap-3.5 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {lang === 'he' ? 'דולר ארה"ב (USD)' : 'US Dollar (USD)'}
                </span>
                <span className="font-black text-slate-800 dark:text-white text-base">
                  ₪{usdToIlsRate.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2.5 border-t border-slate-100/50 dark:border-slate-700/30">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {lang === 'he' ? 'אירו (EUR)' : 'Euro (EUR)'}
                </span>
                <span className="font-black text-slate-800 dark:text-white text-base">
                  ₪{eurToIlsRate.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2.5 border-t border-slate-100/50 dark:border-slate-700/30">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {lang === 'he' ? 'לירה שטרלינג (GBP)' : 'British Pound (GBP)'}
                </span>
                <span className="font-black text-slate-800 dark:text-white text-base">
                  ₪{gbpToIlsRate.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2.5 border-t border-slate-100/50 dark:border-slate-700/30">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {lang === 'he' ? 'באט תאילנדי (THB)' : 'Thai Baht (THB)'}
                </span>
                <span className="font-black text-slate-800 dark:text-white text-base">
                  ₪{thbToIlsRate.toFixed(4)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={async () => {
                  setIsUpdatingRates(true);
                  try {
                    const res = await fetch('https://open.er-api.com/v6/latest/ILS');
                    if (!res.ok) throw new Error('API error');
                    const data = await res.json();
                    if (data && data.result === 'success' && data.rates) {
                      const usdPerIls = data.rates.USD;
                      const eurPerIls = data.rates.EUR;
                      const gbpPerIls = data.rates.GBP;
                      const thbPerIls = data.rates.THB;
                      
                      let updatedCount = 0;
                      if (usdPerIls) {
                        const calculatedUsd = parseFloat((1 / usdPerIls).toFixed(4));
                        setUsdToIlsRate(calculatedUsd);
                        localStorage.setItem('prop_app_usd_rate', calculatedUsd.toString());
                        updatedCount++;
                      }
                      if (eurPerIls) {
                        const calculatedEur = parseFloat((1 / eurPerIls).toFixed(4));
                        setEurToIlsRate(calculatedEur);
                        localStorage.setItem('prop_app_eur_rate', calculatedEur.toString());
                        updatedCount++;
                      }
                      if (gbpPerIls) {
                        const calculatedGbp = parseFloat((1 / gbpPerIls).toFixed(4));
                        setGbpToIlsRate(calculatedGbp);
                        localStorage.setItem('prop_app_gbp_rate', calculatedGbp.toString());
                        updatedCount++;
                      }
                      if (thbPerIls) {
                        const calculatedThb = parseFloat((1 / thbPerIls).toFixed(4));
                        setThbToIlsRate(calculatedThb);
                        localStorage.setItem('prop_app_thb_rate', calculatedThb.toString());
                        updatedCount++;
                      }
                      
                      if (updatedCount > 0) {
                        triggerCurrencyNotice(lang === 'he' ? 'שערי החליפין עודכנו בהצלחה!' : 'Exchange rates updated successfully!');
                      } else {
                        throw new Error('No rates found');
                      }
                    }
                  } catch (e) {
                    console.error(e);
                    triggerCurrencyNotice(lang === 'he' ? 'שגיאה בעדכון שערי חליפין' : 'Error updating exchange rates');
                  } finally {
                    setIsUpdatingRates(false);
                  }
                }}
                disabled={isUpdatingRates}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-black shadow-md shadow-indigo-100 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
              >
                <LucideIcon name="RefreshCw" size={16} className={`${isUpdatingRates ? 'animate-spin' : ''}`} />
                <span>{isUpdatingRates ? (lang === 'he' ? 'מעדכן שערים...' : 'Updating...') : (lang === 'he' ? 'עדכן עכשיו מהאינטרנט' : 'Update Exchange Rates Now')}</span>
              </button>

              <button
                onClick={() => setIsRatesModalOpen(false)}
                className="w-full py-3 bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Exchange Rate & Global Currency Notice (Toast) */}
      {currencyNotice && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 dark:bg-slate-950/95 text-white text-[11px] md:text-xs font-black py-3 px-5 rounded-2xl shadow-2xl border border-slate-700/60 backdrop-blur-sm max-w-[280px] md:max-w-md text-center animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2 justify-center">
            <LucideIcon name="Info" size={14} className="text-amber-400 shrink-0" />
            <span>{currencyNotice}</span>
          </div>
        </div>
      )}
    </div>
  );
}
