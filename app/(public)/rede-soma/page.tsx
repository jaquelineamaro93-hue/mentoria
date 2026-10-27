import SomaNetworking from '@/components/public/SomaNetworking';
import { SomaSiteHeader, SomaSiteFooter } from '@/components/public/SomaMarketingChrome';

export default function RedeSomaPage() {
  return <div className="min-h-screen overflow-x-clip bg-[#0F1A18] text-[#EEF3F1]">
    <SomaSiteHeader active="/rede-soma" />
    <main>
      <SomaNetworking showCollage />
    </main>
    <SomaSiteFooter />
  </div>;
}
