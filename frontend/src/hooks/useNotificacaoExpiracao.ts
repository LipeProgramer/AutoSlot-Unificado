import { useEffect, useState } from 'react';
import { useParking } from '../context/ParkingContext';

export type ToastItem = {
  id: string;
  mensagem: string;
  tipo: 'aviso' | 'perigo';
};

const AVISO_MINUTOS = 5;

export function useNotificacaoExpiracao() {
  const { vagas } = useParking();
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remover = (id: string) => setToasts(t => t.filter(x => x.id !== id));

  useEffect(() => {
    const agora = new Date();

    vagas.forEach(v => {
      if (v.status !== 'Reservada' || !v.saidaPrevista) return;

      const saida = new Date(v.saidaPrevista);
      const diffMin = (saida.getTime() - agora.getTime()) / 60000;

      if (diffMin > 0 && diffMin <= AVISO_MINUTOS) {
        const id = `exp-${v.id}`;
        setToasts(t => {
          if (t.find(x => x.id === id)) return t;
          return [
            ...t,
            {
              id,
              mensagem: `Vaga ${v.codigo} (${v.placa || 'sem placa'}) expira em ${Math.ceil(diffMin)} min`,
              tipo: 'aviso',
            },
          ];
        });
      }
    });
  }, [vagas]);

  return { toasts, remover };
}
