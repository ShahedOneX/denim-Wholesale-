import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Customer } from '../types';
import {
  initAuth,
  googleSignIn,
  getAccessToken,
  logout,
} from '../services/googleAuth';
import {
  findDriveSpreadsheets,
  createWholesaleSpreadsheet,
  syncDataToSpreadsheet,
  SpreadsheetInfo,
  SyncResult,
} from '../services/googleSheets';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onShowToast?: (msg: string) => void;
  linkedSpreadsheetId?: string | null;
  onSpreadsheetLinked?: (id: string, url: string) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  customers,
  onShowToast,
  linkedSpreadsheetId,
  onSpreadsheetLinked,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isFetchingDrive, setIsFetchingDrive] = useState(false);
  const [driveSheets, setDriveSheets] = useState<SpreadsheetInfo[]>([]);

  // Mode: 'new' or existing spreadsheet ID
  const [targetMode, setTargetMode] = useState<'new' | 'existing'>('new');
  const [selectedSheetId, setSelectedSheetId] = useState<string>(linkedSpreadsheetId || '');
  const [newSheetTitle, setNewSheetTitle] = useState(
    'Arif Fashion World - Wholesale CRM Ledger'
  );

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState('');
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  // Confirmation dialog state (MANDATORY for modifying Workspace user data)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmTargetTitle, setConfirmTargetTitle] = useState('');

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, cachedToken) => {
        setCurrentUser(user);
        setToken(cachedToken);
      },
      () => {
        setCurrentUser(null);
        setToken(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // When token is available, search Drive for existing sheets
  useEffect(() => {
    if (token && isOpen) {
      loadDriveSheets(token);
    }
  }, [token, isOpen]);

  const loadDriveSheets = async (accessToken: string) => {
    setIsFetchingDrive(true);
    try {
      const sheets = await findDriveSpreadsheets(accessToken);
      setDriveSheets(sheets);
      if (sheets.length > 0 && !selectedSheetId) {
        setSelectedSheetId(sheets[0].id);
      }
    } catch (err: any) {
      console.warn('Could not list Drive spreadsheets:', err);
    } finally {
      setIsFetchingDrive(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setToken(result.accessToken);
        if (onShowToast) onShowToast(`Connected as ${result.user.displayName || result.user.email}`);
        loadDriveSheets(result.accessToken);
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      if (onShowToast) onShowToast(err.message || 'Google Sign-in was cancelled');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setCurrentUser(null);
      setToken(null);
      setDriveSheets([]);
      if (onShowToast) onShowToast('Signed out of Google account');
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  // Trigger confirmation modal before writing to Google Sheets
  const promptSyncConfirmation = () => {
    if (targetMode === 'new') {
      setConfirmTargetTitle(`"${newSheetTitle}" (New Google Spreadsheet)`);
    } else {
      const existing = driveSheets.find((s) => s.id === selectedSheetId);
      setConfirmTargetTitle(`"${existing?.name || selectedSheetId}"`);
    }
    setShowConfirmModal(true);
  };

  // Execute sync after explicit user confirmation
  const executeSync = async () => {
    setShowConfirmModal(false);
    if (!token) {
      if (onShowToast) onShowToast('Please sign in to Google first');
      return;
    }

    setIsSyncing(true);
    setSyncStatusText('Connecting to Google Sheets API...');

    try {
      let targetId = selectedSheetId;
      let targetUrl = '';

      if (targetMode === 'new' || !targetId) {
        setSyncStatusText('Creating new Google Spreadsheet with Ledger tabs...');
        const newSheet = await createWholesaleSpreadsheet(token, newSheetTitle.trim() || undefined);
        targetId = newSheet.id;
        targetUrl = newSheet.url;
        setSelectedSheetId(targetId);
      } else {
        targetUrl = `https://docs.google.com/spreadsheets/d/${targetId}/edit`;
      }

      setSyncStatusText(`Writing ${customers.length} customer accounts & warehouse orders...`);
      const result = await syncDataToSpreadsheet(token, targetId, customers);
      setLastSyncResult(result);

      if (onSpreadsheetLinked) {
        onSpreadsheetLinked(result.spreadsheetId, result.spreadsheetUrl);
      }

      if (onShowToast) {
        onShowToast(`Successfully synced ${result.customersSynced} accounts & ${result.ordersSynced} orders to Google Sheets!`);
      }

      // Refresh drive sheets list to include newly created sheet
      loadDriveSheets(token);
    } catch (err: any) {
      console.error('Sync error:', err);
      if (onShowToast) onShowToast(`Sync failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
      setSyncStatusText('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-surface-container-lowest rounded-2xl w-full max-w-lg shadow-2xl border border-surface-container overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-surface-container flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">table_chart</span>
            </div>
            <div>
              <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-[16px] text-on-surface">
                Google Sheets Integration
              </h3>
              <p className="font-['Inter'] text-[11px] text-secondary">
                Two-way sync for Customer Ledgers &amp; Warehouse Dispatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-secondary cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Authentication State */}
          {!currentUser ? (
            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[26px]">cloud_sync</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-[14px] text-on-surface">
                  Connect your Google Account
                </h4>
                <p className="font-['Inter'] text-[12px] text-secondary max-w-sm mx-auto">
                  Sync wholesale accounts, order histories, and denim models directly into your personal or company Google Drive spreadsheets.
                </p>
              </div>

              {/* Official Google Sign-in button */}
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn}
                  className="gsi-material-button"
                >
                  <div className="gsi-material-button-state"></div>
                  <div className="gsi-material-button-content-wrapper">
                    <div className="gsi-material-button-icon">
                      <svg
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48"
                        style={{ display: 'block' }}
                      >
                        <path
                          fill="#EA4335"
                          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                        ></path>
                        <path
                          fill="#4285F4"
                          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                        ></path>
                        <path
                          fill="#FBBC05"
                          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                        ></path>
                        <path
                          fill="#34A853"
                          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                        ></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                      </svg>
                    </div>
                    <span className="gsi-material-button-contents">
                      {isSigningIn ? 'Connecting to Google...' : 'Sign in with Google'}
                    </span>
                  </div>
                </button>
              </div>

              <div className="pt-2 text-[11px] font-['Inter'] text-secondary flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-[13px] text-emerald-600">verified_user</span>
                <span>Permissions: Google Drive &amp; Google Spreadsheets (with your permission)</span>
              </div>
            </div>
          ) : (
            <>
              {/* Connected User Profile Banner */}
              <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="Google avatar"
                      className="w-8 h-8 rounded-full border border-surface-container shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary text-on-primary font-bold flex items-center justify-center text-xs shrink-0">
                      {currentUser.displayName?.[0] || 'U'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-['Inter'] font-semibold text-[13px] text-on-surface truncate">
                        {currentUser.displayName || 'Google Account'}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold">
                        Connected
                      </span>
                    </div>
                    <span className="font-['Inter'] text-[11px] text-secondary truncate block">
                      {currentUser.email}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-2 py-1 rounded-lg text-[11px] font-['Inter'] font-semibold text-error hover:bg-error-container/20 transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
              </div>

              {/* Target Spreadsheet Mode */}
              <div className="space-y-2">
                <label className="font-['Inter'] text-[12px] font-bold text-on-surface block">
                  Choose Destination Spreadsheet:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetMode('new')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      targetMode === 'new'
                        ? 'bg-primary-container/20 border-primary text-primary shadow-xs'
                        : 'bg-surface-container-low border-surface-container text-secondary hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="material-symbols-outlined text-[18px]">add_box</span>
                      {targetMode === 'new' && (
                        <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                      )}
                    </div>
                    <span className="font-['Plus_Jakarta_Sans'] font-bold text-[12px]">
                      Create New Sheet
                    </span>
                    <span className="font-['Inter'] text-[10px] text-secondary">
                      Creates ledger with formatted tabs
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetMode('existing')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      targetMode === 'existing'
                        ? 'bg-primary-container/20 border-primary text-primary shadow-xs'
                        : 'bg-surface-container-low border-surface-container text-secondary hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="material-symbols-outlined text-[18px]">folder_open</span>
                      {targetMode === 'existing' && (
                        <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                      )}
                    </div>
                    <span className="font-['Plus_Jakarta_Sans'] font-bold text-[12px]">
                      Use Existing Drive Sheet
                    </span>
                    <span className="font-['Inter'] text-[10px] text-secondary">
                      Update existing Google Sheet
                    </span>
                  </button>
                </div>
              </div>

              {/* Options details */}
              {targetMode === 'new' ? (
                <div className="space-y-1.5">
                  <label className="font-['Inter'] text-[11px] font-medium text-secondary block">
                    Spreadsheet Name:
                  </label>
                  <input
                    type="text"
                    value={newSheetTitle}
                    onChange={(e) => setNewSheetTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-[13px] font-['Inter'] text-on-surface focus:outline-none focus:border-primary"
                    placeholder="Spreadsheet name..."
                  />
                  <span className="font-['Inter'] text-[10px] text-secondary block">
                    Will create tabs &quot;Customer Accounts&quot; &amp; &quot;Warehouse Orders&quot;.
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-['Inter'] text-[11px] font-medium text-secondary block">
                      Select from Google Drive:
                    </label>
                    <button
                      type="button"
                      onClick={() => token && loadDriveSheets(token)}
                      disabled={isFetchingDrive}
                      className="text-[10px] font-['Inter'] text-primary font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[12px]">refresh</span>
                      <span>Refresh Drive</span>
                    </button>
                  </div>

                  {isFetchingDrive ? (
                    <div className="p-3 text-center text-[12px] font-['Inter'] text-secondary">
                      Scanning Google Drive for spreadsheets...
                    </div>
                  ) : driveSheets.length === 0 ? (
                    <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container text-center text-[11px] font-['Inter'] text-secondary">
                      No Google Spreadsheets found in Drive. Switch to &quot;Create New Sheet&quot;.
                    </div>
                  ) : (
                    <select
                      value={selectedSheetId}
                      onChange={(e) => setSelectedSheetId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-[12px] font-['Inter'] text-on-surface focus:outline-none focus:border-primary"
                    >
                      {driveSheets.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.lastModified?.split('T')[0] || 'Spreadsheet'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Data Summary to Sync */}
              <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-['Inter'] font-semibold text-on-surface">
                  <span className="flex items-center gap-1 text-primary">
                    <span className="material-symbols-outlined text-[15px]">inventory</span>
                    <span>Wholesale Data Ready for Sync:</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-surface-container font-mono text-[10px]">
                    Live Snapshot
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-['Inter']">
                  <div className="p-2 rounded-lg bg-surface-container-lowest border border-surface-container">
                    <span className="text-secondary block text-[10px]">Accounts &amp; VIPs</span>
                    <span className="font-bold text-[14px] text-on-surface">
                      {customers.length} Retailers
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-container-lowest border border-surface-container">
                    <span className="text-secondary block text-[10px]">Warehouse Orders</span>
                    <span className="font-bold text-[14px] text-on-surface">
                      {customers.reduce((sum, c) => sum + c.orderHistory.length, 0)} Total
                    </span>
                  </div>
                </div>
              </div>

              {/* Syncing State Indicator */}
              {isSyncing && (
                <div className="p-3 rounded-xl bg-primary-container/20 border border-primary/30 flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0"></div>
                  <span className="font-['Inter'] text-[12px] text-primary font-medium">
                    {syncStatusText}
                  </span>
                </div>
              )}

              {/* Last Sync Result Banner */}
              {lastSyncResult && !isSyncing && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-['Inter'] text-[12px] font-bold">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>Sync Successful!</span>
                    </div>
                    <span className="text-[10px] font-['Inter'] text-secondary">
                      {lastSyncResult.updatedAt}
                    </span>
                  </div>
                  <p className="font-['Inter'] text-[11px] text-on-surface">
                    Successfully updated {lastSyncResult.customersSynced} customer accounts and {lastSyncResult.ordersSynced} warehouse orders.
                  </p>
                  <a
                    href={lastSyncResult.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-['Inter'] text-[11px] font-semibold hover:bg-emerald-800 transition-colors cursor-pointer shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    <span>Open in Google Sheets</span>
                  </a>
                </div>
              )}

              {/* Primary Sync Button */}
              <button
                type="button"
                onClick={promptSyncConfirmation}
                disabled={isSyncing}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-['Inter'] text-[13px] font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">sync</span>
                <span>
                  {targetMode === 'new' ? 'Create & Sync to Google Sheets' : 'Sync to Selected Google Sheet'}
                </span>
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-surface-container-low border-t border-surface-container flex items-center justify-between">
          <span className="font-['Inter'] text-[11px] text-secondary">
            Google Sheets API v4
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-surface-container text-primary font-['Inter'] text-[12px] font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Explicit User Confirmation Dialog (MANDATORY for Workspace data mutation) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-sm shadow-2xl border border-surface-container p-4.5 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">warning</span>
              </div>
              <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-[15px] text-on-surface">
                Confirm Google Sheets Sync
              </h4>
            </div>

            <p className="font-['Inter'] text-[12px] text-secondary leading-relaxed">
              You are about to export and write wholesale CRM data to {confirmTargetTitle}.
              This will update the <strong className="text-on-surface">Customer Accounts</strong> ({customers.length} records) and <strong className="text-on-surface">Warehouse Orders</strong> tabs with latest records.
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-surface-container text-[12px] font-['Inter'] font-medium text-secondary hover:bg-surface-container cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSync}
                className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-[12px] font-['Inter'] font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[15px]">check</span>
                <span>Confirm Sync</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
