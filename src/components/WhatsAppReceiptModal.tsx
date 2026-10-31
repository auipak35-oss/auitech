import React, { useState, useEffect, useRef } from 'react';
import { FeePayment, InstitutionSettings, Student } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  X,
  MessageCircle,
  Download,
  Share2,
  Copy,
  Check,
  Send,
  Smartphone,
  Laptop,
  AlertCircle,
  CheckCircle2,
  FileText,
  Phone,
  ShieldCheck,
  ExternalLink,
  Printer,
  Sparkles,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  payment: FeePayment;
  student?: Student;
  settings: InstitutionSettings;
  onClose: () => void;
  onOpenPrintReceipt?: () => void;
}

export const WhatsAppReceiptModal: React.FC<Props> = ({
  isOpen,
  payment,
  student,
  settings,
  onClose,
  onOpenPrintReceipt,
}) => {
  if (!isOpen) return null;

  // Receipt reference DOM for PDF generation
  const receiptPreviewRef = useRef<HTMLDivElement>(null);

  // Determine primary and secondary phone numbers
  const initialPhone = student?.guardianContact || student?.phone || '';
  const [recipientPhone, setRecipientPhone] = useState(initialPhone);
  const [phoneType, setPhoneType] = useState<'guardian' | 'student' | 'custom'>(
    student?.guardianContact ? 'guardian' : 'student'
  );

  // Active channel tab: 'whatsapp' | 'sms' | 'preview'
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'sms' | 'preview'>('whatsapp');

  // PDF Generation State
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfGenerationError, setPdfGenerationError] = useState('');

  // Sharing capabilities detection
  const [canDirectShareFile, setCanDirectShareFile] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  // Notification and Copy State
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedSms, setCopiedSms] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Financial calculations
  const currency = settings.currencySymbol || 'Rs.';
  const previousBalance = Math.max(0, payment.balanceRemaining + payment.amountPaid);
  const discountAmount = student?.discount || 0;
  const courseFeeOrMonthly = student?.monthlyFee || payment.totalDue;

  // Clean phone number for WhatsApp international format (e.g., Pakistan +92...)
  const formatPhoneForWhatsApp = (raw: string): string => {
    // Remove spaces, dashes, parentheses
    let cleaned = raw.replace(/[^0-9+]/g, '');
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    } else if (cleaned.startsWith('00')) {
      cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('03')) {
      // Pakistani mobile starting with 03xx -> 923xx
      cleaned = '92' + cleaned.substring(1);
    } else if (cleaned.startsWith('3') && cleaned.length === 10) {
      cleaned = '92' + cleaned;
    }
    return cleaned;
  };

  const cleanPhone = formatPhoneForWhatsApp(recipientPhone);

  // Default Polite WhatsApp Message according to specifications
  const initialWhatsAppMessage = `Assalam-o-Alaikum,
Dear Parent/Guardian,

The fee payment for ${payment.studentName} has been received by ${settings.name}.

Student ID: ${payment.studentId}
Class/Course: ${payment.className}
Receipt No.: ${payment.receiptNumber}
Amount Paid: ${currency} ${payment.amountPaid.toLocaleString()}
Remaining Balance: ${currency} ${payment.balanceRemaining.toLocaleString()}

Please find the attached official fee receipt PDF for your record.

Thank you,
${settings.name}
Near Rubina Shaheen Medical Complex, People Chowk, Haveli Lakha, District Okara, Punjab, Pakistan.
Contact: 0312-1266130, 0329-8294648`;

  const [customMessage, setCustomMessage] = useState(initialWhatsAppMessage);

  // SMS Text Message
  const defaultSmsText = `${settings.name}: Fee payment of ${currency} ${payment.amountPaid.toLocaleString()} received for ${payment.studentName} (${payment.studentId}). Receipt #${payment.receiptNumber}. Remaining Balance: ${currency} ${payment.balanceRemaining.toLocaleString()}. Tel: 0312-1266130 / 0329-8294648`;
  const [customSms, setCustomSms] = useState(defaultSmsText);

  // Check device and sharing capability on mount
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobileDevice(isMobile);

    if (typeof navigator !== 'undefined' && 'canShare' in navigator) {
      try {
        const dummyFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
        if (navigator.canShare({ files: [dummyFile] })) {
          setCanDirectShareFile(true);
        }
      } catch (e) {
        setCanDirectShareFile(false);
      }
    }
  }, []);

  // Set file name
  useEffect(() => {
    const safeStudentName = payment.studentName.replace(/[^a-zA-Z0-9]/g, '_');
    setPdfFileName(`Receipt_${payment.receiptNumber}_${safeStudentName}.pdf`);
  }, [payment]);

  // Generate PDF from receipt preview
  const generatePdfBlob = async (): Promise<{ blob: Blob; url: string; file: File } | null> => {
    if (!receiptPreviewRef.current) return null;
    setIsGeneratingPdf(true);
    setPdfGenerationError('');

    try {
      // Use html2canvas to capture high-res image of the receipt
      const canvas = await html2canvas(receiptPreviewRef.current, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(pdfHeight, 290));

      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const file = new File([blob], pdfFileName, { type: 'application/pdf' });

      setPdfBlob(blob);
      setPdfUrl(url);
      setIsGeneratingPdf(false);
      return { blob, url, file };
    } catch (error: any) {
      console.error('PDF Generation failed:', error);
      setIsGeneratingPdf(false);
      setPdfGenerationError('Failed to generate PDF receipt. You can still download or print.');
      return null;
    }
  };

  // Pre-generate PDF on modal open
  useEffect(() => {
    const timer = setTimeout(() => {
      generatePdfBlob();
    }, 400);
    return () => clearTimeout(timer);
  }, [payment]);

  // Action: Download PDF directly
  const handleDownloadPdf = async () => {
    let url = pdfUrl;
    if (!url) {
      const generated = await generatePdfBlob();
      if (generated) url = generated.url;
    }

    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = pdfFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setStatusMessage({ type: 'success', text: `Receipt PDF "${pdfFileName}" downloaded successfully!` });
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Action: Mobile Direct Share (attaches the PDF file directly into WhatsApp!)
  const handleMobileDirectShare = async () => {
    if (!cleanPhone && !recipientPhone) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid recipient phone number first.' });
      return;
    }

    try {
      let fileToShare: File | null = null;
      if (pdfBlob) {
        fileToShare = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });
      } else {
        const generated = await generatePdfBlob();
        if (generated) fileToShare = generated.file;
      }

      if (fileToShare && navigator.canShare && navigator.canShare({ files: [fileToShare] })) {
        await navigator.share({
          files: [fileToShare],
          title: `Fee Receipt #${payment.receiptNumber} - ${payment.studentName}`,
          text: customMessage,
        });
        setStatusMessage({ type: 'success', text: 'PDF share sheet opened! Select WhatsApp to deliver.' });
      } else {
        // Fallback to standard WhatsApp link
        handleOpenWhatsAppWeb();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Share error:', err);
        handleOpenWhatsAppWeb();
      }
    }
  };

  // Action: Open WhatsApp Web / App with pre-filled message
  const handleOpenWhatsAppWeb = () => {
    if (!recipientPhone.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter parent/guardian phone number.' });
      return;
    }

    const encodedText = encodeURIComponent(customMessage);
    const targetUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;

    // On laptops or mobile, open WhatsApp in a new tab
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    setStatusMessage({
      type: 'info',
      text: 'WhatsApp opened with pre-filled message. Remember to attach the downloaded PDF receipt!',
    });
    setTimeout(() => setStatusMessage(null), 7000);
  };

  // Action: Copy WhatsApp Message
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(customMessage);
    setCopiedMessage(true);
    setStatusMessage({ type: 'success', text: 'WhatsApp message copied to clipboard!' });
    setTimeout(() => {
      setCopiedMessage(false);
      setStatusMessage(null);
    }, 3000);
  };

  // Action: Copy SMS Text
  const handleCopySms = () => {
    navigator.clipboard.writeText(customSms);
    setCopiedSms(true);
    setStatusMessage({ type: 'success', text: 'SMS confirmation text copied!' });
    setTimeout(() => {
      setCopiedSms(false);
      setStatusMessage(null);
    }, 3000);
  };

  // Action: Open native SMS app
  const handleOpenDeviceSms = () => {
    if (!recipientPhone.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a recipient phone number.' });
      return;
    }
    const cleanSmsPhone = recipientPhone.replace(/[^0-9+]/g, '');
    const encodedBody = encodeURIComponent(customSms);
    window.location.href = `sms:${cleanSmsPhone}?body=${encodedBody}`;
    setStatusMessage({ type: 'info', text: 'Device SMS app opened with confirmation message.' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-5 py-4 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base sm:text-lg">
                  Send Full Fee Receipt on WhatsApp
                </h3>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono border border-emerald-500/30">
                  {payment.receiptNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official Receipt for <strong className="text-slate-200">{payment.studentName}</strong> ({payment.studentId})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FEEDBACK STATUS ALERT */}
        {statusMessage && (
          <div
            className={`px-5 py-2.5 text-xs font-semibold flex items-center justify-between transition ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-b border-rose-200'
                : 'bg-amber-50 text-amber-900 border-b border-amber-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-slate-700 ml-2 text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TABS SELECTOR */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'whatsapp'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Delivery</span>
            </button>
            <button
              onClick={() => setActiveTab('sms')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'sms'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>SMS Option</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'preview'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Receipt Preview</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onOpenPrintReceipt && (
              <button
                onClick={onOpenPrintReceipt}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-white border border-slate-300 px-2.5 py-1 rounded-md hover:bg-slate-50 active:scale-95 transition"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Print Dialog</span>
              </button>
            )}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 px-3 py-1 rounded-md active:scale-95 transition shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>

        {/* MODAL MAIN CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: WHATSAPP SHARING */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-6">
              {/* Recipient Phone Selection Card */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Recipient Parent / Guardian Phone Number</span>
                  </label>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-[11px]">
                    {student?.guardianContact && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhoneType('guardian');
                          setRecipientPhone(student.guardianContact);
                        }}
                        className={`px-2 py-0.5 rounded font-medium transition ${
                          phoneType === 'guardian'
                            ? 'bg-emerald-100 text-emerald-800 font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Guardian Contact
                      </button>
                    )}
                    {student?.phone && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhoneType('student');
                          setRecipientPhone(student.phone);
                        }}
                        className={`px-2 py-0.5 rounded font-medium transition ${
                          phoneType === 'student'
                            ? 'bg-emerald-100 text-emerald-800 font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Student Phone
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPhoneType('custom')}
                      className={`px-2 py-0.5 rounded font-medium transition ${
                        phoneType === 'custom'
                          ? 'bg-emerald-100 text-emerald-800 font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Custom Number
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-8">
                    <div className="relative">
                      <input
                        type="text"
                        value={recipientPhone}
                        onChange={(e) => {
                          setRecipientPhone(e.target.value);
                          setPhoneType('custom');
                        }}
                        placeholder="e.g. +92 300 1234567 or 03001234567"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-4 text-xs text-slate-500">
                    {cleanPhone ? (
                      <span className="flex items-center gap-1 text-emerald-700 font-mono font-medium">
                        <Check className="w-3.5 h-3.5" />
                        WhatsApp ID: +{cleanPhone}
                      </span>
                    ) : (
                      <span className="text-amber-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Please provide valid phone
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Message Editor Card */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Polite WhatsApp Message (Editable)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-300 px-2.5 py-1 rounded-md hover:bg-slate-50 transition"
                  >
                    {copiedMessage ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-500" />
                        <span>Copy Message</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  rows={8}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-3 font-sans text-xs sm:text-sm text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden leading-relaxed"
                />
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Pre-populated with real financial figures: <strong>{currency} {payment.amountPaid.toLocaleString()}</strong> paid, <strong>{currency} {payment.balanceRemaining.toLocaleString()}</strong> remaining.
                </p>
              </div>

              {/* SHARING ACTION BUTTONS */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Deliver Full Receipt
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* MOBILE NATIVE SHARE (If supported) */}
                  <div className={`p-4 rounded-xl border transition ${
                    isMobileDevice || canDirectShareFile
                      ? 'border-emerald-300 bg-emerald-50/60'
                      : 'border-slate-200 bg-white'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <h5 className="font-bold text-slate-900 text-sm">
                            Mobile Direct Share
                          </h5>
                          {canDirectShareFile && (
                            <span className="bg-emerald-200 text-emerald-900 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              Direct PDF
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-normal">
                          {canDirectShareFile
                            ? 'Shares the actual PDF file directly into WhatsApp with the prepared polite message on supported phones.'
                            : 'Opens WhatsApp with the pre-filled message directly on your mobile device.'}
                        </p>
                        <button
                          type="button"
                          onClick={handleMobileDirectShare}
                          disabled={isGeneratingPdf}
                          className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white py-2.5 px-4 text-xs sm:text-sm font-bold shadow-xs transition"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>
                            {isGeneratingPdf
                              ? 'Preparing PDF...'
                              : 'Send Full Receipt on WhatsApp (Mobile)'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* LAPTOP & DESKTOP FLOW */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                        <Laptop className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-bold text-slate-900 text-sm">
                          Laptop & Desktop Flow
                        </h5>
                        <p className="text-xs text-slate-600 mt-1 leading-normal">
                          Laptops cannot directly attach files to external apps without manual upload. Follow these 2 easy steps:
                        </p>

                        <div className="mt-3 space-y-2">
                          <button
                            type="button"
                            onClick={handleDownloadPdf}
                            disabled={isGeneratingPdf}
                            className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 py-2 px-3 text-xs font-bold active:scale-95 transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Step 1: Download PDF Receipt</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleOpenWhatsAppWeb}
                            className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white py-2 px-3 text-xs font-bold active:scale-95 transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Step 2: Open WhatsApp & Attach PDF</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Helpful Instruction Box */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong className="text-slate-800">Verified & Safe Payment:</strong> Payment #{payment.receiptNumber} is safely recorded in the database. Sharing or downloading does not change amounts or generate duplicate payments.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SMS OPTION */}
          {activeTab === 'sms' && (
            <div className="space-y-5">
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 text-xs text-amber-900 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-amber-950">SMS Provider Notice</h5>
                  <p className="mt-1 leading-relaxed">
                    An automated Cloud SMS Gateway (such as Jazz, Telenor SMS API, or Twilio) is not currently connected to this deployment.
                    You can instantly send this confirmation using your <strong>device's native SMS app</strong> or <strong>copy the message</strong> to send manually.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    SMS Confirmation Text
                  </label>
                  <button
                    type="button"
                    onClick={handleCopySms}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-300 px-2.5 py-1 rounded-md hover:bg-slate-50 transition"
                  >
                    {copiedSms ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-500" />
                        <span>Copy SMS</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={customSms}
                  onChange={(e) => setCustomSms(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900 focus:border-slate-500 focus:outline-hidden"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleOpenDeviceSms}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-4 text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition"
                >
                  <Send className="w-4 h-4 text-amber-400" />
                  <span>Send via Device SMS App</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopySms}
                  className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 py-2.5 px-4 text-xs sm:text-sm font-bold active:scale-95 transition"
                >
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copy Text to Clipboard</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: RECEIPT PREVIEW (Also used as the DOM source for PDF rendering) */}
          <div className={activeTab === 'preview' ? 'block' : 'hidden'}>
            <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
              <span>High-resolution PDF canvas with official circular crest</span>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="flex items-center gap-1 font-bold text-amber-700 hover:text-amber-800 underline"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save as PDF ({pdfFileName})</span>
              </button>
            </div>
          </div>

          {/* ACTUAL RECEIPT CANVAS FOR HTML2CANVAS & PREVIEW */}
          <div
            ref={receiptPreviewRef}
            className={`bg-white rounded-xl border border-slate-300 p-6 sm:p-8 text-slate-900 shadow-xs max-w-2xl mx-auto ${
              activeTab !== 'preview' ? 'sr-only' : 'block'
            }`}
          >
            {/* INSTITUTION HEADER WITH OFFICIAL LOGO */}
            <div className="border-b-2 border-slate-900 pb-5 text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <img
                  src={settings.logoUrl || '/assets/aistudio/adsas_4f29c8b1.jpg'}
                  alt="Anwaar-ul-Islam Technical Institute"
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
                  <span>Contact: <strong>{settings.phone || '0312-1266130, 0329-8294648'}</strong></span>
                  <span>·</span>
                  <span>Branch: {settings.campusBranch || 'Main Campus'}</span>
                </div>
              </div>
            </div>

            {/* RECEIPT TITLE BAR */}
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
                  Payment Date & Time
                </span>
                <span className="font-mono font-semibold text-slate-900">
                  {payment.paymentDate} · {new Date(payment.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block">
                  Status
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

            {/* STUDENT & GUARDIAN PARTICULARS */}
            <div className="grid grid-cols-2 gap-3 text-xs border-b border-slate-200 pb-4">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-semibold block">Student Full Name</span>
                <span className="font-black text-slate-950 text-sm">{payment.studentName}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-semibold block">Student ID / Roll No</span>
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
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block">Contact Number</span>
                  <span className="font-mono font-medium text-slate-800">{student.phone}</span>
                </div>
              )}
              {student?.guardianContact && (
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block">Guardian Phone</span>
                  <span className="font-mono font-medium text-slate-800">{student.guardianContact}</span>
                </div>
              )}
            </div>

            {/* FINANCIAL ITEMIZATION TABLE */}
            <div className="mt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-500 uppercase text-[10px] font-bold">
                    <th className="py-1.5">Description</th>
                    <th className="py-1.5 text-right">Amount ({currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2 text-slate-800">
                      Standard Monthly / Course Fee
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
                      Previous Outstanding Dues (Before this Payment)
                    </td>
                    <td className="py-2 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {currency} {previousBalance.toLocaleString()}
                    </td>
                  </tr>

                  <tr className="bg-emerald-50/70 font-bold text-emerald-950">
                    <td className="py-2.5 text-emerald-900">
                      Amount Paid Now ({payment.paymentMethod})
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-emerald-800 text-sm">
                      {currency} {payment.amountPaid.toLocaleString()}
                    </td>
                  </tr>

                  <tr className="border-t-2 border-slate-900 font-black">
                    <td className="py-2.5 text-slate-950">
                      Remaining Balance After Payment
                    </td>
                    <td
                      className={`py-2.5 text-right font-mono tabular-nums text-sm ${
                        payment.balanceRemaining > 0 ? 'text-amber-800 font-bold' : 'text-slate-500'
                      }`}
                    >
                      {currency} {payment.balanceRemaining.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* PAYMENT METADATA */}
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 text-[11px]">
              <div>
                <span className="text-slate-500">Payment Channel:</span>{' '}
                <span className="font-semibold text-slate-900">{payment.paymentMethod}</span>
              </div>
              <div>
                <span className="text-slate-500">Transaction Ref:</span>{' '}
                <span className="font-mono font-semibold text-slate-900">{payment.referenceNumber}</span>
              </div>
              <div>
                <span className="text-slate-500">Collected By:</span>{' '}
                <span className="font-semibold text-slate-900">{payment.receivedBy}</span>
              </div>
              <div>
                <span className="text-slate-500">Receipt Type:</span>{' '}
                <span className="font-semibold text-slate-900">{payment.feeType}</span>
              </div>
            </div>

            {/* OFFICIAL STAMP & SIGNATURE SECTION */}
            <div className="mt-10 grid grid-cols-3 gap-4 text-center text-xs">
              <div>
                <div className="mx-auto w-32 border-b border-slate-400 pb-1">
                  <span className="font-semibold text-slate-800">{payment.receivedBy}</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block uppercase tracking-wide">
                  Accounts Officer
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

            {/* FOOTER VERIFICATION */}
            <div className="mt-8 border-t border-slate-200 pt-3 flex flex-wrap items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Verified Computer Generated Fee Receipt · AUI Digi
              </span>
              <span>Near Rubina Shaheen Medical Complex, People Chowk, Haveli Lakha · 0312-1266130, 0329-8294648</span>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="border-t border-slate-200 bg-slate-100 px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Official WhatsApp Receipt Service · Powered by AUI Digi</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 active:scale-95 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
