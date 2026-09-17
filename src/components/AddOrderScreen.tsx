import React, { useState } from 'react';
import { Customer, DENIM_MODELS } from '../data/initialData';
import { OrderTag } from '../types';

interface AddOrderScreenProps {
  customers: Customer[];
  onOrderSaved: (newOrder: {
    clientName: string;
    shopName: string;
    phone: string;
    secondaryPhone?: string;
    detailedAddress?: string;
    district: string;
    model: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
    paymentStatus: 'Full Paid' | 'Partial Adv.' | 'Due / Credit';
    deliveryStatus: 'Pending' | 'Dispatched' | 'Delivered';
    logisticsNote: string;
    tags?: OrderTag[];
  }) => void;
  onNavigate: (tab: 'dashboard' | 'customers' | 'add-order' | 'follow-ups' | 'analytics') => void;
}

export const AddOrderScreen: React.FC<AddOrderScreenProps> = ({
  customers,
  onOrderSaved,
  onNavigate,
}) => {
  // Form State
  const [waNumber, setWaNumber] = useState('01718-492011');
  const [clientName, setClientName] = useState('Rahim Uddin');
  const [shopName, setShopName] = useState('Rahim Fashion & Wholesale');
  const [district, setDistrict] = useState('Gazipur');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [detailedAddress, setDetailedAddress] = useState('');
  const [showExtraDetails, setShowExtraDetails] = useState(false);

  // Commercials State
  const [selectedModel, setSelectedModel] = useState('D-501 Heavy Denim');
  const [quantity, setQuantity] = useState<number>(100);
  const [unitPrice, setUnitPrice] = useState<number>(570);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'Full Paid' | 'Partial Adv.' | 'Due / Credit'>('Full Paid');
  const [deliveryMode, setDeliveryMode] = useState<'Pending' | 'Dispatched' | 'Delivered'>('Pending');
  const [orderNotes, setOrderNotes] = useState(
    'Requires urgent dispatch via Sundarban Courier - Tongi Hub counter.'
  );

  // Warehouse Order Tags State
  const [selectedTags, setSelectedTags] = useState<OrderTag[]>(['Wholesale', 'Priority']);

  const AVAILABLE_TAGS: { id: OrderTag; label: string; icon: string; activeClass: string; inactiveClass: string }[] = [
    { id: 'Priority', label: 'Priority', icon: 'flag', activeClass: 'bg-error-container text-on-error-container border-error', inactiveClass: 'bg-surface-container text-secondary border-transparent' },
    { id: 'Wholesale', label: 'Wholesale', icon: 'inventory_2', activeClass: 'bg-primary-container/40 text-primary border-primary', inactiveClass: 'bg-surface-container text-secondary border-transparent' },
    { id: 'Sample', label: 'Sample', icon: 'science', activeClass: 'bg-tertiary-container/40 text-on-tertiary-container border-tertiary', inactiveClass: 'bg-surface-container text-secondary border-transparent' },
    { id: 'Rush', label: 'Rush', icon: 'bolt', activeClass: 'bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500', inactiveClass: 'bg-surface-container text-secondary border-transparent' },
    { id: 'Backorder', label: 'Backorder', icon: 'history', activeClass: 'bg-secondary-container text-on-secondary-container border-secondary', inactiveClass: 'bg-surface-container text-secondary border-transparent' },
  ];

  const handleToggleTag = (tag: OrderTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Submitting / Confirmation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Auto-detect client by phone lookup
  const matchedClient = customers.find((c) => {
    const cleanInput = waNumber.replace(/[^0-9]/g, '');
    const cleanCustomer = c.phone.replace(/[^0-9]/g, '');
    const cleanSecondary = (c.secondaryPhone || '').replace(/[^0-9]/g, '');
    return (
      (cleanInput.length >= 6 && cleanCustomer.includes(cleanInput)) ||
      (cleanInput.length >= 6 && cleanSecondary.includes(cleanInput))
    );
  });

  // Calculate live totals
  const safeQty = Math.max(0, quantity || 0);
  const safePrice = Math.max(0, unitPrice || 0);
  const safeDiscount = Math.max(0, discount || 0);
  const grossValuation = Math.max(0, safeQty * safePrice - safeDiscount);

  const handleSelectModel = (name: string, price: number) => {
    setSelectedModel(name);
    setUnitPrice(price);
  };

  const handleCommitOrder = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onOrderSaved({
        clientName,
        shopName,
        phone: waNumber,
        secondaryPhone,
        detailedAddress,
        district,
        model: selectedModel,
        quantity: safeQty,
        unitPrice: safePrice,
        discount: safeDiscount,
        total: grossValuation,
        paymentStatus: paymentMode,
        deliveryStatus: deliveryMode,
        logisticsNote: orderNotes,
        tags: selectedTags,
      });
      setIsSubmitting(false);
      setShowSuccessToast(true);
    }, 600);
  };

  return (
    <div className="flex flex-col w-full pb-28 pt-16 px-4 max-w-lg mx-auto">
      <div className="flex flex-col w-full space-y-3.5">
        {/* Value Proposition Alert Banner */}
        <div className="bg-primary-fixed text-on-primary-fixed p-3.5 rounded-xl shadow-sm flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-on-primary text-[18px]">auto_mode</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-['Plus_Jakarta_Sans'] text-[12px] font-bold tracking-tight text-primary uppercase">
              Enter Data Once → System Does The Rest
            </span>
            <p className="font-['Inter'] text-[11px] text-on-primary-fixed-variant mt-0.5 leading-tight">
              Customer ledger, replenishment forecast, timeline log &amp; VIP alerts sync instantly.
            </p>
          </div>
        </div>

        {/* Form Header & Speed Tag */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[22px]">post_add</span>
            <span className="font-['Plus_Jakarta_Sans'] font-bold text-headline-sm text-on-surface tracking-tight">
              Wholesale Entry
            </span>
          </div>
          <div className="flex items-center gap-1 bg-surface-container-high text-primary px-2.5 py-1 rounded-full shadow-sm">
            <span className="material-symbols-outlined text-[15px]">timer</span>
            <span className="font-['Inter'] text-[11px] font-semibold">⏱️ 30s Quick Pass</span>
          </div>
        </div>

        {/* Micro Assistant Interactive Strip */}
        <div
          id="customerMatchBadge"
          className={`px-3 py-1.5 rounded-lg flex items-center justify-between text-[12px] transition-all duration-300 ${
            matchedClient
              ? 'bg-tertiary-container text-on-tertiary'
              : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="material-symbols-outlined text-[18px] text-tertiary-fixed">bolt</span>
            <span className="font-['Inter'] font-medium truncate">
              {matchedClient ? (
                <>
                  <span className="font-bold">{matchedClient.name}</span> detected (Match #AFW-774)
                </>
              ) : (
                'Smart duplicate guard active • Auto-verification enabled'
              )}
            </span>
          </div>
          <span className="font-['Inter'] text-tertiary-fixed text-[11px] uppercase tracking-wider font-semibold shrink-0">
            Zero Redundancy
          </span>
        </div>

        {/* Section 1: Customer Profile */}
        <div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-sm space-y-3 border border-surface-container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary font-['Plus_Jakarta_Sans'] text-[11px] font-bold flex items-center justify-center">
                1
              </span>
              <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-[16px] text-on-surface">
                Client Identification
              </h2>
            </div>
            <span className="font-['Inter'] text-secondary text-[11px]">Primary Unique ID</span>
          </div>

          {/* WhatsApp / Phone field */}
          <div className="space-y-1">
            <label
              className="font-['Inter'] text-[13px] font-semibold text-on-surface-variant flex items-center justify-between"
              htmlFor="waNumber"
            >
              <span>
                WhatsApp Number <span className="text-error">*</span>
              </span>
              <span className="font-['Inter'] text-primary flex items-center gap-0.5 text-[11px] font-semibold">
                <span className="material-symbols-outlined text-[13px]">verified</span> Primary Key
              </span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 flex items-center gap-1 text-secondary pointer-events-none">
                <span className="material-symbols-outlined text-[18px] text-on-tertiary-container">chat</span>
                <span className="font-['Inter'] text-body-md font-semibold text-on-surface">+880</span>
              </div>
              <input
                id="waNumber"
                className="w-full bg-surface-container-low text-on-surface font-['Inter'] text-[15px] font-semibold pl-24 pr-10 py-2.5 rounded-lg outline-none focus:bg-surface-container transition-colors border border-transparent focus:border-primary"
                placeholder="01712-345678"
                type="tel"
                value={waNumber}
                onChange={(e) => setWaNumber(e.target.value)}
              />
              <span className="material-symbols-outlined absolute right-3 text-on-tertiary-container text-[20px]">
                {matchedClient ? 'check_circle' : 'person_add'}
              </span>
            </div>
            <div className="bg-surface-container-low p-2 rounded-lg text-secondary font-['Inter'] text-[11px] flex items-center gap-1.5 mt-1">
              <span className="material-symbols-outlined text-primary text-[14px]">lightbulb</span>
              <span>Auto-detects client history or opens new verified ledger profile</span>
            </div>
          </div>

          {/* Client Name & Business Name Stacked Pair */}
          <div className="grid grid-cols-1 gap-2.5">
            <div className="space-y-1">
              <label
                className="font-['Inter'] text-[12px] font-semibold text-on-surface-variant"
                htmlFor="clientName"
              >
                Merchant / Contact Name <span className="text-error">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-secondary text-[18px]">
                  person
                </span>
                <input
                  id="clientName"
                  className="w-full bg-surface-container-low text-on-surface font-['Inter'] text-[14px] pl-10 pr-3 py-2.5 rounded-lg outline-none focus:bg-surface-container transition-colors border border-transparent focus:border-primary"
                  placeholder="e.g. Rahim Uddin"
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label
                className="font-['Inter'] text-[12px] font-semibold text-on-surface-variant"
                htmlFor="shopName"
              >
                Shop / Outlet Enterprise <span className="text-error">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-secondary text-[18px]">
                  storefront
                </span>
                <input
                  id="shopName"
                  className="w-full bg-surface-container-low text-on-surface font-['Inter'] text-[14px] pl-10 pr-3 py-2.5 rounded-lg outline-none focus:bg-surface-container transition-colors border border-transparent focus:border-primary"
                  placeholder="e.g. Rahim Fashion"
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Distribution Zone */}
          <div className="space-y-1">
            <label
              className="font-['Inter'] text-[12px] font-semibold text-on-surface-variant"
              htmlFor="districtSelect"
            >
              Wholesale Distribution Zone <span className="text-error">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-secondary text-[18px]">
                location_on
              </span>
              <select
                id="districtSelect"
                className="w-full bg-surface-container-low text-on-surface font-['Inter'] text-[14px] pl-10 pr-9 py-2.5 rounded-lg outline-none focus:bg-surface-container appearance-none transition-colors border border-transparent focus:border-primary cursor-pointer"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              >
                <option value="Gazipur">Gazipur Industrial Belt</option>
                <option value="Dhaka">Dhaka Central (Islampur / Sadarghat)</option>
                <option value="Tongi">Tongi Station Road</option>
                <option value="Mirpur">Mirpur 10 Garment Hub</option>
                <option value="Narayanganj">Narayanganj Fabric Market</option>
                <option value="Chittagong">Chittagong Terribazar</option>
                <option value="Jamalpur">Jamalpur Wholesale Point</option>
                <option value="Bogura">Bogura Cantonment Zone</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 text-secondary pointer-events-none text-[20px]">
                expand_more
              </span>
            </div>
          </div>

          {/* Client Visual Context Tile */}
          <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-container">
            <img
              className="w-12 h-12 rounded-lg object-cover shrink-0 shadow-sm"
              alt="Denim fabrics in wholesale shop"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKq8G0kuB1tRakZ-3mJFTRy3-gN6LSoFv6TBYJNBCXDWfX2fDKhpNLgIzdA-KOUeZbHybfGDti65wUYarOzEXNAaXjIHgJExavmuFaVocTFXFFn0C2hzkYzjy91lFKpAmSBScZCLe7LxmMME8kpLTcR3alW8gSO3Nq0PS6lgysipw_azGwdW2fqmpZgDbo1eUx6WX7wiOBz5NTTMn3TXFZvrlCDrbcB4b-p6f2ruoPB2Q9l3HVK1Tc"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-['Plus_Jakarta_Sans'] font-bold text-[13px] text-primary truncate">
                {matchedClient ? matchedClient.name : 'Rahim Fashion'} (Tongi Warehouse)
              </span>
              <span className="font-['Inter'] text-[11px] text-secondary">
                Tier-1 Partner • 4 Orders YTD • 98% Pay On-Time
              </span>
            </div>
          </div>

          {/* Toggle Alternative Details */}
          <div>
            <button
              className="flex items-center justify-between w-full py-1.5 px-2 text-left rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
              onClick={() => setShowExtraDetails(!showExtraDetails)}
              type="button"
            >
              <span className="font-['Inter'] text-[12px] font-semibold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">
                  {showExtraDetails ? 'do_not_disturb_on' : 'add_circle'}
                </span>
                <span>Alternative Phone, Invoicing &amp; Delivery Address</span>
              </span>
              <span className="font-['Inter'] text-secondary text-[11px]">Optional</span>
            </button>

            {showExtraDetails && (
              <div className="pt-2 space-y-2">
                <div className="space-y-1">
                  <label className="font-['Inter'] text-[11px] font-semibold text-on-surface-variant">
                    Secondary Line / Manager Mobile
                  </label>
                  <input
                    className="w-full bg-surface-container-low text-on-surface font-['Inter'] text-[13px] px-3 py-2 rounded-lg outline-none focus:bg-surface-container"
                    placeholder="+880 01XXXXXXXXX"
                    type="tel"
                    value={secondaryPhone}
                    onChange={(e) => setSecondaryPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-['Inter'] text-[11px] font-semibold text-on-surface-variant">
                    Detailed Road / Floor / Market Gate
                  </label>
                  <textarea
                    className="w-full bg-surface-container-low text-on-surface font-['Inter'] text-[13px] px-3 py-2 rounded-lg outline-none focus:bg-surface-container"
                    placeholder="Gareeb-E-Newaz Avenue, Sector 11, Shop 42, 2nd Floor..."
                    rows={2}
                    value={detailedAddress}
                    onChange={(e) => setDetailedAddress(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Denim Fabric & Batch Details */}
        <div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-sm space-y-3 border border-surface-container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary font-['Plus_Jakarta_Sans'] text-[11px] font-bold flex items-center justify-center">
                2
              </span>
              <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-[16px] text-on-surface">
                Denim Lot &amp; Commercials
              </h2>
            </div>
            <div className="flex items-center gap-1 text-secondary font-['Inter'] text-[11px]">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              <span>Today, 10 Sep</span>
            </div>
          </div>

          {/* Denim Models Quick Select Strip */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-['Inter'] text-[12px] font-semibold text-on-surface-variant">
                Select Denim Model / Grade
              </label>
              <span className="font-['Inter'] text-primary text-[11px] font-semibold">Fast Lot Picker</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar">
              {DENIM_MODELS.map((model) => {
                const isSelected = selectedModel.includes(model.name.split(' ')[0]);
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => handleSelectModel(model.name, model.defaultPrice)}
                    className={`shrink-0 px-3 py-1.5 rounded-full font-['Inter'] text-[12px] font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span>{model.shortLabel}</span>
                    <span className="text-[11px] opacity-80">৳{model.defaultPrice}</span>
                  </button>
                );
              })}
            </div>
            <input
              id="selectedModelInput"
              className="w-full bg-surface-container-low text-on-surface font-['Inter'] text-[14px] px-3 py-2 rounded-lg outline-none focus:bg-surface-container font-semibold mt-1"
              type="text"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            />
          </div>

          {/* Denim Visual Verification Preview */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low">
              <img
                className="w-10 h-10 rounded-lg object-cover shadow-xs shrink-0"
                alt="Lot #AFW-9920 dark indigo weave"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuARx3BM6-b4L5Gdnf_Qn_QkPFH5wWZSsCDn7_XF-nvNUYa7w7GcS0PskCDpVsnATiWC_HQa5-iD6iP0Dbx8GnDJAdKXsQsKArLyHaOWiHncWUVZpa84phMx1QDTKBxcS8Id2zpCe8BtLmuRSo1KZfPU7s-RO2lM5TWZztbv8Ny5vzRnOHfwdTe09httDi9CJe3vXg5-Znt0m4Mgs78WP6Ot9tS4Pkh7pYVqs3Qjgv59NbooiNIjWYWm"
              />
              <div className="flex flex-col min-w-0">
                <span className="font-['Inter'] text-[12px] font-bold text-on-surface truncate">
                  Lot #AFW-9920
                </span>
                <span className="font-['Inter'] text-[11px] text-secondary">100% Ring Spun</span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low">
              <img
                className="w-10 h-10 rounded-lg object-cover shadow-xs shrink-0"
                alt="Export ready pallet"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDV7smRD79v7XLl0-QZRCCWCHER8JAKMAyDwg1IpHcsUm7xN4ZGsKnT3kg6Xqtuav8za4ojS3CM_ng_uTvD9HzMpa5s1c2sBExXTwhYHabpOzgqQaqie_AliJbI8AGVs1-IZW7PJfSKYWqyIpsUF8R8b_WzZY4UPKygA-AohVNekZCephR-nf6W12ZJmTr0mxPPdgp9JFqK1a1KPp-8FDeClo7-oH3ijFVXuTB11pRAmdCcR8ERItsz"
              />
              <div className="flex flex-col min-w-0">
                <span className="font-['Inter'] text-[12px] font-bold text-on-surface truncate">
                  Export Ready
                </span>
                <span className="font-['Inter'] text-[11px] text-on-tertiary-container font-semibold">
                  Ready in Stock
                </span>
              </div>
            </div>
          </div>

          {/* Quantity & Unit Price Inputs */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label
                className="font-['Inter'] text-[12px] font-semibold text-on-surface-variant"
                htmlFor="orderQty"
              >
                Quantity (Pcs) <span className="text-error">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  id="orderQty"
                  className="w-full bg-surface-container-low text-on-surface font-['Inter'] text-[16px] px-3 py-2.5 rounded-lg outline-none focus:bg-surface-container font-bold"
                  min={1}
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                />
                <span className="absolute right-3 text-secondary font-['Inter'] text-[11px] font-bold pointer-events-none">
                  PCS
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label
                className="font-['Inter'] text-[12px] font-semibold text-on-surface-variant"
                htmlFor="unitPrice"
              >
                Price / Piece (BDT) <span className="text-error">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 font-['Inter'] text-on-surface font-bold text-[14px]">
                  ৳
                </span>
                <input
                  id="unitPrice"
                  className="w-full bg-surface-container-low text-on-surface font-['Inter'] text-[16px] pl-8 pr-3 py-2.5 rounded-lg outline-none focus:bg-surface-container font-bold"
                  min={1}
                  type="number"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Discount Field */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label
                className="font-['Inter'] text-[12px] font-semibold text-on-surface-variant"
                htmlFor="orderDiscount"
              >
                Executive Trade Discount (Optional)
              </label>
              <span className="font-['Inter'] text-secondary text-[11px]">Direct Deduction</span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3 font-['Inter'] text-on-surface font-bold text-[14px]">
                ৳
              </span>
              <input
                id="orderDiscount"
                className="w-full bg-surface-container-low text-on-surface font-['Inter'] text-[14px] pl-8 pr-3 py-2 rounded-lg outline-none focus:bg-surface-container"
                min={0}
                placeholder="0"
                type="number"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* DYNAMIC LIVE CALCULATION CARD */}
          <div className="bg-primary text-on-primary p-3.5 rounded-xl shadow-md space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-tertiary-fixed text-[20px]">
                  payments
                </span>
                <span className="font-['Inter'] text-[12px] font-semibold text-surface-variant uppercase tracking-wider">
                  Gross Order Valuation
                </span>
              </div>
              <span className="bg-primary-container px-2 py-0.5 rounded text-[11px] font-['Inter'] text-primary-fixed font-semibold tracking-wide">
                Live Audit
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1 relative z-10">
              <div className="flex flex-col">
                <span className="font-['Inter'] text-surface-container-high text-[12px]">
                  Calculated in real-time
                </span>
                <span className="font-['Inter'] text-surface-dim text-[11px]">
                  {safeQty} pcs @ ৳ {safePrice.toLocaleString('en-IN')}
                  {safeDiscount > 0 && ` (-৳ ${safeDiscount.toLocaleString('en-IN')})`}
                </span>
              </div>
              <div className="text-right">
                <span className="font-['Plus_Jakarta_Sans'] text-[24px] font-bold tracking-tight text-on-primary">
                  ৳ {grossValuation.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Micro Visual Ledger Bar */}
            <div className="w-full bg-primary-container h-1.5 rounded-full overflow-hidden relative z-10 mt-1">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  paymentMode === 'Full Paid'
                    ? 'bg-tertiary-fixed w-full'
                    : paymentMode === 'Partial Adv.'
                    ? 'bg-secondary-fixed w-1/2'
                    : 'bg-error w-1/12'
                }`}
              ></div>
            </div>
          </div>

          {/* Payment Status Selector */}
          <div className="space-y-1.5">
            <label className="font-['Inter'] text-[12px] font-semibold text-on-surface-variant">
              Payment Settlement Status
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-surface-container-low p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPaymentMode('Full Paid')}
                className={`py-2 px-1 text-center rounded-lg font-['Inter'] text-[12px] font-semibold transition-all flex flex-col items-center cursor-pointer ${
                  paymentMode === 'Full Paid'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-secondary hover:bg-surface-container-high'
                }`}
              >
                <span>Full Paid</span>
                <span className="text-[10px] opacity-80">
                  ৳ {grossValuation.toLocaleString('en-IN')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('Partial Adv.')}
                className={`py-2 px-1 text-center rounded-lg font-['Inter'] text-[12px] font-semibold transition-all flex flex-col items-center cursor-pointer ${
                  paymentMode === 'Partial Adv.'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-secondary hover:bg-surface-container-high'
                }`}
              >
                <span>Partial Adv.</span>
                <span className="text-[10px] opacity-80">Split Token</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('Due / Credit')}
                className={`py-2 px-1 text-center rounded-lg font-['Inter'] text-[12px] font-semibold transition-all flex flex-col items-center cursor-pointer ${
                  paymentMode === 'Due / Credit'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-secondary hover:bg-surface-container-high'
                }`}
              >
                <span>Due / Credit</span>
                <span className="text-[10px] opacity-80">30-Day Cycle</span>
              </button>
            </div>
          </div>

          {/* Delivery Status Selector */}
          <div className="space-y-1.5">
            <label className="font-['Inter'] text-[12px] font-semibold text-on-surface-variant">
              Fulfillment / Dispatch Channel
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-surface-container-low p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setDeliveryMode('Pending')}
                className={`py-2 px-1 text-center rounded-lg font-['Inter'] text-[12px] transition-all cursor-pointer ${
                  deliveryMode === 'Pending'
                    ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                    : 'text-secondary hover:bg-surface-container-high'
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMode('Dispatched')}
                className={`py-2 px-1 text-center rounded-lg font-['Inter'] text-[12px] transition-all cursor-pointer ${
                  deliveryMode === 'Dispatched'
                    ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                    : 'text-secondary hover:bg-surface-container-high'
                }`}
              >
                Dispatched
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMode('Delivered')}
                className={`py-2 px-1 text-center rounded-lg font-['Inter'] text-[12px] transition-all cursor-pointer ${
                  deliveryMode === 'Delivered'
                    ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                    : 'text-secondary hover:bg-surface-container-high'
                }`}
              >
                Delivered
              </button>
            </div>
          </div>

          {/* Warehouse Order Categorization & Dispatch Tags */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-['Inter'] text-[12px] font-semibold text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">label</span>
                <span>Warehouse Tags &amp; Order Priority</span>
              </label>
              <span className="font-['Inter'] text-[11px] text-secondary">
                {selectedTags.length} selected
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-surface-container-low border border-surface-container">
              {AVAILABLE_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleToggleTag(tag.id)}
                    className={`px-2.5 py-1.5 rounded-lg font-['Inter'] text-[12px] font-semibold border flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                      isSelected ? tag.activeClass : tag.inactiveClass
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">{tag.icon}</span>
                    <span>{tag.label}</span>
                    {isSelected && (
                      <span className="material-symbols-outlined text-[13px] ml-0.5">check</span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="font-['Inter'] text-[11px] text-secondary px-0.5">
              Tagging enables the warehouse dispatch team to prioritize and filter orders by bulk type.
            </p>
          </div>

          {/* Logistics Instructions */}
          <div className="space-y-1">
            <label
              className="font-['Inter'] text-[12px] font-semibold text-on-surface-variant"
              htmlFor="orderNotes"
            >
              Logistics / Packaging Instruction
            </label>
            <textarea
              id="orderNotes"
              className="w-full bg-surface-container-low text-on-surface font-['Inter'] text-[13px] p-3 rounded-lg outline-none focus:bg-surface-container border border-transparent focus:border-primary"
              placeholder="e.g. Requires urgent shipment via Sundarban Courier..."
              rows={2}
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Automation Preview Banner */}
        <div className="bg-surface-container p-3.5 rounded-xl space-y-2 border border-surface-container-high">
          <div className="flex items-center gap-1.5 text-primary">
            <span className="material-symbols-outlined text-[20px]">electric_bolt</span>
            <span className="font-['Plus_Jakarta_Sans'] text-[12px] font-bold tracking-tight uppercase">
              Instant System Autonomous Routine
            </span>
          </div>
          <p className="font-['Inter'] text-[12px] text-on-surface-variant">
            Upon saving, Arif Fashion World&apos;s CRM engine immediately executes:
          </p>
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-tertiary-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-on-tertiary-container text-[13px]">
                  done
                </span>
              </div>
              <span className="font-['Inter'] text-[12px] text-on-surface">
                Links to WhatsApp customer profile &amp; builds unified thread
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-tertiary-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-on-tertiary-container text-[13px]">
                  done
                </span>
              </div>
              <span className="font-['Inter'] text-[12px] text-on-surface">
                Updates Purchase Frequency (Calculated average order cycle: 19 days)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-tertiary-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-on-tertiary-container text-[13px]">
                  done
                </span>
              </div>
              <span className="font-['Inter'] text-[12px] text-on-surface">
                Forecasts Next Expected Re-order:{' '}
                <span className="font-semibold text-primary">29 Sep 2026</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-tertiary-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-on-tertiary-container text-[13px]">
                  done
                </span>
              </div>
              <span className="font-['Inter'] text-[12px] text-on-surface">
                Schedules Automated Smart Follow-up (3 days before replenishment)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-tertiary-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-on-tertiary-container text-[13px]">
                  done
                </span>
              </div>
              <span className="font-['Inter'] text-[12px] text-on-surface">
                Refreshes Factory Capacity, Cash Flow &amp; Inactive Client Radar
              </span>
            </div>
          </div>
        </div>

        {/* Primary Execution CTA */}
        <div className="pt-1">
          <button
            id="saveOrderBtn"
            disabled={isSubmitting}
            onClick={handleCommitOrder}
            className="w-full bg-primary text-on-primary py-3.5 px-4 rounded-xl font-['Plus_Jakarta_Sans'] font-bold text-[16px] flex items-center justify-center gap-2 shadow-md hover:bg-primary-container active:scale-[0.99] transition-all cursor-pointer disabled:opacity-75"
            type="button"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[24px]">sync</span>
                <span>SYNCHRONIZING PROFILE &amp; TIMELINE...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[24px]">save</span>
                <span>SAVE ORDER (Auto-Process Everything)</span>
              </>
            )}
          </button>
          <div className="flex items-center justify-center gap-1 text-secondary font-['Inter'] text-[11px] mt-2">
            <span className="material-symbols-outlined text-[13px]">lock</span>
            <span>Encrypted Ledger Submission • Instant WhatsApp Cloud Confirmation</span>
          </div>
        </div>
      </div>

      {/* Success Toast Overlay */}
      {showSuccessToast && (
        <div
          id="successModal"
          className="fixed inset-x-4 bottom-24 bg-inverse-surface text-inverse-on-surface p-4 rounded-xl shadow-xl flex items-start gap-3 z-50 transition-all duration-300 max-w-lg mx-auto"
        >
          <div className="w-9 h-9 rounded-full bg-tertiary-container flex items-center justify-center shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-tertiary-fixed text-[22px]">check</span>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-['Plus_Jakarta_Sans'] text-body-md font-bold text-tertiary-fixed">
              Order Logged &amp; Automated!
            </span>
            <p className="font-['Inter'] text-body-sm text-surface-dim mt-0.5">
              {shopName}&apos;s ledger updated with ৳ {grossValuation.toLocaleString('en-IN')}. Smart alert
              queued.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => onNavigate('dashboard')}
                className="font-['Inter'] text-[12px] font-bold text-tertiary-fixed bg-tertiary-container/50 px-2.5 py-1 rounded hover:bg-tertiary-container cursor-pointer"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => setShowSuccessToast(false)}
                className="font-['Inter'] text-[12px] text-surface-variant hover:text-on-primary cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowSuccessToast(false)}
            className="text-surface-variant hover:text-inverse-on-surface cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}
    </div>
  );
};
