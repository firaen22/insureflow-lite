import { Client, PolicyData, Product, Language, PDFColumnConfig } from './types';

export const PRODUCT_TYPES = [
  'Life',
  'Medical',
  'Critical Illness',
  'Savings',
  'Auto',
  'Property',
  'Accident',
  'Hospital Income',
  'Surgical Cash',
  'Pay Waiver'
] as const;

// Default Layout Config for PDF Studio
export const DEFAULT_PDF_LAYOUT: PDFColumnConfig[] = [
  // Basic Info Section
  { id: 'company_plan', labelKey: 'Company / Plan', visible: true, order: 0, width: 20 },
  { id: 'effective', labelKey: 'Effective', visible: true, order: 1, width: 10 },
  { id: 'term', labelKey: 'Term', visible: true, order: 2, width: 5 },
  { id: 'status', labelKey: 'Status', visible: true, order: 3, width: 5 },
  { id: 'insured', labelKey: 'Insured', visible: true, order: 4, width: 10 },
  // Coverage Section
  { id: 'life', labelKey: 'Life', visible: true, order: 5, width: 10 },
  { id: 'ci', labelKey: 'CI', visible: true, order: 6, width: 10 },
  { id: 'medical', labelKey: 'Medical', visible: true, order: 7, width: 7 },
  { id: 'accident', labelKey: 'Accident', visible: true, order: 8, width: 7 },
  // Premium Section
  { id: 'currency', labelKey: 'Curr.', visible: true, order: 9, width: 5 },
  { id: 'premium_amt', labelKey: 'Amt', visible: true, order: 10, width: 10 },
  { id: 'payment_mode', labelKey: 'Mode', visible: true, order: 11, width: 5 },
  { id: 'tax_deductible', labelKey: 'Tax Ded.', visible: true, order: 12, width: 8 },
];
export const PRODUCT_LIBRARY: Product[] = [
  {
    name: 'CEO Medical Plan',
    provider: 'AIA',
    type: 'Medical',
    defaultTags: ['AIA', 'Medical', 'High-End', 'Global Cover'],
    isTaxDeductible: true,
    annualCoverageLimit: 10000000,
    wholeLifeCoverageLimit: 30000000
  },
  {
    name: 'Crisis Cover Prudential',
    provider: 'Prudential',
    type: 'Critical Illness',
    defaultTags: ['Prudential', 'Critical Illness', 'Lump Sum']
  },
  {
    name: 'SunLife Wealth Builder',
    provider: 'Sunlife',
    type: 'Savings',
    defaultTags: ['Sunlife', 'Savings', 'Dividend']
  },
  {
    name: 'CEO Medical Rider',
    provider: 'AIA',
    type: 'Rider',
    defaultTags: ['AIA', 'Medical Rider', 'High-End'],
    isTaxDeductible: true,
    annualCoverageLimit: 5000000,
    wholeLifeCoverageLimit: 15000000
  },
  {
    name: 'Crisis Cover Rider',
    provider: 'Prudential',
    type: 'Rider',
    defaultTags: ['Prudential', 'CI Rider']
  },
  {
    name: 'Home Protect Plus',
    provider: 'AIG',
    type: 'Property',
    defaultTags: ['AIG', 'Home', 'Fire']
  }
];

