// src/pages/LandingPage.jsx
import React from 'react';
import { ArrowRight, TrendingUp, Users, Target } from 'lucide-react';
import logo from '../assets/image1.png'; // Your logo

const LandingPage = ({ onNavigateRegister }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply blur-3xl opacity-30 animate-pulse"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 container mx-auto px-6 py-8 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <img
            src={logo}
            alt="DiceBank Logo"
            className="w-14 h-14 rounded-xl shadow-lg object-contain bg-white/10 p-2"
          />
          <span className="text-3xl font-bold tracking-tight">DiceBank</span>
        </div>
        <div className="hidden lg:flex items-center space-x-10 text-sm font-medium">
          <a href="#" className="hover:text-blue-300 transition">Home</a>
          <a href="#" className="hover:text-blue-300 transition">Services</a>
          <a href="#" className="hover:text-blue-300 transition">About Us</a>
          <a href="#" className="hover:text-blue-300 transition">FAQ's</a>
          <button
            onClick={onNavigateRegister}
            className="bg-white text-blue-900 px-7 py-3 rounded-full font-semibold hover:bg-blue-50 transition shadow-md"
          >
            Contact Us
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-6 pt-16 pb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text */}
          <div className="space-y-10">
            <div>
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                Your financial security is{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                  our priority
                </span>
                <span className="inline-block ml-3 text-5xl">Money Bag</span>
              </h1>
            </div>

            <p className="text-lg lg:text-xl text-gray-300 max-w-xl leading-relaxed">
              Secure, fast, and smart banking tailored for you. Manage your money with confidence — 
              from daily spending to long-term investments — all in one trusted platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-5">
              <button
                onClick={onNavigateRegister}
                className="group bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-10 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-xl"
              >
                Open Account
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition" />
              </button>
              <button className="text-gray-300 hover:text-white font-medium text-lg transition">
                We help your finances grow.
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-10">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-7 h-7 text-cyan-400" />
                  <span className="text-4xl font-bold">250K</span>
                  <span className="text-green-400 text-xl">Up Arrow</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">Happy Clients</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="w-7 h-7 text-cyan-400" />
                  <span className="text-4xl font-bold">20</span>
                  <span className="text-green-400 text-xl">Up Arrow</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">Years Strong</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <Target className="w-7 h-7 text-cyan-400" />
                  <span className="text-4xl font-bold">85%</span>
                  <span className="text-green-400 text-xl">Up Arrow</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">Success Rate</p>
              </div>
            </div>
          </div>

          {/* Right: Image */}
          <div className="relative flex justify-center">
            <div className="relative">
              <img
                src="/src/assets/image2.png"
                alt="Trusted banking professional"
                className="rounded-3xl shadow-2xl w-full max-w-lg object-cover border-8 border-white/10"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent rounded-3xl"></div>
            </div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;