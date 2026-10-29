'use client';
import Link from 'next/link';
import { acquisitionEvent } from '@/lib/acquisition';
export default function CampaignLink({ href, intent, label }: { href: string; intent: string; label: string }) {
  return <Link href={href} onClick={() => acquisitionEvent('campaign_start_clicked', { intent })} className="inline-flex min-h-12 items-center rounded-lg bg-[#101827] px-6 py-4 text-base font-medium text-white">{label}</Link>;
}
