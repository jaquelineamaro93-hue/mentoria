# Publicação de vídeos em /cases

Este componente só exibe vídeos expressamente autorizados. O manifesto começa vazio; nenhuma entrevista ou depoimento fictício é publicado.

1. Obter consentimento documentado da pessoa retratada, incluindo a finalidade pública, países e prazos, e confirmar o direito de uso do vídeo, imagem, voz e música.
2. Revisar/retirar dados pessoais, senhas, dados internos e terceiros sem autorização.
3. Publicar arquivos MP4 locais em public/cases/videos/<id>.mp4 e legendas WebVTT opcionais (.vtt); não armazenar na plataforma de cases currículos, dados de membros nem credenciais.
4. Adicionar no video-manifest.json um objeto com id, name, title nas chaves pt-BR/es-419/en, src local, captions e authorized:true. O componente ignora URLs externas e qualquer item sem autorização.
5. Revisar títulos, acessibilidade, legendas e reprodução no celular, então publicar após testes. Para revogar, retirar o item do manifesto e eliminar o vídeo da origem.

O exemplo da Nuvia é uma referência visual de navegação, não uma autorização de reprodução, republicação ou depoimentos em nome da SOMA.
