import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Card, Badge, Button } from '../components/ui';
import { ShieldAlert, Users, Activity, FileText } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [logs, setLogs] = useState([]);

    // Mock Data for Deviation Radar
    const radarData = [
        { subject: 'Hold Time', A: 100, B: 110, fullMark: 150 },
        { subject: 'Flight F1', A: 90, B: 130, fullMark: 150 },
        { subject: 'Flight F2', A: 80, B: 90, fullMark: 150 },
        { subject: 'Entropy', A: 95, B: 85, fullMark: 150 },
        { subject: 'Stability', A: 85, B: 85, fullMark: 150 },
        { subject: 'Typing Speed', A: 70, B: 60, fullMark: 150 },
    ];

    useEffect(() => {
        const fetchSem = async () => {
            try {
                const s = await api.get("/admin/stats");
                setStats(s.data);
                const l = await api.get("/admin/logs");
                setLogs(l.data);
            } catch (e) {
                console.error(e);
            }
        };
        fetchSem();
        const interval = setInterval(fetchSem, 5000);
        return () => clearInterval(interval);
    }, []);

    if (!stats) return <div className="p-8 text-white">Loading Security Console...</div>;

    return (
        <div className="max-w-7xl mx-auto px-6 py-8">
            <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                <ShieldAlert className="w-8 h-8 text-cyan-400" />
                Security Operations Center (SOC)
            </h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-slate-900 border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/20 rounded-lg text-indigo-400">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm uppercase">Active Sessions</p>
                            <p className="text-2xl font-bold text-white">{stats.active_sessions}</p>
                        </div>
                    </div>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${stats.threat_level === "LOW" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm uppercase">Global Threat Level</p>
                            <p className={`text-2xl font-bold ${stats.threat_level === "LOW" ? "text-emerald-400" : "text-rose-400"}`}>
                                {stats.threat_level}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-cyan-500/20 rounded-lg text-cyan-400">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm uppercase">Avg Trust Score</p>
                            <p className="text-2xl font-bold text-white">{(stats.avg_trust * 100).toFixed(1)}%</p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Audit Logs */}
                <Card className="bg-slate-900/80 border-slate-800 min-h-[400px]">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-slate-400" /> Audit Trail
                    </h2>
                    <div className="space-y-0 overflow-hidden rounded-lg border border-slate-700">
                        <table className="w-full text-sm text-left text-slate-400">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-800">
                                <tr>
                                    <th className="px-4 py-3">Time</th>
                                    <th className="px-4 py-3">User (Hash)</th>
                                    <th className="px-4 py-3">Action</th>
                                    <th className="px-4 py-3">Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.log_id} className="border-b border-slate-800 hover:bg-slate-800/50">
                                        <td className="px-4 py-3 font-mono text-xs">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-cyan-500">{log.user_hash}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant={log.action.includes("SUCCESS") ? "success" : "error"}>
                                                {log.action}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-xs">{log.metadata?.reason || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Explainability Radar */}
                <Card className="bg-slate-900/80 border-slate-800 min-h-[400px] flex flex-col">
                    <h2 className="text-lg font-bold text-white mb-4">Deviation Analysis (Last Session)</h2>
                    <p className="text-xs text-slate-400 mb-4">Comparing current session metrics (Blue) against enrollment baseline (Green).</p>

                    <div className="flex-1 w-full h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#334155" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} />
                                <Radar
                                    name="Baseline"
                                    dataKey="A"
                                    stroke="#34d399"
                                    fill="#34d399"
                                    fillOpacity={0.3}
                                />
                                <Radar
                                    name="Current"
                                    dataKey="B"
                                    stroke="#22d3ee"
                                    fill="#22d3ee"
                                    fillOpacity={0.3}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
