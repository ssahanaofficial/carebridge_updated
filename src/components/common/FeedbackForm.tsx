import React, { useState } from 'react';
import {
  Star,
  Send,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  User,
  Building2,
  Droplet,
  Wind,
  Truck,
  Stethoscope,
  Shield,
  HelpCircle,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { saveFeedback, type FeedbackItem } from '../../services/feedbackService';
import type { UserRole } from '../../types';

export interface FeedbackFormProps {
  role?: UserRole | 'visitor';
  roleLabel?: string;
  facilityName?: string;
  allowRoleSwitch?: boolean;
  onSuccess?: (item: FeedbackItem) => void;
  title?: string;
  description?: string;
  compact?: boolean;
}

const ROLE_CATEGORIES: Record<string, string[]> = {
  patient: [
    'Emergency Intake & Urgency Selection',
    'Bed & ICU Reservation Process',
    'Blood Group Matching & Availability',
    'Medical Oxygen Delivery & Refills',
    'Ambulance Response Time & Tracking',
    'Attendant Portal & Family Profile Linking',
    'General Experience & Ease of Use'
  ],
  patientAttendant: [
    'Emergency Intake & Urgency Selection',
    'Bed & ICU Reservation Process',
    'Blood Group Matching & Availability',
    'Medical Oxygen Delivery & Refills',
    'Ambulance Response Time & Tracking',
    'Attendant Portal & Family Profile Linking',
    'General Experience & Ease of Use'
  ],
  hospital: [
    'Bed & ICU Capacity Synchronization',
    'Incoming Emergency Triage Notifications',
    'Accepting & Locking Reservations',
    'Patient Handover & Clinical Summaries',
    'Physician / Department Coordination',
    'Technical Issues & Suggestions'
  ],
  bloodBank: [
    '8-Group Blood Unit Inventory Sync',
    'Emergency Transfusion Requests Flow',
    'Reservation Expiration & Hold Locks',
    'Attendant / Courier Verification',
    'Stock Reporting Accuracy'
  ],
  oxygenProvider: [
    'Cylinder & Concentrator Inventory Updates',
    'Emergency Oxygen Requisition Flow',
    'Dispatch & Delivery Logistics',
    'Safety & Prescription Verification',
    'Pickup Handover & Verification'
  ],
  ambulanceProvider: [
    'Emergency Call Routing & GPS Coordinates',
    '7-Step Telemetry Stepper Updating',
    'Direct Attendant / Hospital Communication',
    'ALS vs BLS Fleet Assignment',
    'Hospital Receiving Dock Handover'
  ],
  doctor: [
    'Pre-admission Clinical Triage Quality',
    'Attaching Medical Notes & Directives',
    'Patient Vitals & History Visibility',
    'Emergency Admission Approval Flow',
    'Inter-departmental Referral Quality'
  ],
  admin: [
    'Facility Verification & Credentialing',
    'Audit Log & Lifecycle Event Tracking',
    'Cross-provider Escalation Handling',
    'Platform Security & Performance',
    'Coordination Room Tools'
  ],
  visitor: [
    'Website Navigation & Responsiveness',
    'Information Clarity & Help Guides',
    'Tutorial Video & Step Walkthroughs',
    'Emergency Contact Clarity',
    'Other Inquiries'
  ]
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  patient: <User className="w-4 h-4 text-teal-600" />,
  patientAttendant: <User className="w-4 h-4 text-teal-600" />,
  hospital: <Building2 className="w-4 h-4 text-blue-600" />,
  bloodBank: <Droplet className="w-4 h-4 text-rose-600" />,
  oxygenProvider: <Wind className="w-4 h-4 text-sky-600" />,
  ambulanceProvider: <Truck className="w-4 h-4 text-amber-600" />,
  doctor: <Stethoscope className="w-4 h-4 text-emerald-600" />,
  admin: <Shield className="w-4 h-4 text-purple-600" />,
  visitor: <HelpCircle className="w-4 h-4 text-slate-600" />
};

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  patient: 'Patient & Family',
  patientAttendant: 'Patient Attendant',
  hospital: 'Hospital Facility',
  bloodBank: 'Blood Bank',
  oxygenProvider: 'Oxygen Supplier',
  ambulanceProvider: 'Ambulance Operator',
  doctor: 'Physician / Medical Staff',
  admin: 'Coordinator / Admin',
  visitor: 'General Visitor'
};

