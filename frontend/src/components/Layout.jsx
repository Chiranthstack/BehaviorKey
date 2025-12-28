import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Lock, Activity, Menu, X, Github } from 'lucide-react';
import { useState } from 'react';
import Button from './ui/Button';

const Layout = ({ children }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Enrollment', path: '/enrollment' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <div className="min-h-screen flex flex-col font-sans text-slate-300">
            {/* Navbar UI */}
            <nav className="fixed w-full z-50 transition-all duration-300 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/'}>
                            <div className="relative">
                                <div className="absolute inset-0 bg-cyan-500 blur-lg opacity-20 rounded-full"></div>
                                <ShieldCheck className="w-8 h-8 text-cyan-400 relative z-10" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                BioAuth<span className="text-cyan-400">.ai</span>
                            </span>
                        </div>

                        {/* Desktop Nav */}
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.name}
                                        to={link.path}
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive(link.path)
                                                ? 'text-cyan-400 bg-cyan-500/10'
                                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* CTA Button */}
                        <div className="hidden md:block">
                            <Button size="sm" variant="outline" className="gap-2">
                                <Github className="w-4 h-4" />
                                <span>Source</span>
                            </Button>
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-white/5 focus:outline-none"
                            >
                                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden glass-panel border-t border-white/5">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`block px-3 py-2 rounded-md text-base font-medium ${isActive(link.path)
                                            ? 'text-cyan-400 bg-cyan-500/10'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </nav>

            {/* Main Content */}
            <main className="flex-grow pt-20">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 bg-slate-900/50 backdrop-blur-sm mt-auto">
                <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-slate-500 text-sm">
                            © 2025 Behavioral Biometrics Project. All rights reserved.
                        </p>
                        <div className="flex space-x-6 text-slate-500">
                            <span className="flex items-center gap-1 text-xs"><Lock className="w-3 h-3" /> Encrypted</span>
                            <span className="flex items-center gap-1 text-xs"><Activity className="w-3 h-3" /> Continuous Auth</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
