import { useState, useRef, useEffect, type MutableRefObject } from "react";
import { createInspection } from "../features/inspections/services/inspection_services";
import { FiBarChart2, FiLogOut } from "react-icons/fi";
import { navigationUtils } from "../services/routes/constants";
import { useNavigate } from "react-router-dom";

/* ─────────────────────────────── TYPES ─────────────────────────────── */

interface WaveformVisualizerProps {
  isRecording: boolean;
  analyserRef: MutableRefObject<AnalyserNode | null>;
}

/* ─────────────────────────────── AUDIO UTILS ─────────────────────────────── */

const encodeWAV = (samples: Float32Array, sampleRate: number): Blob => {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++)
      view.setUint8(offset + i, str.charCodeAt(i));
  };

  let offset = 0;
  writeString(offset, "RIFF"); offset += 4;
  view.setUint32(offset, 36 + samples.length * 2, true); offset += 4;
  writeString(offset, "WAVE"); offset += 4;
  writeString(offset, "fmt "); offset += 4;
  view.setUint32(offset, 16, true); offset += 4;
  view.setUint16(offset, 1, true); offset += 2;
  view.setUint16(offset, 1, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, sampleRate * 2, true); offset += 4;
  view.setUint16(offset, 2, true); offset += 2;
  view.setUint16(offset, 16, true); offset += 2;
  writeString(offset, "data"); offset += 4;
  view.setUint32(offset, samples.length * 2, true);

  let index = 44;
  for (let i = 0; i < samples.length; i++, index += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(index, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: "audio/wav" });
};

const convertToWav = async (webmBlob: Blob) => {
  const arrayBuffer = await webmBlob.arrayBuffer();
  const audioCtx = new AudioContext();
  const decoded = await audioCtx.decodeAudioData(arrayBuffer);
  return encodeWAV(decoded.getChannelData(0), decoded.sampleRate);
};

/* ─────────────────────────────── WAVEFORM ─────────────────────────────── */

function WaveformVisualizer({ isRecording, analyserRef }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = "#f8f9fb";
      ctx.fillRect(0, 0, W, H);

      if (isRecording && analyserRef.current) {
        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        // Glow effect
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#003399";
        ctx.beginPath();
        ctx.strokeStyle = "#003399";
        ctx.lineWidth = 2.5;

        const sliceWidth = W / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * H) / 2;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          x += sliceWidth;
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Idle flat line
        ctx.beginPath();
        ctx.strokeStyle = "#d1d5db";
        ctx.lineWidth = 1.5;
        ctx.moveTo(0, H / 2);
        ctx.lineTo(W, H / 2);
        ctx.stroke();
      }
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [isRecording, analyserRef]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={80}
      className="w-full rounded-lg border border-gray-100"
      style={{ background: "#f8f9fb" }}
    />
  );
}

/* ─────────────────────────────── SUCCESS BANNER ─────────────────────────────── */

