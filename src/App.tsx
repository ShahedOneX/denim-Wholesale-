import React, { useState, useEffect } from 'react';
import { Customer, INITIAL_CUSTOMERS } from './data/initialData';
import { ActiveTab, OrderTag } from './types';
import { AppHeader } from './components/AppHeader';
import { BottomNav } from './components/BottomNav';
import { DashboardScreen } from './components/DashboardScreen';
import { CustomersListScreen } from './components/CustomersListScreen';
import { CustomerDetailsScreen } from './components/CustomerDetailsScreen';
import { AddOrderScreen } from './components/AddOrderScreen';
import { FollowUpsScreen } from './components/FollowUpsScreen';
import { AnalyticsScreen } from './components/AnalyticsScreen';
import { WhatsAppModal } from './components/WhatsAppModal';
import { GeminiChatModal } from './components/GeminiChatModal';
import { AuthProfileModal } from './components/AuthProfileModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { auth, isFirebaseConfigured } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { exportCustomerLedgerCSV } from './utils/csvExport';
import { getAccessToken } from './services/googleAuth';
import { appendOrderRowToSpreadsheet } from './services/googleSheets';

export default function App() {
  // Load persisted customer ledger or fall back to INITIAL_CUSTOMERS
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('afw_customers_ledger');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_CUSTOMERS;
      }
    }
    return INITIAL_CUSTOMERS;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [whatsAppCustomer, setWhatsAppCustomer] = useState<Customer | null>(null);
  const [toast, setToast] = useState<{ message: string; icon?: string } | null>(null);

  // Gemini AI Chat & Auth Profile modal states
  const [isGeminiChatOpen, setIsGeminiChatOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);

  // Linked Google Spreadsheet ID & URL
  const [linkedSpreadsheetId, setLinkedSpreadsheetId] = useState<string | null>(() => {
    return localStorage.getItem('afw_linked_spreadsheet_id') || null;
  });
  const [linkedSpreadsheetUrl, setLinkedSpreadsheetUrl] = useState<string | null>(() => {
    return localStorage.getItem('afw_linked_spreadsheet_url') || null;
  });

  const handleSpreadsheetLinked = (id: string, url: string) => {
    setLinkedSpreadsheetId(id);
    setLinkedSpreadsheetUrl(url);
    localStorage.setItem('afw_linked_spreadsheet_id', id);
    localStorage.setItem('afw_linked_spreadsheet_url', url);
  };

  // Authenticated User state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const localUser = localStorage.getItem('afw_auth_user');
    if (localUser) {
      try {
        return JSON.parse(localUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Sync auth state with Firebase Auth if configured
  useEffect(() => {
    if (isFirebaseConfigured) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setCurrentUser(user);
          localStorage.setItem('afw_auth_user', JSON.stringify(user));
        }
      });
      return () => unsubscribe();
    }
  }, []);

  // Persist customer data modifications
  useEffect(() => {
    localStorage.setItem('afw_customers_ledger', JSON.stringify(customers));
  }, [customers]);

  // Helper to trigger floating toast
  const showToast = (message: string, icon: string = 'check_circle') => {
    setToast({ message, icon });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  // Navigations
  const handleTabChange = (tab: ActiveTab) => {
    if (tab === 'gemini-chat') {
      setIsGeminiChatOpen(true);
      return;
    }
    setSelectedCustomerId(null);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (selectedCustomerId) {
      setSelectedCustomerId(null);
    } else {
      setActiveTab('dashboard');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Order Creation & Auto-Ledger Updates
  const handleOrderSaved = (newOrder: {
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
  }) => {
    const existingIndex = customers.findIndex(
      (c) =>
        c.phone.replace(/[^0-9]/g, '') === newOrder.phone.replace(/[^0-9]/g, '') ||
        c.name.toLowerCase() === newOrder.shopName.toLowerCase()
    );

    const orderId = `#ORD-${new Date().toISOString().slice(2, 7).replace('-', '')}-${Math.floor(
      10 + Math.random() * 90
    )}`;
    const todayStr = '10 Sep 2026';
    const assignedTags: OrderTag[] = newOrder.tags && newOrder.tags.length > 0 ? newOrder.tags : ['Wholesale'];

    if (existingIndex !== -1) {
      // Update existing customer
      const existing = customers[existingIndex];
      const updatedOrders = [
        {
          id: orderId,
          date: todayStr,
          model: newOrder.model,
          quantity: newOrder.quantity,
          unitPrice: newOrder.unitPrice,
          discount: newOrder.discount,
          total: newOrder.total,
          deliveryStatus: newOrder.deliveryStatus,
          paymentStatus: newOrder.paymentStatus,
          courier: 'Sundarban Courier (Tongi Hub)',
          logisticsNote: newOrder.logisticsNote,
          tags: assignedTags,
        },
        ...existing.orderHistory,
      ];

      const updatedCustomer: Customer = {
        ...existing,
        ltv: existing.ltv + newOrder.total,
        ordersCount: existing.ordersCount + 1,
        totalQuantity: existing.totalQuantity + newOrder.quantity,
        lastOrderDate: todayStr,
        lastOrderAmount: newOrder.total,
        lastOrderPcs: newOrder.quantity,
        lastOrderModel: newOrder.model,
        nextExpectedOrder: '06 Oct 2026',
        nextFollowUpDate: '03 Oct 2026',
        activityLog: [
          {
            date: todayStr,
            title: `Order ${orderId} Placed`,
            desc: `${newOrder.quantity} pcs ${newOrder.model} (৳ ${newOrder.total.toLocaleString(
              'en-IN'
            )}) recorded with autonomous reorder scheduled for 06 Oct.`,
            type: 'order',
          },
          ...existing.activityLog,
        ],
        orderHistory: updatedOrders,
      };

      const nextList = [...customers];
      nextList[existingIndex] = updatedCustomer;
      setCustomers(nextList);
      showToast(`Order ${orderId} saved! Restock predicted for 06 Oct 2026.`);
    } else {
      // Insert new customer record
      const newCustomer: Customer = {
        id: `c-${Date.now()}`,
        name: newOrder.shopName || 'New Wholesale Client',
        ownerName: newOrder.clientName || 'Store Manager',
        phone: newOrder.phone,
        secondaryPhone: newOrder.secondaryPhone,
        detailedAddress: newOrder.detailedAddress || `${newOrder.district} Wholesale Market`,
        district: newOrder.district,
        avatar:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDKq8G0kuB1tRakZ-3mJFTRy3-gN6LSoFv6TBYJNBCXDWfX2fDKhpNLgIzdA-KOUeZbHybfGDti65wUYarOzEXNAaXjIHgJExavmuFaVocTFXFFn0C2hzkYzjy91lFKpAmSBScZCLe7LxmMME8kpLTcR3alW8gSO3Nq0PS6lgysipw_azGwdW2fqmpZgDbo1eUx6WX7wiOBz5NTTMn3TXFZvrlCDrbcB4b-p6f2ruoPB2Q9l3HVK1Tc',
        tier: 'Regular Reorder',
        pipelineStatus: 'Active',
        ltv: newOrder.total,
        ordersCount: 1,
        totalQuantity: newOrder.quantity,
        ontimePaymentRate: 100,
        cycleDays: 24,
        leadDays: 3,
        lastOrderDate: todayStr,
        lastOrderAmount: newOrder.total,
        lastOrderPcs: newOrder.quantity,
        lastOrderModel: newOrder.model,
        nextExpectedOrder: '04 Oct 2026',
        nextFollowUpDate: '01 Oct 2026',
        followUpStatus: 'scheduled',
        preferredModel: newOrder.model,
        preferredSpecs: 'Ring-spun indigo weave',
        modelSharePercent: 100,
        timelinePulse: [
          { date: '10 Sep', pcs: newOrder.quantity, label: `${newOrder.quantity} pcs`, isPast: true, isReorder: false },
          { date: '04 Oct', pcs: newOrder.quantity, label: 'Reorder Expected', isPast: false, isReorder: true },
        ],
        activityLog: [
          {
            date: todayStr,
            title: `First Order ${orderId} Created`,
            desc: `Wholesale profile initialized with ${newOrder.quantity} pcs.`,
            type: 'order',
          },
        ],
        banglaWhatsAppTemplate: `আসসালামু আলাইকুম ${newOrder.clientName || 'ভাই'}, আরিফ ফ্যাশন ওয়ার্ল্ড থেকে স্মরণ করিয়ে দিচ্ছি। আপনার ${newOrder.model} এর পরবর্তী লটের জন্য আমরা প্রস্তুত। জানাবেন কি?`,
        orderHistory: [
          {
            id: orderId,
            date: todayStr,
            model: newOrder.model,
            quantity: newOrder.quantity,
            unitPrice: newOrder.unitPrice,
            discount: newOrder.discount,
            total: newOrder.total,
            deliveryStatus: newOrder.deliveryStatus,
            paymentStatus: newOrder.paymentStatus,
            courier: 'Sundarban Courier',
            logisticsNote: newOrder.logisticsNote,
            tags: assignedTags,
          },
        ],
      };

      setCustomers([newCustomer, ...customers]);
      showToast(`New wholesale ledger initiated for ${newCustomer.name}!`);

      // Auto-append new order to linked Google Sheet if available
      if (linkedSpreadsheetId) {
        getAccessToken().then((token) => {
          if (token) {
            appendOrderRowToSpreadsheet(
              token,
              linkedSpreadsheetId,
              {
                id: orderId,
                date: todayStr,
                model: newOrder.model,
                quantity: newOrder.quantity,
                unitPrice: newOrder.unitPrice,
                discount: newOrder.discount,
                total: newOrder.total,
                paymentStatus: newOrder.paymentStatus,
                deliveryStatus: newOrder.deliveryStatus,
                courier: 'Sundarban Courier',
                logisticsNote: newOrder.logisticsNote,
                tags: assignedTags,
              },
              {
                name: newCustomer.name,
                ownerName: newCustomer.ownerName,
                phone: newCustomer.phone,
                district: newCustomer.district,
              }
            ).then((ok) => {
              if (ok) {
                showToast(`Order ${orderId} synced to Google Sheets!`, 'table_chart');
              }
            }).catch(() => {});
          }
        });
      }
    }
  };

  // Warehouse Order Tags Updater
  const handleUpdateOrderTags = (customerId: string, orderId: string, tags: OrderTag[]) => {
    setCustomers((prevCustomers) =>
      prevCustomers.map((cust) => {
        if (cust.id !== customerId) return cust;
        return {
          ...cust,
          orderHistory: cust.orderHistory.map((ord) =>
            ord.id === orderId ? { ...ord, tags } : ord
          ),
        };
      })
    );
    showToast(`Warehouse tags updated for ${orderId}!`, 'label');
  };

  // Follow-up Contact Log Save
  const handleSaveContactLog = (
    customerId: string,
    outcome:
      | 'Interested'
      | 'Will Order Later'
      | 'Ordered (Immediate)'
      | 'No Response'
      | 'Not Interested'
  ) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          return {
            ...c,
            contactedToday: true,
            lastContactOutcome: outcome,
            activityLog: [
              {
                date: 'Today, 10 Sep',
                title: `Outreach Response: ${outcome}`,
                desc: `Staff completed WhatsApp follow-up. Outcome marked as "${outcome}".`,
                type: 'log',
              },
              ...c.activityLog,
            ],
          };
        }
        return c;
      })
    );
  };

  // Broadcast Re-Engagement Campaign to Dormant Accounts
  const handleLaunchCampaign = () => {
    showToast('Re-engagement broadcast queued for 3 inactive accounts via WhatsApp Cloud API!');
  };

  // Export Customer Ledger Data to CSV for Backup & Accounting
  const handleExportCSV = () => {
    try {
      exportCustomerLedgerCSV(customers);
      showToast(`Exported ${customers.length} wholesale accounts to CSV!`, 'download');
    } catch (err) {
      showToast('Failed to generate CSV export file', 'error');
    }
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col font-['Inter'] selection:bg-primary selection:text-on-primary">
      {/* Top Header */}
      <AppHeader
        currentTab={selectedCustomerId ? 'customer-detail' : activeTab}
        selectedCustomerId={selectedCustomerId}
        onBack={handleBack}
        onOpenGeminiChat={() => setIsGeminiChatOpen(true)}
        onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
        isSheetsLinked={!!linkedSpreadsheetId}
        onOpenAuthProfile={() => setIsAuthModalOpen(true)}
        userName={currentUser?.displayName || 'Arif Hossain'}
        userAvatar={currentUser?.photoURL || undefined}
      />

      {/* Main Dynamic View Area */}
      <main className="flex-1 w-full flex flex-col">
        {selectedCustomerId && selectedCustomer ? (
          <CustomerDetailsScreen
            customer={selectedCustomer}
            onBack={handleBack}
            onOpenWhatsApp={(cust) => setWhatsAppCustomer(cust)}
            onNewOrder={() => {
              setSelectedCustomerId(null);
              setActiveTab('add-order');
            }}
            onShowToast={showToast}
            onUpdateOutcome={(cid, outcome) => handleSaveContactLog(cid, outcome)}
            onUpdateOrderTags={handleUpdateOrderTags}
            onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
          />
        ) : activeTab === 'dashboard' ? (
          <DashboardScreen
            customers={customers}
            onSelectCustomer={handleSelectCustomer}
            onOpenWhatsApp={(cust) => setWhatsAppCustomer(cust)}
            onNavigate={handleTabChange}
            onOpenGeminiChat={() => setIsGeminiChatOpen(true)}
            onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
            onExportCSV={handleExportCSV}
            onUpdateOrderTags={handleUpdateOrderTags}
            onMarkContacted={(cid) => {
              handleSaveContactLog(cid, 'Interested');
              showToast('Follow-up logged as completed today!');
            }}
            onSaveReorder={(newReorder) => {
              showToast(
                `Reorder cycle for ${newReorder.clientName} updated to ${newReorder.cycleDays} days!`
              );
            }}
          />
        ) : activeTab === 'customers' ? (
          <CustomersListScreen
            customers={customers}
            onSelectCustomer={handleSelectCustomer}
            onOpenWhatsApp={(cust) => setWhatsAppCustomer(cust)}
            onExportCSV={handleExportCSV}
            onNewOrder={(cust) => {
              setWhatsAppCustomer(null);
              setActiveTab('add-order');
            }}
          />
        ) : activeTab === 'add-order' ? (
          <AddOrderScreen
            customers={customers}
            onOrderSaved={handleOrderSaved}
            onNavigate={handleTabChange}
          />
        ) : activeTab === 'follow-ups' ? (
          <FollowUpsScreen
            customers={customers}
            onOpenWhatsApp={(cust) => setWhatsAppCustomer(cust)}
            onSelectCustomer={handleSelectCustomer}
            onNavigate={handleTabChange}
            onSaveContactLog={handleSaveContactLog}
            onShowToast={showToast}
            onLaunchCampaign={handleLaunchCampaign}
          />
        ) : activeTab === 'analytics' ? (
          <AnalyticsScreen customers={customers} onShowToast={showToast} />
        ) : null}
      </main>

      {/* WhatsApp Modal Outreach */}
      <WhatsAppModal
        isOpen={!!whatsAppCustomer}
        onClose={() => setWhatsAppCustomer(null)}
        customer={whatsAppCustomer}
        onSend={(message) => {
          if (whatsAppCustomer) {
            handleSaveContactLog(whatsAppCustomer.id, 'Interested');
            showToast(`WhatsApp sent to ${whatsAppCustomer.name}!`, 'chat');
          }
        }}
      />

      {/* Global Floating Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-22 inset-x-4 max-w-sm mx-auto z-50 bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <span className="material-symbols-outlined text-[20px] text-tertiary-fixed">
            {toast.icon || 'check_circle'}
          </span>
          <span className="font-['Inter'] text-[13px] font-medium leading-snug flex-1">
            {toast.message}
          </span>
          <button
            onClick={() => setToast(null)}
            className="text-surface-variant hover:text-inverse-on-surface cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Sticky Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        pendingFollowupsCount={2}
        onOpenGeminiChat={() => setIsGeminiChatOpen(true)}
      />

      {/* Gemini AI Multi-Turn Chatbot Modal */}
      <GeminiChatModal
        isOpen={isGeminiChatOpen}
        onClose={() => setIsGeminiChatOpen(false)}
        customers={customers}
        onOpenWhatsApp={(cust) => {
          setIsGeminiChatOpen(false);
          setWhatsAppCustomer(cust);
        }}
      />

      {/* Firebase Auth & Profile Modal */}
      <AuthProfileModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChanged={(user) => setCurrentUser(user)}
        onShowToast={showToast}
      />

      {/* Google Sheets Integration Modal */}
      <GoogleSheetsModal
        isOpen={isGoogleSheetsModalOpen}
        onClose={() => setIsGoogleSheetsModalOpen(false)}
        customers={customers}
        onShowToast={(msg) => showToast(msg, 'table_chart')}
        linkedSpreadsheetId={linkedSpreadsheetId}
        onSpreadsheetLinked={handleSpreadsheetLinked}
      />
    </div>
  );
}
