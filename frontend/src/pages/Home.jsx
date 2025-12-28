import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Fingerprint, Key, Zap, ArrowRight, Lock } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="relative overflow-hidden">
            {/* Hero Section */}
            <div className="relative pt-20 pb-32 lg:pt-32 lg:pb-44">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-8 animate-fade-in-up">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                        </span>
                        Next-Gen Identity Verification
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
                        Identity Beyond <br />
                        <span className="text-gradient">Passwords</span> & Keys
                    </h1>

                    <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-400 mb-10">
                        Authenticate users continuously based on behavior.
                        Bind cryptographic keys to unique typing and movement patterns for zero-trust security.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button size="lg" onClick={() => navigate('/enrollment')} className="group">
                            Start Enrollment
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <Button size="lg" variant="outline">
                            Learn Architecture
                        </Button>
                    </div>
                </div>

                {/* Background decorative elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden -z-10 pointer-events-none">
                    <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px]"></div>
                    <div className="absolute top-[40%] right-[20%] w-72 h-72 bg-purple-500/20 rounded-full blur-[100px]"></div>
                </div>
            </div>

            {/* Features Grid */}
            <section className="py-20 bg-slate-900/40 border-y border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">Three Pillars of Security</h2>
                        <p className="text-slate-400">Merging Cybersecurity, Cryptography, and AI.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Shield className="w-8 h-8 text-cyan-400" />}
                            title="Cybersecurity"
                            description="Prevent session hijacking and verify identity continuously in the background without user interruption."
                        />
                        <FeatureCard
                            icon={<Key className="w-8 h-8 text-purple-400" />}
                            title="Cryptography"
                            description="Biometric-based key generation ensuring keys exist only when the legitimate user is present."
                        />
                        <FeatureCard
                            icon={<Fingerprint className="w-8 h-8 text-emerald-400" />}
                            title="AI & ML"
                            description="Advanced models learn unique keystroke dynamics and mouse movements to distinguish you from imposters."
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }) => (
    <Card className="hover:border-white/20 transition-colors duration-300">
        <div className="mb-4 p-3 bg-white/5 rounded-lg inline-block">
            {icon}
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-slate-400 leading-relaxed">
            {description}
        </p>
    </Card>
);

export default Home;
