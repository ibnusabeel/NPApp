import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "NP SlipCheck - ตรวจสอบสลิป & การเงิน",
    description: "Dashboard ตรวจสอบสลิปโอนเงิน จัดการลูกค้า และใบแจ้งหนี้",
};

export default function SlipCheckLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
