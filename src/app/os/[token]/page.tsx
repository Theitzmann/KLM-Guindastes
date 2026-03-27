import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface OsData {
  id: number;
  numeroOS: number | null;
  cliente: string;
  localidade: string;
  descricao: string | null;
  solicitante: string | null;
  dataInicio: string;
  dataFim: string | null;
  status: string;
  tipoVeiculoSolicitado: string | null;
  qtdVeiculos: number;
  veiculo: { apelido: string | null; nome: string; tipo: string; placa: string; capacidade: number | null } | null;
  veiculosAlocados: Array<{ veiculo: { apelido: string | null; nome: string; tipo: string; placa: string; capacidade: number | null } }>;
  funcionario: { nome: string; funcao: string; telefone: string | null } | null;
  funcionariosAlocados: Array<{ funcionario: { nome: string; funcao: string; telefone: string | null } }>;
}

const statusLabels: Record<string, string> = {
  AGENDADO: 'Agendado',
  EM_ANDAMENTO: 'Em Andamento',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};

const statusColors: Record<string, string> = {
  AGENDADO: '#f59e0b',
  EM_ANDAMENTO: '#3b82f6',
  CONCLUIDO: '#22c55e',
  CANCELADO: '#ef4444',
};

const tipoLabels: Record<string, string> = {
  MUNCK: 'Munck',
  GUINDASTE: 'Guindaste',
  EMPILHADEIRA: 'Empilhadeira',
  CARRETA: 'Carreta',
};

const funcaoLabels: Record<string, string> = {
  OPERADOR: 'Operador',
  MOTORISTA: 'Motorista',
  AUXILIAR: 'Auxiliar',
};

async function getOs(token: string): Promise<OsData | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/os/${token}`, { cache: 'no-store' });
    if (res.status === 404 || res.status === 410) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const os = await getOs(token);
  if (!os) return { title: 'OS não encontrada — KLM Guindastes' };

  const osNum = (os.numeroOS ?? os.id).toString().padStart(4, '0');
  return {
    title: `OS #${osNum} — KLM Guindastes`,
    description: `${os.cliente} · ${os.localidade} · ${new Date(os.dataInicio).toLocaleDateString('pt-BR')}`,
    robots: { index: false, follow: false },
    openGraph: {
      title: `OS #${osNum} — KLM Guindastes`,
      description: `${os.cliente} · ${os.localidade} · ${new Date(os.dataInicio).toLocaleDateString('pt-BR')}`,
      type: 'website',
    },
  };
}

