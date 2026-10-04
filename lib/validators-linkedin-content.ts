import type { LinkedInContentAction } from './prompts-linkedin-content';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function validarResultadoLinkedIn(action: LinkedInContentAction) {
  return (value: unknown): value is Record<string, unknown> => {
    if (!isRecord(value)) return false;

    if (action === 'ideas') {
      const pilares = value.pilares;
      const ideias = value.ideias;

      return (
        Array.isArray(pilares) &&
        pilares.length === 3 &&
        pilares.every(
          (item) =>
            isRecord(item) &&
            typeof item.nome === 'string' &&
            typeof item.por_que === 'string' &&
            Array.isArray(item.subtemas)
        ) &&
        Array.isArray(ideias) &&
        ideias.length === 9 &&
        ideias.every(
          (item) =>
            isRecord(item) &&
            typeof item.titulo === 'string' &&
            typeof item.premissa === 'string' &&
            typeof item.formato === 'string' &&
            typeof item.angulo === 'string'
        )
      );
    }

    if (action === 'hooks') {
      const hooks = value.hooks;
      return (
        Array.isArray(hooks) &&
        hooks.length === 6 &&
        hooks.every(
          (item) =>
            isRecord(item) &&
            typeof item.tipo === 'string' &&
            typeof item.texto === 'string'
        )
      );
    }

    if (action === 'voice') {
      return (
        typeof value.resumo === 'string' &&
        Array.isArray(value.tom) &&
        typeof value.prompt_voz === 'string'
      );
    }

    return typeof value.post === 'string' && value.post.trim().length > 0;
  };
}
