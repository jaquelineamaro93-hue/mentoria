'use client';
import { MessageCircle } from 'lucide-react';
export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/5511986067420?text=Olá! Gostaria de saber mais sobre a mentoria SOMA."
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 animate-bounce"
    >
      <MessageCircle size={24} />
    </a>
  );
}
