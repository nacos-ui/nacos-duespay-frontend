import React from 'react';
import { CreditCard, Mail, Phone, CheckCircle2 } from 'lucide-react';

const SidebarSummary = ({
  paymentItems,
  selectedItems,
  themeColor,
  getTotalAmount,
  formatTotal,
  steps,
  currentStep,
  associationData
}) => {
  const adminEmail = associationData?.admin_email;
  const adminPhone = associationData?.admin_phone;

  return (
    <div className="space-y-6">

      {/* Desktop Steps Navigation - Clean Vertical List */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
          Payment Progress
        </h3>
        <div className="space-y-4">
          {steps && steps.map((step) => {
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;

            return (
              <div key={step.number} className="flex items-center gap-3">
                <div className={`
                        flex items-center justify-center w-8 h-8 rounded-full border-2 
                        ${isCompleted ? 'bg-emerald-50 border-emerald-500 text-emerald-600' :
                    isActive ? 'border-gray-900 text-gray-900' : 'border-gray-200 text-gray-300'}
                     `}
                  style={isActive ? { borderColor: themeColor, color: themeColor } : {}}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <div className="text-sm font-bold">{step.number}</div>}
                </div>
                <div>
                  <p className={`text-sm font-medium ${isActive || isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Summary - Hide on last step */}
      {currentStep !== 4 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Invoice Summary
          </h3>

          {selectedItems.length > 0 ? (
            <div className="space-y-3">
              {selectedItems.map(itemId => {
                const item = paymentItems.find(p => p.id === itemId);
                if (!item) return null;
                return (
                  <div key={itemId} className="flex justify-between items-start text-sm">
                    <div className="flex-1 pr-2">
                      <span className="text-gray-700">{item.title}</span>
                    </div>
                    <span className="font-semibold text-gray-900 whitespace-nowrap">₦{item.amount.toLocaleString()}</span>
                  </div>
                );
              })}

              <div className="pt-4 mt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold" style={{ color: themeColor }}>
                  {formatTotal(getTotalAmount())}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm">
              No items selected yet.
            </div>
          )}
        </div>
      )}

      {/* Support Links */}
      {(adminEmail || adminPhone) && (
        <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
            Need Assistance?
          </h3>
          <div className="space-y-3">
            {adminEmail && (
              <a
                href={`mailto:${adminEmail}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
              >
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-900">Email Support</p>
                  <p className="text-xs text-gray-500 truncate">{adminEmail}</p>
                </div>
              </a>
            )}
            {adminPhone && (
              <a
                href={`tel:${adminPhone}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-900">Phone Support</p>
                  <p className="text-xs text-gray-500 truncate">{adminPhone}</p>
                </div>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Mobile Only: Quick Contact Text */}
      <div className="lg:hidden text-center text-xs text-gray-400 mt-2">
        Issues? Contact {adminEmail ? (
          <a href={`mailto:${adminEmail}`} className="font-medium underline decoration-dotted">Support</a>
        ) : 'the administrator'}
      </div>

    </div>
  );
};

export default SidebarSummary;