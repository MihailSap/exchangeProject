export type LotStatus = "DRAFT" | "MODERATION" | "REJECTED" | "ACTIVE" | "ARCHIVED" | "IN_EXCHANGE" | "COMPLETED" | "DELETED";
export type Lot = {
  id: number;
  title: string;
  description: string;
  type: "PRODUCT" | "SERVICE";
  delivery_method: "DELIVERY" | "PICKUP" | "BOTH";
  estimated_cost: number;
  category: { id: number; name: string };
  region: string;
  photos: { order: number; name: string }[];
  owner: { id: number; name: string; rating: number | null };
  wants: { want_type: "LOT" | "KEYWORDS" | "CATEGORY" | "ANY"; keywords: string | null; target_category: { id: number; name: string } | null; target_lot: string | null }[];
  status: LotStatus;
  published_at: string | null;
  expires_at: string | null;
};
