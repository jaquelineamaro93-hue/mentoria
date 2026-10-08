import { somaSocialImage } from '@/lib/soma-social-image';
export const runtime = 'nodejs';
export const alt = 'SOMA Mentoria, LinkedIn, currículo e Gupy com os mascotes Lume, Norte, Brasa e Íris';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function Image() { return somaSocialImage('planos'); }
