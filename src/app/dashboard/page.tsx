'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Truck, Users, ClipboardList, Construction,
  MapPin, User, Calendar, Wrench, CheckCircle2,
  Clock, AlertTriangle, DollarSign, Phone, Eye, FileText, Share2, Link
} from 'lucide-react';
import { Sidebar, StatusBadge, tipoVeiculoLabels, tipoServicoLabels, funcaoLabels } from '@/components/shared';

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [osPreview, setOsPreview] = useState<any>(null);
  const [toast, setToast] = useState('');
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      const [userRes, veicRes, funcRes, servRes] = await Promise.all([
        fetch('/api/auth/me'), fetch('/api/veiculos'), fetch('/api/funcionarios'), fetch('/api/servicos'),
      ]);
      if (!userRes.ok) { router.push('/'); return; }
      setUser(await userRes.json());
      setVeiculos(await veicRes.json());
      setFuncionarios(await funcRes.json());
      setServicos(await servRes.json());
    } catch { router.push('/'); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const getOrCreateToken = async (servicoId: number): Promise<string | null> => {
    try {
      const res = await fetch(`/api/servicos/${servicoId}/token`, { method: 'POST' });
      if (!res.ok) return null;
      const data = await res.json();
      return data.url;
    } catch { return null; }
  };

  const handleWhatsApp = async (s: any) => {
    const url = await getOrCreateToken(s.id);
    if (!url) { showToast('Erro ao gerar link'); return; }
    const osNum = (s.numeroOS ?? s.id).toString().padStart(4, '0');
    const text = `OS #${osNum} — KLM Guindastes\nAcesse os detalhes da sua ordem de serviço:\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyLink = async (s: any) => {
    const url = await getOrCreateToken(s.id);
    if (!url) { showToast('Erro ao gerar link'); return; }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    showToast('Link copiado!');
  };

  if (loading) return <div className="loading" style={{ minHeight: '100vh' }}><div className="loading-spinner" /></div>;

  const veiculosPorTipo = (tipo: string) => veiculos.filter((v: any) => v.tipo === tipo);
  const veiculosDisponiveis = veiculos.filter((v: any) => v.status === 'DISPONIVEL').length;
  const veiculosEmUso = veiculos.filter((v: any) => v.status === 'EM_USO').length;
  const veiculosManutencao = veiculos.filter((v: any) => v.status === 'MANUTENCAO').length;
  const funcTrabalhando = funcionarios.filter((f: any) => f.status === 'TRABALHANDO').length;
  const servicosAtivos = servicos.filter((s: any) => s.status === 'EM_ANDAMENTO' || s.status === 'AGENDADO');
  const servicosPendentes = servicos.filter((s: any) => s.status === 'AGENDADO' && !s.veiculoId && (!s.veiculosAlocados || s.veiculosAlocados.length === 0));
  const isFinanceiro = user?.cargo === 'FINANCEIRO';
  const isOperacional = user?.cargo === 'OPERACIONAL';

  return (
    <div className="app-layout">
      <Sidebar user={user} sidebarOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Painel de Controle</h1>
          <p className="page-subtitle">
            {isFinanceiro ? 'Visão financeira — faturamento e cobrança' :
             isOperacional ? 'Gestão operacional — alocação de veículos e equipe' :
             'Visão comercial — disponibilidade e agendamentos'}
          </p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card amber" onClick={() => router.push('/dashboard/veiculos')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon amber"><Truck size={24} /></div>
            <div className="stat-value">{veiculos.length}</div>
            <div className="stat-label">Total de Veículos</div>
          </div>
          <div className="stat-card green" onClick={() => router.push('/dashboard/veiculos?status=DISPONIVEL')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon green"><CheckCircle2 size={24} /></div>
            <div className="stat-value">{veiculosDisponiveis}</div>
            <div className="stat-label">Disponíveis</div>
          </div>
          <div className="stat-card blue" onClick={() => router.push('/dashboard/veiculos?status=EM_USO')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon blue"><Construction size={24} /></div>
            <div className="stat-value">{veiculosEmUso}</div>
            <div className="stat-label">Em Uso</div>
          </div>
          <div className="stat-card red" onClick={() => router.push('/dashboard/veiculos')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon red"><Wrench size={24} /></div>
            <div className="stat-value">{veiculosManutencao}</div>
            <div className="stat-label">Em Manutenção</div>
          </div>
          <div className="stat-card purple" onClick={() => router.push('/dashboard/funcionarios')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon purple"><Users size={24} /></div>
            <div className="stat-value">{funcTrabalhando}/{funcionarios.length}</div>
            <div className="stat-label">Funcionários Ativos</div>
          </div>
        </div>

        {/* Availability by Type (for COMERCIAL/OPERACIONAL) */}
        {true && (
          <div className="content-section" style={{ marginBottom: 24 }}>
            <div className="section-header">
              <h2 className="section-title"><Truck className="section-title-icon" size={20} /> Disponibilidade por Tipo</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, padding: '20px 24px' }}>
              {['MUNCK', 'GUINDASTE', 'EMPILHADEIRA', 'CARRETA'].map((tipo) => {
                const all = veiculosPorTipo(tipo);
                const disp = all.filter((v: any) => v.status === 'DISPONIVEL').length;
                return (
                  <div key={tipo} onClick={() => router.push('/dashboard/veiculos')} style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 16, border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s' }} className="hover-card">
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{tipoVeiculoLabels[tipo]}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{disp}<span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-secondary)' }}>/{all.length}</span></div>
                    <div style={{ fontSize: '0.8rem', color: disp > 0 ? 'var(--green-400)' : 'var(--red-400)' }}>
                      {disp > 0 ? `${disp} disponíve${disp > 1 ? 'is' : 'l'}` : 'Todos em uso / manutenção'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pending Assignment Alert (for OPERACIONAL) */}
        {servicosPendentes.length > 0 && (
          <div onClick={() => router.push('/dashboard/servicos')} style={{ background: 'var(--amber-glow)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-md)', padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'all 0.2s' }} className="hover-card">
            <AlertTriangle size={20} style={{ color: 'var(--amber-400)', flexShrink: 0 }} />
            <div>
              <strong style={{ color: 'var(--amber-400)' }}>{servicosPendentes.length} OS pendente{servicosPendentes.length > 1 ? 's' : ''} de alocação</strong>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 2 }}>
                Serviços agendados aguardando atribuição de veículo específico
              </p>
            </div>
          </div>
        )}

        {/* Active Jobs */}
        <div className="content-section">
          <div className="section-header">
            <h2 className="section-title"><ClipboardList className="section-title-icon" size={20} /> Serviços Ativos</h2>
            <span className="badge badge-em-andamento"><span className="badge-dot" />{servicosAtivos.length} ativo{servicosAtivos.length !== 1 ? 's' : ''}</span>
          </div>

          {servicosAtivos.length === 0 ? (
            <div className="empty-state"><ClipboardList size={48} /><p>Nenhum serviço ativo no momento</p></div>
          ) : (
            <div className="jobs-grid">
              {servicosAtivos.map((s: any) => (
                <div key={s.id} className="job-card">
                  <div className="job-card-header">
                    <div>
                      <div className="job-card-client">{s.cliente}</div>
                      {s.solicitante && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Solicitante: {s.solicitante}</div>}
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="job-card-detail"><MapPin size={14} /><span>{s.localidade}</span></div>
                  <div className="job-card-detail">
                    <Truck size={14} />
                    <span>
                      {s.veiculosAlocados?.length > 0
                        ? s.veiculosAlocados.map((sv: any) => sv.veiculo?.apelido || sv.veiculo?.nome).filter(Boolean).join(', ')
                        : s.veiculo ? (s.veiculo.apelido || s.veiculo.nome) : (
                          <span style={{ color: 'var(--amber-400)' }}>
                            {s.qtdVeiculos}x {tipoVeiculoLabels[s.tipoVeiculoSolicitado] || s.tipoVeiculoSolicitado} — Aguardando alocação
                          </span>
                        )}
                    </span>
                  </div>
                  {s.funcionario && <div className="job-card-detail"><User size={14} /><span>{s.funcionario.nome}</span></div>}
                  <div className="job-card-detail">
                    <Calendar size={14} />
                    <span>{new Date(s.dataInicio).toLocaleDateString('pt-BR')}{s.dataFim && ` — ${new Date(s.dataFim).toLocaleDateString('pt-BR')}`}</span>
                  </div>
                  {s.tipoServico && <div className="job-card-detail"><Clock size={14} /><span>{tipoServicoLabels[s.tipoServico]}</span></div>}
                  {s.valores && (
                    <div className="job-card-detail"><DollarSign size={14} /><span style={{ color: 'var(--green-400)' }}>{s.valores}</span></div>
                  )}
                  {s.contatoPagamento && (
                    <div className="job-card-detail"><Phone size={14} /><span>{s.contatoPagamento}</span></div>
                  )}
                  {s.descricao && <div className="job-card-detail" style={{ fontStyle: 'italic', marginTop: 6 }}><FileText size={14} /><span>{s.descricao}</span></div>}

                  {/* OS Preview button */}
                  {true && (
                    <button className="btn btn-secondary btn-sm" style={{ marginTop: 10, width: '100%' }} onClick={() => setOsPreview(s)}>
                      <Eye size={14} /> Ver OS para Operador
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Employee Status */}
        {true && (
          <div className="content-section">
            <div className="section-header">
              <h2 className="section-title"><Users className="section-title-icon" size={20} /> Equipe de Operadores</h2>
            </div>
            <table className="data-table">
              <thead><tr><th>Nome</th><th>Função</th><th>Telefone</th><th>Status</th><th>Serviço Atual</th></tr></thead>
              <tbody>
                {funcionarios.map((f: any) => {
                  const activeService = f.servicos?.[0];
                  return (
                    <tr key={f.id}>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{f.nome}</td>
                      <td>{funcaoLabels[f.funcao] || f.funcao}</td>
                      <td>{f.telefone || '—'}</td>
                      <td><StatusBadge status={f.status} /></td>
                      <td>{activeService ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AlertTriangle size={14} style={{ color: 'var(--amber-400)' }} />
                          {activeService.veiculo?.apelido || activeService.veiculo?.nome || 'Não alocado'} — {activeService.localidade?.split('-')[0]?.trim()}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Finance: Completed jobs */}
        {true && (
          <div className="content-section">
            <div className="section-header">
              <h2 className="section-title"><DollarSign className="section-title-icon" size={20} /> Serviços Concluídos — Faturamento</h2>
            </div>
            <table className="data-table">
              <thead><tr><th>Cliente</th><th>Data</th><th>Financeiro</th><th>Status</th></tr></thead>
              <tbody>
                {servicos.filter((s: any) => s.status === 'CONCLUIDO').map((s: any) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{s.cliente}</div>
                      {s.solicitante && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.solicitante}</div>}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{new Date(s.dataInicio).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <div style={{ color: 'var(--green-400)', fontWeight: 600, fontSize: '0.85rem' }}>{s.valores || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.formaPagamento || '—'} / {s.contatoPagamento || 'Sem contato'}</div>
                    </td>
                    <td><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* OS Preview Modal */}
        {osPreview && (
          <div className="modal-overlay" onClick={() => setOsPreview(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
              <div className="modal-header">
                <h3 className="modal-title">Ordem de Serviço #{(osPreview.numeroOS ?? osPreview.id).toString().padStart(4, '0')}</h3>
                <button className="modal-close" onClick={() => setOsPreview(null)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="os-card">
                  <div className="os-card-header">
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--amber-400)' }}>KLM Guindastes — Ordem de Serviço</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 4 }}>OS #{(osPreview.numeroOS ?? osPreview.id).toString().padStart(4, '0')}</div>
                  </div>
                  <div className="os-card-body">
                    <div className="os-field"><Truck size={14} /><div><strong>Cliente:</strong> {osPreview.cliente}</div></div>
                    <div className="os-field"><MapPin size={14} /><div><strong>Local:</strong> {osPreview.localidade}</div></div>
                    <div className="os-field"><Calendar size={14} /><div><strong>Data:</strong> {new Date(osPreview.dataInicio).toLocaleDateString('pt-BR')}{osPreview.dataFim ? ` até ${new Date(osPreview.dataFim).toLocaleDateString('pt-BR')}` : ''}</div></div>
                    <div className="os-field"><Truck size={14} /><div><strong>Veículo{(osPreview.veiculosAlocados?.length || 0) > 1 ? 's' : ''}:</strong> {osPreview.veiculosAlocados?.length > 0 ? osPreview.veiculosAlocados.map((sv: any) => sv.veiculo?.apelido || sv.veiculo?.nome).filter(Boolean).join(', ') : osPreview.veiculo ? (osPreview.veiculo.apelido || osPreview.veiculo.nome) : 'A definir'}</div></div>
                    {(osPreview.funcionariosAlocados?.length > 0 || osPreview.funcionario) && (
                      <div className="os-field"><User size={14} /><div>
                        <strong>Funcionário{(osPreview.funcionariosAlocados?.length || 0) > 1 ? 's' : ''}:</strong>{' '}
                        {osPreview.funcionariosAlocados?.length > 0
                          ? osPreview.funcionariosAlocados.map((sf: any) => sf.funcionario?.nome).filter(Boolean).join(', ')
                          : osPreview.funcionario.nome}
                      </div></div>
                    )}
                    {osPreview.descricao && <div className="os-field"><FileText size={14} /><div><strong>Descrição:</strong> {osPreview.descricao}</div></div>}
                    {osPreview.solicitante && <div className="os-field"><User size={14} /><div><strong>Responsável:</strong> {osPreview.solicitante}</div></div>}
                    {osPreview.contatoPagamento && <div className="os-field"><Phone size={14} /><div><strong>Contato:</strong> {osPreview.contatoPagamento}</div></div>}
                  </div>
                  <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: 12, marginTop: 12, fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    KLM Guindastes — Qualidade com Segurança
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleWhatsApp(osPreview)}>
                    <Share2 size={16} /> Abrir no WhatsApp
                  </button>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => handleCopyLink(osPreview)}>
                    <Link size={16} /> Copiar Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {toast && <div className="toast toast-success">{toast}</div>}
      </main>
    </div>
  );
}
