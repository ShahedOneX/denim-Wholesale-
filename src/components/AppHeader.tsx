import React from 'react';
import { LOGO_URL } from '../data/initialData';
import { ActiveTab } from '../types';

interface AppHeaderProps {
  currentTab: ActiveTab;
  selectedCustomerId: string | null;
  onBack: () => void;
  unreadCount?: number;
  onOpenSearch?: () => void;
  onOpenNotifications?: () => void;
  onOpenGeminiChat?: () => void;
  onOpenGoogleSheets?: () => void;
  isSheetsLinked?: boolean;
  onOpenAuthProfile?: () => void;
  userName?: string;
  userAvatar?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentTab,
  selectedCustomerId,
  onBack,
  unreadCount = 2,
  onOpenSearch,
  onOpenNotifications,
  onOpenGeminiChat,
  onOpenGoogleSheets,
  isSheetsLinked = false,
  onOpenAuthProfile,
  userName,
  userAvatar,
}) => {
  const isSubPage = selectedCustomerId !== null || currentTab === 'add-order';

  const getTitle = () => {
    if (selectedCustomerId) {
      return { title: 'Customer Details', subtitle: 'Arif Fashion World CRM' };
    }
    if (currentTab === 'add-order') {
      return { title: 'Add Order', subtitle: 'Arif Fashion World CRM' };
    }
    if (currentTab === 'follow-ups') {
      return { title: 'Arif Fashion World', subtitle: 'B2B Wholesale Denim' };
    }
    if (currentTab === 'customers') {
      return { title: 'Wholesale Accounts', subtitle: 'Client Ledgers & LTV' };
    }
    if (currentTab === 'analytics') {
      return { title: 'CRM Intelligence', subtitle: 'Velocity & Replenishment Matrix' };
    }
    if (currentTab === 'gemini-chat') {
      return { title: 'আরিফ এআই কোপাইলট', subtitle: 'Gemini Wholesale Assistant' };
    }
    return { title: 'Arif Fashion World', subtitle: 'B2B Wholesale Denim' };
  };

  const { title, subtitle } = getTitle();

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
      <div className={`px-4 flex items-center justify-between gap-2 ${isSubPage ? 'h-16' : 'h-20'}`}>
        <div className="flex items-center gap-2 min-w-0">
          {isSubPage ? (
            <button
              aria-label="Go Back"
              id="header-back-btn"
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-on-surface hover:bg-surface-container transition-colors shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
          ) : null}

          <img
            src={LOGO_URL}
            alt="Arif Fashion World Logo"
            className={`${isSubPage ? 'h-7' : 'h-8'} w-auto object-contain shrink-0`}
          />

          <div className="flex flex-col min-w-0 ml-1">
            <div className="flex items-center gap-1.5">
              <span className="font-['Plus_Jakarta_Sans'] font-bold text-[17px] text-primary tracking-tight truncate">
                {title}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-['Inter'] text-[11px] text-secondary font-medium truncate">
                {subtitle}
              </span>
              {!isSubPage && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-surface-container-low text-tertiary-container font-['Inter'] text-[10px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container animate-pulse"></span>
                  Online / Auto-Sync
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Google Sheets Integration Trigger */}
          <button
            aria-label="Google Sheets Integration"
            id="header-google-sheets-btn"
            onClick={onOpenGoogleSheets}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[12px] font-['Inter'] font-semibold transition-all shadow-sm cursor-pointer active:scale-95 ${
              isSheetsLinked
                ? 'bg-emerald-700 text-white hover:bg-emerald-800 ring-1 ring-emerald-400/50'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
            }`}
            title="Google Sheets Live Sync & Ledger"
          >
            <span className="material-symbols-outlined text-[16px] text-emerald-600 dark:text-emerald-400">
              table_chart
            </span>
            <span className="hidden sm:inline">Google Sheets</span>
          </button>

          {/* Gemini AI Copilot Trigger */}
          <button
            aria-label="Open Gemini AI Assistant"
            id="header-gemini-ai-btn"
            onClick={onOpenGeminiChat}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-[12px] font-['Inter'] font-semibold transition-all shadow-sm cursor-pointer active:scale-95"
            title="আরিফ এআই কোপাইলট (Gemini AI Chat)"
          >
            <span className="material-symbols-outlined text-[16px] text-tertiary-fixed">smart_toy</span>
            <span className="hidden sm:inline">আরিফ এআই</span>
          </button>

          {!isSubPage && (
            <>
              <button
                aria-label="Search"
                id="header-search-btn"
                onClick={onOpenSearch}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-secondary hover:text-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">search</span>
              </button>
              <button
                aria-label="Notifications"
                id="header-notifications-btn"
                onClick={onOpenNotifications}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-secondary hover:text-primary relative transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error"></span>
                )}
              </button>
            </>
          )}

          {/* User Profile / Auth Button */}
          <button
            id="header-auth-profile-btn"
            onClick={onOpenAuthProfile}
            className="flex items-center gap-1.5 p-0.5 rounded-full hover:ring-2 hover:ring-primary transition-all cursor-pointer"
            title={userName ? `Logged in: ${userName}` : 'Google Sign-in / Firebase Auth'}
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName || 'User'}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-primary/20 shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary text-[15px] font-bold shadow-sm">
                {userName ? userName[0] : 'A'}
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