export const TRANSLATIONS = {
  en: {
    nav: {
      brand: 'InsureFlow',
      dashboard: 'Dashboard',
      upload: 'Policy Upload',
      clients: 'Clients',
      products: 'Product Library',
      reminders: 'Reminders',
      settings: 'Settings'
    },
    header: {
      driveConnected: 'Drive Connected'
    },
    dashboard: {
      title: 'Dashboard Overview',
      subtitle: 'Last updated: Just now',
      totalClients: 'Total Clients',
      activePolicies: 'Active Policies',
      premiumRevenue: 'Premium Revenue',
      monthly: 'Monthly',
      reminders: 'Reminders',
      attentionNeeded: 'Attention Needed',
      policyDist: 'Policy Distribution',
      recentUpdates: 'Recent Policy Updates',
      upcomingReminders: 'Upcoming Reminders',
      premiumsDue: 'Premiums Due',
      birthdays: 'Birthdays',
      noPremiums: 'No premiums due soon.',
      noBirthdays: 'No upcoming birthdays.',
      sendWish: 'Send Wish',
      viewCalendar: 'View Calendar',
      table: {
        policyNo: 'Policy No.',
        holder: 'Holder',
        type: 'Type',
        anniversary: 'Anniversary',
        mode: 'Mode',
        status: 'Status'
      }
    },
    upload: {
      title: 'New Policy Processing',
      subtitle: 'Upload PDF documents to automatically extract policy details using AI.',
      dragDropTitle: 'Drag & Drop Policy PDF',
      dragDropDesc: 'Supported formats: PDF, JPG, PNG. Max file size: 10MB.',
      selectFile: 'Select File',
      uploading: 'Uploading...',
      analyzing: 'AI Analyzing...',
      detecting: 'Detecting languages (Chinese/English)...',
      identifying: 'Identifying Plan Name & Riders...',
      matching: 'Matching with Product Library...',
      complete: 'Analysis Complete',
      uploadAnother: 'Upload Another',
      privacy: 'Client Privacy Protected',
      privacyDesc: 'Local encryption enabled before cloud sync.',
      previewTitle: 'Extracted Data Preview',
      confidence: 'Confidence',
      manualEdit: 'Manual Edit',
      saveCRM: 'Save to CRM',
      saveRecord: 'Save & Record Product',
      done: 'Done',
      edit: 'Edit',
      manualEntry: 'Enter Details Manually',
      or: 'OR',
      manualMode: 'Manual Entry Mode',
      enterDetails: 'Enter policy details in the form.',
      fields: {
        planName: 'Main Plan (Base)',
        policyHolder: 'Policy Holder',
        clientBirthday: 'Client Birthday',
        policyNumber: 'Policy Number',
        type: 'Type',
        premium: 'Base Premium ($)',
        totalPremium: 'Total Premium',
        anniversary: 'Anniversary (DD/MM)',
        paymentMode: 'Payment Mode',
        riders: 'Riders / Supplementary Benefits',
        addRider: 'Add Rider',
        riderName: 'Rider Name',
        riderPrem: 'Prem ($)',
        expiresSoon: 'Due Soon',
        newProduct: 'New Product',
        newProductDesc: 'This plan is not in the library. Saving this policy will record it for future auto-tagging.',
        noTags: 'No library tags found.',
        emptyState: 'Upload a document to see extracted details here.',
        effectiveDate: 'Effective Date (YYYY-MM-DD)'
      }
    },
    clients: {
      title: 'Client Management',
      subtitle: 'Manage client records, tags, and contact details.',
      addClient: 'Add New Client',
      searchPlaceholder: 'Search by name, email, phone, or tags...',
      filterTags: 'Filter by System Tags:',
      all: 'All',
      addTag: 'Add Tag',
      table: {
        name: 'Client Name',
        tags: 'Tags',
        birthday: 'Birthday',
        policies: 'Policies',
        status: 'Status',
        actions: 'Actions',
        noTags: 'No tags',
        notFound: 'No clients found matching your search.',
        deleteConfirm: 'Are you sure you want to delete this client and all their policies?'
      }
    },
    clientDetails: {
      backToClients: 'Back to Clients',
      generateReport: 'Generate Report',
      contactInfo: 'Contact Information',
      policiesHeld: 'Policies Held',
      totalAnnualPremium: 'Total Annual Premium',
      totalPolicies: 'Total Policies',
      noPolicies: 'No policies found for this client.',
      email: 'Email',
      phone: 'Phone',
      birthday: 'Birthday',
      lastContact: 'Last Contact',
      editPolicy: 'Edit Policy',
      deletePolicy: 'Delete Policy',
      deleteConfirm: 'Are you sure you want to delete this policy?',
      saveChanges: 'Save Changes',
      cancel: 'Cancel',
      summary: {
        title: 'Protection Summary (HKD)',
        totalPremium: 'Total Annual Premium',
        life: 'Life Coverage',
        ci: 'Critical Illness'
      },
      policyCard: {
        basePlan: 'Base Plan',
        policyNo: 'Policy No.',
        status: 'Status',
        anniversary: 'Anniversary',
        paymentMode: 'Payment Mode',
        premium: 'Premium',
        riders: 'Riders & Supplementary',
        type: 'Type',
        effectiveDate: 'Effective Date',
        // Specifics
        roomType: 'Room Type',
        excess: 'Medical Excess',
        sumInsured: 'Sum Insured',
        multipay: 'Multipay Feature',
        endDate: 'Policy End Date',
        capital: 'Capital Invested',
        accidentLimit: 'Accident Medical Limit',
        sectionLimit: 'Section Limit',
        physio: 'Physio Visits/Year',
        physioLimit1: 'Physio Limit 1',
        physioLimit2: 'Physio Limit 2',
        bonesetting: 'Bonesetting Limit',
        acupuncture: 'Acupuncture Limit'
      }
    },
    meetings: {
      title: 'Meeting Logs',
      addLog: 'Add Meeting Log',
      date: 'Date',
      type: 'Type',
      summary: 'Summary',
      notes: 'Rough Notes',
      summarize: 'AI Summarize',
      noLogs: 'No meetings logged yet.',
      deleteConfirm: 'Delete this meeting log?',
      types: {
        Intro: 'Intro',
        PolicyReview: 'Policy Review',
        Claim: 'Claim',
        Upsell: 'Upsell',
        General: 'General'
      }
    },
    products: {
      title: 'Product Library',
      subtitle: 'Centralized repository of insurance plans and extraction rules.',
      addProduct: 'Add Product',
      editProduct: 'Edit Product',
      save: 'Save Changes',
      cancel: 'Cancel',
      searchPlaceholder: 'Search products...',
      table: {
        name: 'Product Name',
        provider: 'Provider',
        type: 'Category',
        tags: 'Auto-Tags',
        actions: 'Actions',
        noProducts: 'No products found.'
      },
      form: {
        name: 'Product Name',
        provider: 'Provider',
        type: 'Category',
        tags: 'Tags',
        addTag: 'Add Tag',
        taxDeductible: 'Tax Deductible',
        annualLimit: 'Annual Coverage Limit (Medical)',
        lifeLimit: 'Whole Life Coverage Limit (Medical)'
      }
    },
    reminders: {
      title: 'Renewal & Reviews',
      subtitle: 'Monitor policies approaching their anniversary date for client reviews and document refreshes.',
      daysRemaining: 'Days Remaining',
      policyDetails: 'Policy Details',
      anniversary: 'Anniversary',
      status: 'Status',
      actions: 'Actions',
      uploadRenewal: 'Upload Renewal',
      contact: 'Contact',
      noReminders: 'No upcoming policy reviews in the next 60 days.',
      urgent: 'Urgent',
      upcoming: 'Upcoming',
      filterAll: 'All Upcoming',
      filterUrgent: 'Urgent (<30 Days)'
    },
    report: {
      backToDetails: 'Back to Details',
      title: 'Client Report Preview',
      generating: 'Generating...',
      downloadBtn: 'Download PDF',
      protection: '保障 Protection',
      age: 'Age',
      totalLife: 'Total Life Protection',
      totalCI: 'Total CI Protection',
      totalAnnualPremium: 'Total Annual Premium',
      visibleColumns: 'Visible Columns:',
      totalsApprox: 'TOTALS (Approx. HKD):',
      life: 'Life:',
      ci: 'CI:',
      prem: 'Prem:',
      yr: '/ Yr',
      // Column Labels
      columns: {
        'company_plan': 'Company / Plan',
        'effective': 'Effective',
        'term': 'Term',
        'status': 'Status',
        'insured': 'Insured',
        'life': 'Life',
        'ci': 'CI',
        'medical': 'Medical',
        'accident': 'Acc',
        'currency': 'Curr.',
        'premium_amt': 'Amt',
        'payment_mode': 'Mode',
        'tax_deductible': 'Tax Ded.'
      }
    },
    settings: {
      title: 'Settings',
      accountSystem: 'Account & System',
      notSignedIn: 'Not Signed In',
      signInPrompt: 'Sign in via the Sync button to link account.',
      preferences: 'Preferences',
      language: 'Language',
      aiParsing: 'AI Parsing Settings',
      aiProvider: 'AI Provider',
      baseUrl: 'Base URL',
      apiKey: 'API Key',
      storedLocally: 'Stored locally in your browser.',
      verifySave: 'Verify & Save',
      clear: 'Clear',
      selectModel: 'Select AI Model',
      keyWorks: 'key works with selected model.',
      keyNotVerified: 'Key saved, but not verified. Click "Verify & Save" to check models.',
      connection: 'Connection',
      spreadsheetId: 'Spreadsheet ID',
      notConnected: 'Not connected',
      test: 'Test',
      rulesNotifs: 'Rules & Notifications',
      reminderDays: 'Policy Anniversary Reminder (Days)',
      reminderDesc: 'Show reminders for policies originating within this many days.',
      pdfStudio: 'PDF Report Layout (Studio)',
      pdfStudioDesc: 'Customize the columns shown in the client PDF report. Changes apply globally.',
      dataManagement: 'Data Management',
      exportData: 'Export Data (JSON)',
      clearCache: 'Clear Local Cache'
    }
  },
  zh: {
    nav: {
      brand: 'InsureFlow',
      dashboard: '儀表板',
      upload: '保單上傳',
      clients: '客戶管理',
      products: '產品資料庫',
      reminders: '提醒事項',
      settings: '設定'
    },
    header: {
      driveConnected: '雲端已連線'
    },
    dashboard: {
      title: '儀表板總覽',
      subtitle: '最後更新：剛剛',
      totalClients: '客戶總數',
      activePolicies: '有效保單',
      premiumRevenue: '保費收入',
      monthly: '每月',
      reminders: '提醒事項',
      attentionNeeded: '需要關注',
      policyDist: '保單分佈',
      recentUpdates: '近期保單更新',
      upcomingReminders: '即將到期提醒',
      premiumsDue: '保費到期',
      birthdays: '生日提醒',
      noPremiums: '近期無到期保費。',
      noBirthdays: '近期無客戶生日。',
      sendWish: '發送祝福',
      viewCalendar: '查看行事曆',
      table: {
        policyNo: '保單號碼',
        holder: '持有人',
        type: '類型',
        anniversary: '週年日',
        mode: '繳費模式',
        status: '狀態'
      }
    },
    upload: {
      title: '新保單處理',
      subtitle: '上傳 PDF 文件，利用 AI 自動提取保單詳情。',
      dragDropTitle: '拖放保單 PDF',
      dragDropDesc: '支援格式：PDF, JPG, PNG。最大檔案：10MB。',
      selectFile: '選擇檔案',
      uploading: '上傳中...',
      analyzing: 'AI 分析中...',
      detecting: '偵測語言 (中文/英文)...',
      identifying: '識別計劃名稱及附約...',
      matching: '正在比對產品庫...',
      complete: '分析完成',
      uploadAnother: '上傳另一個',
      privacy: '客戶隱私受保護',
      privacyDesc: '雲端同步前已啟用本地加密。',
      previewTitle: '提取資料預覽',
      confidence: '信心指數',
      manualEdit: '手動編輯',
      saveCRM: '儲存至 CRM',
      saveRecord: '儲存並記錄產品',
      done: '完成',
      edit: '編輯',
      manualEntry: '手動輸入詳情',
      or: '或',
      manualMode: '手動輸入模式',
      enterDetails: '請在表格中輸入保單詳情。',
      fields: {
        planName: '主計劃 (基本)',
        policyHolder: '保單持有人',
        clientBirthday: '客戶生日',
        policyNumber: '保單號碼',
        type: '類型',
        premium: '基本保費 ($)',
        totalPremium: '總保費',
        anniversary: '保單週年日 (日/月)',
        paymentMode: '繳費模式',
        riders: '附約 / 附加利益',
        addRider: '新增附約',
        riderName: '附約名稱',
        riderPrem: '保費 ($)',
        expiresSoon: '即將到期',
        newProduct: '新產品',
        newProductDesc: '此計劃不在產品庫中。儲存此保單將記錄以供未來自動標記。',
        noTags: '未找到產品庫標籤。',
        emptyState: '上傳文件以在此處查看提取詳情。',
        effectiveDate: '生效日期 (YYYY-MM-DD)'
      }
    },
    clients: {
      title: '客戶管理',
      subtitle: '管理客戶記錄、標籤和聯絡詳情。',
      addClient: '新增客戶',
      searchPlaceholder: '搜尋姓名、電郵、電話或標籤...',
      filterTags: '依系統標籤篩選：',
      all: '全部',
      addTag: '新增標籤',
      table: {
        name: '客戶名稱',
        tags: '標籤',
        birthday: '生日',
        policies: '保單數量',
        status: '狀態',
        actions: '操作',
        noTags: '無標籤',
        notFound: '未找到符合搜尋條件的客戶。',
        deleteConfirm: '您確定要刪除此客戶及其所有保單嗎？'
      }
    },
    clientDetails: {
      backToClients: '返回客戶列表',
      generateReport: '生成報告',
      contactInfo: '聯絡資訊',
      policiesHeld: '持有保單',
      totalAnnualPremium: '年度總保費',
      totalPolicies: '保單總數',
      noPolicies: '此客戶尚無保單。',
      email: '電子郵件',
      phone: '電話',
      birthday: '生日',
      lastContact: '最後聯絡',
      editPolicy: '編輯保單',
      deletePolicy: '刪除保單',
      deleteConfirm: '您確定要刪除此保單嗎？',
      saveChanges: '儲存變更',
      cancel: '取消',
      protectionMatureDate: '保障期滿日',
      premiumMatureDate: '繳費期滿日',
      summary: {
        title: '保障摘要 (HKD)',
        totalPremium: '年度總保費',
        life: '人壽保額',
        ci: '危疾保額'
      },
      policyCard: {
        basePlan: 'Basic Plan',
        policyNo: 'Policy No.',
        status: 'Status',
        anniversary: 'Anniversary',
        paymentMode: 'Payment Mode',
        premium: 'Premium',
        riders: 'Riders & Supplementary',
        type: 'Type',
        effectiveDate: 'Effective Date',
        // Specifics
        roomType: 'Room Type',
        excess: 'Medical Excess',
        sumInsured: 'Sum Insured',
        multipay: 'Multipay Feature',
        endDate: 'Policy End Date',
        capital: 'Capital Invested',
        accidentLimit: 'Accident Medical Limit',
        sectionLimit: 'Section Limit',
        physio: 'Physio Visits/Year',
        physioLimit1: '物理治療限額 1',
        physioLimit2: '物理治療限額 2',
        bonesetting: '跌打限額',
        acupuncture: '針灸限額'
      }
    },
    meetings: {
      title: '會議記錄',
      addLog: '新增會議記錄',
      date: '日期',
      type: '類型',
      summary: '摘要',
      notes: '原始筆記',
      summarize: 'AI 摘要',
      noLogs: '尚無會議記錄。',
      deleteConfirm: '確定要刪除此會議記錄？',
      types: {
        Intro: '介紹',
        PolicyReview: '保單檢視',
        Claim: '理賠',
        Upsell: '加保',
        General: '一般'
      }
    },
    products: {
      title: 'Product Library',
      subtitle: '集中管理保險計劃及提取規則。',
      addProduct: '新增產品',
      editProduct: '編輯產品',
      save: '儲存變更',
      cancel: '取消',
      searchPlaceholder: '搜尋產品...',
      table: {
        name: '產品名稱',
        provider: '供應商',
        type: '類別',
        tags: '自動標籤',
        actions: '操作',
        noProducts: '未找到產品。'
      },
      form: {
        name: '產品名稱',
        provider: '供應商',
        type: '類別',
        tags: '標籤',
        addTag: '新增標籤',
        taxDeductible: '可扣稅',
        annualLimit: '年度保障限額 (醫療)',
        lifeLimit: '終身保障限額 (醫療)'
      }
    },
    reminders: {
      title: '續保與審查',
      subtitle: '監控即將到週年日的保單，以進行客戶審查或更新文件。',
      daysRemaining: '剩餘天數',
      policyDetails: '保單詳情',
      anniversary: '週年日',
      status: '狀態',
      actions: '操作',
      uploadRenewal: '上傳續保文件',
      contact: '聯絡',
      noReminders: '未來60天內無即將到期的保單審查。',
      urgent: '緊急',
      upcoming: '即將到來',
      filterAll: '全部',
      filterUrgent: '緊急 (<30 天)'
    },
    report: {
      backToDetails: '返回詳情',
      title: '客戶報告預覽',
      generating: '產生中...',
      downloadBtn: '下載 PDF',
      protection: '保障 Protection',
      age: '年齡',
      totalLife: '人壽總保額',
      totalCI: '危疾總保額',
      totalAnnualPremium: '年度總保費',
      visibleColumns: '顯示欄位:',
      totalsApprox: '總計 (約 HKD):',
      life: '人壽:',
      ci: '危疾:',
      prem: '保費:',
      yr: '/ 年',
      // Column Labels
      columns: {
        'company_plan': '公司 / 計劃',
        'effective': '生效日期',
        'term': '年期',
        'status': '狀態',
        'insured': '受保人',
        'life': '人壽',
        'ci': '危疾',
        'medical': '醫療',
        'accident': '意外',
        'currency': '貨幣',
        'premium_amt': '金額',
        'payment_mode': '繳費模式',
        'tax_deductible': '可扣稅'
      }
    },
    settings: {
      title: '設定',
      accountSystem: '帳戶與系統',
      notSignedIn: '未登入',
      signInPrompt: '請透過同步按鈕登入以連結帳戶。',
      preferences: '偏好設定',
      language: '語言',
      aiParsing: 'AI 解析設定',
      aiProvider: 'AI 供應商',
      baseUrl: 'API 基礎網址',
      apiKey: 'API 金鑰',
      storedLocally: '金鑰儲存於瀏覽器本地端中。',
      verifySave: '驗證並儲存',
      clear: '清除',
      selectModel: '選擇 AI 模型',
      keyWorks: '金鑰與所選模型可用。',
      keyNotVerified: '金鑰已儲存但未經驗證。請點擊「驗證並儲存」檢查可用模型。',
      connection: '資料庫連線',
      spreadsheetId: 'Google Sheet ID',
      notConnected: '未連線',
      test: '測試連線',
      rulesNotifs: '規則與通知',
      reminderDays: '保單週年日提醒 (天數)',
      reminderDesc: '此天數內將顯示客戶保單檢閱續保的提醒。',
      pdfStudio: 'PDF 報告版面 (工作室)',
      pdfStudioDesc: '自訂在客戶 PDF 報告中顯示的欄位。變更將套用至全域。',
      dataManagement: '資料管理',
      exportData: '匯出資料 (JSON)',
      clearCache: '清除本地快取'
    }
  }
};

