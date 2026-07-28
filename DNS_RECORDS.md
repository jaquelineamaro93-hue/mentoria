# 🌐 Registros DNS SendGrid para camarocrm.com

## Registros a Adicionar (6 no total)

| Tipo | Host | Valor |
|------|------|-------|
| CNAME | `url2822.camarocrm.com` | `sendgrid.net` |
| CNAME | `111492319.camarocrm.com` | `sendgrid.net` |
| CNAME | `em5249.camarocrm.com` | `u111492319.wl070.sendgrid.net` |
| CNAME | `s1._domainkey.camarocrm.com` | `s1.domainkey.u111492319.wl070.sendgrid.net` |
| CNAME | `s2._domainkey.camarocrm.com` | `s2.domainkey.u111492319.wl070.sendgrid.net` |
| TXT | `_dmarc.camarocrm.com` | `v=DMARC1; p=none;` |

---

## 📋 Passo a Passo por Registrador

### 🔵 GoDaddy

1. Acesse [godaddy.com](https://godaddy.com) e faça login
2. Vá para **Products** → **Domains**
3. Selecione `camarocrm.com`
4. Clique **Manage DNS**
5. Scroll até **Records**
6. Para cada registro CNAME:
   - Clique **Add** (ou ➕)
   - **Type**: `CNAME`
   - **Name**: Cole o host (ex: `url2822`)
   - **Value**: Cole o valor (ex: `sendgrid.net`)
   - Clique ✓
7. Para o TXT (DMARC):
   - Clique **Add**
   - **Type**: `TXT`
   - **Name**: `_dmarc`
   - **Value**: `v=DMARC1; p=none;`
   - Clique ✓

**Tempo**: ~5 minutos

---

### 🟦 Namecheap

1. Login em [namecheap.com](https://namecheap.com)
2. Vá para **Domain List**
3. Clique **Manage** ao lado de `camarocrm.com`
4. Abra a aba **Advanced DNS**
5. Para cada registro:
   - Clique **Add New Record**
   - **Type**: Selecione `CNAME` (ou `TXT` para DMARC)
   - **Host**: Cole o host
   - **Value**: Cole o valor
   - **TTL**: Deixe 30 min (padrão)
   - Clique ✓

**Tempo**: ~5 minutos

---

### 🟦 HostGator / BlueHost

1. Login no **cPanel**
2. Procure por **Zone Editor** ou **DNS Manager**
3. Localize `camarocrm.com`
4. Para cada registro:
   - Clique **Add Record**
   - Preencha conforme acima
   - Clique **Add Record**

**Tempo**: ~5 minutos

---

### 🟦 Cloudflare

1. Login em [cloudflare.com](https://cloudflare.com)
2. Selecione `camarocrm.com`
3. Vá para **DNS** na barra superior
4. Para cada registro:
   - Clique **Add record**
   - **Type**: `CNAME` (ou `TXT`)
   - **Name**: Cole o host
   - **Content**: Cole o valor
   - **TTL**: Auto
   - Clique **Save**

**Tempo**: ~5 minutos

---

### 🟦 Register.com / Uol / Registro.br

1. Login no painel do registrador
2. Procure **DNS Manager** ou **Gerenciar DNS**
3. Adicione cada registro como indicado acima

**Tempo**: ~5 minutos

---

## ✅ Checklist de Adição

- [ ] CNAME `url2822.camarocrm.com` → `sendgrid.net`
- [ ] CNAME `111492319.camarocrm.com` → `sendgrid.net`
- [ ] CNAME `em5249.camarocrm.com` → `u111492319.wl070.sendgrid.net`
- [ ] CNAME `s1._domainkey.camarocrm.com` → `s1.domainkey.u111492319.wl070.sendgrid.net`
- [ ] CNAME `s2._domainkey.camarocrm.com` → `s2.domainkey.u111492319.wl070.sendgrid.net`
- [ ] TXT `_dmarc.camarocrm.com` → `v=DMARC1; p=none;`

---

## ⏱️ Propagação de DNS

Após adicionar:

1. **Imediato**: Alguns provedores (como Cloudflare) propagam em segundos
2. **5-30 minutos**: Maioria dos registradores
3. **Até 24 horas**: Pior caso (raro)

**Verificar propagação**:
```bash
# Terminal/PowerShell
nslookup url2822.camarocrm.com
# Deve retornar: sendgrid.net

dig em5249.camarocrm.com
# Deve retornar: u111492319.wl070.sendgrid.net
```

---

## 🔍 Verificar no SendGrid

Após adicionar os registros e esperar a propagação:

1. Login em [sendgrid.com](https://sendgrid.com)
2. Vá para **Settings** → **Sender Authentication**
3. Seu domínio deve aparecer com status **✓ Verified**

Se não aparecer como verificado:
- Aguarde mais tempo (até 1 hora)
- Clique **Verify** manualmente
- Verifique se os registros foram adicionados corretamente

---

## 🆘 Troubleshooting

### "CNAME records not found"
- Verifique se digitou certo (maiúsculas/minúsculas importam?)
- Aguarde 15-30 minutos
- Tente limpar DNS cache: `ipconfig /flushdns` (Windows) ou `sudo dscacheutil -flushcache` (Mac)

### "DNS propagation taking long"
- Alguns registradores têm cache mais longo
- Pressione Refresh no SendGrid após 1 hora

### "Still not verified after 2 hours"
1. Re-verifique os registros DNS adicionados
2. Certifique que o tipo está correto (CNAME vs TXT)
3. Sem espaços extras nos valores
4. Contate suporte SendGrid com screenshot dos registros

---

## 📞 Suporte

**SendGrid Support**: support@sendgrid.com (eles ajudam com propagação DNS)

**Seu registrador**: Cada registrador tem suporte próprio

---

## ⏰ Próximo Passo

Após **verificar** que os registros foram adicionados ✓:

1. Volta em SendGrid e confirma verificação
2. Siga o `SENDGRID_SETUP.md` passo 4 (API Key)
3. Adiciona ao `.env.local`
4. Teste o portal!

---

**Status**: Aguardando adição ao DNS
**Domínio**: camarocrm.com
**Data**: 28/07/2024
