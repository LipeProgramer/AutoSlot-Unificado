import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './styles.css';

type ReciboData = {
  reserva: {
    id: number;
    nomeCliente: string;
    telefoneCliente: string;
    placa: string;
    modeloVeiculo: string;
    vagaId: number;
    horarioChegadaReal: string;
    horarioSaidaReal: string;
    vaga?: { codigo: string };
  };
  pagamento?: {
    id: number;
    valorCobrado: number;
    formaPagamento: string;
    registradoEm: string;
  };
};

export default function Recibo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<ReciboData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const res = await api.get(`/api/reservas/${id}/recibo`);
        setData(res.data);
      } catch (e) {
        console.error(e);
        alert('Erro ao carregar recibo.');
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [id]);

  function formatarMoeda(valor: number) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function formatarData(dataISO: string) {
    if (!dataISO) return '-';
    return new Date(dataISO).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Carregando recibo...</div>;
  if (!data) return <div style={{ padding: 40, textAlign: 'center' }}>Recibo não encontrado.</div>;

  const { reserva, pagamento } = data;
  const pago = !!pagamento;
  const valorCobrado = pagamento?.valorCobrado || 0;
  // Assumindo um ISS fictício de 2% para nota (opcional, igual ao modelo do usuário)
  const iss = valorCobrado * 0.02; 

  return (
    <div className="recibo-container">
      <div className="actions no-print">
        <button className="secondary" onClick={() => navigate(-1)}>Voltar</button>
        {pago && <button onClick={() => window.print()}>Imprimir / Salvar PDF</button>}
      </div>

      <main className="invoice" id="invoice">
        <div className="header">
          <div className="brand">
            <h1>AutoSlot</h1>
            <p>Nota Fiscal de Serviço Eletrônica</p>
            <p>Serviço de agendamento e gestão de estacionamento</p>
          </div>

          <div className={`badge ${pago ? 'pago' : 'pendente'}`}>
            {pago ? 'AUTORIZADA' : 'PENDENTE'}
          </div>
        </div>

        <section className="section">
          <h2>Dados da Nota</h2>
          <div className="grid">
            <div className="item">
              <div className="label">Número da NFS-e</div>
              <div className="value">{pago ? `2026${pagamento.id.toString().padStart(5, '0')}` : 'Aguardando emissão'}</div>
            </div>
            <div className="item">
              <div className="label">Código de Verificação</div>
              <div className="value">{pago ? `ASLT-${reserva.id}-${pagamento.id}` : 'Aguardando autorização'}</div>
            </div>
            <div className="item">
              <div className="label">Data de Emissão</div>
              <div className="value">{pago ? formatarData(pagamento.registradoEm) : '-'}</div>
            </div>
            <div className="item">
              <div className="label">ID do Agendamento</div>
              <div className="value">AG-{reserva.id.toString().padStart(4, '0')}</div>
            </div>
          </div>
        </section>

        <section className="section">
          <h2>Prestador do Serviço</h2>
          <div className="grid">
            <div className="item">
              <div className="label">Razão Social</div>
              <div className="value">AutoSlot Estacionamentos LTDA</div>
            </div>
            <div className="item">
              <div className="label">CNPJ</div>
              <div className="value">00.000.000/0001-00</div>
            </div>
            <div className="item">
              <div className="label">Inscrição Municipal</div>
              <div className="value">123456</div>
            </div>
            <div className="item">
              <div className="label">Cidade/UF</div>
              <div className="value">Maringá/PR</div>
            </div>
          </div>
        </section>

        <section className="section">
          <h2>Tomador do Serviço</h2>
          <div className="grid">
            <div className="item">
              <div className="label">Nome</div>
              <div className="value">{reserva.nomeCliente || 'Cliente não identificado'}</div>
            </div>
            <div className="item">
              <div className="label">CPF/CNPJ</div>
              <div className="value">Não informado</div>
            </div>
            <div className="item">
              <div className="label">Telefone</div>
              <div className="value">{reserva.telefoneCliente || '-'}</div>
            </div>
          </div>
        </section>

        <section className="section">
          <h2>Dados do Estacionamento</h2>
          <div className="grid">
            <div className="item">
              <div className="label">Placa do Veículo</div>
              <div className="value">{reserva.placa}</div>
            </div>
            <div className="item">
              <div className="label">Modelo</div>
              <div className="value">{reserva.modeloVeiculo || '-'}</div>
            </div>
            <div className="item">
              <div className="label">Vaga</div>
              <div className="value">{reserva.vaga?.codigo || reserva.vagaId}</div>
            </div>
            <div className="item">
              <div className="label">Período Reservado</div>
              <div className="value">
                {formatarData(reserva.horarioChegadaReal)} até {formatarData(reserva.horarioSaidaReal)}
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <h2>Serviço Prestado</h2>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Descrição</th>
                <th>Qtd.</th>
                <th>Valor Unitário</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>11.01</td>
                <td>Guarda e estacionamento de veículo automotor.</td>
                <td>1</td>
                <td>{formatarMoeda(valorCobrado)}</td>
                <td>{formatarMoeda(valorCobrado)}</td>
              </tr>
            </tbody>
          </table>

          <div className="total-box">
            <div className="total">
              <div className="total-row">
                <span>Valor do Serviço</span>
                <span>{formatarMoeda(valorCobrado)}</span>
              </div>
              <div className="total-row">
                <span>ISS estimado (2%)</span>
                <span>{formatarMoeda(iss)}</span>
              </div>
              <div className="total-row final">
                <span>Total Pago</span>
                <span>{formatarMoeda(valorCobrado)}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <h2>Pagamento</h2>
          <div className="grid">
            <div className="item">
              <div className="label">Forma de Pagamento</div>
              <div className="value">{pagamento?.formaPagamento || '-'}</div>
            </div>
            <div className="item">
              <div className="label">Data do Pagamento</div>
              <div className="value">{pago ? formatarData(pagamento.registradoEm) : '-'}</div>
            </div>
            <div className="item">
              <div className="label">Status do Pagamento</div>
              <div className="value">{pago ? 'Pago' : 'Pendente'}</div>
            </div>
          </div>
        </section>

        <div className="footer">
          Este documento é uma representação visual da nota fiscal/comprovante gerado pelo sistema AutoSlot.
          Para validade fiscal, a NFS-e deve ser autorizada pelo órgão competente e possuir número, código de verificação e XML oficial.
        </div>
      </main>
    </div>
  );
}
