import React, { useState, useEffect } from 'react';
import { Customer } from '../types';

interface WhatsAppModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onLogged: (customerId: string, outcome: string) => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  customer,
  isOpen,
  onClose,
  onLogged,
}) => {
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (customer) {
      setMessage(customer.banglaWhatsAppTemplate);
      setIsEditing(false);
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

  const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
  const internationalPhone = cleanPhone.startsWith('880')
    ? cleanPhone
    : cleanPhone.startsWith('0')
    ? '880' + cleanPhone.substring(1)
    : '880' + cleanPhone;

  const encodedMessage = encodeURIComponent(message);
  const waUrl = `https://wa.me/${internationalPhone}?text=${encodedMessage}`;

  const handleSendAndLog = () => {
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    onLogged(customer.id, 'WhatsApp Message Sent');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface-container-lowest rounded-t-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Handle & Header */}
        <div className="flex flex-col gap-1">
          <div className="w-12 h-1.5 rounded-full bg-outline-variant mx-auto mb-2"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-tertiary text-tertiary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">chat</span>
              </div>
              <div>
                <h5 className="font-['Plus_Jakarta_Sans'] text-headline-sm font-bold text-on-surface">
                  {customer.name}
                </h5>
                <span className="font-['Inter'] text-secondary text-[11px] font-medium">
                  {customer.ownerName} • +880 {customer.phone}
                </span>
              </div>
            </div>
            <button
              id="close-wa-modal-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface-container-low text-secondary flex items-center justify-center hover:text-on-surface transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Message Preview Box */}
        <div className="rounded-xl bg-surface-container-low p-3.5 flex flex-col gap-2 border border-surface-container">
          <div className="flex items-center justify-between text-[11px] text-secondary">
            <span className="font-['Inter'] font-semibold uppercase tracking-wide">
              Auto-Tailored Bangla Message
            </span>
            <span className="text-on-tertiary-container font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container animate-pulse"></span>{' '}
              Ready
            </span>
          </div>

          {isEditing ? (
            <textarea
              className="w-full bg-surface-container-lowest text-on-surface text-body-md font-['Inter'] leading-relaxed p-3 rounded-lg shadow-sm border border-primary outline-none ring-2 ring-primary/20 min-h-[90px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          ) : (
            <div className="p-3 rounded-lg bg-surface-container-lowest text-on-surface text-body-md font-['Inter'] leading-relaxed shadow-sm border border-surface-container/50 select-text">
              &quot;{message}&quot;
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-secondary px-1">
            <span className="truncate">Referencing: {customer.preferredModel}</span>
            <span className="shrink-0 font-medium">Bengali Script Verified</span>
          </div>
        </div>

        {/* Action Buttons in Modal */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            id="wa-direct-send-btn"
            onClick={handleSendAndLog}
            className="w-full h-12 rounded-xl bg-tertiary-container text-on-tertiary font-['Plus_Jakarta_Sans'] font-bold text-[14px] flex items-center justify-center gap-2 shadow-md hover:bg-tertiary active:scale-[0.99] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px] text-tertiary-fixed">send</span>
            <span>Open WhatsApp • Send Message</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              id="wa-toggle-edit-btn"
              onClick={() => setIsEditing(!isEditing)}
              className="h-10 rounded-xl bg-surface-container text-on-surface font-['Inter'] text-[12px] font-semibold flex items-center justify-center gap-1.5 hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isEditing ? 'done' : 'edit_note'}
              </span>
              <span>{isEditing ? 'Done Editing' : 'Edit Message'}</span>
            </button>

            <button
              id="wa-cancel-btn"
              onClick={onClose}
              className="h-10 rounded-xl bg-surface-container-low text-secondary font-['Inter'] text-[12px] font-medium hover:text-on-surface transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