export default async function OsPublicPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const os = await getOs(token);
  if (!os) notFound();

  const osNum = (os.numeroOS ?? os.id).toString().padStart(4, '0');
  const dataInicio = new Date(os.dataInicio).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const dataFim = os.dataFim ? new Date(os.dataFim).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : null;
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(os.localidade)}`;
  const statusColor = statusColors[os.status] || '#888';
  const statusLabel = statusLabels[os.status] || os.status;

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f0f; color: #e5e5e5; min-height: 100vh; }
        .page { max-width: 480px; margin: 0 auto; padding: 24px 20px 48px; }
        .header { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid #2a2a2a; }
        .logo-circle { width: 44px; height: 44px; background: #f59e0b; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 18px; color: #0f0f0f; flex-shrink: 0; }
        .header-text h1 { font-size: 1rem; font-weight: 700; color: #f5f5f5; }
        .header-text p { font-size: 0.75rem; color: #888; margin-top: 1px; }
        .os-hero { background: #1a1a1a; border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid #2a2a2a; }
        .os-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1.5px; color: #f59e0b; font-weight: 600; }
        .os-number { font-size: 1.8rem; font-weight: 800; color: #f5f5f5; margin-top: 4px; }
        .os-status { display: inline-flex; align-items: center; gap: 6px; margin-top: 8px; padding: 4px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 600; }
        .os-status-dot { width: 7px; height: 7px; border-radius: 50%; }
        .section { background: #1a1a1a; border-radius: 12px; padding: 16px; margin-bottom: 12px; border: 1px solid #2a2a2a; }
        .section-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px; color: #888; font-weight: 600; margin-bottom: 6px; }
        .section-value { font-size: 1rem; color: #f5f5f5; font-weight: 500; line-height: 1.4; }
        .section-sub { font-size: 0.8rem; color: #aaa; margin-top: 2px; }
        .action-link { display: inline-flex; align-items: center; gap: 6px; margin-top: 10px; background: #f59e0b; color: #0f0f0f; padding: 8px 14px; border-radius: 8px; font-size: 0.82rem; font-weight: 700; text-decoration: none; }
        .phone-link { display: inline-flex; align-items: center; gap: 6px; margin-top: 10px; background: #22c55e22; color: #22c55e; border: 1px solid #22c55e44; padding: 8px 14px; border-radius: 8px; font-size: 0.82rem; font-weight: 700; text-decoration: none; }
        .footer { text-align: center; font-size: 0.72rem; color: #555; margin-top: 32px; padding-top: 20px; border-top: 1px solid #2a2a2a; }
      `}</style>

      <div className="page">
        <div className="header">
          <div className="logo-circle">K</div>
          <div className="header-text">
            <h1>KLM Guindastes</h1>
            <p>Qualidade com Segurança</p>
          </div>
        </div>

        <div className="os-hero">
          <div className="os-label">Ordem de Serviço</div>
          <div className="os-number">OS #{osNum}</div>
          <div className="os-status" style={{ background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}44` }}>
            <span className="os-status-dot" style={{ background: statusColor }} />
            {statusLabel}
          </div>
        </div>

        <div className="section">
          <div className="section-label">Cliente</div>
          <div className="section-value">{os.cliente}</div>
          {os.solicitante && <div className="section-sub">Solicitante: {os.solicitante}</div>}
        </div>

        <div className="section">
          <div className="section-label">Local de Serviço</div>
          <div className="section-value">{os.localidade}</div>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="action-link">
            📍 Abrir no Maps
          </a>
        </div>

        <div className="section">
          <div className="section-label">Data</div>
          <div className="section-value">{dataInicio}{dataFim ? ` até ${dataFim}` : ''}</div>
        </div>

        <div className="section">
          <div className="section-label">Veículo{os.veiculosAlocados.length > 1 ? 's' : ''}</div>
          {os.veiculosAlocados.length > 0 ? (
            os.veiculosAlocados.map((sv, i) => (
              <div key={i} style={{ marginTop: i > 0 ? 8 : 0 }}>
                <div className="section-value">{sv.veiculo.apelido || sv.veiculo.nome}</div>
                <div className="section-sub">
                  {tipoLabels[sv.veiculo.tipo] || sv.veiculo.tipo} · {sv.veiculo.placa}
                  {sv.veiculo.capacidade ? ` · ${sv.veiculo.capacidade}t` : ''}
                </div>
              </div>
            ))
          ) : os.veiculo ? (
            <>
              <div className="section-value">{os.veiculo.apelido || os.veiculo.nome}</div>
              <div className="section-sub">
                {tipoLabels[os.veiculo.tipo] || os.veiculo.tipo} · {os.veiculo.placa}
                {os.veiculo.capacidade ? ` · ${os.veiculo.capacidade}t` : ''}
              </div>
            </>
          ) : (
            <div className="section-value" style={{ color: '#f59e0b' }}>
              {os.qtdVeiculos}x {tipoLabels[os.tipoVeiculoSolicitado || ''] || os.tipoVeiculoSolicitado} — A definir
            </div>
          )}
        </div>

        {(os.funcionariosAlocados?.length > 0 || os.funcionario) && (
          <div className="section">
            <div className="section-label">Funcionário{(os.funcionariosAlocados?.length || 0) > 1 ? 's' : ''}</div>
            {os.funcionariosAlocados?.length > 0
              ? os.funcionariosAlocados.map((sf, i) => (
                <div key={i} style={{ marginBottom: i < os.funcionariosAlocados.length - 1 ? 8 : 0 }}>
                  <div className="section-value">{sf.funcionario.nome}</div>
                  <div className="section-sub">{funcaoLabels[sf.funcionario.funcao] || sf.funcionario.funcao}</div>
                  {sf.funcionario.telefone && (
                    <a href={`tel:${sf.funcionario.telefone.replace(/\D/g, '')}`} className="phone-link">
                      📞 {sf.funcionario.telefone}
                    </a>
                  )}
                </div>
              ))
              : os.funcionario && (
                <div>
                  <div className="section-value">{os.funcionario.nome}</div>
                  <div className="section-sub">{funcaoLabels[os.funcionario.funcao] || os.funcionario.funcao}</div>
                  {os.funcionario.telefone && (
                    <a href={`tel:${os.funcionario.telefone.replace(/\D/g, '')}`} className="phone-link">
                      📞 {os.funcionario.telefone}
                    </a>
                  )}
                </div>
              )
            }
          </div>
        )}

        {os.descricao && (
          <div className="section">
            <div className="section-label">Descrição / Observações</div>
            <div className="section-value" style={{ fontSize: '0.9rem' }}>{os.descricao}</div>
          </div>
        )}

        <div className="footer">
          KLM Guindastes — Controle de Operações
        </div>
      </div>
    </>
  );
}
