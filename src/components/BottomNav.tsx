import React from 'react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  currentTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  pendingFollowupsCount: number;
  onOpenGeminiChat?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  pendingFollowupsCount,
  onOpenGeminiChat,
}) => {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface/95 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.04)] border-t border-surface-container">
      <div className="flex items-center justify-around h-16 px-2 relative max-w-lg mx-auto">
        {/* Dashboard */}
        <button
          id="nav-dashboard-tab"
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center min-w-[56px] h-12 transition-colors cursor-pointer ${
            currentTab === 'dashboard'
              ? 'text-primary-container font-semibold'
              : 'text-secondary hover:text-primary'
          }`}
        >
          <span
            className="material-symbols-outlined text-[22px]"
            style={currentTab === 'dashboard' ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            dashboard
          </span>
          <span className="font-['Inter'] text-[11px] font-semibold mt-0.5">Dashboard</span>
        </button>

        {/* Customers */}
        <button
          id="nav-customers-tab"
          onClick={() => onTabChange('customers')}
          className={`flex flex-col items-center justify-center min-w-[56px] h-12 transition-colors cursor-pointer ${
            currentTab === 'customers'
              ? 'text-primary-container font-semibold'
              : 'text-secondary hover:text-primary'
          }`}
        >
          <span
            className="material-symbols-outlined text-[22px]"
            style={currentTab === 'customers' ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            group
          </span>
          <span className="font-['Inter'] text-[11px] font-semibold mt-0.5">Customers</span>
        </button>

        {/* Elevated Center Add Order Button */}
        <div className="flex items-center justify-center -mt-5">
          <button
            id="nav-add-order-center-btn"
            aria-label="Add Order"
            onClick={() => onTabChange('add-order')}
            className={`flex items-center justify-center w-12 h-12 rounded-full bg-primary-container text-on-primary shadow-[0_4px_12px_rgba(30,58,138,0.35)] active:scale-95 transition-transform cursor-pointer ring-4 ring-surface ${
              currentTab === 'add-order' ? 'scale-105 bg-primary' : ''
            }`}
          >
            <span className="material-symbols-outlined text-[26px]">add</span>
          </button>
        </div>

        {/* Follow-ups */}
        <button
          id="nav-followups-tab"
          onClick={() => onTabChange('follow-ups')}
          className={`flex flex-col items-center justify-center min-w-[56px] h-12 transition-colors relative cursor-pointer ${
            currentTab === 'follow-ups'
              ? 'text-primary-container font-semibold'
              : 'text-secondary hover:text-primary'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <span
              className="material-symbols-outlined text-[22px]"
              style={currentTab === 'follow-ups' ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              event_note
            </span>
            {pendingFollowupsCount > 0 && (
              <span className="absolute -top-1 -right-2.5 px-1 py-0.2 rounded-full bg-error text-on-error font-['Inter'] text-[10px] leading-tight font-bold">
                {pendingFollowupsCount}
              </span>
            )}
          </div>
          <span className="font-['Inter'] text-[11px] font-semibold mt-0.5">Follow-ups</span>
        </button>

        {/* Analytics */}
        <button
          id="nav-analytics-tab"
          onClick={() => onTabChange('analytics')}
          className={`flex flex-col items-center justify-center min-w-[52px] h-12 transition-colors cursor-pointer ${
            currentTab === 'analytics'
              ? 'text-primary-container font-semibold'
              : 'text-secondary hover:text-primary'
          }`}
        >
          <span
            className="material-symbols-outlined text-[22px]"
            style={currentTab === 'analytics' ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            tune
          </span>
          <span className="font-['Inter'] text-[11px] font-semibold mt-0.5">Analytics</span>
        </button>

        {/* Gemini AI Copilot */}
        <button
          id="nav-gemini-ai-tab"
          onClick={() => {
            if (onOpenGeminiChat) {
              onOpenGeminiChat();
            } else {
              onTabChange('gemini-chat');
            }
          }}
          className="flex flex-col items-center justify-center min-w-[52px] h-12 transition-colors cursor-pointer text-primary hover:text-primary-container"
        >
          <span
            className="material-symbols-outlined text-[22px] text-tertiary-container animate-pulse"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            smart_toy
          </span>
          <span className="font-['Inter'] text-[11px] font-semibold mt-0.5 text-primary">
            আরিফ AI
          </span>
        </button>
      </div>
    </nav>
  );
};
