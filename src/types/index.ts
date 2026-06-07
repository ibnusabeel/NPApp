export interface IPrice {
    quantity: number;
    price: number;
    unit?: string; // Optional unit per price tier
}

export interface IProduct {
    _id?: string;
    name: string;
    code: string;
    image?: string;
    packing: string;
    unit: string; // Default unit (ใบ, แพ็ค, เมตร, ชิ้น, โหล, etc.)
    category?: string;
    labelWidth: number; // cm
    labelHeight: number; // cm
    prices: IPrice[];
    createdAt?: string;
    updatedAt?: string;
}

// Predefined units for Thai commerce
export const PRODUCT_UNITS = [
    "ใบ",
    "ชิ้น",
    "แพ็ค",
    "โหล",
    "เมตร",
    "กิโลกรัม",
    "ลิตร",
    "ขวด",
    "กล่อง",
    "ถุง",
    "ม้วน",
    "แผ่น",
    "คู่",
    "ชุด",
] as const;

// Default label dimensions
export const DEFAULT_LABEL_WIDTH = 10; // cm
export const DEFAULT_LABEL_HEIGHT = 2.5; // cm

// Common categories
export const PRODUCT_CATEGORIES = [
    "บรรจุภัณฑ์",
    "เครื่องสำอาง",
    "อาหาร",
    "เครื่องดื่ม",
    "เครื่องเขียน",
    "ของใช้ในบ้าน",
    "อิเล็กทรอนิกส์",
    "อื่นๆ",
] as const;

// ─── SlipCheck Module Types ───

export interface ISlipSenderReceiver {
    name: string | null;
    account: string | null;
    bank: string | null;
}

export interface ISlipRecord {
    _id?: string;
    lineUserId: string;
    lineMessageId?: string;
    eventTimestamp?: string;
    customerCode?: string | null;
    customerName?: string | null;
    allocationStatus?: "pending" | "allocated" | "unallocated" | null;
    allocatedInvoiceId?: string | null;
    allocatedAmount?: number | null;
    success: boolean;
    verified: boolean;
    verificationMode: "slipok" | "qr" | "silent";
    amount: number | null;
    transDate: string | null;
    transTime: string | null;
    transRef: string | null;
    sendingBank: string | null;
    bankName: string | null;
    sender: ISlipSenderReceiver | null;
    receiver: ISlipSenderReceiver | null;
    slipokCode: number | null;
    message: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface ICustomer {
    _id?: string;
    customerCode: string;
    name: string;
    phone: string;
    lineUserId?: string | null;
    linkedAt?: string | null;
    lineDisplayName?: string | null;
    linePictureUrl?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface IInvoicePayment {
    slipRecordId?: string | null;
    amount: number;
    paidAt: string;
}

export interface IInvoice {
    _id?: string;
    invoiceNo: string;
    customerId?: string;
    customerCode: string;
    customerName: string;
    amount: number;
    paidAmount: number;
    status: "pending" | "partial" | "paid";
    dueDate?: string | null;
    note?: string;
    payments?: IInvoicePayment[];
    remaining?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface ILineFollower {
    userId: string;
    displayName: string | null;
    pictureUrl: string | null;
    linkedCustomerCode?: string | null;
    linkedCustomerName?: string | null;
    lastAt?: string;
    slipCount?: number;
}

export interface IDashboardOverview {
    slips: {
        total: number;
        today: number;
        todaySuccess: number;
        todayAmount: number;
        verifiedTotal: number;
    };
    customers: {
        total: number;
        linked: number;
    };
    invoices: {
        total: number;
        pending: number;
        partial: number;
        outstanding: number;
    };
    unallocatedSlips: number;
    recentSlips: ISlipRecord[];
    pendingInvoices: IInvoice[];
    system: {
        mongo: boolean;
        qrFallback: boolean;
        autoCustomerOnFollow: boolean;
        quota: any;
    };
}

export interface IModuleRegistry {
    version: string;
    groups: {
        id: string;
        label: string;
        modules: {
            id: string;
            path: string;
            label: string;
            icon: string;
            enabled: boolean;
            badge?: string;
        }[];
    }[];
}

export interface ISlipOkQuota {
    success?: boolean;
    data?: {
        total?: number;
        used?: number;
        remaining?: number;
    };
}

export interface ISlipTestResult {
    mode: "slipok" | "qr" | "qr-only" | "silent" | "error";
    message?: string;
    slipok?: any;
    qr?: any;
    error?: string;
}
