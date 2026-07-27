'use client';

import { Bell, User, Settings } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
      <div className="flex-1">
        <h2 className="text-gray-900 font-semibold">Portal de Mentoria</h2>
      </div>

      <div className="flex items-center space-x-6">
        <button className="relative p-2 text-gray-600 hover:text-gray-900 transition">
          <Bell className="w-6 h-6" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <button className="p-2 text-gray-600 hover:text-gray-900 transition">
          <Settings className="w-6 h-6" />
        </button>

        <div className="flex items-center space-x-3 pl-6 border-l border-gray-200">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Mentorado</p>
            <p className="text-xs text-gray-600">Ativo</p>
          </div>
        </div>
      </div>
    </header>
  );
}
