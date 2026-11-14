import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Bed,
  Droplet,
  Wind,
  Truck,
  Activity,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
  ChevronRight,
  HelpCircle,
  PhoneCall
} from 'lucide-react';

interface PatientTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartEmergency?: () => void;
}

interface Chapter {
  id: number;
  title: string;
  timestamp: string;
  startTime: number; // in seconds
  duration: number; // in seconds
  description: string;
  badge: string;
}

const CHAPTERS: Chapter[] = [
  {
    id: 1,
    title: 'Starting Emergency Requisition',
    timestamp: '0:00',
    startTime: 0,
    duration: 16,
    description: 'How to trigger emergency intake from the home page and specify patient condition & urgency.',
    badge: 'Step 1'
  },
  {
    id: 2,
    title: 'Selecting Beds & ICU Units',
    timestamp: '0:16',
    startTime: 16,
    duration: 18,
    description: 'How to toggle general hospital beds or intensive care (ICU/ventilator) with verified capacity.',
    badge: 'Step 2'
  },
  {
    id: 3,
    title: 'Requesting Blood & Medical Oxygen',
    timestamp: '0:34',
    startTime: 34,
    duration: 18,
    description: 'Choosing exact blood groups (A+, B+, O+, etc.), units, and oxygen cylinders or concentrators.',
    badge: 'Step 3'
  },
  {
    id: 4,
    title: 'Ambulance Dispatch: ALS vs BLS',
    timestamp: '0:52',
    startTime: 52,
    duration: 16,
    description: 'Understanding Advanced Life Support (critical/cardiac) vs Basic Life Support (stable transit).',
    badge: 'Step 4'
  },
  {
    id: 5,
    title: 'Live Telemetry & Tracking Status',
    timestamp: '1:08',
    startTime: 68,
    duration: 17,
    description: 'Tracking hospital acceptance, real-time ambulance location, and contacting dispatch personnel.',
    badge: 'Step 5'
  }
];

const TOTAL_VIDEO_DURATION = 85; // 1 minute 25 seconds