const RATING_LABELS = ['', 'Needs Immediate Fix', 'Below Expectations', 'Satisfactory', 'Very Good', 'Exceptional'];

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  role = 'patient',
  roleLabel,
  facilityName,
  allowRoleSwitch = false,
  onSuccess,
  title,
  description,
  compact = false
}) => {
  const { currentUser, activeRole } = useAuth();
  const effectiveRole = allowRoleSwitch ? role : (activeRole || role || 'patient');

  const [currentRole, setCurrentRole] = useState<UserRole | 'visitor'>(effectiveRole as any);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('low');
  const [name, setName] = useState<string>(currentUser?.displayName || '');
  const [email, setEmail] = useState<string>(currentUser?.email || '');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedItem, setSubmittedItem] = useState<FeedbackItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categories = ROLE_CATEGORIES[currentRole] || ROLE_CATEGORIES.patient;

  // Set default category when role changes
  React.useEffect(() => {
    const cats = ROLE_CATEGORIES[currentRole] || ROLE_CATEGORIES.patient;
    if (!category || !cats.includes(category)) {
      setCategory(cats[0]);
    }
  }, [currentRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please provide feedback comments.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const saved = await saveFeedback({
        role: currentRole,
        roleLabel: roleLabel || ROLE_DISPLAY_NAMES[currentRole] || 'User',
        rating,
        category: category || categories[0],
        subject: subject.trim() || `${ROLE_DISPLAY_NAMES[currentRole]} Platform Feedback`,
        message: message.trim(),
        urgency,
        userUid: currentUser?.uid,
        userName: name.trim() || currentUser?.displayName || 'Anonymous',
        userEmail: email.trim() || currentUser?.email || 'unspecified@carebridge.org',
        facilityName: facilityName || (currentUser as any)?.facilityName || undefined,
        metadata: {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          platform: 'web',
          resolved: false
        }
      });

      setSubmittedItem(saved);
      if (onSuccess) {
        onSuccess(saved);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedItem(null);
    setMessage('');
    setSubject('');
    setRating(5);
    setError(null);
  };

  if (submittedItem) {
    return (
      <div className="bg-white rounded-2xl border border-teal-200 p-6 sm:p-8 text-center space-y-4 shadow-sm animate-in fade-in duration-200">
        <div className="w-14 h-14 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h4 className="text-lg font-bold text-slate-900">Thank You For Your Feedback!</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Your insights directly support CareBridge coordinators in optimizing emergency resource dispatch and improving facility workflows.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-mono text-slate-700 font-semibold border border-slate-200">
          <span>Reference Ticket:</span>
          <span className="text-teal-700 font-bold">{submittedItem.id}</span>
        </div>
        <div className="pt-2">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Submit Another Feedback
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-50 border border-teal-100">
              {ROLE_ICONS[currentRole] || <MessageSquare className="w-4 h-4 text-teal-600" />}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {title || `${ROLE_DISPLAY_NAMES[currentRole] || 'User'} Feedback & Continuous Improvement`}
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            {description || 'Share real-time suggestions, report operational bottlenecks, or rate your coordination experience.'}
          </p>
        </div>

        {/* Role Selector (when role switching allowed) */}
        {allowRoleSwitch && (
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
            <span className="text-[11px] text-slate-500 font-medium px-1">Role:</span>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value as any)}
              className="bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="patient">Patient & Attendant</option>
              <option value="hospital">Hospital Facility</option>
              <option value="bloodBank">Blood Bank</option>
              <option value="oxygenProvider">Oxygen Supplier</option>
              <option value="ambulanceProvider">Ambulance Service</option>
              <option value="doctor">Physician / Doctor</option>
              <option value="admin">Administrator / Coordinator</option>
              <option value="visitor">General Visitor</option>
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating Stars & Indicator */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Overall Experience Rating:
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-slate-300 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        isActive
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-slate-100 text-slate-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              {RATING_LABELS[hoverRating || rating]}
            </span>
          </div>
        </div>

        {/* Category & Urgency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Feedback Focus Area:
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
            >
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Severity / Urgency:
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setUrgency('low')}
                className={`py-2 px-2 rounded-xl font-bold border transition-all text-center ${
                  urgency === 'low'
                    ? 'bg-teal-50 border-teal-500 text-teal-800 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Routine Note
              </button>
              <button
                type="button"
                onClick={() => setUrgency('medium')}
                className={`py-2 px-2 rounded-xl font-bold border transition-all text-center ${
                  urgency === 'medium'
                    ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Workflow Delay
              </button>
              <button
                type="button"
                onClick={() => setUrgency('high')}
                className={`py-2 px-2 rounded-xl font-bold border transition-all text-center ${
                  urgency === 'high'
                    ? 'bg-red-50 border-red-500 text-red-800 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Critical Issue
              </button>
            </div>
          </div>
        </div>

        {/* Feedback Message */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700">
              Detailed Comments & Observations:
            </label>
            <span className="text-[11px] text-slate-400">{message.length} / 1000</span>
          </div>
          <textarea
            rows={compact ? 3 : 4}
            maxLength={1000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Please describe your feedback, specific bottlenecks, or suggestions for the ${ROLE_DISPLAY_NAMES[currentRole]} section...`}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors placeholder:text-slate-400"
          />
        </div>

        {/* User Info Fields (Optional / Pre-filled) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name or organization (optional)"
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Contact email for updates (optional)"
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Encrypted transmission & verified platform telemetry</span>
          </div>

          <button
            type="submit"
            disabled={submitting || !message.trim()}
            className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Submit {ROLE_DISPLAY_NAMES[currentRole]} Feedback</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

