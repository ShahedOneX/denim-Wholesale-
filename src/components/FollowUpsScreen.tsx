import React, { useState } from 'react';
import { Customer } from '../types';

interface FollowUpsScreenProps {
  customers: Customer[];
  onOpenWhatsApp: (customer: Customer) => void;
  onSelectCustomer: (customerId: string) => void;
  onNavigate: (tab: 'dashboard' | 'customers' | 'add-order' | 'follow-ups' | 'analytics') => void;
  onSaveContactLog: (
    customerId: string,
    outcome: 'Interested' | 'Will Order Later' | 'Ordered (Immediate)' | 'No Response' | 'Not Interested'
  ) => void;
  onShowToast: (message: string, icon?: string) => void;
  onLaunchCampaign: () => void;
}

export const FollowUpsScreen: React.FC<FollowUpsScreenProps> = ({
  customers,
  onOpenWhatsApp,
  onSelectCustomer,
  onNavigate,
  onSaveContactLog,
  onShowToast,
  onLaunchCampaign,
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'this_week' | 'overdue' | 'all'>('today');
  const [expandedDrawerId, setExpandedDrawerId] = useState<string | null>('c-rahim');
  const [selectedResults, setSelectedResults] = useState<
    Record<string, 'Interested' | 'Will Order Later' | 'Ordered (Immediate)' | 'No Response' | 'Not Interested'>
  >({
    'c-rahim': 'Interested',
  });
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [defaultLeadTime, setDefaultLeadTime] = useState(3);
  const [defaultCycleRange, setDefaultCycleRange] = useState('26-30');

  const rahimClient = customers.find((c) => c.id === 'c-rahim') || customers[0];
  const karimClient = customers.find((c) => c.id === 'c-karim') || customers[1];
  const sakibClient = customers.find((c) => c.id === 'c-sakib') || customers[2];
  const modernClient = customers.find((c) => c.id === 'c-modern') || customers[5];

  const handleResultChange = (
    customerId: string,
    outcome: 'Interested' | 'Will Order Later' | 'Ordered (Immediate)' | 'No Response' | 'Not Interested'
  ) => {
    setSelectedResults((prev) => ({ ...prev, [customerId]: outcome }));
  };

  const handleSaveContactLog = (customerId: string) => {
    const outcome = selectedResults[customerId] || 'Interested';
    onSaveContactLog(customerId, outcome);
    onShowToast(`Status logged & reorder updated: ${outcome}!`);
  };

  return (
    <div className="flex flex-col w-full pb-28 pt-20 px-4 max-w-lg mx-auto">
      <div className="flex flex-col w-full pb-8">
        {/* Top Command Overview & Auto-Sync Engine Pulse */}
        <section className="flex flex-col gap-2 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-fixed text-primary">
                <span className="material-symbols-outlined text-[16px]">smart_toy</span>
              </span>
              <span className="font-['Inter'] text-[11px] text-secondary uppercase tracking-wider font-semibold">
                AI Reorder Engine Active
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-low text-tertiary-container font-['Inter'] text-[11px] font-semibold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-ping"></span>
              Synced 2m ago
            </span>
          </div>

          {/* Motivational Prompt Banner */}
          <div className="bg-surface-container-lowest rounded-xl p-3.5 shadow-sm flex items-start gap-3 relative overflow-hidden border border-surface-container">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[24px]">notifications_active</span>
            </div>
            <div className="flex flex-col min-w-0 pr-1">
              <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-headline-sm text-on-surface leading-snug">
                Who should I contact today?
              </h2>
              <p className="font-['Inter'] text-body-sm text-secondary mt-0.5">
                5 high-probability accounts are entering their calculated restock phase.
              </p>
            </div>
          </div>
        </section>

        {/* Filter Carousel Tabs with Badges */}
        <section className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar items-center">
          <button
            onClick={() => setActiveTab('today')}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl font-['Inter'] text-[12px] font-semibold transition-all cursor-pointer ${
              activeTab === 'today'
                ? 'bg-primary-container text-on-primary shadow-sm'
                : 'bg-surface-container-lowest text-secondary shadow-sm hover:text-on-surface'
            }`}
          >
            <span>TODAY</span>
            <span
              className={`px-1.5 py-0.5 rounded-full font-bold text-[10px] ${
                activeTab === 'today'
                  ? 'bg-on-primary text-primary-container'
                  : 'bg-surface-container text-secondary'
              }`}
            >
              5
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tomorrow')}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl font-['Inter'] text-[12px] font-semibold transition-all cursor-pointer ${
              activeTab === 'tomorrow'
                ? 'bg-primary-container text-on-primary shadow-sm'
                : 'bg-surface-container-lowest text-secondary shadow-sm hover:text-on-surface'
            }`}
          >
            <span>TOMORROW</span>
            <span className="px-1.5 py-0.5 rounded-full bg-surface-container text-secondary text-[10px]">
              3
            </span>
          </button>

          <button
            onClick={() => setActiveTab('this_week')}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl font-['Inter'] text-[12px] font-semibold transition-all cursor-pointer ${
              activeTab === 'this_week'
                ? 'bg-primary-container text-on-primary shadow-sm'
                : 'bg-surface-container-lowest text-secondary shadow-sm hover:text-on-surface'
            }`}
          >
            <span>THIS WEEK</span>
            <span className="px-1.5 py-0.5 rounded-full bg-surface-container text-secondary text-[10px]">
              8
            </span>
          </button>

          <button
            onClick={() => setActiveTab('overdue')}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl font-['Inter'] text-[12px] font-semibold transition-all cursor-pointer ${
              activeTab === 'overdue'
                ? 'bg-error-container text-on-error-container shadow-sm font-bold'
                : 'bg-surface-container-lowest text-secondary shadow-sm hover:text-on-surface'
            }`}
          >
            <span>OVERDUE</span>
            <span className="px-1.5 py-0.5 rounded-full bg-error text-on-error text-[10px] font-bold">
              2
            </span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl font-['Inter'] text-[12px] font-semibold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-primary-container text-on-primary shadow-sm'
                : 'bg-surface-container-lowest text-secondary shadow-sm hover:text-on-surface'
            }`}
          >
            <span>ALL SCHEDULED</span>
            <span className="px-1.5 py-0.5 rounded-full bg-surface-container text-secondary text-[10px]">
              18
            </span>
          </button>
        </section>

        {/* Section Title & Dynamic Target Value */}
        <div className="flex items-center justify-between mt-3 mb-2 px-1">
          <div className="flex items-center gap-1.5">
            <span className="font-['Inter'] text-[12px] font-semibold text-secondary">
              Today&apos;s Priority Pipeline
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            <span className="font-['Inter'] text-[11px] text-primary font-bold">5 Actions Due</span>
          </div>
          <span className="font-['Inter'] text-[13px] text-tertiary-container font-bold">
            ৳2,18,000 Expected
          </span>
        </div>

        {/* Cards List */}
        <div className="flex flex-col gap-3">
          {/* Card 1: Rahim Fashion (Featured / Expanded Interactions) */}
          <article
            id="card-rahim"
            className={`flex flex-col bg-surface-container-lowest rounded-xl p-3.5 shadow-sm relative overflow-hidden transition-all duration-200 border border-surface-container ${
              rahimClient.contactedToday ? 'opacity-50' : ''
            }`}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary-container"></div>

            {/* Card Header */}
            <div className="flex items-start justify-between gap-2 pt-1">
              <div
                className="flex items-start gap-2.5 min-w-0 cursor-pointer"
                onClick={() => onSelectCustomer(rahimClient.id)}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-surface-container-high relative">
                  <img
                    className="w-full h-full object-cover"
                    alt="Rahim Fashion denim stack"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2On_5lBNtONHD9xqVvz82f7IcZS-S2LyympyBudA0EtgUsSFrwGxPiU3imMGmOraozpCQZ7b-zZ1_jCAZI2N46aRAtqDxpvEF0bWc55C7W8pIwFZwq5UBmAJZ1yzRLizzi3odyGL1QNPJg4U2wPXO1Dn-Uf9oSaD-PRXO9hpuSaIqvoCgSO4CJ16sUcbWvrJF3FPeZ5ENbsmo-DxFpwb6iOPMhyW_nzA0CReWGk6r8kL1bi1Mso43"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-[16px] text-on-surface truncate hover:text-primary">
                      {rahimClient.name}
                    </h3>
                    <span className="px-1.5 py-0.5 rounded-full bg-surface-container-high text-primary-container font-['Inter'] text-[10px] uppercase font-bold tracking-wide">
                      VIP Customer
                    </span>
                  </div>
                  <p className="font-['Inter'] text-[12px] text-secondary truncate flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    Gazipur Industrial Area
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-low text-primary-container font-['Inter'] text-[11px] font-semibold shrink-0">
                <span className="material-symbols-outlined text-[14px]">timer</span>
                Due Today
              </span>
            </div>

            {/* Financial & AI Predictive Intelligence Block */}
            <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 rounded-lg bg-surface-container-low">
              <div className="flex flex-col">
                <span className="font-['Inter'] text-[11px] text-secondary">Last Order Details</span>
                <span className="font-['Inter'] text-[14px] font-bold text-on-surface mt-0.5">
                  10 Sep • ৳57,000
                </span>
                <span className="font-['Inter'] text-[11px] text-secondary">
                  100 pcs (D-501 Selvedge)
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-['Inter'] text-[11px] text-secondary">Predicted Restock</span>
                <span className="font-['Inter'] text-[14px] font-bold text-tertiary-container mt-0.5">
                  6 Oct 2026
                </span>
                <span className="font-['Inter'] text-[11px] text-secondary">
                  Cycle: Every 26 days (3d Lead)
                </span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 mt-3">
              <button
                className="flex-1 h-11 flex items-center justify-center gap-1.5 px-3 rounded-lg bg-[#25D366] text-white font-['Inter'] text-[13px] font-semibold active:scale-95 transition-transform shadow-sm cursor-pointer hover:opacity-90"
                onClick={() => onOpenWhatsApp(rahimClient)}
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                <span>WhatsApp</span>
              </button>

              <button
                className="flex-1 h-11 flex items-center justify-center gap-1.5 px-3 rounded-lg bg-primary text-on-primary font-['Inter'] text-[13px] font-semibold active:scale-95 transition-transform shadow-sm cursor-pointer hover:bg-primary-container"
                onClick={() =>
                  setExpandedDrawerId(expandedDrawerId === 'c-rahim' ? null : 'c-rahim')
                }
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Mark Contacted</span>
              </button>

              <button
                aria-label="Reschedule contact date"
                className="w-11 h-11 flex items-center justify-center rounded-lg bg-surface-container text-secondary active:scale-90 transition-transform cursor-pointer hover:text-on-surface"
                onClick={() => onShowToast('Rescheduled Rahim Fashion for +3 days.')}
              >
                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
              </button>
            </div>

            {/* Quick Contact Result Drawer */}
            {expandedDrawerId === 'c-rahim' && (
              <div
                id="rahim-drawer"
                className="mt-3 pt-3 bg-surface-container-low rounded-lg p-3 flex flex-col gap-2.5 transition-all border border-surface-container"
              >
                <div className="flex items-center justify-between">
                  <span className="font-['Inter'] text-[12px] text-on-surface font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">rate_review</span>
                    Contact Result Log:
                  </span>
                  <span className="font-['Inter'] text-[11px] text-secondary">Auto-updates CRM</span>
                </div>

                {/* Outcome Pills List */}
                <div className="grid grid-cols-2 gap-2" role="radiogroup">
                  <label
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedResults['c-rahim'] === 'Interested'
                        ? 'bg-primary text-on-primary font-semibold'
                        : 'bg-surface-container-lowest hover:bg-surface-container-high'
                    }`}
                  >
                    <input
                      className="accent-primary"
                      name="contact_result_rahim"
                      type="radio"
                      value="Interested"
                      checked={selectedResults['c-rahim'] === 'Interested'}
                      onChange={() => handleResultChange('c-rahim', 'Interested')}
                    />
                    <span className="font-['Inter'] text-[12px]">Interested</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedResults['c-rahim'] === 'Will Order Later'
                        ? 'bg-primary text-on-primary font-semibold'
                        : 'bg-surface-container-lowest hover:bg-surface-container-high'
                    }`}
                  >
                    <input
                      className="accent-primary"
                      name="contact_result_rahim"
                      type="radio"
                      value="Will Order Later"
                      checked={selectedResults['c-rahim'] === 'Will Order Later'}
                      onChange={() => handleResultChange('c-rahim', 'Will Order Later')}
                    />
                    <span className="font-['Inter'] text-[12px]">Will Order Later</span>
                  </label>

                  <label
                    className={`col-span-2 flex items-center justify-between p-2 rounded-lg cursor-pointer transition-opacity ${
                      selectedResults['c-rahim'] === 'Ordered (Immediate)'
                        ? 'bg-primary text-on-primary ring-2 ring-primary-container'
                        : 'bg-primary-container text-on-primary'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        className="accent-white"
                        name="contact_result_rahim"
                        type="radio"
                        value="Ordered (Immediate)"
                        checked={selectedResults['c-rahim'] === 'Ordered (Immediate)'}
                        onChange={() => handleResultChange('c-rahim', 'Ordered (Immediate)')}
                      />
                      <span className="font-['Plus_Jakarta_Sans'] text-[13px] font-bold">
                        Ordered (Immediate)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('add-order');
                      }}
                      className="flex items-center gap-1 font-['Inter'] text-[11px] font-bold bg-on-primary text-primary-container px-2 py-0.5 rounded shadow-xs cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">add_shopping_cart</span>
                      +Add Order
                    </button>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedResults['c-rahim'] === 'No Response'
                        ? 'bg-primary text-on-primary font-semibold'
                        : 'bg-surface-container-lowest hover:bg-surface-container-high'
                    }`}
                  >
                    <input
                      className="accent-primary"
                      name="contact_result_rahim"
                      type="radio"
                      value="No Response"
                      checked={selectedResults['c-rahim'] === 'No Response'}
                      onChange={() => handleResultChange('c-rahim', 'No Response')}
                    />
                    <span className="font-['Inter'] text-[12px] text-secondary">No Response</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedResults['c-rahim'] === 'Not Interested'
                        ? 'bg-error text-on-error font-semibold'
                        : 'bg-surface-container-lowest hover:bg-surface-container-high'
                    }`}
                  >
                    <input
                      className="accent-error"
                      name="contact_result_rahim"
                      type="radio"
                      value="Not Interested"
                      checked={selectedResults['c-rahim'] === 'Not Interested'}
                      onChange={() => handleResultChange('c-rahim', 'Not Interested')}
                    />
                    <span className="font-['Inter'] text-[12px] text-error font-medium">
                      Not Interested
                    </span>
                  </label>
                </div>

                <button
                  className="w-full mt-1 py-2 rounded bg-surface-container-highest text-primary font-['Inter'] text-[12px] font-bold active:bg-primary-container active:text-on-primary transition-colors text-center cursor-pointer"
                  onClick={() => handleSaveContactLog('c-rahim')}
                  type="button"
                >
                  Save Contact Log
                </button>
              </div>
            )}
          </article>

          {/* Card 2: Karim Traders */}
          <article
            id="card-karim"
            className="flex flex-col bg-surface-container-lowest rounded-xl p-3.5 shadow-sm relative overflow-hidden transition-all duration-200 border border-surface-container"
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className="flex items-start gap-2.5 min-w-0 cursor-pointer"
                onClick={() => onSelectCustomer(karimClient.id)}
              >
                <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-surface-container-high relative">
                  <img
                    className="w-full h-full object-cover"
                    alt="Karim Traders warehouse denim"
                    src={karimClient.avatar}
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-[15px] text-on-surface truncate hover:text-primary">
                      {karimClient.name}
                    </h3>
                    <span className="px-1.5 py-0.5 rounded-full bg-surface-container-high text-primary-container font-['Inter'] text-[10px] uppercase font-bold">
                      VIP Customer
                    </span>
                  </div>
                  <p className="font-['Inter'] text-[11px] text-secondary truncate mt-0.5">
                    {karimClient.district} • {karimClient.phone}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-secondary font-['Inter'] text-[11px] shrink-0 font-medium">
                Reorder: 7 Oct
              </span>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-secondary font-['Inter'] text-[12px] bg-surface-container-low px-2.5 py-1.5 rounded">
              <span>Last Batch: {karimClient.lastOrderDate} (120 pcs D-502)</span>
              <span className="font-['Inter'] text-[13px] text-on-surface font-bold">৳69,600</span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                className="h-10 flex items-center justify-center gap-1.5 rounded-lg bg-[#25D366] text-white font-['Inter'] text-[12px] font-semibold active:scale-95 transition-transform shadow-sm cursor-pointer hover:opacity-90"
                onClick={() => onOpenWhatsApp(karimClient)}
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                <span>WhatsApp</span>
              </button>
              <button
                className="h-10 flex items-center justify-center gap-1.5 rounded-lg bg-surface-container-high text-primary font-['Inter'] text-[12px] font-semibold active:bg-primary active:text-on-primary transition-colors cursor-pointer"
                onClick={() => {
                  onSaveContactLog(karimClient.id, 'Interested');
                  onShowToast(`Follow-up logged for ${karimClient.name}`);
                }}
              >
                <span className="material-symbols-outlined text-[18px]">check</span>
                <span>Contacted</span>
              </button>
            </div>
          </article>

          {/* Card 3: Sakib Jeans */}
          <article
            id="card-sakib"
            className="flex flex-col bg-surface-container-lowest rounded-xl p-3.5 shadow-sm relative overflow-hidden transition-all duration-200 border border-surface-container"
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className="flex items-start gap-2.5 min-w-0 cursor-pointer"
                onClick={() => onSelectCustomer(sakibClient.id)}
              >
                <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-surface-container-high relative">
                  <img
                    className="w-full h-full object-cover"
                    alt="Sakib Jeans store shelves"
                    src={sakibClient.avatar}
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-[15px] text-on-surface truncate hover:text-primary">
                      {sakibClient.name}
                    </h3>
                    <span className="px-1.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed font-['Inter'] text-[10px] uppercase font-bold">
                      High Value
                    </span>
                  </div>
                  <p className="font-['Inter'] text-[11px] text-secondary truncate mt-0.5">
                    {sakibClient.district} • {sakibClient.phone}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-secondary font-['Inter'] text-[11px] shrink-0 font-medium">
                Reorder: 8 Oct
              </span>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-secondary font-['Inter'] text-[12px] bg-surface-container-low px-2.5 py-1.5 rounded">
              <span>Average Order Velocity: 34 Days</span>
              <span className="font-['Inter'] text-[13px] text-on-surface font-bold">৳91,400</span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                className="h-10 flex items-center justify-center gap-1.5 rounded-lg bg-[#25D366] text-white font-['Inter'] text-[12px] font-semibold active:scale-95 transition-transform shadow-sm cursor-pointer hover:opacity-90"
                onClick={() => onOpenWhatsApp(sakibClient)}
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                <span>WhatsApp</span>
              </button>
              <button
                className="h-10 flex items-center justify-center gap-1.5 rounded-lg bg-surface-container-high text-primary font-['Inter'] text-[12px] font-semibold active:bg-primary active:text-on-primary transition-colors cursor-pointer"
                onClick={() => {
                  onSaveContactLog(sakibClient.id, 'Interested');
                  onShowToast(`Follow-up logged for ${sakibClient.name}`);
                }}
              >
                <span className="material-symbols-outlined text-[18px]">check</span>
                <span>Contacted</span>
              </button>
            </div>
          </article>
        </div>

        {/* Overdue Alert Critical Section */}
        <section className="flex flex-col mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-error">
              <span className="material-symbols-outlined text-[20px]">warning</span>
              <span className="font-['Plus_Jakarta_Sans'] font-bold text-headline-sm">
                Overdue Follow-ups (Action Needed)
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-['Inter'] text-[11px] font-bold">
              Immediate
            </span>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-3.5 shadow-sm border-l-4 border-l-error flex flex-col gap-2.5 border border-surface-container">
            <div className="flex items-start justify-between">
              <div className="flex flex-col min-w-0">
                <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-[15px] text-on-surface truncate">
                  {modernClient.name}
                </h4>
                <span className="font-['Inter'] text-[11px] text-secondary">
                  {modernClient.district} • Account Tier 1
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-error text-on-error font-['Inter'] text-[11px] font-bold tracking-wide">
                Overdue 4 Days
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-secondary font-['Inter'] text-[12px]">
              <span className="material-symbols-outlined text-[16px] text-error">event_busy</span>
              <span>
                Reorder was calculated for{' '}
                <strong className="text-on-surface">{modernClient.nextExpectedOrder}</strong> (Missed
                cycle window)
              </span>
            </div>

            <button
              onClick={() => onOpenWhatsApp(modernClient)}
              className="w-full h-11 rounded-lg bg-error text-on-error font-['Inter'] text-[13px] font-bold flex items-center justify-center gap-2 active:opacity-95 transition-opacity shadow-sm mt-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">mark_chat_unread</span>
              <span>Urgent Follow-up via WhatsApp</span>
            </button>
          </div>
        </section>

        {/* Inactive Customer Automation Alert Pill */}
        <section className="mt-4 flex flex-col bg-surface-container-high rounded-xl p-3.5 shadow-sm relative overflow-hidden border border-surface-container-highest">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[18px]">history_toggle_off</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-['Inter'] text-[10px] text-secondary uppercase font-bold tracking-wider">
                Churn Risk Automation
              </span>
              <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-[15px] text-on-surface leading-tight">
                3 Inactive Customers Detected
              </h4>
            </div>
          </div>

          {/* Inactive Accounts Stacks */}
          <div className="flex flex-col gap-1.5 mt-2.5">
            <div className="flex items-center justify-between bg-surface-container-lowest px-2.5 py-2 rounded-lg border border-surface-container">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                <span className="font-['Inter'] text-[12px] font-semibold text-on-surface truncate">
                  Jamuna Garments (Tangail)
                </span>
              </div>
              <span className="font-['Inter'] text-[11px] text-secondary shrink-0 font-medium">
                30+ Days Dormant
              </span>
            </div>

            <div className="flex items-center justify-between bg-surface-container-lowest px-2.5 py-2 rounded-lg border border-surface-container">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-outline"></span>
                <span className="font-['Inter'] text-[12px] font-semibold text-on-surface truncate">
                  Blue Star Jeans (Sylhet)
                </span>
              </div>
              <span className="font-['Inter'] text-[11px] text-secondary shrink-0 font-medium">
                60+ Days Inactive
              </span>
            </div>

            <div className="flex items-center justify-between bg-surface-container-lowest px-2.5 py-2 rounded-lg border border-surface-container">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-error"></span>
                <span className="font-['Inter'] text-[12px] text-error truncate font-bold">
                  Apex Denim Shop (Barisal)
                </span>
              </div>
              <span className="font-['Inter'] text-[11px] text-error shrink-0 font-bold">
                90+ Days (Lost Risk)
              </span>
            </div>
          </div>

          {/* Automated Broadcast Action */}
          <button
            onClick={onLaunchCampaign}
            className="mt-3 w-full h-11 rounded-lg bg-primary-container text-on-primary font-['Inter'] text-[13px] font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform cursor-pointer hover:bg-primary"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">forward_to_inbox</span>
            <span>Send Re-Engagement WhatsApp Campaign</span>
          </button>
        </section>

        {/* Bottom Quick Settings Preview */}
        <section className="mt-4 p-2.5 bg-surface-container-low rounded-xl flex items-center justify-between border border-surface-container">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-[18px] text-secondary">tune</span>
            <p className="font-['Inter'] text-[12px] text-secondary truncate">
              Default Lead Time: <strong className="text-on-surface">{defaultLeadTime} Days</strong> |
              Cycle: <strong className="text-on-surface">{defaultCycleRange} Days</strong>
            </p>
          </div>
          <button
            onClick={() => setShowAdjustModal(true)}
            className="font-['Inter'] text-[11px] text-primary font-bold hover:underline px-2 py-1 shrink-0 cursor-pointer"
            type="button"
          >
            Adjust
          </button>
        </section>
      </div>

      {/* Adjust Lead Time Modal */}
      {showAdjustModal && (
        <div
          className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowAdjustModal(false)}
        >
          <div
            className="w-full max-w-sm bg-surface-container-lowest rounded-2xl p-5 shadow-2xl flex flex-col gap-4 border border-surface-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-headline-sm text-primary">
                Adjust CRM Engine Cycles
              </h3>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-secondary hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-['Inter'] text-[12px] font-semibold text-on-surface block mb-1">
                  Predictive Lead Time (Days before depletion)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 3, 4, 5].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDefaultLeadTime(d)}
                      className={`py-2 rounded-lg font-['Inter'] text-[12px] font-bold transition-colors cursor-pointer ${
                        defaultLeadTime === d
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container text-secondary hover:text-on-surface'
                      }`}
                    >
                      {d} Days
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-['Inter'] text-[12px] font-semibold text-on-surface block mb-1">
                  Default Buying Velocity Cycle
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['20-25', '26-30', '31-35'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setDefaultCycleRange(r)}
                      className={`py-2 rounded-lg font-['Inter'] text-[12px] font-bold transition-colors cursor-pointer ${
                        defaultCycleRange === r
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container text-secondary hover:text-on-surface'
                      }`}
                    >
                      {r} Days
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowAdjustModal(false);
                onShowToast('Updated AI cycle & lead time parameters');
              }}
              className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-['Inter'] text-[13px] font-bold cursor-pointer hover:bg-primary-container transition-colors"
            >
              Save Parameters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
