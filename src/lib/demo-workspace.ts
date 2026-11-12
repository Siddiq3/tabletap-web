'use client';
import { useEffect, useState } from 'react';
import type { BillAmounts, BillKind, BillPayment, BillStatus, Menu, Order, PublicRestaurant, StaffMember } from '@/contract';
export type DemoStaff = StaffMember & { demoPin: string };
/** A bill in browser storage; mirrors the bills table (frozen = amounts locked when it closed). */
export type DemoBill = {
  id: string; invoiceNo: number; kind: BillKind; status: BillStatus; tableId: string | null; tableLabel: string | null;
  customerName: string | null; customerPhone: string | null; discountPaise: number; discountReason: string | null;
  serviceChargeOn: boolean; openedAt: string; settledAt: string | null; voidReason: string | null;
  payments: BillPayment[]; frozen: BillAmounts | null;
};
export type DemoRestaurant = PublicRestaurant & { gstin?: string | null; fssai?: string | null; serviceChargePercent?: number; packagingPaise?: number };
export type DemoWorkspace = { restaurant: DemoRestaurant; tableCount: number; menu: Menu; orders: Order[]; demoUpiId: string; staff: DemoStaff[]; bills: DemoBill[] };
const KEY = 'tabletap.owner-demo.workspace.v1';
const EVENT = 'tabletap-owner-demo';
export function readDemoWorkspace(): DemoWorkspace | null {
  try { const value = JSON.parse(localStorage.getItem(KEY) ?? 'null'); return value && value.restaurant && Array.isArray(value.menu?.items) && Array.isArray(value.orders) ? { ...value, staff: Array.isArray(value.staff) ? value.staff : [], bills: Array.isArray(value.bills) ? value.bills : [] } : null; } catch { return null; }
}
export function saveDemoWorkspace(value: DemoWorkspace) { localStorage.setItem(KEY, JSON.stringify(value)); window.dispatchEvent(new Event(EVENT)); }
export function clearDemoWorkspace() { localStorage.removeItem(KEY); window.dispatchEvent(new Event(EVENT)); }
export function useDemoWorkspace() {
  const [workspace, setWorkspace] = useState<DemoWorkspace | null>(null);
  useEffect(() => { const refresh = () => setWorkspace(readDemoWorkspace()); refresh(); window.addEventListener('storage', refresh); window.addEventListener(EVENT, refresh); return () => { window.removeEventListener('storage', refresh); window.removeEventListener(EVENT, refresh); }; }, []);
  return workspace;
}
export function changeDemoOrder(id: string, patch: Partial<Order>) { const workspace = readDemoWorkspace(); if (workspace) saveDemoWorkspace({ ...workspace, orders: workspace.orders.map(order => order.id === id ? { ...order, ...patch } : order) }); }
