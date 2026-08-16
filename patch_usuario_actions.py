import sys

path = "app/admin/AdminClient.tsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Procura o bloco onde mostra cada usuário e adiciona os botões de ação
old_user_item = """                    <button
                      key={usuario.id}
                      onClick={() => toggleAdmin(usuario.id, usuario.is_admin)}
                      disabled={usuarioTogglingId === usuario.id}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-all disabled:opacity-60 ${
                        usuario.is_admin
                          ? 'bg-amber-50 border-amber-300 hover:bg-amber-100'
                          : 'bg-cream border-line hover:border-brown-deep'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-medium text-ink flex items-center gap-1">
                            {usuario.nome}
                            {usuario.is_admin && <Shield size={14} className="text-amber-600" />}
                          </p>
                          <p className="text-xs text-ink-faint mb-1.5">{usuario.email}</p>
                          <span className={`inline-block text-[10px] uppercase tracking-wide font-medium px-2.5 py-0.5 rounded-full border ${
                            usuario.is_admin
                              ? 'bg-amber-100 text-amber-700 border-amber-300'
                              : 'bg-sky-50 text-sky-700 border-sky-200'
                          }`}>
                            {usuario.is_admin ? '👮 Admin' : '👤 Usuário'}
                          </span>
                        </div>
                        {usuarioTogglingId === usuario.id && <Loader2 size={14} className="animate-spin text-brown-deep" />}
                      </div>
                    </button>"""

new_user_item = """                    <div
                      key={usuario.id}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                        usuario.is_admin
                          ? 'bg-amber-50 border-amber-300'
                          : 'bg-cream border-line'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-ink flex items-center gap-1">
                            {usuario.nome}
                            {usuario.is_admin && <Shield size={14} className="text-amber-600" />}
                          </p>
                          <p className="text-xs text-ink-faint mb-1.5">{usuario.email}</p>
                          <span className={`inline-block text-[10px] uppercase tracking-wide font-medium px-2.5 py-0.5 rounded-full border ${
                            usuario.is_admin
                              ? 'bg-amber-100 text-amber-700 border-amber-300'
                              : 'bg-sky-50 text-sky-700 border-sky-200'
                          }`}>
                            {usuario.is_admin ? '👮 Admin' : '👤 Usuário'}
                          </span>
                        </div>
                        <button
                          onClick={() => toggleAdmin(usuario.id, usuario.is_admin)}
                          disabled={usuarioTogglingId === usuario.id}
                          className={`shrink-0 p-1.5 rounded-lg transition-colors ${
                            usuarioTogglingId === usuario.id ? 'opacity-60' : 'hover:bg-black/5'
                          }`}
                          title={usuario.is_admin ? 'Remover acesso admin' : 'Conceder acesso admin'}
                        >
                          {usuarioTogglingId === usuario.id ? (
                            <Loader2 size={16} className="animate-spin text-brown-deep" />
                          ) : (
                            <Shield size={16} className={usuario.is_admin ? 'text-amber-600' : 'text-ink-faint'} />
                          )}
                        </button>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => confirmarEmailUsuario(usuario.id, usuario.nome)}
                          disabled={confirmandoId === usuario.id}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-brown hover:bg-brown-deep text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                        >
                          {confirmandoId === usuario.id ? <Loader2 size={12} className="animate-spin" /> : <Key size={12} />}
                          Reset senha
                        </button>
                        <button
                          onClick={() => deletarUsuario(usuario.id, usuario.nome)}
                          disabled={deletandoId === usuario.id}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                        >
                          {deletandoId === usuario.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          Deletar
                        </button>
                      </div>
                    </div>"""

if old_user_item not in content:
    print("ERRO: bloco do usuário não encontrado")
    sys.exit(1)

content = content.replace(old_user_item, new_user_item, 1)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("✅ Botões de Reset e Deletar adicionados ao painel de usuários!")
