'use client';

import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
  const whatsappNumber = '5511986067420';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Olá! Gostaria de saber mais sobre a mentoria SOMA.`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 animate-bounce"
      title="Enviar mensagem via WhatsApp"
      aria-label="Chat com WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
    </a>
  );
}
