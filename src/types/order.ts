import { Customer } from "./customer";
import { Item } from "./item";

export enum PaymentMethod {
  CASH = "cash",
  BANK_TRANSFER = "bank_transfer",
  DIRECT_DEBIT = "direct_debit",
  DELIVERY_NOTE = "delivery_note",
}

export enum OrderStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  PAUSED = "paused",
}

export enum Frequency {
  DAILY = "daily",
  WEEKDAYS = "weekdays",
  WEEKLY = "weekly",
  BIWEEKLY = "biweekly",
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  SEMI_ANNUALLY = "semi_annually",
  ANNUALLY = "annually",
}

export enum VatRate {
  NONE = 0,
  REDUCED = 7,
  STANDARD = 19,
}

export interface OrderItem {
  item: Item;
  quantity: number;
  unitPrice: number;
  vatRate: VatRate;
  netAmount: number;
  grossAmount: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer: Customer;
  items: OrderItem[];
  paymentMethod: PaymentMethod;
  driverNote?: string;
  startDate: string;
  endDate?: string;
  frequency?: Frequency;
  status: OrderStatus;
  totalNetAmount: number;
  totalGrossAmount: number;
  createdAt: string;
  updatedAt: string;
}