function SuccessBanner({ engineId, onReset }: { engineId: string; onReset: () => void }) {
  return (
    <div
      className="w-full rounded-xl p-6 flex flex-col items-center gap-4 text-center"
      style={{
        background: "linear-gradient(135deg, #f0f7ff 0%, #e8f5e9 100%)",
        border: "1.5px solid #b2dfdb",
      }}
    >
      {/* Checkmark */}
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          width: 64,
          height: 64,
          background: "linear-gradient(135deg, #003399 60%, #1565c0 100%)",
          boxShadow: "0 4px 18px rgba(0,51,153,0.18)",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path
            d="M8 16.5L13.5 22L24 11"
            stroke="white"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div>
        <p
          className="text-lg font-semibold"
          style={{ color: "#003399", fontFamily: "'DM Sans', sans-serif" }}
        >
          Inspection Uploaded Successfully
        </p>
        <p className="text-sm mt-1" style={{ color: "#546e7a" }}>
          Audio inspection for engine{" "}
          <span className="font-semibold" style={{ color: "#1a237e" }}>
            {engineId}
          </span>{" "}
          has been submitted.
        </p>
      </div>

      <div
        className="rounded-lg px-4 py-2 text-xs font-medium flex items-center gap-2"
        style={{ background: "#e8eaf6", color: "#3949ab" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        {new Date().toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>

      <button
        onClick={onReset}
        className="mt-1 px-6 py-2 rounded-lg text-sm font-semibold transition"
        style={{
          background: "#003399",
          color: "#fff",
          boxShadow: "0 2px 8px rgba(0,51,153,0.18)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#1565c0")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#003399")}
      >
        Record Another
      </button>
    </div>
  );
}

/* ─────────────────────────────── MAIN COMPONENT ─────────────────────────────── */

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function EngineRecorder() {
    const navigate = useNavigate();
  const [engineId, setEngineId] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<any>(null);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const startRecording = async () => {
    if (!engineId) return;
    chunksRef.current = [];
    setUploadStatus("idle");

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContextRef.current = new AudioContext();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    const analyser = audioContextRef.current.createAnalyser();
    source.connect(analyser);
    analyserRef.current = analyser;

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const webmBlob = new Blob(chunksRef.current, { type: "audio/webm" });
      const wavBlob = await convertToWav(webmBlob);
      await uploadInspection(wavBlob);
    };

    recorder.start();
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => setRecordingTime((p) => p + 1), 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    clearInterval(timerRef.current);
  };

  const uploadInspection = async (wavBlob: Blob) => {
    if (!engineId) return;
    setUploadStatus("uploading");
    try {
      const file = new File([wavBlob], `inspection-${Date.now()}.wav`, {
        type: "audio/wav",
      });
      await createInspection({
        vinNumber: engineId,
        workstationId: 1,
        descriptionAudio: file,
        view: "ALL",
      });
      setUploadStatus("success");
    } catch {
      setUploadStatus("error");
    }
  };

  const handleReset = () => {
    setUploadStatus("idle");
    setEngineId("");
    setRecordingTime(0);
  };
  const handleLogout = () => {
    navigationUtils.logout();
  };


  return (
    <>
      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
      `}</style>
      <header className=" sticky top-0 z-50 bg-gradient-to-r from-white via-blue-50 to-indigo-50 shadow-lg border-b-2 border-indigo-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-5">
            {/* Top Row - Title and Actions */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
              {/* Left Side - Title and Branding */}
              <div className="flex items-center gap-4">
                {/* Logo/Icon */}
                {/* <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg">
                        <span className="text-3xl">🚗</span>
                      </div> */}

                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
                    Engine Inspection
                  </h1>
                </div>
              </div>

              {/* Right Side - Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-md hover:shadow-lg"
                >
                  <FiBarChart2 className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-medium shadow-sm"
                >
                  <FiLogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      <div
        className="h-[calc(100vh-88px)] flex items-center justify-center p-6 overflow-hidden"
        style={{ background: "#f4f6fb" }}
      >

        <div
          className="w-full"
          style={{ maxWidth: 520 }}
        >
          {/* Card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "#ffffff",
              boxShadow: "0 4px 32px rgba(0,51,153,0.08), 0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            {/* Header bar */}
            <div
              className="flex items-center gap-3 px-6 py-4"
              style={{
                background: "linear-gradient(90deg, #003399 0%, #1a237e 100%)",
              }}
            >
              {/* logo area */}
              <div
                className="flex items-center justify-center rounded-lg"
                style={{
                  width: 36,
                  height: 36,
                  background: "rgba(255,255,255,0.15)",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.65)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Brown Box
                </p>
                <p className="text-sm font-semibold text-white" style={{ lineHeight: 1.2 }}>
                  Engine Inspection System
                </p>
              </div>

              {/* Recording pulse indicator */}
              {isRecording && (
                <div className="ml-auto flex items-center gap-2">
                  <span
                    className="inline-block rounded-full"
                    style={{
                      width: 8,
                      height: 8,
                      background: "#ff1744",
                      animation: "pulse 1s ease-in-out infinite",
                    }}
                  />
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "rgba(255,255,255,0.85)", fontFamily: "'DM Mono', monospace" }}
                  >
                    REC {formatTime(recordingTime)}
                  </span>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {uploadStatus === "success" ? (
                <SuccessBanner engineId={engineId} onReset={handleReset} />
              ) : (
                <>
                  {/* Engine Number Field */}
                  <div>
                    <label
                      className="block text-xs font-semibold mb-1.5"
                      style={{ color: "#546e7a", letterSpacing: "0.06em", textTransform: "uppercase" }}
                    >
                      Engine Number
                    </label>
                    <input
                      type="text"
                      value={engineId}
                      onChange={(e) => setEngineId(e.target.value)}
                      placeholder="e.g. MBLHA10AXNBB12345"
                      disabled={isRecording}
                      className="w-full rounded-lg px-4 py-2.5 text-sm transition outline-none"
                      style={{
                        border: "1.5px solid #e0e3ea",
                        color: "#1a237e",
                        background: isRecording ? "#f4f6fb" : "#ffffff",
                        fontFamily: "'DM Mono', monospace",
                        letterSpacing: "0.04em",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#003399")}
                      onBlur={(e) => (e.target.style.borderColor = "#e0e3ea")}
                    />
                  </div>

                  {/* Waveform */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "#546e7a", letterSpacing: "0.06em", textTransform: "uppercase" }}
                      >
                        Audio Signal
                      </span>
                      {isRecording && (
                        <span
                          className="text-xs font-medium"
                          style={{ color: "#003399", fontFamily: "'DM Mono', monospace" }}
                        >
                          {formatTime(recordingTime)}
                        </span>
                      )}
                    </div>
                    <WaveformVisualizer
                      isRecording={isRecording}
                      analyserRef={analyserRef}
                    />
                  </div>

                  {/* Error message */}
                  {uploadStatus === "error" && (
                    <div
                      className="rounded-lg px-4 py-3 text-sm flex items-center gap-2"
                      style={{ background: "#fff3e0", border: "1px solid #ffb74d", color: "#e65100" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      Upload failed. Please check your connection and try again.
                    </div>
                  )}

                  {/* Action Button */}
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      disabled={!engineId || uploadStatus === "uploading"}
                      className="w-full py-3 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
                      style={{
                        background: engineId ? "#003399" : "#e0e3ea",
                        color: engineId ? "#ffffff" : "#9aa3b0",
                        cursor: engineId ? "pointer" : "not-allowed",
                        boxShadow: engineId ? "0 2px 12px rgba(0,51,153,0.20)" : "none",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (engineId) e.currentTarget.style.background = "#1565c0";
                      }}
                      onMouseLeave={(e) => {
                        if (engineId) e.currentTarget.style.background = "#003399";
                      }}
                    >
                      {uploadStatus === "uploading" ? (
                        <>
                          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 12a9 9 0 11-6.219-8.56" />
                          </svg>
                          Uploading Inspection…
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="3" fill="currentColor" />
                          </svg>
                          Start Recording
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                      style={{
                        background: "#c62828",
                        color: "#ffffff",
                        boxShadow: "0 2px 12px rgba(198,40,40,0.22)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#b71c1c")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#c62828")}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="4" y="4" width="16" height="16" rx="2" />
                      </svg>
                      Stop & Submit
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {/* <div
              className="px-6 py-3 flex items-center justify-between"
              style={{ borderTop: "1px solid #f0f2f7" }}
            >
              <span className="text-xs" style={{ color: "#b0bec5" }}>
                Workstation ID: <span style={{ color: "#78909c", fontFamily: "'DM Mono', monospace" }}>WS-002</span>
              </span>
              <span className="text-xs" style={{ color: "#b0bec5" }}>
                View: <span style={{ color: "#78909c" }}>LEFT</span>
              </span>
            </div> */}
          </div>

          {/* Bottom note */}
          <p className="text-center text-xs mt-4" style={{ color: "#b0bec5" }}>
            © {new Date().getFullYear()} Brown Box — Quality Assurance Division
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.3); }
        }
      `}</style>
    </>
  );
}