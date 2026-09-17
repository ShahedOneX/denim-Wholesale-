import React, { useState } from 'react';
import { Customer, OrderTag } from '../types';

interface CustomerDetailsScreenProps {
  customer: Customer;
  onBack: () => void;
  onOpenWhatsApp: (customer: Customer) => void;
  onNewOrder: () => void;
  onShowToast: (message: string) => void;
  onUpdateOutcome: (customerId: string, outcome: 'Interested' | 'Will Order Later' | 'Ordered (Immediate)') => void;
  onUpdateOrderTags?: (customerId: string, orderId: string, tags: OrderTag[]) => void;
  onOpenGoogleSheets?: () => void;
}

export const CustomerDetailsScreen: React.FC<CustomerDetailsScreenProps> = ({
  customer,
  onOpenWhatsApp,
  onNewOrder,
  onShowToast,
  onUpdateOutcome,
  onUpdateOrderTags,
  onOpenGoogleSheets,
}) => {
  const [selectedOutcome, setSelectedOutcome] = useState<string>(
    customer.lastContactOutcome || ''
  );
  const [selectedTagFilter, setSelectedTagFilter] = useState<'All' | OrderTag>('All');
  const [editingTagOrderId, setEditingTagOrderId] = useState<string | null>(null);

  const ALL_TAGS: { id: OrderTag; label: string; icon: string; badgeClass: string; chipClass: string }[] = [
    { id: 'Priority', label: 'Priority', icon: 'flag', badgeClass: 'bg-error-container text-on-error-container border border-error/30', chipClass: 'hover:bg-error-container/20' },
    { id: 'Wholesale', label: 'Wholesale', icon: 'inventory_2', badgeClass: 'bg-primary-container/30 text-primary border border-primary/30', chipClass: 'hover:bg-primary-container/20' },
    { id: 'Sample', label: 'Sample', icon: 'science', badgeClass: 'bg-tertiary-container/30 text-on-tertiary-container border border-tertiary/30', chipClass: 'hover:bg-tertiary-container/20' },
    { id: 'Rush', label: 'Rush', icon: 'bolt', badgeClass: 'bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30', chipClass: 'hover:bg-amber-500/20' },
    { id: 'Backorder', label: 'Backorder', icon: 'history', badgeClass: 'bg-secondary-container text-on-secondary-container border border-secondary/30', chipClass: 'hover:bg-secondary-container/20' },
  ];

  const tagCounts: Record<'All' | OrderTag, number> = {
    All: customer.orderHistory.length,
    Priority: customer.orderHistory.filter((o) => (o.tags || []).includes('Priority')).length,
    Wholesale: customer.orderHistory.filter((o) => (o.tags || []).includes('Wholesale')).length,
    Sample: customer.orderHistory.filter((o) => (o.tags || []).includes('Sample')).length,
    Rush: customer.orderHistory.filter((o) => (o.tags || []).includes('Rush')).length,
    Backorder: customer.orderHistory.filter((o) => (o.tags || []).includes('Backorder')).length,
  };

  const filteredOrders = customer.orderHistory.filter((order) => {
    if (selectedTagFilter === 'All') return true;
    return (order.tags || []).includes(selectedTagFilter);
  });

  const handleToggleOrderTag = (orderId: string, currentTags: OrderTag[] | undefined, tagToToggle: OrderTag) => {
    const list = currentTags || [];
    const nextTags = list.includes(tagToToggle)
      ? list.filter((t) => t !== tagToToggle)
      : [...list, tagToToggle];
    if (onUpdateOrderTags) {
      onUpdateOrderTags(customer.id, orderId, nextTags);
    }
  };

  const handleOutcomeClick = (outcome: 'Interested' | 'Will Order Later' | 'Ordered (Immediate)') => {
    setSelectedOutcome(outcome);
    onUpdateOutcome(customer.id, outcome);
    onShowToast(`Response outcome logged: ${outcome}`);
  };

  return (
    <div className="flex flex-col w-full pb-28 pt-16 px-4 max-w-lg mx-auto">
      <div className="flex flex-col w-full space-y-3.5">
        {/* Executive VIP Client Profile Card */}
        <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm p-4 space-y-3.5 border border-surface-container">
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-primary-fixed/30 to-transparent rounded-bl-full pointer-events-none"></div>

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  className="w-14 h-14 rounded-xl object-cover shadow-sm ring-2 ring-surface-container"
                  alt={`${customer.ownerName} portrait`}
                  src={customer.avatar}
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-tertiary-container rounded-full flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-[10px] text-tertiary-fixed"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check
                  </span>
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-[18px] text-on-surface truncate">
                    {customer.name}
                  </h1>
                  <span
                    className="material-symbols-outlined text-[16px] text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                </div>
                <p className="font-['Inter'] text-[12px] text-secondary">
                  {customer.district} • {customer.ownerName}
                </p>
                <div className="flex items-center gap-1 mt-0.5 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[14px] text-tertiary-container">
                    chat
                  </span>
                  <span className="font-['Inter'] text-[12px] font-semibold">{customer.phone}</span>
                  <span className="px-1.5 py-0.2 bg-tertiary-fixed/40 text-on-tertiary-fixed rounded text-[9px] font-semibold tracking-wider uppercase">
                    Verified
                  </span>
                </div>
              </div>
            </div>

            <button
              aria-label="Customer Options"
              className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
              onClick={() => onShowToast(`Options menu for ${customer.name}`)}
            >
              <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
          </div>

          {/* Badges Row */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary-container text-on-secondary-fixed font-['Inter'] text-[11px] font-semibold">
              <span
                className="material-symbols-outlined text-[14px] text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                military_tech
              </span>
              <span>{customer.tier.toUpperCase()}</span>
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-tertiary-fixed/30 text-on-tertiary-fixed font-['Inter'] text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container animate-pulse"></span>
              <span>ACTIVE PIPELINE</span>
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-error-container text-on-error-container font-['Inter'] text-[11px] font-semibold">
              <span className="material-symbols-outlined text-[14px]">notifications_active</span>
              <span>FOLLOW-UP: TODAY</span>
            </div>
          </div>

          {/* Instant Operational Action Bar */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              id="customer-details-wa-btn"
              onClick={() => onOpenWhatsApp(customer)}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg bg-tertiary-container text-on-tertiary font-['Inter'] text-[13px] font-semibold active:opacity-90 shadow-sm transition-transform active:scale-[0.98] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
              <span>WhatsApp</span>
            </button>
            <a
              id="customer-details-call-btn"
              href={`tel:${customer.phone.replace(/[^0-9]/g, '')}`}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg bg-surface-container text-on-surface font-['Inter'] text-[13px] font-semibold hover:bg-surface-container-high active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">call</span>
              <span>Call</span>
            </a>
            <button
              id="customer-details-new-order-btn"
              onClick={onNewOrder}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg bg-primary text-on-primary font-['Inter'] text-[13px] font-semibold active:bg-primary-container shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
              <span>New Order</span>
            </button>
          </div>
        </div>

        {/* Real-time Intelligence Pill Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[18px]">auto_awesome</span>
            <span className="font-['Plus_Jakarta_Sans'] font-bold text-headline-sm text-primary">
              Autonomous Intelligence
            </span>
          </div>
          <span className="font-['Inter'] text-[11px] font-semibold text-secondary bg-surface-container px-2 py-0.5 rounded">
            Zero Manual Input
          </span>
        </div>

        {/* Key Predictive Engine Highlights (Bento 2-col) */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between border border-surface-container">
            <div className="flex items-center justify-between text-secondary mb-1">
              <span className="font-['Inter'] text-[11px] font-semibold">Next Expected Order</span>
              <span className="material-symbols-outlined text-[16px] text-tertiary-container">
                event_upcoming
              </span>
            </div>
            <div className="font-['Inter'] text-[20px] text-primary font-bold">
              {customer.nextExpectedOrder}
            </div>
            <div className="flex items-center gap-1 mt-1 text-tertiary-container font-['Inter'] text-[11px] font-semibold">
              <span className="material-symbols-outlined text-[13px]">schedule</span>
              <span>Cycle: ~{customer.cycleDays} Days avg</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between border border-surface-container">
            <div className="flex items-center justify-between text-secondary mb-1">
              <span className="font-['Inter'] text-[11px] font-semibold">Automated Follow-up</span>
              <span className="material-symbols-outlined text-[16px] text-error">priority_high</span>
            </div>
            <div className="font-['Inter'] text-[20px] text-error font-bold">
              Today ({customer.nextFollowUpDate.split(' ').slice(0, 2).join(' ')})
            </div>
            <div className="text-secondary font-['Inter'] text-[11px] mt-1">
              <span>{customer.leadDays}-day lead target active</span>
            </div>
          </div>
        </div>

        {/* 4-Tile High Data Density Financial KPI Board */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container">
            <span className="font-['Inter'] text-[11px] font-medium text-secondary block mb-0.5">
              Lifetime Purchase
            </span>
            <div className="font-['Inter'] text-[19px] text-on-surface font-bold">
              ৳ {customer.ltv.toLocaleString('en-IN')}
            </div>
            <div className="font-['Inter'] text-[11px] text-secondary mt-0.5">
              Across {customer.ordersCount} fulfilled orders
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container">
            <span className="font-['Inter'] text-[11px] font-medium text-secondary block mb-0.5">
              Average Order (AOV)
            </span>
            <div className="font-['Inter'] text-[19px] text-on-surface font-bold">
              ৳ {Math.round(customer.ltv / Math.max(1, customer.ordersCount)).toLocaleString('en-IN')}
            </div>
            <div className="font-['Inter'] text-[11px] text-secondary mt-0.5">
              {Math.round(customer.totalQuantity / Math.max(1, customer.ordersCount))} pcs avg volume
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container">
            <span className="font-['Inter'] text-[11px] font-medium text-secondary block mb-0.5">
              Total Quantity
            </span>
            <div className="font-['Inter'] text-[19px] text-primary font-bold">
              {customer.totalQuantity} pcs
            </div>
            <div className="font-['Inter'] text-[11px] text-secondary mt-0.5">
              100% Selvedge Indigo
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container">
            <span className="font-['Inter'] text-[11px] font-medium text-secondary block mb-0.5">
              Segment Status
            </span>
            <div className="font-['Inter'] text-[15px] text-tertiary-container flex items-center gap-1 font-bold">
              <span
                className="material-symbols-outlined text-[15px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                workspace_premium
              </span>
              <span>VIP Tier-1</span>
            </div>
            <div className="font-['Inter'] text-[11px] text-secondary mt-0.5">
              Qualified (&gt; ৳1.5L)
            </div>
          </div>
        </div>

        {/* Preferred Specs & Catalog Affinity Card */}
        <div className="rounded-xl bg-surface-container-lowest shadow-sm p-3.5 space-y-2.5 border border-surface-container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-primary">apparel</span>
              <span className="font-['Plus_Jakarta_Sans'] font-bold text-[15px] text-on-surface">
                Denim Product Affinity
              </span>
            </div>
            <span className="font-['Inter'] text-[11px] text-secondary font-medium">
              Auto Calculated
            </span>
          </div>

          <div className="flex gap-3 items-center bg-surface-container-low p-2.5 rounded-lg">
            <img
              className="w-12 h-12 rounded-lg object-cover shadow-sm shrink-0"
              alt="D-501 Heavy Denim fabric weave"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBM6dtPHr4O5jSnGNVJrHf6vdUDllykZ1Aw8ByvxkRc394veIQ8wbKRhk3u0jOnpzJfcHH-3yPPmbcUFVQfzKBSbG4vMFoMPPK-vxYxsIvB1_YtnHaPW2qgZiKtcG6Q9GVEJoImjF6UlYSn6t5exZrE598V7zMNldQ8dGd5cLdJSxuYej0xw2WSsP8njsg-GbJVLSr1IHwUiN04MKBk1zo7nK9Fuu-OizWP15fafAOp6dv1fdGzqtK6"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-['Inter'] text-[13px] font-bold text-on-surface truncate">
                  {customer.preferredModel}
                </span>
                <span className="text-tertiary-container font-['Inter'] text-[14px] font-bold">
                  {Math.round(customer.totalQuantity * (customer.modelSharePercent / 100))} pcs
                </span>
              </div>
              <p className="font-['Inter'] text-[11px] text-secondary truncate">
                {customer.preferredSpecs}
              </p>
              <div className="w-full bg-surface-container rounded-full h-1.5 mt-1.5 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${customer.modelSharePercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between font-['Inter'] text-[11px] text-secondary px-0.5">
            <span>
              Last Order: {customer.lastOrderPcs} pcs on {customer.lastOrderDate}
            </span>
            <span className="text-primary font-bold">{customer.modelSharePercent}% of all orders</span>
          </div>
        </div>

        {/* Order Timeline & Reorder Pulse Tracker */}
        <div className="rounded-xl bg-surface-container-lowest shadow-sm p-4 space-y-3 border border-surface-container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-primary">timeline</span>
              <span className="font-['Plus_Jakarta_Sans'] font-bold text-[15px] text-on-surface">
                Timeline &amp; Reorder Pulse
              </span>
            </div>
            <span className="font-['Inter'] text-[11px] font-bold text-tertiary-container bg-tertiary-fixed/30 px-2 py-0.5 rounded">
              98% Retention
            </span>
          </div>

          {/* Horizontal Visual Rhythm Timeline */}
          <div className="relative py-2">
            <div className="absolute left-4 right-4 top-5 h-0.5 bg-surface-container-high z-0"></div>
            <div className="grid grid-cols-4 relative z-10 gap-1">
              {customer.timelinePulse.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center text-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${
                      item.isReorder
                        ? 'bg-tertiary-container text-on-tertiary animate-pulse ring-2 ring-tertiary-fixed/50'
                        : 'bg-primary text-on-primary'
                    }`}
                  >
                    {item.isReorder ? '★' : '✓'}
                  </div>
                  <span className="text-[10px] font-medium text-on-surface mt-1.5">{item.date}</span>
                  <span
                    className={`text-[9px] ${
                      item.isReorder ? 'text-tertiary-container font-semibold' : 'text-secondary'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Action Task Box for Today */}
          <div className="rounded-lg bg-surface-container-low p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-on-surface">
                <span className="material-symbols-outlined text-[16px] text-primary">flag</span>
                <span className="font-['Inter'] text-[12px] font-bold">
                  Today&apos;s Milestone ({customer.nextFollowUpDate.split(' ').slice(0, 2).join(' ')})
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container text-[10px] font-bold">
                DUE NOW
              </span>
            </div>
            <p className="font-['Inter'] text-[11px] text-secondary leading-relaxed">
              System flagged {customer.ownerName} for replenishment contact {customer.leadDays} days
              before standard stock exhaustion.
            </p>

            {/* Quick Micro-Interaction Status Selector */}
            <div className="space-y-1.5 pt-1">
              <span className="font-['Inter'] text-[11px] text-secondary font-semibold">
                Log Response Outcome:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  className={`outcome-btn py-1.5 px-2 rounded font-['Inter'] text-[11px] font-semibold transition-colors cursor-pointer ${
                    selectedOutcome === 'Interested'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                  onClick={() => handleOutcomeClick('Interested')}
                >
                  Interested
                </button>
                <button
                  className={`outcome-btn py-1.5 px-2 rounded font-['Inter'] text-[11px] font-semibold transition-colors cursor-pointer ${
                    selectedOutcome === 'Will Order Later'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                  onClick={() => handleOutcomeClick('Will Order Later')}
                >
                  Later
                </button>
                <button
                  className={`outcome-btn py-1.5 px-2 rounded font-['Inter'] text-[11px] font-semibold transition-colors cursor-pointer ${
                    selectedOutcome === 'Ordered (Immediate)'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                  onClick={() => handleOutcomeClick('Ordered (Immediate)')}
                >
                  Ordered ✓
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Order History Header & Summary Chip */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">receipt_long</span>
              <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-headline-sm text-primary">
                Order History
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenGoogleSheets}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-['Inter'] text-[11px] font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
                title="Sync records to Google Sheets"
              >
                <span className="material-symbols-outlined text-[13px] text-emerald-600">table_chart</span>
                <span>Sheets Sync</span>
              </button>
              <span className="font-['Inter'] text-[12px] text-secondary">
                {filteredOrders.length} of {customer.orderHistory.length} Records
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-surface-container p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-on-secondary-container">
              <span className="material-symbols-outlined text-[16px]">equalizer</span>
              <span className="font-['Inter'] text-[12px]">
                Total {customer.totalQuantity} pcs • ৳ {customer.ltv.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="font-['Inter'] text-[12px] text-primary font-bold">
              Avg ৳ {Math.round(customer.ltv / Math.max(1, customer.ordersCount)).toLocaleString('en-IN')}
            </span>
          </div>

          {/* Warehouse Order Categorization & Filter Pills */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between px-1">
              <span className="font-['Inter'] text-[11px] font-semibold text-secondary uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-primary">filter_alt</span>
                <span>Warehouse Tags Filter</span>
              </span>
              {selectedTagFilter !== 'All' && (
                <button
                  onClick={() => setSelectedTagFilter('All')}
                  className="font-['Inter'] text-[11px] text-primary hover:underline cursor-pointer"
                >
                  Clear filter
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedTagFilter('All')}
                className={`px-2.5 py-1 rounded-full font-['Inter'] text-[11px] font-semibold border flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                  selectedTagFilter === 'All'
                    ? 'bg-primary text-on-primary border-primary shadow-xs'
                    : 'bg-surface-container-lowest text-secondary border-surface-container hover:bg-surface-container'
                }`}
              >
                <span>All Orders</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    selectedTagFilter === 'All' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  {tagCounts.All}
                </span>
              </button>

              {ALL_TAGS.map((tag) => {
                const count = tagCounts[tag.id] || 0;
                const isSelected = selectedTagFilter === tag.id;
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => setSelectedTagFilter(tag.id)}
                    className={`px-2.5 py-1 rounded-full font-['Inter'] text-[11px] font-semibold border flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-on-primary border-primary shadow-xs'
                        : 'bg-surface-container-lowest text-secondary border-surface-container hover:bg-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[13px]">{tag.icon}</span>
                    <span>{tag.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isSelected ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chronological Order Cards Stack */}
        <div className="space-y-2.5">
          {filteredOrders.length === 0 ? (
            <div className="rounded-xl bg-surface-container-lowest p-6 text-center border border-dashed border-surface-container space-y-2">
              <span className="material-symbols-outlined text-[32px] text-secondary">label_off</span>
              <p className="font-['Inter'] text-[13px] text-on-surface font-semibold">
                No orders tagged as &quot;{selectedTagFilter}&quot;
              </p>
              <button
                onClick={() => setSelectedTagFilter('All')}
                className="font-['Inter'] text-[12px] text-primary font-medium hover:underline cursor-pointer"
              >
                Show all {customer.orderHistory.length} orders
              </button>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const currentTags = order.tags || [];
              const isEditingTags = editingTagOrderId === order.id;

              return (
                <div
                  key={order.id}
                  className="rounded-xl bg-surface-container-lowest shadow-sm p-3.5 space-y-2.5 border border-surface-container"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-['Inter'] font-bold text-[13px] text-on-surface">
                          {order.id}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-tertiary-fixed/40 text-on-tertiary-fixed font-['Inter'] text-[10px] font-semibold">
                          {order.deliveryStatus} • {order.paymentStatus}
                        </span>
                      </div>
                      <span className="font-['Inter'] text-[11px] text-secondary">
                        {order.date} • {order.courier}
                      </span>
                    </div>
                    <span className="font-['Inter'] text-[15px] font-bold text-primary">
                      ৳ {order.total.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Denim Model Spec */}
                  <div className="flex items-center justify-between text-[11px] font-['Inter'] bg-surface-container-low px-2.5 py-1.5 rounded-lg">
                    <span className="text-on-surface-variant">{order.model}</span>
                    <span className="text-on-surface font-semibold">
                      {order.quantity} pcs × ৳{order.unitPrice}
                    </span>
                  </div>

                  {/* Order Tags & Warehouse Classification Bar */}
                  <div className="pt-0.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {currentTags.length > 0 ? (
                          currentTags.map((tag) => {
                            const meta = ALL_TAGS.find((t) => t.id === tag);
                            return (
                              <span
                                key={tag}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-['Inter'] text-[10px] font-bold ${
                                  meta?.badgeClass || 'bg-surface-container text-secondary border border-surface-container'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[12px]">
                                  {meta?.icon || 'label'}
                                </span>
                                <span>{tag}</span>
                              </span>
                            );
                          })
                        ) : (
                          <span className="font-['Inter'] text-[11px] text-secondary italic">
                            No warehouse tags
                          </span>
                        )}
                      </div>

                      {/* Manage Tags Trigger */}
                      <button
                        type="button"
                        onClick={() =>
                          setEditingTagOrderId(isEditingTags ? null : order.id)
                        }
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-['Inter'] font-semibold text-primary hover:bg-primary-container/20 transition-colors cursor-pointer"
                        title="Add or remove warehouse tags"
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {isEditingTags ? 'close' : 'edit_note'}
                        </span>
                        <span>{isEditingTags ? 'Done' : 'Edit Tags'}</span>
                      </button>
                    </div>

                    {/* Quick Tag Editor Accordion */}
                    {isEditingTags && (
                      <div className="p-2 rounded-lg bg-surface-container-low border border-surface-container space-y-1.5 animate-in fade-in duration-150">
                        <span className="font-['Inter'] text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                          Toggle Warehouse Labels:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {ALL_TAGS.map((tag) => {
                            const isTagged = currentTags.includes(tag.id);
                            return (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => handleToggleOrderTag(order.id, currentTags, tag.id)}
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

                    {/* Logistics Notes if provided */}
                    {order.logisticsNote && (
                      <div className="flex items-start gap-1 text-[11px] text-secondary font-['Inter'] bg-surface-container/40 p-2 rounded-md">
                        <span className="material-symbols-outlined text-[14px] text-primary shrink-0 mt-0.5">
                          local_shipping
                        </span>
                        <span className="line-clamp-2">{order.logisticsNote}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Interactive Activity & Logistics Feed Card */}
        <div className="rounded-xl bg-surface-container-lowest shadow-sm p-4 space-y-3 border border-surface-container">
          <div className="flex items-center justify-between">
            <span className="font-['Plus_Jakarta_Sans'] font-bold text-[15px] text-on-surface">
              Fulfillment &amp; Interaction Log
            </span>
            <span className="font-['Inter'] text-[11px] text-secondary">Chronological</span>
          </div>

          <div className="relative pl-5 space-y-4">
            <div className="absolute left-1.5 top-1.5 bottom-1.5 w-0.5 bg-surface-container"></div>
            {customer.activityLog.map((act, index) => (
              <div key={index} className="relative">
                <div
                  className={`absolute -left-5 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-surface-container-lowest ${
                    act.type === 'alert'
                      ? 'bg-error'
                      : act.type === 'delivery'
                      ? 'bg-tertiary-container'
                      : 'bg-primary'
                  }`}
                ></div>
                <p className="font-['Inter'] text-[12px] font-bold text-on-surface">
                  {act.date} • {act.title}
                </p>
                <p className="font-['Inter'] text-[11px] text-secondary leading-relaxed">
                  {act.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