// Assuming current demo date is roughly Oct 1st, 2023 for context

export const MOCK_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'Alice Johnson',
    email: 'alice.j@example.com',
    phone: '+1 (555) 123-4567',
    birthday: '1985-10-05',
    totalPolicies: 2,
    lastContact: '2023-10-15',
    status: 'Active',
    tags: ['AIA', 'Life', 'Medical']
  },
  {
    id: 'c2',
    name: 'Michael Chen',
    email: 'm.chen@techcorp.com',
    phone: '+1 (555) 987-6543',
    birthday: '1990-10-12',
    totalPolicies: 1,
    lastContact: '2023-10-12',
    status: 'Lead',
    tags: ['Prudential', 'Accident']
  },
  {
    id: 'c3',
    name: 'Sarah Connor',
    email: 's.connor@sky.net',
    phone: '+1 (555) 456-7890',
    birthday: '1978-11-20',
    totalPolicies: 3,
    lastContact: '2023-09-28',
    status: 'Active',
    tags: ['Sunlife', 'Home', 'Critical Illness', 'VIP']
  },
  {
    id: 'c4',
    name: 'James Wright',
    email: 'j.wright@law.com',
    phone: '+1 (555) 234-5678',
    birthday: '1982-05-15',
    totalPolicies: 1,
    lastContact: '2023-10-18',
    status: 'Active',
    tags: ['AIA', 'Maid']
  },
];

