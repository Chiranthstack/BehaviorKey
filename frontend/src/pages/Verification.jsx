import React, { useState, useRef, useEffect } from 'react';
import { BiometricCollector } from '../lib/biometrics';
import api from '../lib/api';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { ShieldCheck, Lock, Unlock, Activity, AlertOctagon, Terminal } from 'lucide-react';

export default function Verification() {
    const [msg, setMsg] = useState("");
    const [typingStatus, setTypingStatus] = useState("Monitoring...");
    const [confidence, setConfidence] = useState(0);
    const [unlockedKey, setUnlockedKey] = useState(null);
    const collector = useRef(new BiometricCollector());
    const [secretData, setSecretData] = useState("LOCKED CONTENT - ENCRYPTED");

    // Activity Log
    const [logs, setLogs] = useState([]);

    const addLog = (text, type = 'info') => {
        setLogs(prev => [{ time: new Date().toLocaleTimeString(), text, type }, ...prev].slice(0, 10));
    };

    useEffect(() => {
        // Continuous Auth Loop
        collector.current.start();
        addLog("Biometric Collector Started", "info");

        const interval = setInterval(async () => {
            const events = collector.current.getEvents();
            if (events.length < 3) return; // Need minimal data

            // Batch and clear
            collector.current.reset();

            const userId = localStorage.getItem("user_id");
            if (!userId) {
                addLog("No User ID found. Please Enroll first.", "error");
                return;
            }

            try {
                // Add Timestamp for Replay Protection (Seconds)
                const requestTs = Date.now() / 1000;

                const res = await api.post("/verify", {
                    user_id: userId,
                    events: events,
                    request_ts: requestTs
                });

                const conf = res.data.confidence;
                setConfidence(conf);

                if (res.data.authenticated) {
                    setUnlockedKey(res.data.key);
                    setTypingStatus("VERIFIED");
                    setSecretData(`DECRYPTED: ${res.data.key.substring(0, 8)}...`);
                    addLog(`Auth Success (Score: ${(conf * 100).toFixed(0)}%)`, "success");
                } else {
                    setUnlockedKey(null);
                    setTypingStatus("SUSPICIOUS");
                    setSecretData("LOCKED CONTENT - ENCRYPTED");
                    addLog(`Auth Failed (Score: ${(conf * 100).toFixed(0)}%)`, "warning");
                }
            } catch (err) {
                console.error(err);
                if (err.response && err.response.status === 401) {
                    addLog("Security Alert: Replay Detected!", "error");
                } else {
                    addLog("Server Error / Network Issue", "error");
                }
            }

        }, 4000); // Analysis Interval

        return () => {
            clearInterval(interval);
            collector.current.stop();
        }
    }, []);

    // Helper for Gauge Color
    const getGaugeColor = (score) => {
        if (score > 0.8) return "text-emerald-500";
        if (score > 0.5) return "text-amber-500";
        return "text-rose-500";
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Secure Workspace</h1>
                    <p className="text-slate-400">Continuous Authentication Active</p>
                </div>
                <div className="flex gap-2">
                    <Badge variant={unlockedKey ? "success" : "error"} className="px-4 py-1.5 text-sm">
                        {unlockedKey ? <><ShieldCheck className="w-4 h-4 mr-2" /> SESSION SECURE</> : <><AlertOctagon className="w-4 h-4 mr-2" /> SESSION LOCKED</>}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Workspace Simulation */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <div className="flex justify-between items-center mb-4 border-b border-slate-700/50 pb-4">
                            <h2 className="text-lg font-semibold text-white flex items-center">
                                <Terminal className="w-5 h-5 mr-2 text-cyan-400" />
                                Work Simulation
                            </h2>
                            <span className="text-xs text-slate-500">Typing patterns are analyzed in real-time</span>
                        </div>
                        <textarea
                            className="w-full h-48 bg-slate-900/50 border border-slate-700 rounded-lg p-4 font-mono text-slate-300 placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all resize-none"
                            placeholder="Start typing your report, email, or code here..."
                            onChange={(e) => setMsg(e.target.value)}
                            value={msg}
                        />
                    </Card>

                    <Card className="relative overflow-hidden">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-white flex items-center">
                                <Lock className="w-5 h-5 mr-2 text-purple-400" />
                                Encrypted Vault
                            </h2>
                        </div>

                        <div className={`p-6 rounded-lg font-mono text-sm border transition-all duration-500 ${unlockedKey
                                ? "bg-emerald-900/10 border-emerald-500/30 text-emerald-400"
                                : "bg-slate-900 border-slate-800 text-slate-600 blur-[2px]"
                            }`}>
                            {unlockedKey ? (
                                <div className="break-all opacity-100 transition-opacity">
                                    <h3 className="text-xs text-emerald-500 uppercase mb-2 font-bold">Decryption Key Active</h3>
                                    {unlockedKey}
                                </div>
                            ) : (
                                "283749283749283749283749827349827349872349872349872349"
                            )}
                        </div>

                        {!unlockedKey && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                <Lock className="w-12 h-12 text-slate-700 mb-2" />
                                <span className="text-slate-500 font-bold tracking-widest">ACCESS DENIED</span>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right: Security Console */}
                <div className="space-y-6">
                    {/* Live Trust Gauge */}
                    <Card className="text-center pb-8">
                        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-6">Live Trust Score</h3>

                        <div className="relative w-48 h-24 mx-auto overflow-hidden">
                            {/* Gauge Background */}
                            <div className="absolute top-0 left-0 w-full h-full bg-slate-800 rounded-t-full"></div>
                            {/* Gauge Fill */}
                            <div
                                className={`absolute top-0 left-0 w-full h-full rounded-t-full origin-bottom transition-transform duration-1000 ease-out ${confidence > 0.6 ? "bg-gradient-to-t from-emerald-500 to-cyan-400" : "bg-gradient-to-t from-rose-600 to-orange-500"
                                    }`}
                                style={{ transform: `rotate(${(confidence * 180) - 180}deg)` }}
                            ></div>
                            {/* Inner Cover */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-slate-900 rounded-t-full flex items-end justify-center pb-2">
                                <span className={`text-3xl font-bold ${getGaugeColor(confidence)}`}>
                                    {(confidence * 100).toFixed(0)}%
                                </span>
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-slate-400">
                            Threshold: <span className="text-white">60%</span>
                        </p>
                    </Card>

                    {/* Activity Log */}
                    <Card className="h-[300px] flex flex-col">
                        <div className="flex items-center gap-2 mb-4 border-b border-slate-700/50 pb-2">
                            <Activity className="w-4 h-4 text-cyan-400" />
                            <h3 className="text-sm font-medium text-white">Security Event Log</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                            {logs.map((log, i) => (
                                <div key={i} className="flex gap-3 text-xs border-l-2 border-slate-700 pl-3 py-1">
                                    <span className="text-slate-500 whitespace-nowrap">{log.time}</span>
                                    <span className={`${log.type === 'success' ? 'text-emerald-400' :
                                            log.type === 'error' ? 'text-rose-400' :
                                                log.type === 'warning' ? 'text-amber-400' : 'text-slate-300'
                                        }`}>
                                        {log.text}
                                    </span>
                                </div>
                            ))}
                            {logs.length === 0 && <span className="text-slate-600 italic text-xs">Waiting for events...</span>}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
