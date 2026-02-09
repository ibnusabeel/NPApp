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
    labelWidth: number;  // cm
    labelHeight: number; // cm
    prices: IPrice[];
    createdAt?: string;
    updatedAt?: string;
}

// Predefined units for Thai commerce
export const PRODUCT_UNITS = [
    'ใบ',
    'ชิ้น',
    'แพ็ค',
    'โหล',
    'เมตร',
    'กิโลกรัม',
    'ลิตร',
    'ขวด',
    'กล่อง',
    'ถุง',
    'ม้วน',
    'แผ่น',
    'คู่',
    'ชุด',
] as const;

// Default label dimensions
export const DEFAULT_LABEL_WIDTH = 10; // cm
export const DEFAULT_LABEL_HEIGHT = 2.5; // cm

// Common categories
export const PRODUCT_CATEGORIES = [
    'บรรจุภัณฑ์',
    'เครื่องสำอาง',
    'อาหาร',
    'เครื่องดื่ม',
    'เครื่องเขียน',
    'ของใช้ในบ้าน',
    'อิเล็กทรอนิกส์',
    'อื่นๆ',
] as const;
