'use client';
import { useEffect, useState } from 'react';
import type { Menu, Order, PublicRestaurant, StaffMember } from '@/contract';
export type DemoStaff = StaffMember & { demoPin: string };
export type DemoWorkspace = { restaurant: PublicRestaurant; tableCount: number; menu: Menu; orders: Order[]; demoUpiId: string; staff: DemoStaff[] };
const KEY = 'tabletap.owner-demo.workspace.v1';
const EVENT = 'tabletap-owner-demo';
export function readDemoWorkspace(): DemoWorkspace | null {
  try { const value = JSON.parse(localStorage.getItem(KEY) ?? 'null'); return value && value.restaurant && Array.isArray(value.menu?.items) && Array.isArray(value.orders) ? { ...value, staff: Array.isArray(value.staff) ? value.staff : [] } : null; } catch { return null; }
}
export function saveDemoWorkspace(value: DemoWorkspace) { localStorage.setItem(KEY, JSON.stringify(value)); window.dispatchEvent(new Event(EVENT)); }
export function clearDemoWorkspace() { localStorage.removeItem(KEY); window.dispatchEvent(new Event(EVENT)); }
export function useDemoWorkspace() {
  const [workspace, setWorkspace] = useState<DemoWorkspace | null>(null);
  useEffect(() => { const refresh = () => setWorkspace(readDemoWorkspace()); refresh(); window.addEventListener('storage', refresh); window.addEventListener(EVENT, refresh); return () => { window.removeEventListener('storage', refresh); window.removeEventListener(EVENT, refresh); }; }, []);
  return workspace;
}
export function addDemoOrder(order: Order) { const workspace = readDemoWorkspace(); if (workspace) saveDemoWorkspace({ ...workspace, orders: [order, ...workspace.orders].slice(0, 100) }); }
export function changeDemoOrder(id: string, patch: Partial<Order>) { const workspace = readDemoWorkspace(); if (workspace) saveDemoWorkspace({ ...workspace, orders: workspace.orders.map(order => order.id === id ? { ...order, ...patch } : order) }); }
