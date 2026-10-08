import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const mascotes = [
  { name: 'Lume', color: '#E9B95F', dark: '#563D20' },
  { name: 'Norte', color: '#E79574', dark: '#6F3C35' },
  { name: 'Brasa', color: '#8AC6B1', dark: '#28594B' },
  { name: 'Íris', color: '#B9A3DF', dark: '#51406F' },
];

// Personagens baseados nos mascotes oficiais já usados no Meu Passaporte.
function Mascote({ index }: { index: number }) {
  const c = mascotes[index];
  return (
    <svg width="142" height="142" viewBox="0 0 200 200">
      <ellipse cx="100" cy="181" rx="52" ry="8" fill={c.dark} opacity=".12"/>
      {index === 3 ? (
        <>
          <path d="M89 110Q15 24 40 124Q58 151 94 140M110 108Q172 17 162 124Q148 148 109 140" fill={c.color}/>
          <ellipse cx="100" cy="131" rx="32" ry="44" fill={c.dark}/>
          <circle cx="102" cy="86" r="30" fill={c.color}/>
          <path d="M128 79L184 72L130 91" fill={c.dark}/>
          <path d="M91 163L71 184L111 174" fill={c.color}/>
        </>
      ) : (
        <>
          {index === 1 && <path d="M127 153Q188 164 172 93Q151 109 141 140" fill={c.color}/>}
          <ellipse cx="100" cy="132" rx="49" ry="45" fill={c.dark}/>
          {index !== 2 ? <path d="M48 86L49 26L82 54L119 54L150 26L151 87" fill={c.color}/> : <><circle cx="61" cy="63" r="18" fill={c.dark}/><circle cx="139" cy="63" r="18" fill={c.dark}/></>}
          <rect x="45" y="53" width="110" height="86" rx={index === 2 ? 35 : 43} fill={c.color}/>
          {index === 0 && <><circle cx="77" cy="91" r="25" fill="#FFF5DD"/><circle cx="122" cy="91" r="25" fill="#FFF5DD"/></>}
          {index === 1 && <path d="M49 96Q74 116 100 131Q127 112 151 96L123 133L77 133Z" fill="#FFF5DD"/>}
          {index === 2 && <ellipse cx="100" cy="112" rx="37" ry="21" fill="#CFE9DD"/>}
          <path d="M63 156L80 167M120 167L138 156" stroke={c.color} strokeWidth="13" strokeLinecap="round"/>
        </>
      )}
      <circle cx={index === 3 ? 110 : 78} cy={index === 3 ? 82 : 91} r="5" fill={c.dark}/>
      {index !== 3 && <><circle cx="122" cy="91" r="5" fill={c.dark}/><path d="M94 108Q100 115 107 108" fill="none" stroke={c.dark} strokeWidth="3" strokeLinecap="round"/></>}
      <path d="M96 139L100 151L111 153L102 161L104 173L93 167L83 172L85 160L77 152L89 151Z" fill="#FFE5A0"/>
    </svg>
  );
}

export function GET() {
  return new ImageResponse(
    <div style={{ width: 1200, height: 630, display: 'flex', flexDirection: 'column', backgroundColor: '#F8F2E9', color: '#14362D', fontFamily: 'sans-serif', padding: '43px 55px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <span style={{ fontSize: 46, fontWeight: 800, letterSpacing: -2 }}>SOMA</span>
          <span style={{ fontSize: 20, letterSpacing: 4 }}>MENTORIA</span>
        </div>
        <div style={{ display: 'flex', borderRadius: 30, backgroundColor: '#E7F0E8', padding: '11px 20px', fontSize: 19, color: '#28594B' }}>Sua carreira em movimento</div>
      </div>
      <div style={{ display: 'flex', marginTop: 32, alignItems: 'center', gap: 30 }}>
        <div style={{ display: 'flex', flexDirection: 'column', width: 690 }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: '#D45520' }}>NOVIDADES SOMA</span>
          <span style={{ fontSize: 55, lineHeight: 1.08, fontWeight: 800, letterSpacing: -2, marginTop: 12 }}>Novas ferramentas para impulsionar sua jornada</span>
          <span style={{ fontSize: 25, color: '#4A675C', marginTop: 20 }}>LinkedIn, currículo, Gupy, Percepção 360 e muito mais</span>
        </div>
        <div style={{ display: 'flex', width: 360, height: 312, flexWrap: 'wrap', gap: 12 }}>
          {mascotes.map((c, index) => (
            <div key={c.name} style={{ width: 172, height: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 23, backgroundColor: '#FFFFFF', border: '2px solid #E7E8DB' }}>
              <Mascote index={index}/>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', marginTop: 'auto', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#183F37', borderRadius: 24, padding: '21px 26px', color: '#FFFFFF' }}>
        <span style={{ fontSize: 23, fontWeight: 700 }}>Primeiros Passos  •  Meu Passaporte  •  Percepção 360</span>
        <span style={{ fontSize: 19, color: '#FFCB9C' }}>somamentoria.com/planos</span>
      </div>
    </div>,
    { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300', 'Content-Disposition': 'inline; filename="soma-planos.png"' } }
  );
}
