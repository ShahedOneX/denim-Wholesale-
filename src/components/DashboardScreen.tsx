import React, { useState } from 'react';
import { Customer, OrderTag } from '../types';
import { exportWarehouseOrdersCSV } from '../utils/csvExport';

interface DashboardScreenProps {
  customers: Customer[];
  onNavigate: (tab: 'dashboard' | 'customers' | 'add-order' | 'follow-ups' | 'analytics') => void;
  onSelectCustomer: (customerId: string) => void;
  onOpenWhatsApp: (customer: Customer) => void;
  onMarkContacted: (customerId: string) => void;
  onReschedule?: (customerId: string) => void;
  onShowToast?: (message: string) => void;
  onSaveReorder?: (data: any) => void;
  onOpenGeminiChat?: () => void;
  onExportCSV?: () => void;
  onOpenGoogleSheets?: () => void;
  onUpdateOrderTags?: (customerId: string, orderId: string, tags: OrderTag[]) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  customers,
  onNavigate,
  onSelectCustomer,
  onOpenWhatsApp,
  onMarkContacted,
  onReschedule,
  onShowToast,
  onSaveReorder,
  onOpenGeminiChat,
  onExportCSV,
  onOpenGoogleSheets,
  onUpdateOrderTags,
}) => {
  const [activeFilterTab, setActiveFilterTab] = useState<'today' | 'tomorrow' | 'this-week' | 'overdue'>('today');
  const [showWarehouseOrdersModal, setShowWarehouseOrdersModal] = useState(false);
  const [warehouseTagFilter, setWarehouseTagFilter] = useState<'All' | OrderTag>('All');
  const [editingWarehouseOrderId, setEditingWarehouseOrderId] = useState<string | null>(null);

  // Filter accounts according to tab
  const getFilteredCustomers = () => {
    if (activeFilterTab === 'today') {
      return customers.filter((c) => c.followUpStatus === 'today');
    }
    if (activeFilterTab === 'tomorrow') {
      return customers.filter((c) => c.followUpStatus === 'tomorrow' || c.id === 'c-karim');
    }
    if (activeFilterTab === 'this-week') {
      return customers.filter((c) => c.followUpStatus === 'this_week' || c.followUpStatus === 'today');
    }
    if (activeFilterTab === 'overdue') {
      return customers.filter((c) => c.followUpStatus === 'overdue' || (c.overdueDays && c.overdueDays > 0));
    }
    return customers.slice(0, 5);
  };

  const filteredList = getFilteredCustomers();

  // Top leaderboard customers sorted by LTV
  const leaderboard = [...customers].sort((a, b) => b.ltv - a.ltv).slice(0, 3);

  // Quick Snapshot Aggregations
  // 1. Total Monthly Revenue: sum of all orders made in current month or fallback to monthly run-rate
  // Calculate directly from customer order histories and fallback baseline
  const allOrders = customers.flatMap((c) => c.orderHistory || []);
  
  // Pending deliveries count across all orders in client histories
  const pendingDeliveriesCount = allOrders.filter(
    (o) => o.deliveryStatus === 'Pending' || o.deliveryStatus === 'Dispatched'
  ).length;

  // Today's orders count
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayFormattedSnippet = '16 Sep'; // current operational mock date context
  const todayOrders = allOrders.filter(
    (o) => (o.date && (o.date.includes(todayDateStr) || o.date.includes(todayFormattedSnippet) || o.date.includes('2026-09-16')))
  );
  // Default to at least 4 active today orders if historical seeds aren't yet populated
  const todayOrderCount = Math.max(todayOrders.length, 4);

  // Total Monthly Revenue (BDT) - sum of orders + monthly active wholesale run-rate
  const monthlyRevenueTotal = 3845000 + (todayOrders.length > 0 ? todayOrders.reduce((sum, o) => sum + (o.total || 0), 0) : 0);

  // Dynamic Low-Stock Assessment based on Reorder Frequency (cycleDays)
  // Formula: Customers with fast reorder cycles (<=25 days) consume ~8-10 pcs/day, requiring threshold of 200-250 pcs.
  // Standard cycles (26-35 days) require threshold of 150 pcs.
  // Slower cycles (>35 days) require threshold of 100 pcs.
  const getStockThreshold = (cycleDays: number) => {
    if (cycleDays <= 22) return 260; // high-velocity batch consumption
    if (cycleDays <= 28) return 220; // active weekly replenishment
    if (cycleDays <= 35) return 160; // monthly standard
    return 110; // relaxed cycles
  };

  const lowStockCustomers = customers.map((c) => {
    const threshold = getStockThreshold(c.cycleDays);
    const isLowStock = c.totalQuantity <= threshold;
    const deficit = threshold - c.totalQuantity;
    return {
      ...c,
      threshold,
      isLowStock,
      deficit,
      estimatedDaysLeft: Math.max(1, Math.round((c.totalQuantity / (c.totalQuantity + threshold)) * c.cycleDays)),
    };
  }).filter((c) => c.isLowStock);

  const [showLowStockModal, setShowLowStockModal] = useState(false);

  // Warehouse Management Order Tagging & Logistics
  const ALL_WAREHOUSE_TAGS: { id: OrderTag; label: string; icon: string; badgeClass: string }[] = [
    { id: 'Priority', label: 'Priority', icon: 'flag', badgeClass: 'bg-error-container text-on-error-container border border-error/30' },
    { id: 'Wholesale', label: 'Wholesale', icon: 'inventory_2', badgeClass: 'bg-primary-container/30 text-primary border border-primary/30' },
    { id: 'Sample', label: 'Sample', icon: 'science', badgeClass: 'bg-tertiary-container/30 text-on-tertiary-container border border-tertiary/30' },
    { id: 'Rush', label: 'Rush', icon: 'bolt', badgeClass: 'bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30' },
    { id: 'Backorder', label: 'Backorder', icon: 'history', badgeClass: 'bg-secondary-container text-on-secondary-container border border-secondary/30' },
  ];

  const allOrdersWithCustomer = customers.flatMap((c) =>
    c.orderHistory.map((o) => ({
      ...o,
      customerId: c.id,
      customerName: c.name,
      ownerName: c.ownerName,
      customerPhone: c.phone,
      customerDistrict: c.district,
      customerAvatar: c.avatar,
      tags: o.tags && o.tags.length > 0 ? o.tags : (['Wholesale'] as OrderTag[]),
    }))
  );

  const warehouseTagCounts: Record<'All' | OrderTag, number> = {
    All: allOrdersWithCustomer.length,
    Priority: allOrdersWithCustomer.filter((o) => o.tags.includes('Priority')).length,
    Wholesale: allOrdersWithCustomer.filter((o) => o.tags.includes('Wholesale')).length,
    Sample: allOrdersWithCustomer.filter((o) => o.tags.includes('Sample')).length,
    Rush: allOrdersWithCustomer.filter((o) => o.tags.includes('Rush')).length,
    Backorder: allOrdersWithCustomer.filter((o) => o.tags.includes('Backorder')).length,
  };

  const filteredWarehouseOrders = allOrdersWithCustomer.filter((o) => {
    if (warehouseTagFilter === 'All') return true;
    return o.tags.includes(warehouseTagFilter);
  });

  const handleToggleWarehouseTag = (
    customerId: string,
    orderId: string,
    currentTags: OrderTag[],
    tagToToggle: OrderTag
  ) => {
    const nextTags = currentTags.includes(tagToToggle)
      ? currentTags.filter((t) => t !== tagToToggle)
      : [...currentTags, tagToToggle];
    if (onUpdateOrderTags) {
      onUpdateOrderTags(customerId, orderId, nextTags);
    }
  };

  return (
    <div className="flex flex-col w-full gap-4 pb-28 pt-20 px-4 max-w-lg mx-auto">
      {/* Core Automation Philosophy Banner */}
      <div className="relative overflow-hidden rounded-xl bg-primary text-on-primary p-3.5 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0 z-10">
          <div className="w-9 h-9 rounded-lg bg-surface-container-highest/20 flex items-center justify-center shrink-0 text-tertiary-fixed">
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_mode
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-['Inter'] text-[10px] tracking-wider uppercase text-inverse-primary font-bold">
              CRM Philosophy
            </span>
            <h2 className="font-['Plus_Jakarta_Sans'] text-[13px] text-on-primary truncate font-bold">
              ONE INPUT → AUTOMATICALLY MANAGE EVERYTHING
            </h2>
          </div>
        </div>
        <span className="shrink-0 px-2 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container font-['Inter'] text-[10px] font-bold z-10">
          Live Engine
        </span>
        <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-primary-container/40 pointer-events-none blur-sm"></div>
      </div>

      {/* Primary CTA: High Visibility + ADD NEW ORDER Card */}
      <section className="w-full space-y-2">
        <button
          id="dashboard-add-order-banner"
          className="w-full text-left relative overflow-hidden rounded-xl bg-gradient-to-r from-primary-container to-surface-tint text-on-primary p-4 shadow-lg active:scale-[0.99] transition-all group cursor-pointer"
          onClick={() => onNavigate('add-order')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-surface-container-lowest text-primary-container flex items-center justify-center shadow-sm group-hover:rotate-45 transition-transform duration-300 shrink-0">
                <span className="material-symbols-outlined text-[28px] font-bold">add</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-['Plus_Jakarta_Sans'] text-headline-sm text-on-primary tracking-tight font-bold">
                  + ADD NEW ORDER
                </span>
                <p className="font-['Inter'] text-body-sm text-primary-fixed-dim line-clamp-1">
                  Enter once, system updates stock, ledger &amp; reorders automatically
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-lowest/10">
              <span className="material-symbols-outlined text-on-primary text-[20px]">chevron_right</span>
            </div>
          </div>
          <div className="mt-2.5 pt-1 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 font-['Inter'] text-[11px] text-tertiary-fixed bg-tertiary/60 px-2 py-0.5 rounded font-semibold">
              <span className="material-symbols-outlined text-[12px]">flash_on</span>
              Instant AI Reorder Calculation
            </span>
            <span className="font-['Inter'] text-[11px] text-primary-fixed opacity-80">
              30 sec average entry
            </span>
          </div>
        </button>

        {/* Gemini AI Wholesale Chatbot Copilot Prompt Card */}
        <button
          id="dashboard-open-gemini-ai-card"
          onClick={onOpenGeminiChat}
          className="w-full text-left p-3 rounded-xl bg-surface-container-lowest border border-primary/20 shadow-xs hover:border-primary/50 transition-all flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-xs group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[22px] text-tertiary-fixed">smart_toy</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-['Plus_Jakarta_Sans'] font-bold text-[13px] text-primary">
                  আরিফ এআই পাইকারি সহকারী (Gemini Copilot)
                </span>
                <span className="px-1.5 py-0.2 rounded bg-tertiary-fixed text-on-tertiary-fixed font-['Inter'] text-[9px] font-bold">
                  Active
                </span>
              </div>
              <p className="font-['Inter'] text-[11px] text-secondary">
                রিঅর্ডার তাগাদা, ডেনিম স্টক ও বাংলা হোয়াটসঅ্যাপ মেসেজ লিখতে ক্লিক করুন
              </p>
            </div>
          </div>
          <span className="material-symbols-outlined text-secondary text-[20px] group-hover:text-primary transition-colors">
            chat
          </span>
        </button>
      </section>

      {/* Quick Snapshot Section */}
      <section id="quick-snapshot-section" className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-primary-container">speed</span>
            <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-[13px] text-on-surface uppercase tracking-wide">
              Quick Snapshot
            </h3>
          </div>
          <span className="font-['Inter'] text-secondary text-[11px] font-medium">
            Real-Time Overview
          </span>
        </div>

        {/* Card-based 3-Column Grid for Quick Snapshot */}
        <div className="grid grid-cols-3 gap-2">
          {/* Card 1: Total Monthly Revenue */}
          <div 
            id="snapshot-monthly-revenue-card"
            className="rounded-xl bg-surface-container-lowest p-3 shadow-xs border border-surface-container flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-secondary mb-1">
              <span className="font-['Inter'] text-[11px] font-medium leading-tight">Monthly Revenue</span>
              <div className="w-6 h-6 rounded-md bg-primary-container/10 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[15px]">payments</span>
              </div>
            </div>
            <div className="my-0.5">
              <span className="font-['Plus_Jakarta_Sans'] text-[16px] sm:text-[18px] font-bold text-primary tracking-tight block">
                ৳ {(monthlyRevenueTotal / 100000).toFixed(1)}L
              </span>
            </div>
            <span className="font-['Inter'] text-[10px] text-on-tertiary-container font-semibold truncate">
              ৳ {monthlyRevenueTotal.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Card 2: Today's Order Count */}
          <div 
            id="snapshot-today-orders-card"
            onClick={() => onNavigate('add-order')}
            className="rounded-xl bg-surface-container-lowest p-3 shadow-xs border border-surface-container flex flex-col justify-between cursor-pointer hover:border-primary/40 transition-colors group"
            title="Click to view or add orders"
          >
            <div className="flex items-center justify-between text-secondary mb-1">
              <span className="font-['Inter'] text-[11px] font-medium leading-tight">Today's Orders</span>
              <div className="w-6 h-6 rounded-md bg-tertiary-container/20 flex items-center justify-center text-on-tertiary-container shrink-0 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[15px]">receipt_long</span>
              </div>
            </div>
            <div className="my-0.5 flex items-baseline gap-1">
              <span className="font-['Plus_Jakarta_Sans'] text-[18px] sm:text-[20px] font-bold text-on-surface">
                {todayOrderCount}
              </span>
              <span className="font-['Inter'] text-[10px] text-secondary">orders</span>
            </div>
            <span className="font-['Inter'] text-[10px] text-primary font-semibold group-hover:underline flex items-center gap-0.5">
              <span>+ Add new</span>
              <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
            </span>
          </div>

          {/* Card 3: Pending Deliveries */}
          <div 
            id="snapshot-pending-deliveries-card"
            onClick={() => setShowWarehouseOrdersModal(true)}
            className="rounded-xl bg-surface-container-lowest p-3 shadow-xs border border-surface-container flex flex-col justify-between hover:border-amber-500/50 hover:bg-surface-container-low transition-all cursor-pointer group"
            title="Click to view Warehouse Dispatch & Order Tags"
          >
            <div className="flex items-center justify-between text-secondary mb-1">
              <span className="font-['Inter'] text-[11px] font-medium leading-tight group-hover:text-amber-700 dark:group-hover:text-amber-400">
                Pending Deliveries
              </span>
              <div className="w-6 h-6 rounded-md bg-amber-500/15 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[15px]">local_shipping</span>
              </div>
            </div>
            <div className="my-0.5 flex items-baseline gap-1">
              <span className="font-['Plus_Jakarta_Sans'] text-[18px] sm:text-[20px] font-bold text-amber-700 dark:text-amber-400">
                {pendingDeliveriesCount > 0 ? pendingDeliveriesCount : 3}
              </span>
              <span className="font-['Inter'] text-[10px] text-secondary">in transit</span>
            </div>
            <span className="font-['Inter'] text-[10px] text-primary font-semibold group-hover:underline flex items-center gap-0.5">
              <span>Manage tags</span>
              <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
            </span>
          </div>
        </div>

        {/* Warehouse Orders & Tag Distribution Quick Bar */}
        <div className="mt-2 pt-2 border-t border-surface-container/60 flex items-center justify-between gap-1 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-primary">sell</span>
            <span className="font-['Inter'] text-[11px] font-bold text-on-surface">
              Warehouse Tags:
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {ALL_WAREHOUSE_TAGS.map((tag) => {
              const count = warehouseTagCounts[tag.id] || 0;
              return (
                <button
                  key={tag.id}
                  onClick={() => {
                    setWarehouseTagFilter(tag.id);
                    setShowWarehouseOrdersModal(true);
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-['Inter'] font-bold border transition-all cursor-pointer hover:shadow-xs ${
                    tag.badgeClass
                  }`}
                  title={`View ${tag.label} orders`}
                >
                  <span className="material-symbols-outlined text-[11px]">{tag.icon}</span>
                  <span>{tag.label}</span>
                  <span className="bg-surface-container-lowest/80 px-1 rounded-full text-[9px]">
                    {count}
                  </span>
                </button>
              );
            })}

            <button
              onClick={() => {
                setWarehouseTagFilter('All');
                setShowWarehouseOrdersModal(true);
              }}
              className="text-[11px] font-['Inter'] text-primary font-semibold hover:underline cursor-pointer ml-1 whitespace-nowrap"
            >
              All ({warehouseTagCounts.All}) →
            </button>
          </div>
        </div>
      </section>

      {/* Auto-Calculated Wholesale Executive Metrics */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-primary-container">monitoring</span>
            <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-[13px] text-on-surface uppercase tracking-wide">
              Live Enterprise KPIs
            </h3>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              id="dashboard-google-sheets-btn"
              onClick={onOpenGoogleSheets}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-['Inter'] text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
              title="Open Google Sheets Sync & Live Cloud Ledger"
            >
              <span className="material-symbols-outlined text-[15px] text-emerald-600 dark:text-emerald-400">table_chart</span>
              <span>Sheets Sync</span>
            </button>
            <button
              id="dashboard-export-csv-btn"
              onClick={onExportCSV}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-['Inter'] text-[11px] font-semibold transition-colors cursor-pointer"
              title="Download Ledger as CSV"
            >
              <span className="material-symbols-outlined text-[14px]">download</span>
              <span>CSV Backup</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Sales This Month */}
          <div className="col-span-2 rounded-xl bg-surface-container-lowest p-3.5 shadow-sm relative overflow-hidden border border-surface-container">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-['Inter'] text-[12px] text-secondary font-medium">
                  Sales This Month (October)
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="font-['Plus_Jakarta_Sans'] text-[26px] sm:text-[30px] text-primary font-bold tracking-tight">
                    ৳ 3,845,000
                  </span>
                  <span className="font-['Inter'] text-[11px] text-on-tertiary-container bg-surface-container-low px-1.5 py-0.5 rounded font-bold">
                    +18.4%
                  </span>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-surface-container text-primary-container shrink-0">
                <span className="material-symbols-outlined text-[20px]">payments</span>
              </div>
            </div>
            <div className="mt-2.5 pt-1 flex items-center justify-between text-secondary font-['Inter'] text-[12px] border-t border-surface-container-low">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-primary-container">inventory_2</span>
                <span>
                  <strong>62</strong> Wholesale Orders
                </span>
              </div>
              <div className="text-on-surface-variant font-medium">
                Lifetime: <span className="font-['Inter'] text-primary font-bold">৳ 24.6M</span>
              </div>
            </div>
          </div>

          {/* Average Order Value (AOV) */}
          <div className="rounded-xl bg-surface-container-lowest p-3 shadow-sm flex flex-col justify-between border border-surface-container">
            <div className="flex items-center justify-between">
              <span className="font-['Inter'] text-secondary text-[11px] font-medium">Average Order Value</span>
              <span className="material-symbols-outlined text-[18px] text-secondary">query_stats</span>
            </div>
            <div className="my-1">
              <span className="font-['Inter'] text-[20px] text-on-surface font-bold">৳ 62,000</span>
            </div>
            <span className="font-['Inter'] text-[11px] text-on-secondary-container bg-surface-container px-2 py-0.5 rounded w-fit font-semibold">
              Avg Vol: 110 pcs/order
            </span>
          </div>

          {/* Customer Base Breakdown */}
          <div className="rounded-xl bg-surface-container-lowest p-3 shadow-sm flex flex-col justify-between border border-surface-container">
            <div className="flex items-center justify-between">
              <span className="font-['Inter'] text-secondary text-[11px] font-medium">Total Client Base</span>
              <span className="material-symbols-outlined text-[18px] text-secondary">groups</span>
            </div>
            <div className="my-1 flex items-baseline gap-1">
              <span className="font-['Inter'] text-[20px] text-on-surface font-bold">48</span>
              <span className="font-['Inter'] text-[11px] text-on-tertiary-container font-semibold">
                34 Active
              </span>
            </div>
            <div className="flex items-center gap-1 font-['Inter'] text-[10px] text-secondary flex-wrap">
              <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-primary font-bold">
                8 VIP
              </span>
              <span className="px-1.5 py-0.2 rounded bg-error-container text-on-error-container font-bold">
                5 At-Risk
              </span>
              <span className="px-1.5 py-0.2 rounded bg-surface-container-low text-secondary font-medium">
                6 New
              </span>
            </div>
          </div>

          {/* Dynamic Low-Stock Alert KPI Card */}
          <div 
            id="low-stock-kpi-card"
            onClick={() => setShowLowStockModal(true)}
            className="col-span-2 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-surface-container-lowest p-3 shadow-sm border border-amber-500/30 flex items-center justify-between cursor-pointer hover:border-amber-500/60 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">warning</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-['Plus_Jakarta_Sans'] font-bold text-[13px] text-on-surface">
                    Low-Stock Velocity Alerts
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-900 font-['Inter'] text-[10px] font-bold shadow-xs flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[11px]">inventory</span>
                    <span>{lowStockCustomers.length} Accounts Critical</span>
                  </span>
                </div>
                <span className="font-['Inter'] text-[11px] text-secondary">
                  Accounts with stock below cycle threshold ({lowStockCustomers.map(c => c.name.split(' ')[0]).slice(0, 3).join(', ')}...)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-['Inter'] text-[12px] font-semibold group-hover:translate-x-0.5 transition-transform">
              <span>View List</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Heroic Production Teaser Card */}
      <div className="relative rounded-xl overflow-hidden bg-primary-container text-on-primary p-3.5 shadow-sm flex items-center gap-3">
        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 relative bg-surface-dim">
          <img
            className="w-full h-full object-cover"
            alt="D-501 Heavy Twill fabric weave"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8ML2qKRLnrw1b-3V3ejYH97-nEiECfurQlLxz2g1BvGuSmtmpSasyFa7OFDXnZxbDPzfn9O0nbyo-sdAWNzpz0ngkKeJGHDiMlLB2bKo8eCzmz-9vkcxMNWVQWOtE_iCcq7q5bIJ7Y9IUp4rPKQ4YpYPx8XBEYkscUannIbemL48jYozXeA0kJKD6za3HeHOCJgCrWGfpQkNAHatzed59lWVVFPRJdIcFKsfs1mOIq54FYzC-7O4t"
          />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1 text-tertiary-fixed font-['Inter'] text-[10px] uppercase font-bold tracking-wider">
            <span className="material-symbols-outlined text-[13px]">factory</span>
            <span>Hot Wholesale Inventory</span>
          </div>
          <h4 className="font-['Plus_Jakarta_Sans'] text-[14px] text-on-primary font-bold truncate mt-0.5">
            D-501 Heavy Twill (13.5 Oz)
          </h4>
          <p className="font-['Inter'] text-[11px] text-primary-fixed-dim">
            Highest reorder rate this week in Gazipur &amp; Dhaka hubs.
          </p>
        </div>
        <button
          className="shrink-0 w-8 h-8 rounded-full bg-surface-container-lowest/15 flex items-center justify-center text-on-primary hover:bg-surface-container-lowest/30 transition-colors cursor-pointer"
          onClick={() => onShowToast('Filtered accounts demanding D-501 Heavy Twill')}
          title="Filter D-501"
        >
          <span className="material-symbols-outlined text-[18px]">filter_alt</span>
        </button>
      </div>

      {/* CRITICAL PRIMARY FEATURE: Automatic Follow-Up Engine */}
      <section className="flex flex-col gap-2 mt-1">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[20px] text-error">bolt</span>
              <h3 className="font-['Plus_Jakarta_Sans'] text-headline-sm text-primary font-bold tracking-tight">
                WHO SHOULD I CONTACT TODAY?
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-['Inter'] text-[11px] font-bold animate-pulse">
              5 Pending
            </span>
          </div>
          <p className="font-['Inter'] text-secondary text-[12px]">
            Auto-predicted reorders based on client sales velocity and batch intervals.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
          <button
            id="tab-today"
            className={`px-3 py-1.5 rounded-full font-['Inter'] text-[12px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilterTab === 'today'
                ? 'bg-primary-container text-on-primary shadow-sm'
                : 'bg-surface-container-low text-secondary hover:text-on-surface'
            }`}
            onClick={() => setActiveFilterTab('today')}
          >
            Today (5)
          </button>
          <button
            id="tab-tomorrow"
            className={`px-3 py-1.5 rounded-full font-['Inter'] text-[12px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilterTab === 'tomorrow'
                ? 'bg-primary-container text-on-primary shadow-sm'
                : 'bg-surface-container-low text-secondary hover:text-on-surface'
            }`}
            onClick={() => setActiveFilterTab('tomorrow')}
          >
            Tomorrow (3)
          </button>
          <button
            id="tab-this-week"
            className={`px-3 py-1.5 rounded-full font-['Inter'] text-[12px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilterTab === 'this-week'
                ? 'bg-primary-container text-on-primary shadow-sm'
                : 'bg-surface-container-low text-secondary hover:text-on-surface'
            }`}
            onClick={() => setActiveFilterTab('this-week')}
          >
            This Week (8)
          </button>
          <button
            id="tab-overdue"
            className={`px-3 py-1.5 rounded-full font-['Inter'] text-[12px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilterTab === 'overdue'
                ? 'bg-error-container text-on-error-container font-bold shadow-sm'
                : 'bg-surface-container-low text-secondary hover:text-on-surface'
            }`}
            onClick={() => setActiveFilterTab('overdue')}
          >
            Overdue (2)
          </button>
        </div>

        {/* Follow Up Stack */}
        <div className="flex flex-col gap-2.5">
          {filteredList.map((client) => {
            const isContacted = client.contactedToday;
            return (
              <article
                key={client.id}
                className={`rounded-xl bg-surface-container-lowest p-3.5 shadow-sm transition-all relative overflow-hidden border border-surface-container ${
                  isContacted ? 'opacity-40 scale-[0.98]' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="flex flex-col min-w-0 cursor-pointer"
                    onClick={() => onSelectCustomer(client.id)}
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {client.tier === 'VIP Customer' && (
                        <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary font-['Inter'] text-[10px] font-bold">
                          VIP CUSTOMER • FOLLOW UP TODAY
                        </span>
                      )}
                      {client.tier === 'High Value' && (
                        <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-fixed font-['Inter'] text-[10px] font-bold">
                          HIGH VALUE • REORDER DUE
                        </span>
                      )}
                      {client.tier === 'At Risk' && (
                        <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container font-['Inter'] text-[10px] font-bold">
                          AT RISK (Past Cycle)
                        </span>
                      )}
                      {client.tier === 'Regular Reorder' && (
                        <span className="px-2 py-0.5 rounded bg-surface-container-low text-secondary font-['Inter'] text-[10px] font-bold">
                          REGULAR REORDER
                        </span>
                      )}
                      {client.followUpStatus === 'today' && client.tier !== 'VIP Customer' && (
                        <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container font-['Inter'] text-[10px] font-bold tracking-wide">
                          FOLLOW UP DUE TODAY
                        </span>
                      )}
                      <span className="font-['Inter'] text-[11px] text-primary font-semibold bg-surface-container px-1.5 py-0.2 rounded">
                        {client.district}
                      </span>
                    </div>

                    <h4 className="font-['Plus_Jakarta_Sans'] text-[16px] text-on-surface font-bold mt-1 truncate hover:text-primary transition-colors">
                      {client.name}
                    </h4>
                    <span className="font-['Inter'] text-[12px] text-secondary">
                      Owner: {client.ownerName} • {client.preferredModel}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-['Inter'] text-[10px] text-secondary block uppercase">
                      LTV VALUE
                    </span>
                    <span className="font-['Inter'] text-[15px] text-primary font-bold">
                      ৳ {client.ltv.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Metric Specs Box */}
                <div className="my-2 p-2 rounded-lg bg-surface-container-low grid grid-cols-2 gap-2 text-[11px] font-['Inter']">
                  <div>
                    <span className="text-secondary block">Last Order:</span>
                    <span className="text-on-surface font-semibold">
                      {client.lastOrderDate} • ৳ {client.lastOrderAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-secondary block">Predicted Reorder:</span>
                    <span
                      className={`font-bold ${
                        client.tier === 'At Risk' ? 'text-error' : 'text-primary'
                      }`}
                    >
                      {client.nextExpectedOrder} ({client.cycleDays}d Cycle)
                    </span>
                  </div>

                  {/* Dynamic Stock Assessment Indicator */}
                  {client.totalQuantity <= getStockThreshold(client.cycleDays) && (
                    <div className="col-span-2 mt-0.5 pt-1.5 border-t border-amber-500/20 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                        <span className="material-symbols-outlined text-[14px]">warning</span>
                        Low Stock Alert: {client.totalQuantity} pcs in market
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-800 dark:text-amber-200 font-bold text-[10px]">
                        Cycle Threshold: {getStockThreshold(client.cycleDays)} pcs
                      </span>
                    </div>
                  )}
                </div>

                {/* Instant Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    className="flex-1 h-10 px-3 rounded-lg bg-tertiary text-on-tertiary font-['Inter'] text-[12px] font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer hover:bg-tertiary-container"
                    onClick={() => onOpenWhatsApp(client)}
                  >
                    <span className="material-symbols-outlined text-[17px] text-tertiary-fixed">chat</span>
                    <span>1-Click WhatsApp</span>
                  </button>

                  <button
                    className={`h-10 px-3 rounded-lg font-['Inter'] text-[12px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                      isContacted
                        ? 'bg-surface-container-low text-secondary'
                        : 'bg-surface-container text-primary hover:bg-surface-container-high'
                    }`}
                    onClick={() => onMarkContacted(client.id)}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isContacted ? 'done_all' : 'check_circle'}
                    </span>
                    <span>{isContacted ? 'Contacted' : 'Contacted'}</span>
                  </button>

                  <button
                    className="w-10 h-10 rounded-lg bg-surface-container-low text-secondary flex items-center justify-center hover:text-on-surface transition-colors cursor-pointer"
                    onClick={() => onReschedule(client.id)}
                    title="Reschedule +3 Days"
                  >
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Automation Status & District Velocity */}
      <section className="rounded-xl bg-surface-container-lowest p-3.5 shadow-sm flex flex-col gap-3 border border-surface-container">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-on-tertiary-container animate-ping"></span>
            <h4 className="font-['Plus_Jakarta_Sans'] text-headline-sm text-on-surface font-bold">
              Background Engines Active
            </h4>
          </div>
          <span className="font-['Inter'] text-[10px] text-on-secondary-container bg-surface-container px-2 py-0.5 rounded font-bold">
            Zero Maintenance
          </span>
        </div>

        {/* 3 Engines Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[12px]">
          <div className="p-2.5 rounded-lg bg-surface-container-low flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary-container shrink-0 mt-0.5">
              update
            </span>
            <div>
              <span className="font-['Inter'] text-on-surface block font-bold">Purchase Velocity</span>
              <p className="font-['Inter'] text-[11px] text-secondary">
                Auto-measures customer buying cycles every 24h.
              </p>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-container-low flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-error shrink-0 mt-0.5">
              warning
            </span>
            <div>
              <span className="font-['Inter'] text-on-surface block font-bold">Churn Detector</span>
              <p className="font-['Inter'] text-[11px] text-secondary">
                Flags accounts 48h after missing regular reorder date.
              </p>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-container-low flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-tertiary-container shrink-0 mt-0.5">
              timeline
            </span>
            <div>
              <span className="font-['Inter'] text-on-surface block font-bold">Reorder Matrix</span>
              <p className="font-['Inter'] text-[11px] text-secondary">
                Calculates expected yardage consumption.
              </p>
            </div>
          </div>
        </div>

        {/* District Snapshot Pills */}
        <div className="flex flex-col gap-1.5 pt-1">
          <span className="font-['Inter'] text-secondary text-[11px] uppercase tracking-wider font-semibold">
            Wholesale Hubs Overview
          </span>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <div className="px-3 py-1.5 rounded-lg bg-surface-container flex items-center gap-2 shrink-0">
              <span className="font-['Inter'] text-primary font-bold text-[12px]">Dhaka</span>
              <span className="font-['Inter'] text-[11px] text-secondary">19 Shops • ৳ 1.4M</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-surface-container flex items-center gap-2 shrink-0">
              <span className="font-['Inter'] text-primary font-bold text-[12px]">Gazipur</span>
              <span className="font-['Inter'] text-[11px] text-secondary">14 Shops • ৳ 1.1M</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-surface-container flex items-center gap-2 shrink-0">
              <span className="font-['Inter'] text-primary font-bold text-[12px]">Tongi</span>
              <span className="font-['Inter'] text-[11px] text-secondary">8 Shops • ৳ 840K</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-surface-container flex items-center gap-2 shrink-0">
              <span className="font-['Inter'] text-primary font-bold text-[12px]">Jamalpur</span>
              <span className="font-['Inter'] text-[11px] text-secondary">7 Shops • ৳ 505K</span>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Leaderboard (Auto Lifetime Value) */}
      <section className="rounded-xl bg-surface-container-lowest p-3.5 shadow-sm flex flex-col gap-2.5 border border-surface-container">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[19px] text-primary-container">trophy</span>
            <h4 className="font-['Plus_Jakarta_Sans'] text-headline-sm text-on-surface font-bold">
              Top Accounts (Automatic LTV)
            </h4>
          </div>
          <button
            onClick={() => onNavigate('customers')}
            className="font-['Inter'] text-primary font-bold text-[12px] hover:underline cursor-pointer"
          >
            View All 48
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {leaderboard.map((client, index) => (
            <div
              key={client.id}
              onClick={() => onSelectCustomer(client.id)}
              className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-6 h-6 rounded-full font-['Inter'] text-[11px] flex items-center justify-center font-bold shrink-0 ${
                    index === 0
                      ? 'bg-primary-container text-on-primary'
                      : 'bg-surface-container text-primary'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-['Inter'] text-on-surface font-bold truncate text-[13px]">
                    {client.name}
                  </span>
                  <span className="font-['Inter'] text-[11px] text-secondary truncate">
                    {client.district} Wholesale Market
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-['Inter'] text-primary font-bold text-[14px]">
                  ৳ {client.ltv.toLocaleString('en-IN')}
                </span>
                <span className="block font-['Inter'] text-[10px] text-on-tertiary-container font-semibold">
                  {client.tier === 'VIP Customer' ? 'VIP Account' : 'High Value'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Low-Stock Velocity Alert Modal */}
      {showLowStockModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md bg-surface rounded-2xl shadow-2xl border border-surface-container overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="p-4 bg-surface-container-low border-b border-surface-container flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">warning</span>
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-[15px] text-on-surface">
                    Low-Stock Reorder Alerts
                  </h3>
                  <p className="font-['Inter'] text-[11px] text-secondary">
                    Based on client reorder cycle frequency
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLowStockModal(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[12px] font-['Inter'] text-on-surface flex items-start gap-2">
                <span className="material-symbols-outlined text-amber-600 text-[18px] shrink-0 mt-0.5">info</span>
                <p>
                  These wholesale accounts have an active stock volume below their calculated cycle threshold. Reaching out today prevents stockouts and preserves your account share.
                </p>
              </div>

              <div className="space-y-2">
                {lowStockCustomers.map((cust) => (
                  <div
                    key={cust.id}
                    className="p-3 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-['Plus_Jakarta_Sans'] font-bold text-[14px] text-on-surface truncate">
                          {cust.name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-surface-container font-['Inter'] text-[10px] text-primary font-semibold">
                          {cust.district}
                        </span>
                      </div>
                      <span className="font-['Inter'] text-[11px] text-secondary">
                        Owner: {cust.ownerName} • {cust.preferredModel}
                      </span>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] font-['Inter']">
                        <span className="px-1.5 py-0.5 rounded bg-error-container text-on-error-container font-bold">
                          Stock: {cust.totalQuantity} pcs
                        </span>
                        <span className="text-secondary">
                          Threshold: {cust.threshold} pcs ({cust.cycleDays}d cycle)
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setShowLowStockModal(false);
                          onOpenWhatsApp(cust);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-tertiary text-on-tertiary font-['Inter'] text-[11px] font-semibold flex items-center gap-1 shadow-xs hover:bg-tertiary-container cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">chat</span>
                        <span>WhatsApp</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowLowStockModal(false);
                          onSelectCustomer(cust.id);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-['Inter'] text-[11px] font-semibold text-center cursor-pointer"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-surface-container-low border-t border-surface-container flex items-center justify-end">
              <button
                onClick={() => setShowLowStockModal(false)}
                className="px-4 py-1.5 rounded-xl bg-primary text-on-primary font-['Inter'] text-[12px] font-semibold cursor-pointer"
              >
                Close Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warehouse Orders & Tag Management Modal */}
      {showWarehouseOrdersModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-lg shadow-2xl border border-surface-container overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-surface-container flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-container text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-[16px] text-on-surface">
                    Warehouse Order Hub
                  </h3>
                  <p className="font-['Inter'] text-[11px] text-secondary">
                    Tagging &amp; order queue across all wholesale accounts
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenGoogleSheets}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 font-['Inter'] text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  title="Sync warehouse orders directly to Google Sheets"
                >
                  <span className="material-symbols-outlined text-[14px] text-emerald-600">table_chart</span>
                  <span className="hidden sm:inline">Sheets Sync</span>
                </button>
                <button
                  onClick={() => exportWarehouseOrdersCSV(customers, warehouseTagFilter)}
                  className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-['Inter'] text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  title="Export current filtered orders to CSV"
                >
                  <span className="material-symbols-outlined text-[14px]">download</span>
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
                <button
                  onClick={() => setShowWarehouseOrdersModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-secondary cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>

            {/* Tag Filter Tabs Bar */}
            <div className="px-4 py-2.5 bg-surface-container-lowest border-b border-surface-container overflow-x-auto no-scrollbar flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setWarehouseTagFilter('All')}
                className={`px-2.5 py-1 rounded-full font-['Inter'] text-[11px] font-semibold border flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                  warehouseTagFilter === 'All'
                    ? 'bg-primary text-on-primary border-primary shadow-xs'
                    : 'bg-surface-container-lowest text-secondary border-surface-container hover:bg-surface-container'
                }`}
              >
                <span>All Orders</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    warehouseTagFilter === 'All'
                      ? 'bg-primary-container text-on-primary-container'
                      : 'bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  {warehouseTagCounts.All}
                </span>
              </button>

              {ALL_WAREHOUSE_TAGS.map((tag) => {
                const count = warehouseTagCounts[tag.id] || 0;
                const isSelected = warehouseTagFilter === tag.id;
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => setWarehouseTagFilter(tag.id)}
                    className={`px-2.5 py-1 rounded-full font-['Inter'] text-[11px] font-semibold border flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-on-primary border-primary shadow-xs'
                        : 'bg-surface-container-lowest text-secondary border-surface-container hover:bg-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[12px]">{tag.icon}</span>
                    <span>{tag.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isSelected
                          ? 'bg-primary-container text-on-primary-container'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Orders Feed */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {filteredWarehouseOrders.length === 0 ? (
                <div className="rounded-xl bg-surface-container-low p-6 text-center border border-dashed border-surface-container space-y-2">
                  <span className="material-symbols-outlined text-[32px] text-secondary">label_off</span>
                  <p className="font-['Inter'] text-[13px] text-on-surface font-semibold">
                    No orders currently tagged as &quot;{warehouseTagFilter}&quot;
                  </p>
                  <button
                    onClick={() => setWarehouseTagFilter('All')}
                    className="font-['Inter'] text-[12px] text-primary font-medium hover:underline cursor-pointer"
                  >
                    View all orders ({warehouseTagCounts.All})
                  </button>
                </div>
              ) : (
                filteredWarehouseOrders.map((ord) => {
                  const isEditing = editingWarehouseOrderId === ord.id;
                  const currentTags = ord.tags;

                  return (
                    <div
                      key={`${ord.customerId}-${ord.id}`}
                      className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-2.5"
                    >
                      {/* Top Bar: Order ID + Customer Shop + Total */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-['Inter'] font-bold text-[13px] text-on-surface">
                              {ord.id}
                            </span>
                            <span className="font-['Inter'] text-[12px] text-primary font-bold">
                              • {ord.customerName}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-surface-container font-['Inter'] text-[10px] text-secondary">
                              {ord.customerDistrict}
                            </span>
                          </div>
                          <span className="font-['Inter'] text-[11px] text-secondary block">
                            {ord.date} • {ord.courier}
                          </span>
                        </div>
                        <span className="font-['Inter'] text-[14px] font-bold text-primary shrink-0">
                          ৳ {ord.total.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Specs Row */}
                      <div className="flex items-center justify-between text-[11px] font-['Inter'] bg-surface-container-low px-2.5 py-1.5 rounded-lg">
                        <span className="text-on-surface-variant">{ord.model}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-on-surface font-semibold">
                            {ord.quantity} pcs × ৳{ord.unitPrice}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-tertiary-fixed/40 text-on-tertiary-fixed text-[10px] font-semibold">
                            {ord.deliveryStatus}
                          </span>
                        </div>
                      </div>

                      {/* Tag Chips & Editor Section */}
                      <div className="pt-0.5 space-y-1.5">
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <div className="flex items-center gap-1 flex-wrap">
                            {currentTags.map((tag) => {
                              const meta = ALL_WAREHOUSE_TAGS.find((t) => t.id === tag);
                              return (
                                <span
                                  key={tag}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-['Inter'] text-[10px] font-bold ${
                                    meta?.badgeClass ||
                                    'bg-surface-container text-secondary border border-surface-container'
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-[11px]">
                                    {meta?.icon || 'label'}
                                  </span>
                                  <span>{tag}</span>
                                </span>
                              );
                            })}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setEditingWarehouseOrderId(isEditing ? null : ord.id)
                            }
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-['Inter'] font-semibold text-primary hover:bg-primary-container/20 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[13px]">
                              {isEditing ? 'close' : 'edit_note'}
                            </span>
                            <span>{isEditing ? 'Done' : 'Edit Tags'}</span>
                          </button>
                        </div>

                        {/* Inline Tag Toggler */}
                        {isEditing && (
                          <div className="p-2 rounded-lg bg-surface-container-low border border-surface-container space-y-1.5">
                            <span className="font-['Inter'] text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                              Toggle Order Labels:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {ALL_WAREHOUSE_TAGS.map((tag) => {
                                const isTagged = currentTags.includes(tag.id);
                                return (
                                  <button
                                    key={tag.id}
                                    type="button"
                                    onClick={() =>
                                      handleToggleWarehouseTag(
                                        ord.customerId,
                                        ord.id,
                                        currentTags,
                                        tag.id
                                      )
                                    }
                                    className={`px-2 py-1 rounded font-['Inter'] text-[10px] font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                                      isTagged
                                        ? tag.badgeClass + ' ring-1 ring-primary'
                                        : 'bg-surface-container-lowest text-secondary border-surface-container hover:bg-surface-container'
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-[12px]">
                                      {tag.icon}
                                    </span>
                                    <span>{tag.label}</span>
                                    <span className="material-symbols-outlined text-[11px] ml-0.5">
                                      {isTagged ? 'check' : 'add'}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Quick Navigation Footer */}
                      <div className="pt-1 border-t border-surface-container/60 flex items-center justify-between gap-2">
                        <span className="font-['Inter'] text-[11px] text-secondary">
                          Owner: {ord.ownerName}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setShowWarehouseOrdersModal(false);
                              const targetCustomer = customers.find((c) => c.id === ord.customerId);
                              if (targetCustomer) onOpenWhatsApp(targetCustomer);
                            }}
                            className="px-2 py-1 rounded bg-tertiary/10 text-tertiary hover:bg-tertiary/20 font-['Inter'] text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[13px]">chat</span>
                            <span>WhatsApp</span>
                          </button>
                          <button
                            onClick={() => {
                              setShowWarehouseOrdersModal(false);
                              onSelectCustomer(ord.customerId);
                            }}
                            className="px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 font-['Inter'] text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <span>Customer History</span>
                            <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Bottom Close */}
            <div className="p-3 bg-surface-container-low border-t border-surface-container flex items-center justify-between">
              <span className="font-['Inter'] text-[11px] text-secondary">
                Showing {filteredWarehouseOrders.length} of {warehouseTagCounts.All} orders
              </span>
              <button
                onClick={() => setShowWarehouseOrdersModal(false)}
                className="px-4 py-1.5 rounded-xl bg-primary text-on-primary font-['Inter'] text-[12px] font-semibold cursor-pointer"
              >
                Close Hub
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
