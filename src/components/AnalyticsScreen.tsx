import React, { useState } from 'react';
import { Customer, DENIM_MODELS } from '../data/initialData';

interface AnalyticsScreenProps {
  customers: Customer[];
  onShowToast: (message: string) => void;
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ customers, onShowToast }) => {
  const [timeframe, setTimeframe] = useState<'30d' | '90d' | 'ytd'>('30d');

  const totalRevenue = customers.reduce((acc, c) => acc + c.ltv, 0);
  const totalVolume = customers.reduce((acc, c) => acc + c.totalQuantity, 0);
  const avgCycle = Math.round(
    customers.reduce((acc, c) => acc + c.cycleDays, 0) / Math.max(1, customers.length)
  );

  return (
    <div className="flex flex-col w-full pb-28 pt-20 px-4 max-w-lg mx-auto">
      {/* Header & Timeframe Filter */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-headline-sm text-primary">
            Factory Capacity &amp; Cash Flow
          </h2>
          <p className="font-['Inter'] text-[12px] text-secondary">
            Wholesale denim intelligence &amp; velocity
          </p>
        </div>
        <div className="flex bg-surface-container rounded-lg p-0.5 text-[11px] font-['Inter'] font-semibold">
          <button
            onClick={() => setTimeframe('30d')}
            className={`px-2 py-1 rounded cursor-pointer ${
              timeframe === '30d' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-secondary'
            }`}
          >
            30D
          </button>
          <button
            onClick={() => setTimeframe('90d')}
            className={`px-2 py-1 rounded cursor-pointer ${
              timeframe === '90d' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-secondary'
            }`}
          >
            90D
          </button>
          <button
            onClick={() => setTimeframe('ytd')}
            className={`px-2 py-1 rounded cursor-pointer ${
              timeframe === 'ytd' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-secondary'
            }`}
          >
            YTD
          </button>
        </div>
      </div>

      {/* Hero Metrics Bento Grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-sm border border-surface-container">
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="font-['Inter'] text-[11px] font-semibold uppercase">Total Pipeline LTV</span>
            <span className="material-symbols-outlined text-[16px] text-tertiary-container">payments</span>
          </div>
          <div className="font-['Plus_Jakarta_Sans'] text-[20px] font-bold text-on-surface">
            ৳ {totalRevenue.toLocaleString('en-IN')}
          </div>
          <span className="font-['Inter'] text-[11px] text-tertiary-container font-semibold flex items-center gap-1 mt-0.5">
            <span className="material-symbols-outlined text-[13px]">trending_up</span>
            +18.4% vs last cycle
          </span>
        </div>

        <div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-sm border border-surface-container">
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="font-['Inter'] text-[11px] font-semibold uppercase">Denim Volume</span>
            <span className="material-symbols-outlined text-[16px] text-primary">inventory_2</span>
          </div>
          <div className="font-['Plus_Jakarta_Sans'] text-[20px] font-bold text-primary">
            {totalVolume.toLocaleString('en-IN')} pcs
          </div>
          <span className="font-['Inter'] text-[11px] text-secondary mt-0.5 block">
            Across 14 active batches
          </span>
        </div>

        <div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-sm border border-surface-container">
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="font-['Inter'] text-[11px] font-semibold uppercase">Restock Velocity</span>
            <span className="material-symbols-outlined text-[16px] text-secondary">speed</span>
          </div>
          <div className="font-['Plus_Jakarta_Sans'] text-[20px] font-bold text-on-surface">
            {avgCycle} Days
          </div>
          <span className="font-['Inter'] text-[11px] text-tertiary-container font-semibold mt-0.5 block">
            3-Day Lead Notification
          </span>
        </div>

        <div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-sm border border-surface-container">
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="font-['Inter'] text-[11px] font-semibold uppercase">Retention Rate</span>
            <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
          </div>
          <div className="font-['Plus_Jakarta_Sans'] text-[20px] font-bold text-on-surface">
            94.8%
          </div>
          <span className="font-['Inter'] text-[11px] text-secondary mt-0.5 block">
            Tier-1 Wholesale Accounts
          </span>
        </div>
      </div>

      {/* Model Popularity Breakdown */}
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-surface-container mb-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-primary">pie_chart</span>
            <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-[15px] text-on-surface">
              Denim Product Share
            </h3>
          </div>
          <span className="font-['Inter'] text-[11px] text-secondary">Production Ratio</span>
        </div>

        <div className="space-y-2.5">
          {DENIM_MODELS.map((m, idx) => {
            const shares = [55, 25, 12, 8];
            const share = shares[idx] || 10;
            return (
              <div key={m.id} className="space-y-1">
                <div className="flex items-center justify-between text-[12px] font-['Inter']">
                  <span className="font-semibold text-on-surface">{m.name}</span>
                  <span className="text-secondary font-bold">{share}% (৳{m.defaultPrice}/pc)</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      idx === 0
                        ? 'bg-primary'
                        : idx === 1
                        ? 'bg-secondary'
                        : idx === 2
                        ? 'bg-tertiary-container'
                        : 'bg-outline'
                    }`}
                    style={{ width: `${share}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Wholesale Geographic Distribution */}
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-surface-container mb-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-primary">map</span>
            <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-[15px] text-on-surface">
              Wholesale Distribution Hubs
            </h3>
          </div>
          <span className="font-['Inter'] text-[11px] text-secondary">Active Dispatches</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[12px] font-['Inter']">
          <div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col justify-between">
            <span className="font-semibold text-on-surface">Gazipur Industrial Belt</span>
            <span className="text-primary font-bold text-[14px] mt-1">38% Volume</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col justify-between">
            <span className="font-semibold text-on-surface">Dhaka Islampur / Sadarghat</span>
            <span className="text-primary font-bold text-[14px] mt-1">29% Volume</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col justify-between">
            <span className="font-semibold text-on-surface">Chittagong Terribazar</span>
            <span className="text-primary font-bold text-[14px] mt-1">18% Volume</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col justify-between">
            <span className="font-semibold text-on-surface">Regional Wholesale Points</span>
            <span className="text-primary font-bold text-[14px] mt-1">15% Volume</span>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <button
        type="button"
        onClick={() => onShowToast('Exported Wholesale Ledger report (PDF & CSV)')}
        className="w-full py-3 rounded-xl bg-surface-container-lowest border border-surface-container text-primary font-['Inter'] text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-surface-container shadow-xs cursor-pointer transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">download</span>
        <span>Download Complete Financial &amp; Replenishment Report</span>
      </button>
    </div>
  );
};
