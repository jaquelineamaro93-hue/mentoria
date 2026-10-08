import { ImageResponse } from 'next/og';

const characters = [
  { name: 'Lume', color: '#E9B95F', dark: '#563D20' },
  { name: 'Norte', color: '#E79574', dark: '#6F3C35' },
  { name: 'Brasa', color: '#8AC6B1', dark: '#28594B' },
  { name: 'Íris', color: '#B9A3DF', dark: '#51406F' },
];

// Formas originais dos quatro mascotes do Meu Passaporte
function MascoteSoma({ index }: { index: number }) {
  const c = characters[index];
  return (
    <svg width="192" height="192" viewBox="0 0 200 200" aria-label={c.name}>
      <ellipse cx="100" cy="181" rx="52" ry="8" fill={c.dark} opacity=".12" />
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
      <path d="M161 33V49M153 41H169M32 116V126M27 121H37" stroke={c.color} strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

export function somaSocialImage(kind: 'planos' | 'home') {
  const planos = kind === 'planos';
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: '#102A2B', color: '#FFFFFF', padding: '64px 72px', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: 570, height: 570, borderRadius: '50%', right: -110, top: -180, background: 'radial-gradient(circle, #285C50 0%, #102A2B 72%)' }} />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '57%', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 17, height: 17, borderRadius: 5, background: '#FFB366', transform: 'rotate(15deg)' }} />
          <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: 2 }}>SOMA</span>
          <span style={{ fontSize: 21, color: '#A5D7C9' }}>MENTORIA</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <span style={{ color: '#FFCA94', fontSize: 22, letterSpacing: 3, fontWeight: 700 }}>{planos ? 'FERRAMENTAS DE CARREIRA' : 'SUA CARREIRA EM MOVIMENTO'}</span>
          <span style={{ fontSize: planos ? 62 : 66, fontWeight: 800, lineHeight: 1.1, letterSpacing: -2 }}>{planos ? 'LinkedIn, currículo e Gupy em um só lugar' : 'Descubra caminhos para sua carreira'}</span>
          <span style={{ fontSize: 26, lineHeight: 1.4, color: '#D1E5DC' }}>{planos ? 'Conheça a plataforma e explore as opções de acesso' : 'Autoconhecimento, estratégia e ferramentas práticas'}</span>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', fontSize: 22, color: '#FFCA94', fontWeight: 700 }}>somamentoria.com</span>
      </div>
      <div style={{ display: 'flex', position: 'relative', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', display: 'flex', width: 410, height: 410, borderRadius: '50%', border: '2px solid #5A8A79', opacity: 0.55 }} />
        {characters.map((c, i) => (
          <div key={c.name} style={{
            position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 210, height: 210, borderRadius: 44,
            left: i % 2 === 0 ? 12 : 226, top: i < 2 ? 18 : 236,
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F3F0E7 75%, #D5DDD2 100%)',
            border: '3px solid #FFFFFF', boxShadow: '0 16px 30px rgba(0,0,0,0.26)',
            transform: i % 2 === 0 ? 'rotate(-5deg)' : 'rotate(5deg)'
          }}>
            <MascoteSoma index={i}/>
          </div>
        ))}
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}
