export const PERFIS = {
  ADMIN: 'ADMIN',
  FUNCIONARIO: 'FUNCIONARIO',
};

export const ROTAS_PERMITIDAS = {
  [PERFIS.ADMIN]: [
    '/dashboard',
    '/vagas',
    '/tarifas',
    '/usuarios',
    '/relatorios',
    '/auditoria',
  ],
  [PERFIS.FUNCIONARIO]: [
    '/dashboard',
    '/vagas',
    '/reservas',
    '/checkin',
    '/checkout',
    '/pagamento',
  ],
};

export function temPermissao(usuario, rota) {
  if (!usuario) return false;
  const rotasDoPerfil = ROTAS_PERMITIDAS[usuario.perfil] || [];
  return rotasDoPerfil.includes(rota);
}