export const RECENT_POLICIES: PolicyData[] = [
  {
    id: 'p1',
    policyNumber: 'POL-88329',
    planName: 'CEO Medical Plan',
    holderName: 'Alice Johnson',
    type: 'Medical', // Updated to Medical
    policyAnniversaryDate: '25/10',
    paymentMode: 'Yearly',
    currency: 'HKD',
    premiumAmount: 1200,
    status: 'Active',
    medicalPlanType: 'High-End Private', // High end
    medicalExcess: 5000,
    riders: [
      { name: 'Dental Care Plus', type: 'Medical', premiumAmount: 200 }
    ]
  },
  {
    id: 'p2',
    policyNumber: 'POL-99120',
    planName: 'Accident Safe 360', // Renamed for Context
    holderName: 'Sarah Connor',
    type: 'Accident', // Changed to Accident
    policyAnniversaryDate: '15/05',
    paymentMode: 'Half-Yearly',
    currency: 'HKD',
    premiumAmount: 850,
    status: 'Active',
    sumInsured: 1000000, // Death/Critical
    accidentMedicalLimit: 50000,
    accidentPhysioVisits: 15
  },
  {
    id: 'p3',
    policyNumber: 'POL-77212',
    planName: 'Home Protect Plus',
    holderName: 'James Wright',
    type: 'Property',
    policyAnniversaryDate: '01/11',
    paymentMode: 'Yearly',
    currency: 'USD',
    premiumAmount: 2400,
    status: 'Pending',
    riders: [
      { name: 'Flood Protection', type: 'Property', premiumAmount: 150 },
      { name: 'Theft Cover', type: 'Property', premiumAmount: 100 }
    ]
  },
  // Added new Mock Policy for CI
  {
    id: 'p4',
    policyNumber: 'POL-CI-2022',
    planName: 'Crisis Cover Multi',
    holderName: 'Alice Johnson',
    type: 'Critical Illness',
    policyAnniversaryDate: '01/02',
    paymentMode: 'Monthly',
    currency: 'HKD',
    premiumAmount: 300,
    status: 'Active',
    sumInsured: 500000,
    isMultipay: true
  },
  {
    id: 'p5',
    policyNumber: 'POL-HI-999',
    planName: 'Daily Cash Income',
    holderName: 'Alice Johnson',
    type: 'Hospital Income',
    policyAnniversaryDate: '01/06',
    paymentMode: 'Yearly',
    currency: 'HKD',
    premiumAmount: 800,
    status: 'Active',
    effectiveDate: '2024-06-01'
  }
];
