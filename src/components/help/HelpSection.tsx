import React, { useState } from 'react';
import {
  HelpCircle,
  Search,
  User,
  Building2,
  Droplet,
  Wind,
  Truck,
  Stethoscope,
  Shield,
  Video,
  Play,
  PhoneCall,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BookOpen,
  LifeBuoy,
  Activity,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import { FeedbackForm } from '../common/FeedbackForm';

interface HelpSectionProps {
  onOpenPatientTutorial?: () => void;
  onStartEmergency?: () => void;
  isModal?: boolean;
  onClose?: () => void;
}

type UserCategory =
  | 'all'
  | 'patient'
  | 'hospital'
  | 'bloodBank'
  | 'oxygen'
  | 'ambulance'
  | 'doctor'
  | 'admin';

interface GuideItem {
  id: string;
  role: UserCategory;
  roleLabel: string;
  title: string;
  summary: string;
  steps: string[];
  tips: string[];
  icon: React.ReactNode;
  color: string;
}

const GUIDES: GuideItem[] = [
  {
    id: 'patient-guide',
    role: 'patient',
    roleLabel: 'Patients & Family Attendants',
    title: 'Emergency Resource Requisition & Live Tracking',
    summary:
      'Learn how to request hospital beds, ICU units, blood, oxygen, and ambulances in one consolidated step.',
    steps: [
      'Click "Emergency Resource Requisition" on the homepage or header.',
      'Select any combination of resources needed: Hospital Beds, ICU, Blood Bank (specify blood group), Oxygen (cylinders/concentrator), and Ambulance (ALS or BLS).',
      'Enter the incident address and triage urgency level (Immediate P1, Emergency P2, or Urgent P3).',
      'Fill in patient details (or select from linked family members) and submit the emergency request.',
      'Monitor the Live Telemetry screen to watch hospital acceptance and track ambulance dispatch in real time.'
    ],
    tips: [
      'In life-threatening cardiac or trauma cases, always dial 108 or 112 alongside CareBridge coordination.',
      'Attendants can link family patient profiles in advance under Attendant settings for one-click emergency intake.',
      'Driver and hospital phone numbers are displayed with direct one-tap calling once accepted.'
    ],
    icon: <User className="w-5 h-5" />,
    color: 'teal'
  },
  {
    id: 'hospital-guide',
    role: 'hospital',
    roleLabel: 'Hospitals & Medical Facilities',
    title: 'Bed Inventory & Triage Case Reception',
    summary:
      'Keep your emergency ward occupancy up-to-date and review incoming patient requisitions with instant reservation locks.',
    steps: [
      'Log in to the Hospital Dashboard with verified facility credentials.',
      'Keep General Bed, ICU Bed, and Ventilator counts synchronized via the Live Inventory panel.',
      'Review incoming emergency cases appearing on your live feed with triage priority and patient clinical summary.',
      'Click "Accept Case" to lock in the requested bed/ICU quota or "Refer Out" if your facility is at full capacity.',
      'View attending physician notes and coordinate receiving dock preparation before the ambulance arrives.'
    ],
    tips: [
      'Updating your bed counts regularly ensures patients in critical golden hours are routed directly without delays.',
      'You can filter incoming cases by urgency level (Immediate, Emergency, Urgent) to prioritize ICU allocations.'
    ],
    icon: <Building2 className="w-5 h-5" />,
    color: 'blue'
  },
  {
    id: 'blood-bank-guide',
    role: 'bloodBank',
    roleLabel: 'Blood Banks & Transfusion Centers',
    title: 'Blood Stock Management & Urgent Requisition',
    summary:
      'Manage units for all 8 blood groups and process emergency transfusion requisitions with automatic reservation locks.',
    steps: [
      'Access your Blood Bank Portal to view inventory counts across A+, A-, B+, B-, AB+, AB-, O+, and O-.',
      'When an emergency request arrives, review the patient condition, required units, and hospital destination.',
      'Confirm unit reservation to temporarily decrement stock and notify the courier/attendant.',
      'Mark units as "Dispatched" once handed over to the authorized medical transport team.'
    ],
    tips: [
      'Keep safety buffer alerts enabled for rare negative blood types (O-, AB-).',
      'Attendants must present the authenticated CareBridge Case ID when picking up reserved blood units.'
    ],
    icon: <Droplet className="w-5 h-5" />,
    color: 'rose'
  },
  {
    id: 'oxygen-guide',
    role: 'oxygen',
    roleLabel: 'Oxygen Suppliers & Refill Depots',
    title: 'Medical Oxygen Cylinders & Concentrator Logistics',
    summary:
      'Coordinate pressurized medical oxygen cylinders and electric concentrator delivery for emergency home care and clinics.',
    steps: [
      'Update current stock for Type-B, Type-D cylinders and 5L/10L electric concentrators.',
      'Inspect incoming oxygen requests, patient delivery addresses, and required flow rates.',
      'Accept requisitions and choose between "Facility Pickup" or "Dispatch Delivery Fleet".',
      'Update status to "En Route" with driver contact details for recipient tracking.'
    ],
    tips: [
      'Ensure all dispatched cylinders have valid hydrostatic test dates and sterilized regulatory seals.',
      'Provide recipient attendants with standard oxygen safety guidelines upon delivery.'
    ],
    icon: <Wind className="w-5 h-5" />,
    color: 'sky'
  },
  {
    id: 'ambulance-guide',
    role: 'ambulance',
    roleLabel: 'Ambulance Operators & Paramedic Fleets',
    title: 'Fleet Deployment & 7-Step Telemetry Stepper',
    summary:
      'Manage ALS & BLS vehicles, accept emergency dispatch calls, and stream real-time progression to patients and hospitals.',
    steps: [
      'Register your active fleet under ALS (Advanced Life Support) or BLS (Basic Life Support) categories.',
      'Accept incoming emergency dispatch requests routed based on proximity to the incident location.',
      'Advance your telemetry status as you progress: Dispatched → En Route → Arrived at Incident → Patient Onboard → En Route to Hospital → Delivered.',
      'Keep driver contact numbers updated so anxious attendants can establish direct contact.'
    ],
    tips: [
      'ALS vehicles must have operational defibrillators, portable ventilators, and ACLS-certified paramedics onboard.',
      'Use the CareBridge driver mobile interface to send automated arrival alerts to the receiving hospital.'
    ],
    icon: <Truck className="w-5 h-5" />,
    color: 'amber'
  },
  {
    id: 'doctor-guide',
    role: 'doctor',
    roleLabel: 'Attending Physicians & Triage Officers',
    title: 'Pre-Admission Clinical Triage & Electronic Charting',
    summary:
      'Review incoming trauma cases, examine vital signs, and provide early clinical directives before physical arrival.',
    steps: [
      'Log in to the Doctor / Clinical Portal linked to your hospital affiliation.',
      'Review incoming emergency cases assigned to your medical facility.',
      'Inspect patient age, reported symptoms, triage priority, and pre-existing medical conditions.',
      'Attach clinical notes, triage orders (e.g., "Prepare Crash Cart", "Stat CT Scan"), and assign emergency team members.',
      'Mark case as "Admitted" upon physical handover from the ambulance crew.'
    ],
    tips: [
      'Pre-admission orders reduce hospital door-to-treatment time by up to 14 minutes in acute myocardial or stroke cases.',
      'Attendants can review physician guidance directly on their tracking screen while en route.'
    ],
    icon: <Stethoscope className="w-5 h-5" />,
    color: 'emerald'
  },
  {
    id: 'admin-guide',
    role: 'admin',
    roleLabel: 'Central Coordinators & System Administrators',
    title: 'Platform Governance, Provider Verification & Audit Logs',
    summary:
      'Verify hospital credentials, supervise regional emergency resource distribution, and maintain audit logs.',
    steps: [
      'Review newly registered healthcare facilities and verify regulatory licenses before activating accounts.',
      'Monitor city-wide and regional capacity heatmaps across hospitals, blood banks, and oxygen depots.',
      'Inspect immutable audit logs for emergency requests and status transitions.',
      'Intervene in unfulfilled or stalled emergency cases by re-routing requisitions to alternative facilities.'
    ],
    tips: [
      'All case updates and provider actions are protected by strict Cloud Firestore security rules with user UID verification.',
      'Admin coordinators can trigger regional emergency broadcast alerts during mass casualty incidents.'
    ],
    icon: <Shield className="w-5 h-5" />,
    color: 'purple'
  }
];

interface FAQItem {
  question: string;
  answer: string;
  roles: UserCategory[];
}

const FAQS: FAQItem[] = [
  {
    question: 'How do patients select multiple emergency resources simultaneously?',
    answer:
      'On the Emergency Resource Selection screen, simply click each resource card you require (e.g. Hospital Beds + Blood Bank + Ambulance). Selected cards illuminate in teal with a checkmark. You can then configure details for each before submitting a single unified emergency requisition.',
    roles: ['patient']
  },
  {
    question: 'What is the difference between ALS and BLS ambulances?',
    answer:
      'ALS (Advanced Life Support) ambulances carry paramedics trained in advanced cardiac life support, plus medical hardware like ECG monitors, defibrillators, IV medications, and ventilators. BLS (Basic Life Support) is ideal for non-critical, stable patient transfers requiring basic oxygen and stretcher support.',
    roles: ['patient', 'ambulance']
  },
  {
    question: 'How are hospital bed counts kept accurate and up to date?',
    answer:
      'Verified hospitals update their real-time ICU and ward counts directly from their dashboard. CareBridge marks facilities with live timestamps so patients and attendants can see when counts were last synchronized.',
    roles: ['hospital', 'patient', 'admin']
  },
  {
    question: 'Can attendants manage multiple family members under one account?',
    answer:
      'Yes. Attendants can link multiple patients (e.g. parents, children, spouse) along with their blood groups, emergency contacts, and medical histories. During an emergency, selecting a linked profile auto-fills the entire intake form in seconds.',
    roles: ['patient']
  },
  {
    question: 'How do healthcare facilities get verified on CareBridge?',
    answer:
      'Healthcare organizations register with their official license and facility credentials. Central Coordinators verify the facility credentials within 2 hours before granting active dispatch privileges.',
    roles: ['hospital', 'bloodBank', 'oxygen', 'ambulance', 'admin']
  },
  {
    question: 'What happens if a hospital or provider cannot accept my emergency case?',
    answer:
      'If a provider is unable to accept due to sudden bed saturation, CareBridge immediately alerts the attendant and facilitates instant 1-click re-routing to the next closest verified facility in the regional network.',
    roles: ['patient', 'hospital', 'admin']
  }
];

export const HelpSection: React.FC<HelpSectionProps> = ({
  onOpenPatientTutorial,
  onStartEmergency,
  isModal = false,
  onClose
}) => {
  const [selectedCategory, setSelectedCategory] = useState<UserCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGuideId, setExpandedGuideId] = useState<string | null>('patient-guide');
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  const filteredGuides = GUIDES.filter((guide) => {
    const matchesCategory = selectedCategory === 'all' || guide.role === selectedCategory;
    const matchesSearch =
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.roleLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.steps.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCategory =
      selectedCategory === 'all' || faq.roles.includes(selectedCategory);
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories: { id: UserCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All User Roles', icon: <LifeBuoy className="w-3.5 h-3.5" /> },
    { id: 'patient', label: 'Patients & Attendants', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'hospital', label: 'Hospitals & ICU', icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: 'bloodBank', label: 'Blood Banks', icon: <Droplet className="w-3.5 h-3.5" /> },
    { id: 'oxygen', label: 'Oxygen Depots', icon: <Wind className="w-3.5 h-3.5" /> },
    { id: 'ambulance', label: 'Ambulance Fleets', icon: <Truck className="w-3.5 h-3.5" /> },
    { id: 'doctor', label: 'Doctors & Triage', icon: <Stethoscope className="w-3.5 h-3.5" /> },
    { id: 'admin', label: 'Administrators', icon: <Shield className="w-3.5 h-3.5" /> }
  ];

  const content = (
    <div className="space-y-8 max-w-6xl mx-auto px-4 sm:px-6">
      {/* 1. Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
          <BookOpen className="w-4 h-4 text-teal-600" />
          CareBridge Multi-User Help Center & Guides
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          How to Use CareBridge for Every Healthcare Role
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Comprehensive operational playbooks, feature selection guides, and real-time coordination protocols for patients, clinics, suppliers, and fleets.
        </p>
      </div>

      {/* 2. PROMINENT PATIENT TUTORIAL VIDEO CALLOUT BANNER */}
      <div className="bg-gradient-to-r from-teal-900 via-[#0F4C81] to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl z-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            Featured Patient Video Guide
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Watch the Step-by-Step Patient Video Tutorial
          </h3>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            See exactly how to select emergency resources, configure ICU or oxygen, pick blood groups, choose ALS/BLS ambulances, and track real-time telemetry.
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1 text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" /> 1 min 25 sec
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" /> 5 Key Chapters
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" /> Interactive Controls
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto z-10 shrink-0">
          {onOpenPatientTutorial && (
            <button
              onClick={onOpenPatientTutorial}
              className="w-full sm:w-auto px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
            >
              <Play className="w-4 h-4 fill-white" />
              Watch Video Tutorial
            </button>
          )}

          {onStartEmergency && (
            <button
              onClick={onStartEmergency}
              className="w-full sm:w-auto px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold rounded-2xl border border-white/20 backdrop-blur-xs transition-colors flex items-center justify-center gap-2"
            >
              <Activity className="w-4 h-4 text-teal-300" />
              Start Emergency Now
            </button>
          )}
        </div>
      </div>

      {/* 3. Search & Category Filter Controls */}
      <div className="space-y-4">
        {/* Search input */}
        <div className="relative max-w-md mx-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides, role tips, or FAQs (e.g. ICU, blood, ambulance)..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1.5 py-0.5"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Role User Guides List (Accordions/Cards) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-teal-600" />
            Step-by-Step User Role Playbooks
          </h3>
          <span className="text-xs text-slate-400">
            Showing {filteredGuides.length} guide{filteredGuides.length === 1 ? '' : 's'}
          </span>
        </div>

        {filteredGuides.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
            No guides found matching &ldquo;{searchQuery}&rdquo;. Try another term.
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredGuides.map((guide) => {
              const isExpanded = expandedGuideId === guide.id;
              return (
                <div
                  key={guide.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
                >
                  {/* Card Trigger Header */}
                  <div
                    onClick={() => setExpandedGuideId(isExpanded ? null : guide.id)}
                    className="p-5 flex items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                        {guide.icon}
                      </div>
                      <div className="space-y-0.5 text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                            {guide.roleLabel}
                          </span>
                          {guide.role === 'patient' && onOpenPatientTutorial && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenPatientTutorial();
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline"
                            >
                              <Video className="w-3.5 h-3.5" />
                              Watch Video
                            </button>
                          )}
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900">
                          {guide.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-1">{guide.summary}</p>
                      </div>
                    </div>

                    <div className="text-slate-400 shrink-0 mt-1 sm:mt-0">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>

                  {/* Expanded Playbook Details */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4 animate-in fade-in duration-200">
                      <p className="text-xs text-slate-600 leading-relaxed">{guide.summary}</p>

                      {/* Step-by-Step execution flow */}
                      <div className="space-y-2">
                        <div className="text-xs font-bold uppercase tracking-wider text-teal-700 font-mono">
                          Action Checklist & Protocol:
                        </div>
                        <div className="space-y-2">
                          {guide.steps.map((step, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700"
                            >
                              <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="leading-relaxed">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Important Operational Tips */}
                      <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                        <div className="font-bold flex items-center gap-1.5 text-amber-800">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          Critical Notes & Best Practices:
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px] pl-1">
                          {guide.tips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Role Specific Actions */}
                      {guide.role === 'patient' && onOpenPatientTutorial && (
                        <div className="pt-2 flex items-center gap-3">
                          <button
                            onClick={onOpenPatientTutorial}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            Launch Patient Video Tutorial
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Frequently Asked Questions (FAQ) Section */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-teal-600" />
            Frequently Asked Questions
          </h3>
          <span className="text-xs text-slate-400">
            {filteredFaqs.length} question{filteredFaqs.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="space-y-2.5">
          {filteredFaqs.map((faq, index) => {
            const isFaqOpen = expandedFaqIndex === index;
            return (
              <div
                key={index}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs"
              >
                <button
                  onClick={() => setExpandedFaqIndex(isFaqOpen ? null : index)}
                  className="w-full p-4 flex items-center justify-between gap-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    {faq.question}
                  </span>
                  <span className="text-slate-400 shrink-0">
                    {isFaqOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </button>
                {isFaqOpen && (
                  <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-2.5 animate-in fade-in duration-150">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Multi-User Feedback & Continuous Improvement Section */}
      <div className="pt-2">
        <FeedbackForm
          role={selectedCategory === 'all' ? 'patient' : (selectedCategory as any)}
          allowRoleSwitch={true}
          title="CareBridge Multi-User Role Feedback"
          description="Help our coordination command center improve services. Select your user role and submit your ratings, observations, or issue reports."
        />
      </div>

      {/* 7. Emergency Hotline Quick Reference Footer */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="space-y-1 text-center sm:text-left">
          <div className="font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
            <PhoneCall className="w-4 h-4 text-orange-400" />
            Need Immediate Emergency Dispatch?
          </div>
          <p className="text-slate-400 text-[11px]">
            Dial 108 / 112 for national ambulance services or reach our Central Coordinator desk.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-red-600/20 border border-red-500/40 text-red-300 font-mono font-bold">
            Emergency: 108 / 112
          </div>
          <div className="px-4 py-2 rounded-xl bg-teal-600/20 border border-teal-500/40 text-teal-300 font-mono font-bold">
            CareBridge: +91 800 227 3274
          </div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-slate-50 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Modal Header */}
          <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                <HelpCircle className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                CareBridge Help Center & Role Guides
              </h3>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          <div className="p-4 sm:p-6 overflow-y-auto flex-1">{content}</div>
        </div>
      </div>
    );
  }

  return (
    <section id="help" className="py-16 bg-slate-50 border-b border-slate-200">
      {content}
    </section>
  );
};

