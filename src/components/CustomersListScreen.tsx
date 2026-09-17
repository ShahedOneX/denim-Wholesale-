import React, { useState } from 'react';
import { Customer } from '../types';

interface CustomersListScreenProps {
  customers: Customer[];
  onSelectCustomer: (customerId: string) => void;
  onOpenWhatsApp: (customer: Customer) => void;
  onNewOrder: (customer: Customer) => void;
  onExportCSV?: () => void;
}

export const CustomersListScreen: React.FC<CustomersListScreenProps> = ({
  customers,
  onSelectCustomer,
  onOpenWhatsApp,
  onNewOrder,
  onExportCSV,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'VIP Customer' | 'High Value' | 'At Risk' | 'Dormant'>('all');

  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);

    const matchesTier = tierFilter === 'all' || c.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="flex flex-col w-full pb-28 pt-20 px-4 max-w-lg mx-auto">
      {/* Top Title & Export Action Bar */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-[17px] text-on-surface">
            Wholesale Accounts
          </h2>
          <p className="font-['Inter'] text-[11px] text-secondary">
            {customers.length} Accounts • Total LTV: ৳ {customers.reduce((sum, c) => sum + c.ltv, 0).toLocaleString('en-IN')}
          </p>
        </div>

        <button
          id="export-csv-btn"
          onClick={onExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-['Inter'] text-[12px] font-semibold border border-surface-container-high transition-colors shadow-xs cursor-pointer active:scale-95"
          title="Download ledger backup as CSV for Excel / Accounting"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          <span>Export CSV</span>
        </button>
      </div>

      {/* Search & Filter Header */}
      <div className="space-y-3 mb-3">
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-secondary text-[20px]">
            search
          </span>
          <input
            type="text"
            className="w-full bg-surface-container-low text-on-surface font-['Inter'] text-[14px] pl-10 pr-4 py-2.5 rounded-xl outline-none focus:bg-surface-container border border-surface-container focus:border-primary transition-colors"
            placeholder="Search wholesale client, shop, district, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-secondary hover:text-on-surface cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">cancel</span>
            </button>
          )}
        </div>

        {/* Tier Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: `All (${customers.length})` },
            { id: 'VIP Customer', label: 'VIP (8)' },
            { id: 'High Value', label: 'High Value' },
            { id: 'At Risk', label: 'At Risk (5)' },
            { id: 'Dormant', label: 'Dormant' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTierFilter(tab.id as any)}
              className={`shrink-0 px-3 py-1.5 rounded-full font-['Inter'] text-[12px] font-semibold transition-all cursor-pointer ${
                tierFilter === tab.id
                  ? 'bg-primary-container text-on-primary shadow-sm'
                  : 'bg-surface-container-lowest text-secondary shadow-xs hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Client List */}
      <div className="flex flex-col gap-2.5">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-secondary bg-surface-container-lowest rounded-xl border border-surface-container">
            <span className="material-symbols-outlined text-[36px] text-secondary/60 mb-2">
              person_search
            </span>
            <p className="font-['Inter'] text-[14px]">No wholesale accounts found matching your query.</p>
          </div>
        ) : (
          filtered.map((customer) => (
            <article
              key={customer.id}
              className="rounded-xl bg-surface-container-lowest p-3.5 shadow-sm border border-surface-container flex flex-col gap-2.5 hover:border-primary/40 transition-colors"
            >
              <div
                className="flex items-start justify-between gap-2.5 cursor-pointer"
                onClick={() => onSelectCustomer(customer.id)}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <img
                    className="w-12 h-12 rounded-xl object-cover shadow-xs shrink-0 ring-1 ring-surface-container"
                    alt={`${customer.name} avatar`}
                    src={customer.avatar}
                  />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-[15px] text-on-surface truncate hover:text-primary">
                        {customer.name}
                      </h3>
                      <span
                        className={`px-1.5 py-0.2 rounded font-['Inter'] text-[9px] font-bold uppercase tracking-wider ${
                          customer.tier === 'VIP Customer'
                            ? 'bg-primary-container text-on-primary'
                            : customer.tier === 'At Risk'
                            ? 'bg-error-container text-on-error-container'
                            : 'bg-surface-container text-secondary'
                        }`}
                      >
                        {customer.tier}
                      </span>
                    </div>
                    <span className="font-['Inter'] text-[12px] text-secondary truncate mt-0.5">
                      {customer.ownerName} • {customer.district}
                    </span>
                    <span className="font-['Inter'] text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[13px] text-tertiary-container">
                        chat
                      </span>
                      {customer.phone}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-['Inter'] text-[10px] text-secondary uppercase block">LTV</span>
                  <span className="font-['Inter'] text-[15px] font-bold text-primary">
                    ৳ {customer.ltv.toLocaleString('en-IN')}
                  </span>
                  <span className="block font-['Inter'] text-[10px] text-secondary">
                    {customer.ordersCount} orders
                  </span>
                </div>
              </div>

              {/* Specs & Velocity Summary */}
              <div className="p-2 rounded-lg bg-surface-container-low flex items-center justify-between text-[11px] font-['Inter']">
                <span className="text-secondary truncate">
                  Affinity: <strong className="text-on-surface">{customer.preferredModel}</strong>
                </span>
                <span className="text-primary font-bold shrink-0 ml-1">
                  ~{customer.cycleDays}d Cycle
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => onSelectCustomer(customer.id)}
                  className="py-2 px-2 rounded-lg bg-surface-container text-primary font-['Inter'] text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">visibility</span>
                  <span>Ledger</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenWhatsApp(customer)}
                  className="py-2 px-2 rounded-lg bg-tertiary text-on-tertiary font-['Inter'] text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-tertiary-container transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px] text-tertiary-fixed">
                    chat
                  </span>
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNewOrder(customer)}
                  className="py-2 px-2 rounded-lg bg-primary text-on-primary font-['Inter'] text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-primary-container transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">add</span>
                  <span>+Order</span>
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
};
