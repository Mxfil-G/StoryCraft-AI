
import React from 'react';

export const Header: React.FC = () => (
  <header className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
    <div className="flex items-center gap-3">
      <div className="bg-indigo-600 p-2 rounded-lg">
        <i className="fas fa-feather-pointed text-white text-xl"></i>
      </div>
      <h1 className="text-2xl font-bold tracking-tight serif-title">StoryCraft <span className="text-indigo-400">AI</span></h1>
    </div>
    <div className="hidden md:flex items-center gap-6 text-slate-400 font-medium">
      <a href="#" className="hover:text-white transition-colors">Workspace</a>
      <a href="#" className="hover:text-white transition-colors">Gallery</a>
      <a href="#" className="hover:text-white transition-colors">Resources</a>
    </div>
  </header>
);

export const Footer: React.FC = () => (
  <footer className="p-8 text-center text-slate-500 border-t border-slate-800 mt-20">
    <p>© 2024 StoryCraft AI. Powered by Gemini.</p>
  </footer>
);
