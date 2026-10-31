import React from 'react';
import { FeePayment, InstitutionSettings, Student } from '../types';
import { Printer, X, CheckCircle, ShieldCheck, MessageCircle } from 'lucide-react';

interface Props {
  payment: FeePayment;
  settings: InstitutionSettings;
  student?: Student;
  onClose: () => void;
  onShareWhatsApp?: (payment: FeePayment) => void;
}

export const PrintableReceipt: React.FC<Props> = ({
  payment,
  settings,
  student,
  onClose,
  onShareWhatsApp,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const currency = settings.currencySymbol || 'Rs.';
  const previousBalance = Math.max(0, payment.balanceRemaining + payment.amountPaid);
  const discountAmount = student?.discount || 0;
  const courseFeeOrMonthly = student?.monthlyFee || payment.totalDue;
  const formattedTime = new Date(payment.createdAt || Date.now()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 my-auto">
        {/* Modal Controls - Hidden during print */}
        <div className="no-print flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-950 px-5 py-3.5 text-white gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-white text-sm sm:text-base">Official Fee Receipt</h3>
            <span className="text-xs text-amber-300 font-mono bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
              {payment.receiptNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* WHATSAPP FULL RECEIPT BUTTON */}
            {onShareWhatsApp && (
              <button
                type="button"
                onClick={() => onShareWhatsApp(payment)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs sm:text-sm font-bold text-white hover:bg-emerald-500 active:scale-95 transition shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send Full Receipt on WhatsApp</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-950 hover:bg-amber-400 active:scale-95 transition shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 sm:p-8 bg-white text-slate-900" id="receipt-printable-area">
          {/* Header Banner with Official Institute Logo */}
          <div className="border-b-2 border-slate-900 pb-5 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <img
                src={settings.logoUrl || '/assets/aistudio/adsas_4f29c8b1.jpg'}
                alt="Institute Crest"
                className="w-16 h-16 object-contain rounded-full border border-slate-200 shadow-2xs"
                crossOrigin="anonymous"
              />
              <div className="text-left">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase leading-tight">
                  {settings.name}
                </h1>
                <p className="text-xs font-bold text-amber-700 tracking-wide uppercase">
                  {settings.subTitle || 'School · College · Computer Academy · Spoken English'}
                </p>
              </div>
            </div>

            <div className="mt-2 flex flex-col items-center justify-center gap-0.5 text-[11px] text-slate-600">
              <span className="font-medium text-slate-800 text-center">
                {settings.address || 'Near Rubina Shaheen Medical Complex, People Chowk, Haveli Lakha, District Okara, Punjab, Pakistan.'}
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span>Contact: <strong>{settings.phone || '0312-1266130 / 0329-8294648'}</strong></span>
                <span>·</span>
                <span className="font-semibold text-amber-700">Powered by {settings.poweredBy || 'AUI Digi'}</span>
              </div>
            </div>
          </div>

          {/* Receipt Title Bar */}
          <div className="my-4 flex flex-wrap items-center justify-between gap-3 bg-slate-100 p-3 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block">
                Receipt Number
              </span>
              <span className="font-mono text-sm font-black text-slate-950">
                {payment.receiptNumber}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block">
                Billing Cycle
              </span>
              <span className="font-semibold text-slate-900">
                {payment.billingMonth}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block">
                Date & Time Issued
              </span>
              <span className="font-mono font-semibold text-slate-900">
                {payment.paymentDate} · {formattedTime}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block">
                Payment Type
              </span>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                  payment.isPartial
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}
              >
                {payment.isPartial ? 'Partial Payment' : 'Full Payment'}
              </span>
            </div>
          </div>

          {/* Student Information Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm border-b border-slate-200 pb-4">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-semibold block">Student Name</span>
              <span className="font-black text-slate-950 text-sm sm:text-base">{payment.studentName}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-semibold block">Student ID / Roll No.</span>
              <span className="font-mono font-bold text-slate-900">{payment.studentId}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-semibold block">Father / Guardian Name</span>
              <span className="font-semibold text-slate-900">{payment.fatherName}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-semibold block">Class / Course / Batch</span>
              <span className="font-semibold text-slate-900">{payment.className}</span>
            </div>
            {student?.phone && (
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-semibold block">Student Contact</span>
                <span className="font-mono font-medium text-slate-800 text-xs">{student.phone}</span>
              </div>
            )}
            {student?.guardianContact && (
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-semibold block">Parent / Guardian Contact</span>
                <span className="font-mono font-medium text-slate-800 text-xs">{student.guardianContact}</span>
              </div>
            )}
          </div>

          {/* Fee Breakdown Table */}
          <div className="mt-4">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-300 text-slate-500 uppercase text-[10px] sm:text-[11px] font-bold">
                  <th className="py-2">Description</th>
                  <th className="py-2 text-right">Amount ({currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr>
                  <td className="py-2 text-slate-800">
                    Standard Monthly Tuition / Course Fee for {payment.billingMonth}
                  </td>
                  <td className="py-2 text-right font-mono tabular-nums text-slate-900">
                    {currency} {courseFeeOrMonthly.toLocaleString()}
                  </td>
                </tr>

                {discountAmount > 0 && (
                  <tr className="text-slate-600">
                    <td className="py-2 text-emerald-700">
                      Institutional Fee Concession / Discount
                    </td>
                    <td className="py-2 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                      - {currency} {discountAmount.toLocaleString()}
                    </td>
                  </tr>
                )}

                <tr>
                  <td className="py-2 text-slate-800">
                    Previous Outstanding Balance (Before Payment)
                  </td>
                  <td className="py-2 text-right font-mono tabular-nums font-semibold text-slate-900">
                    {currency} {previousBalance.toLocaleString()}
                  </td>
                </tr>

                <tr className="bg-emerald-50/70 font-semibold text-emerald-950">
                  <td className="py-2.5 text-emerald-900 font-bold">
                    Amount Paid Now ({payment.paymentMethod})
                  </td>
                  <td className="py-2.5 text-right font-mono tabular-nums text-emerald-800 text-base font-black">
                    {currency} {payment.amountPaid.toLocaleString()}
                  </td>
                </tr>

                <tr className="border-t-2 border-slate-900 font-bold">
                  <td className="py-2.5 text-slate-950">
                    Remaining Balance After Payment
                  </td>
                  <td
                    className={`py-2.5 text-right font-mono tabular-nums text-base ${
                      payment.balanceRemaining > 0 ? 'text-amber-800 font-black' : 'text-slate-500'
                    }`}
                  >
                    {currency} {payment.balanceRemaining.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Details Metadata */}
          <div className="mt-4 grid grid-cols-2 gap-2.5 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 text-xs">
            <div>
              <span className="text-slate-500">Payment Channel:</span>{' '}
              <span className="font-semibold text-slate-800">{payment.paymentMethod}</span>
            </div>
            <div>
              <span className="text-slate-500">Transaction Ref / ID:</span>{' '}
              <span className="font-mono font-semibold text-slate-800">{payment.referenceNumber}</span>
            </div>
            <div>
              <span className="text-slate-500">Received By:</span>{' '}
              <span className="font-semibold text-slate-800">{payment.receivedBy}</span>
            </div>
            <div>
              <span className="text-slate-500">Fee Category:</span>{' '}
              <span className="font-semibold text-slate-800">{payment.feeType}</span>
            </div>
            {payment.notes && (
              <div className="col-span-2">
                <span className="text-slate-500">Cashier Note:</span>{' '}
                <span className="italic text-slate-700">{payment.notes}</span>
              </div>
            )}
          </div>

          {/* Signatures & Institute Seal Area */}
          <div className="mt-10 grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <div className="mx-auto w-32 border-b border-slate-400 pb-1">
                <span className="font-semibold text-slate-800">{payment.receivedBy}</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block uppercase tracking-wide">
                Receiving Cashier / Accounts
              </span>
            </div>
            <div>
              <div className="mx-auto w-32 border-b border-slate-400 pb-1">
                <span className="font-semibold text-slate-800">{settings.principalName || 'Hafiz Israr Ahmad Rizvi'}</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block uppercase tracking-wide font-medium">
                Principal
              </span>
            </div>
            <div>
              <div className="mx-auto w-36 border-b border-slate-400 pb-1">
                <span className="font-semibold text-slate-800">{settings.directorName || settings.founderName || 'Professor Muhammad Anwaar Rizvi (R.A)'}</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block uppercase tracking-wide font-medium">
                Founder & Director
              </span>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="mt-6 border-t border-slate-200 pt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
            <span className="flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Official Electronic Fee Receipt · Computer Generated
            </span>
            <span>Near Rubina Shaheen Medical Complex, People Chowk, Haveli Lakha · 0312-1266130, 0329-8294648</span>
          </div>
        </div>
      </div>
    </div>
  );
};
