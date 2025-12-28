import React, { useState, useRef, useEffect } from 'react';
import { BiometricCollector } from '../lib/biometrics';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Keyboard, Lock, CheckCircle2, AlertTriangle, Fingerprint, RefreshCcw } from 'lucide-react';

const PHRASES = [
    "the quick brown fox jumps over the lazy dog",
    "pack my box with five dozen liquor jugs",
    "sphinx of black quartz judge my vow",
    "behavioral biometrics keys your identity",
    "machine learning secures the digital world",
    "security is not a product but a process",
    "cryptography ensures trust in the digital age"
];

const REQUIRED_SAMPLES = 5;

export default function Enrollment() {
    const [samples, setSamples] = useState([]);
    const [targetText, setTargetText] = useState(PHRASES[0]);
    const [currentInput, setCurrentInput] = useState("");
    const [status, setStatus] = useState("idle"); // idle, recording, submitting, success, error
    const [submissionMsg, setSubmissionMsg] = useState("");
    const [progress, setProgress] = useState(0);
    const collector = useRef(new BiometricCollector());
    const navigate = useNavigate();

    useEffect(() => {
        // Randomize initial phrase
        setTargetText(PHRASES[Math.floor(Math.random() * PHRASES.length)]);
    }, []);

    useEffect(() => {
        // Calculate progress based on samples collected relative to required
        setProgress((samples.length / REQUIRED_SAMPLES) * 100);
    }, [samples]);

    const handleFocus = () => {
        collector.current.start();
    };

    const handleBlur = () => {
        // Could stop collection here if we strictly want only input focused events
    };

    const handleChangePhrase = () => {
        if (samples.length > 0) {
            if (!window.confirm("Changing the phrase will reset your current progress. Continue?")) {
                return;
            }
        }
        const newPhrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
        setTargetText(newPhrase);
        setSamples([]);
        setCurrentInput("");
        setStatus("idle");
        collector.current.reset();
    };

    const handleSubmitSample = (e) => {
        e.preventDefault();

        if (currentInput.toLowerCase() !== targetText.toLowerCase()) {
            setSubmissionMsg("Text mismatch. Please key it in exactly as shown.");
            setStatus("error");
            setTimeout(() => {
                setSubmissionMsg("");
                setStatus("idle");
            }, 3000);

            // Optional: don't clear input so they can fix it? 
            // Better to clear for security/consistency in typing flow
            setCurrentInput("");
            collector.current.reset();
            return;
        }

        setStatus("success_sample");
        setSubmissionMsg("Sample recorded successfully!");

        const events = collector.current.getEvents();
        const newSamples = [...samples, events];
        setSamples(newSamples);
        setCurrentInput("");
        collector.current.reset();

        if (newSamples.length >= REQUIRED_SAMPLES) {
            setStatus("ready_to_submit");
            setSubmissionMsg("Sufficient data collected. Ready to finalize enrollment.");
        } else {
            // Reset status back to idle after a moment
            setTimeout(() => {
                setStatus("idle");
                setSubmissionMsg("");
            }, 1500);
        }
    };

    const finishEnrollment = async () => {
        setStatus("submitting");
        const userId = "user_" + Math.floor(Math.random() * 10000);

        try {
            const payload = {
                user_id: userId,
                samples: samples
            };

            const res = await api.post("/enroll", payload);
            localStorage.setItem("user_id", userId);
            localStorage.setItem("user_key", res.data.key);

            setStatus("success");
            setSubmissionMsg("Identity Model Trained & Key Generated. Redirecting...");
            setTimeout(() => {
                navigate("/verify");
            }, 2000);
        } catch (err) {
            console.error(err);
            setStatus("error");
            setSubmissionMsg("Server error during enrollment. Ensure backend is running.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="text-center mb-10">
                <Badge variant="info" className="mb-4">Step 1 of 2: Profile Creation</Badge>
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-4">
                    Biometric Enrollment
                </h1>
                <p className="text-slate-400 max-w-xl mx-auto">
                    We need to learn your unique typing rhythm. Please type the phrase below {REQUIRED_SAMPLES} times to generate your cryptographic identity.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Visualizer / status column */}
                <div className="md:col-span-1 space-y-4">
                    <Card className="h-full flex flex-col justify-center items-center text-center p-6 bg-slate-800/50">
                        <div className="w-24 h-24 mb-4 rounded-full bg-cyan-900/30 flex items-center justify-center relative">
                            <Fingerprint className={`w-12 h-12 ${status === 'recording' || currentInput.length > 0 ? 'text-cyan-400 animate-pulse' : 'text-slate-600'}`} />
                            <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                            <div
                                className="absolute inset-0 border-4 border-cyan-500 rounded-full transition-all duration-500"
                                style={{
                                    clipPath: `inset(0 0 ${100 - progress}% 0)`
                                }}
                            ></div>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">Progress</h3>
                        <p className="text-slate-400 text-sm mb-4">
                            {samples.length} / {REQUIRED_SAMPLES} Samples
                        </p>
                        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </Card>
                </div>

                {/* Input Area */}
                <div className="md:col-span-2">
                    <Card className="relative overflow-hidden group">
                        {/* Status Overlay */}
                        {status === 'submitting' && (
                            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4"></div>
                                <p className="text-cyan-400 animate-pulse">Training Neural Network...</p>
                            </div>
                        )}

                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-slate-500 text-sm font-medium uppercase tracking-wider">
                                    Target Phrase
                                </label>
                                <button
                                    onClick={handleChangePhrase}
                                    className="text-slate-500 hover:text-cyan-400 transition-colors p-1"
                                    title="Change Phrase"
                                >
                                    <RefreshCcw className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4 font-mono text-lg text-cyan-100 select-none text-center tracking-wide relative group-hover:border-slate-700 transition-colors">
                                {targetText}
                            </div>
                        </div>

                        <form onSubmit={handleSubmitSample}>
                            <div className="relative">
                                <input
                                    type="text"
                                    className={`w-full bg-slate-900/50 border-2 rounded-xl p-4 text-lg font-mono text-white placeholder-slate-600 focus:outline-none transition-all duration-300 ${status === 'error'
                                            ? 'border-rose-500/50 focus:border-rose-500 focus:shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                                            : status === 'success_sample'
                                                ? 'border-emerald-500/50 focus:border-emerald-500'
                                                : 'border-slate-700 focus:border-cyan-500 focus:shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                                        }`}
                                    value={currentInput}
                                    onChange={(e) => setCurrentInput(e.target.value)}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                    placeholder="Type the phrase above..."
                                    disabled={status === "submitting" || status === "success" || status === "ready_to_submit"}
                                    autoFocus
                                    autoComplete="off"
                                />
                                <Keyboard className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 pointer-events-none" />
                            </div>

                            {/* Validation Message */}
                            <div className="h-8 mt-2 flex items-center justify-center">
                                {status === 'error' && (
                                    <span className="flex items-center text-rose-400 text-sm animate-shake">
                                        <AlertTriangle className="w-4 h-4 mr-1.5" />
                                        {submissionMsg}
                                    </span>
                                )}
                                {(status === 'success_sample' || status === 'ready_to_submit') && (
                                    <span className="flex items-center text-emerald-400 text-sm animate-fade-in">
                                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                        {submissionMsg}
                                    </span>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="mt-4 flex justify-end">
                                {status === "ready_to_submit" ? (
                                    <Button
                                        type="button"
                                        onClick={finishEnrollment}
                                        variant="primary"
                                        size="lg"
                                        className="w-full"
                                    >
                                        <Lock className="w-4 h-4 mr-2" />
                                        Complete Enrollment
                                    </Button>
                                ) : (
                                    <div className="flex justify-between w-full items-center">
                                        <p className="text-xs text-slate-500">
                                            <span className="text-cyan-500 font-bold">Tip:</span> Maintain your natural typing speed.
                                        </p>
                                        <Button
                                            type="submit"
                                            disabled={currentInput.length === 0}
                                            variant="secondary"
                                            size="sm"
                                        >
                                            Next Sample
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}
