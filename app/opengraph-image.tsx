import { somaSocialImage } from '@/lib/soma-social-image';
export const runtime = 'nodejs';
export const alt = 'SOMA Mentoria, quatro mascotes e ferramentas para sua carreira';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function Image() { return somaSocialImage('home'); }
