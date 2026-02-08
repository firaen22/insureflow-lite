import React from 'react';
import { SignInButton } from "@clerk/clerk-react";
import { Shield, CheckCircle, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
    return (
        <div className="min-h-screen w-full flex bg-slate-50">
            {/* Left Side - Brand & Value Prop (Desktop only) */}
            <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
                {/* Background Patterns */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] rounded-full bg-blue-500 blur-[120px]"></div>
                    <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] rounded-full bg-indigo-500 blur-[100px]"></div>
                </div>

                {/* Header */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/10">
                        <Shield className="w-8 h-8 text-blue-400" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight">InsureFlow <span className="text-blue-400 font-light">Lite</span></span>
                </div>

                {/* content */}
                <div className="relative z-10 max-w-lg">
                    <h1 className="text-5xl font-bold mb-6 leading-tight">
                        Insurance Management, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                            Reimagined.
                        </span>
                    </h1>
                    <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                        The next generation CRM for modern insurance professionals.
                        Streamline your workflow, manage clients effortlessly, and leverage AI to unlock insights.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-500/20 p-1 rounded-full">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                            </div>
                            <span className="text-slate-200">AI-Powered Policy Analysis</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500/20 p-1 rounded-full">
                                <CheckCircle className="w-5 h-5 text-blue-400" />
                            </div>
                            <span className="text-slate-200">Seamless Google Sheets Sync</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-500/20 p-1 rounded-full">
                                <CheckCircle className="w-5 h-5 text-indigo-400" />
                            </div>
                            <span className="text-slate-200">Client Portfolio Insights</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 text-sm text-slate-500">
                    © {new Date().getFullYear()} InsureFlow Lite. All rights reserved.
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
                {/* Mobile Background Elements */}
                <div className="lg:hidden absolute top-0 left-0 w-full h-64 bg-slate-900 overflow-hidden">
                    <div className="absolute top-[-50%] left-[-20%] w-[400px] h-[400px] rounded-full bg-blue-600 blur-[80px] opacity-40"></div>
                </div>

                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 lg:p-12 relative z-10 border border-slate-100 animate-in fade-in slide-in-from-bottom-8 duration-700">

                    {/* Mobile Header */}
                    <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
                        <div className="bg-slate-900 p-1.5 rounded-lg">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-slate-900">InsureFlow Lite</span>
                    </div>

                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h2>
                        <p className="text-slate-500">Sign in to access your dashboard</p>
                    </div>

                    <div className="space-y-6">
                        <div className="w-full">
                            <SignInButton mode="modal">
                                <button className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white py-4 px-6 rounded-xl font-semibold transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]">
                                    <span>Sign In with Clerk</span>
                                    <ArrowRight className="w-5 h-5 opacity-80" />
                                </button>
                            </SignInButton>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-slate-400">Secure Access</span>
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="text-xs text-slate-400">
                                By signing in, you agree to our Terms of Service and Privacy Policy.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
