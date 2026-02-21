
export type Language = 'en' | 'zh';

export type PaymentMode = 'Yearly' | 'Half-Yearly' | 'Quarterly' | 'Monthly';

export interface Product {
  name: string;
  provider: string;
  type: 'Life' | 'Medical' | 'Auto' | 'Property' | 'Critical Illness' | 'Savings' | 'Accident' | 'Hospital Income' | 'Rider';
  defaultTags: string[];
  isTaxDeductible?: boolean;
  annualCoverageLimit?: number; // Medical specific
  wholeLifeCoverageLimit?: number; // Medical specific
}

export interface Rider {
  name: string;
  type: string;
  premiumAmount: number;
  sumInsured?: number;
  protectionMatureDate?: string;
  premiumMatureDate?: string;
}

export interface PolicyData {
  id: string;
  policyNumber: string;
  planName: string;
  company?: string; // Insurance Company Name
  holderName: string;
  insuredName?: string; // New field for Insured Name
  clientId?: string; // Optional: Link to existing client
  clientBirthday?: string; // New field for capturing birthday
  clientPhone?: string; // New field for capturing phone number
  type: 'Life' | 'Medical' | 'Auto' | 'Property' | 'Critical Illness' | 'Savings' | 'Accident' | 'Hospital Income' | 'Rider';
  effectiveDate?: string; // New field for effective date
  policyAnniversaryDate: string; // Format: DD/MM
  maturityDate?: string; // YYYY-MM-DD (New field)
  protectionMatureDate?: string;
  premiumMatureDate?: string;
  paymentMode: PaymentMode;
  currency: 'USD' | 'HKD';
  premiumAmount: number; // Base Premium
  status: 'Active' | 'Pending' | 'Expired';
  extractedTags?: string[]; // Tags derived from Product Library
  riders?: Rider[]; // Nested Rider Plans

  // --- Savings / Cash Value ---
  cashValue?: number; // Guaranteed Cash Value
  accumulatedDividend?: number; // Non-Guaranteed / Accumulated Dividends
  totalCashValue?: number; // Total Surrender Value

  // --- Plan Specific Features ---

  // Medical
  medicalPlanType?: 'Ward' | 'Semi-Private' | 'Private' | 'High-End Semi-Private' | 'High-End Private';
  medicalExcess?: number; // For High-end medical

  // Life / Critical Illness / Accident (Critical)
  sumInsured?: number;

  // Critical Illness
  isMultipay?: boolean; // 多重保

  // Term Life
  policyEndDate?: string; // YYYY-MM-DD

  // Savings
  capitalInvested?: number;

  // Accident
  accidentMedicalLimit?: number; // Sum insured for each accident
  accidentSectionLimit?: number; // Limitation on sum insured for each section
  accidentPhysioVisits?: number; // Number of times each year
}

export interface MeetingLog {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'Intro' | 'Policy Review' | 'Claim' | 'Upsell' | 'Other' | 'General';
  summary: string;
  rawNotes?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthday: string; // YYYY-MM-DD
  totalPolicies: number;
  lastContact: string; // YYYY-MM-DD
  status: 'Active' | 'Lead';
  tags: string[];
  meetingLogs?: MeetingLog[]; // New field
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  UPLOAD = 'UPLOAD',
  CLIENTS = 'CLIENTS',
  CLIENT_DETAILS = 'CLIENT_DETAILS',
  PRODUCTS = 'PRODUCTS',
  SETTINGS = 'SETTINGS',
  REPORT = 'REPORT',
  MEETINGS = 'MEETINGS' // New global view
}

export enum UploadStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface PDFColumnConfig {
  id: string; // Internal identifier
  labelKey: string; // Header text or translation key
  visible: boolean;
  order: number;
  width: number; // Width as a percentage (1-100)
}

export interface AppSettings {
  language: Language;
  reminderDays: number;
  googleSheetId?: string;
  aiProvider?: 'gemini' | 'openai' | 'kimi' | 'nvidia'; // Default 'gemini'
  aiBaseUrl?: string; // For custom OpenAI/Kimi endpoints
  aiModel?: string; // Selected model ID
  pdfLayout?: PDFColumnConfig[]; // Global PDF Layout preferences
}

export interface UserProfile {
  name: string;
  email: string;
  picture?: string;
}