export const PatientTutorialModal: React.FC<PatientTutorialModalProps> = ({
  isOpen,
  onClose,
  onStartEmergency
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // Auto-play timer when open
  useEffect(() => {
    if (!isOpen) {
      setCurrentTime(0);
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
  }, [isOpen]);

  useEffect(() => {
    let interval: any = null;
    if (isPlaying && isOpen) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= TOTAL_VIDEO_DURATION) {
            setIsPlaying(false);
            return TOTAL_VIDEO_DURATION;
          }
          return prev + 0.25 * playbackRate;
        });
      }, 250);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isOpen, playbackRate]);

  if (!isOpen) return null;

  // Identify current chapter
  const currentChapter =
    CHAPTERS.slice().reverse().find((c) => currentTime >= c.startTime) || CHAPTERS[0];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSeek = (newTime: number) => {
    setCurrentTime(Math.min(Math.max(newTime, 0), TOTAL_VIDEO_DURATION));
  };

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white">
        {/* Modal Top Header Bar */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Patient & Family Video Tutorial
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase tracking-wider">
                  Interactive Guide
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Master emergency resource requisition, bed reservations, and ambulance tracking
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            title="Close Tutorial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Player Display Canvas */}
        <div
          ref={videoContainerRef}
          className="relative bg-slate-950 flex flex-col aspect-video max-h-[52vh] sm:max-h-[58vh] overflow-hidden select-none"
        >
          {/* Simulated Video Stage Content */}
          <div className="relative flex-1 w-full h-full overflow-hidden flex flex-col justify-between p-4 sm:p-6">
            {/* Stage Background / Visual Mockup based on current chapter */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0B1E36] to-teal-950/40 pointer-events-none"></div>

            {/* Chapter 1 Visual Scene: Intake & Condition */}
            {currentChapter.id === 1 && (
              <div className="relative z-10 flex flex-col h-full justify-center items-center max-w-xl mx-auto text-center space-y-4 animate-in fade-in duration-300">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs font-semibold">
                  <Activity className="w-3.5 h-3.5 animate-pulse text-orange-400" />
                  Step 1: Emergency Intake
                </div>
                <h4 className="text-xl sm:text-2xl font-black text-white">
                  Click &ldquo;Emergency Resource Requisition&rdquo;
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Start without friction. Input the patient&rsquo;s current symptoms, medical notes, and set urgency triage (Immediate, Emergency, or Urgent).
                </p>
                <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 w-full shadow-lg text-left space-y-2">
                  <div className="text-[11px] uppercase tracking-wider text-teal-400 font-bold">Preview: Urgency Level</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-red-950/60 border-2 border-red-500 text-red-200 font-bold text-center">
                      Immediate (P1)
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 text-center">
                      Emergency (P2)
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 text-center">
                      Urgent (P3)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chapter 2 Visual Scene: Beds & ICU */}
            {currentChapter.id === 2 && (
              <div className="relative z-10 flex flex-col h-full justify-center items-center max-w-xl mx-auto text-center space-y-4 animate-in fade-in duration-300">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold">
                  <Bed className="w-3.5 h-3.5 text-teal-400" />
                  Step 2: Reserve Hospital & ICU Beds
                </div>
                <h4 className="text-xl sm:text-2xl font-black text-white">
                  Select Real-Time Hospital Capacity
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Tap &ldquo;Hospital Beds&rdquo; for general emergency admission, or &ldquo;ICU Facilities&rdquo; for intensive care with ventilator support.
                </p>
                <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                  <div className="p-4 rounded-2xl bg-teal-600 text-white font-bold text-center flex flex-col items-center gap-2 shadow-lg ring-2 ring-teal-400">
                    <Bed className="w-6 h-6" />
                    <span className="text-xs">Hospital Beds (Selected)</span>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">✓ Locked in</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-teal-700/80 text-white font-bold text-center flex flex-col items-center gap-2 shadow-lg ring-2 ring-teal-400">
                    <Activity className="w-6 h-6" />
                    <span className="text-xs">ICU Beds (Selected)</span>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">✓ Ventilator Tagged</span>
                  </div>
                </div>
              </div>
            )}

            {/* Chapter 3 Visual Scene: Blood & Oxygen */}
            {currentChapter.id === 3 && (
              <div className="relative z-10 flex flex-col h-full justify-center items-center max-w-xl mx-auto text-center space-y-4 animate-in fade-in duration-300">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold">
                  <Droplet className="w-3.5 h-3.5 text-rose-400" />
                  Step 3: Specify Blood Group & Oxygen
                </div>
                <h4 className="text-xl sm:text-2xl font-black text-white">
                  Multi-Resource Coordination
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Need donor blood or oxygen cylinders? Check both cards. Specify blood group (A+, B+, O+, AB+) and oxygen type (Cylinder vs 10 LPM Concentrator).
                </p>
                <div className="grid grid-cols-2 gap-3 w-full max-w-md text-xs">
                  <div className="p-3 bg-slate-900 border border-rose-500/50 rounded-xl text-left space-y-1">
                    <div className="text-rose-400 font-bold flex items-center gap-1.5">
                      <Droplet className="w-4 h-4" /> Blood Bank
                    </div>
                    <div className="text-slate-300 text-[11px]">Group: <span className="text-white font-bold">O+ Positive</span></div>
                    <div className="text-slate-300 text-[11px]">Requested: <span className="text-white font-bold">2 Units</span></div>
                  </div>
                  <div className="p-3 bg-slate-900 border border-sky-500/50 rounded-xl text-left space-y-1">
                    <div className="text-sky-400 font-bold flex items-center gap-1.5">
                      <Wind className="w-4 h-4" /> Medical Oxygen
                    </div>
                    <div className="text-slate-300 text-[11px]">Type: <span className="text-white font-bold">D-Type Cylinder</span></div>
                    <div className="text-slate-300 text-[11px]">Quantity: <span className="text-white font-bold">1 Cylinder</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* Chapter 4 Visual Scene: Ambulance ALS vs BLS */}
            {currentChapter.id === 4 && (
              <div className="relative z-10 flex flex-col h-full justify-center items-center max-w-xl mx-auto text-center space-y-4 animate-in fade-in duration-300">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                  <Truck className="w-3.5 h-3.5 text-amber-400" />
                  Step 4: Ambulance Dispatch
                </div>
                <h4 className="text-xl sm:text-2xl font-black text-white">
                  Choose the Appropriate Fleet
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  CareBridge dispatches GPS-enabled ambulances directly to your incident coordinates.
                </p>
                <div className="grid grid-cols-2 gap-3 w-full max-w-md text-left text-xs">
                  <div className="p-3 bg-amber-950/40 border-2 border-amber-500 rounded-xl space-y-1">
                    <div className="text-amber-300 font-bold">ALS (Advanced Life Support)</div>
                    <p className="text-[11px] text-slate-300">Equipped with paramedic, defibrillator, cardiac monitor & ventilator.</p>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl space-y-1">
                    <div className="text-slate-300 font-bold">BLS (Basic Life Support)</div>
                    <p className="text-[11px] text-slate-400">For non-cardiac transfers, oxygen support, and stretcher transport.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Chapter 5 Visual Scene: Real-Time Telemetry */}
            {currentChapter.id === 5 && (
              <div className="relative z-10 flex flex-col h-full justify-center items-center max-w-xl mx-auto text-center space-y-4 animate-in fade-in duration-300">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Step 5: Live Telemetry & Tracking
                </div>
                <h4 className="text-xl sm:text-2xl font-black text-white">
                  Track Allocation in Real-Time
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Once submitted, the coordination room streams live status. See provider acceptance, driver phone number, and distance.
                </p>
                <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-4 w-full max-w-md text-left space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      Live Case #CB-8492
                    </span>
                    <span className="text-emerald-400 font-mono font-bold">ACCEPTED</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-300">
                    <PhoneCall className="w-3.5 h-3.5 text-teal-400" />
                    Ambulance Driver: +91 98450 12345 (ETA: 6 mins)
                  </div>
                </div>
              </div>
            )}

            {/* Subtitles / Audio Transcript Banner */}
            <div className="relative z-20 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 text-[10px] font-bold uppercase tracking-wider font-mono">
                  {currentChapter.badge}
                </span>
                <span className="text-slate-200 line-clamp-1">{currentChapter.description}</span>
              </div>
              <span className="text-slate-400 font-mono text-[11px] shrink-0">
                {formatTime(currentTime)} / {formatTime(TOTAL_VIDEO_DURATION)}
              </span>
            </div>
          </div>

          {/* Video Control Bar */}
          <div className="bg-slate-950/95 border-t border-slate-800 px-4 py-2.5 flex flex-col gap-2 z-20">
            {/* Scrubber Bar */}
            <div className="relative w-full flex items-center group cursor-pointer" onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = clickX / rect.width;
              handleSeek(ratio * TOTAL_VIDEO_DURATION);
            }}>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-sky-400 transition-all duration-100"
                  style={{ width: `${(currentTime / TOTAL_VIDEO_DURATION) * 100}%` }}
                ></div>
              </div>
              {/* Chapter markers on timeline */}
              {CHAPTERS.map((ch) => (
                <div
                  key={ch.id}
                  title={`${ch.title} (${ch.timestamp})`}
                  className="absolute top-0 bottom-0 w-1 bg-white/40 hover:bg-white rounded-full pointer-events-none transform -translate-x-1/2"
                  style={{ left: `${(ch.startTime / TOTAL_VIDEO_DURATION) * 100}%` }}
                />
              ))}
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between text-xs text-slate-300 gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                </button>

                <button
                  onClick={() => handleSeek(currentTime - 10)}
                  className="p-1.5 hover:text-white transition-colors"
                  title="Rewind 10 seconds"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1.5 hover:text-white transition-colors"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <span className="font-mono text-[11px] text-slate-400 hidden sm:inline">
                  {formatTime(currentTime)} / {formatTime(TOTAL_VIDEO_DURATION)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Speed selector */}
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px] font-bold">
                  {[1, 1.25, 1.5].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setPlaybackRate(rate)}
                      className={`px-1.5 py-0.5 rounded ${
                        playbackRate === rate ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>

                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 hover:text-white transition-colors"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chapter Selection & Interactive Feature Guide */}
        <div className="p-4 sm:p-6 bg-slate-900/60 border-t border-slate-800 flex-1 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              Video Chapters & Key Topics
            </h4>
            <span className="text-[11px] text-teal-400 font-medium">Click any chapter to jump</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {CHAPTERS.map((ch) => {
              const isActive = currentChapter.id === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    handleSeek(ch.startTime);
                    setIsPlaying(true);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isActive
                      ? 'bg-teal-950/70 border-teal-500 shadow-md ring-1 ring-teal-400'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                    <span className={`font-bold ${isActive ? 'text-teal-400' : 'text-slate-400'}`}>
                      {ch.badge}
                    </span>
                    <span className="text-slate-400">{ch.timestamp}</span>
                  </div>
                  <h5 className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-slate-300'}`}>
                    {ch.title}
                  </h5>
                </button>
              );
            })}
          </div>

          {/* Quick Feature Checklist for Patients */}
          <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-800/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-xs font-bold text-teal-300 flex items-center justify-center sm:justify-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                Ready to initiate emergency coordination?
              </div>
              <p className="text-[11px] text-slate-300">
                You can select multiple services (Bed + Blood + Oxygen + Ambulance) together in one step.
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {onStartEmergency && (
                <button
                  onClick={() => {
                    onClose();
                    onStartEmergency();
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Activity className="w-4 h-4" />
                  Select Features Now
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

