'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, MapPin, Calendar, Eye, Truck, User, Phone, DollarSign, AlertTriangle, FileText, Share2, Link } from 'lucide-react';
import { Sidebar, StatusBadge, tipoVeiculoLabels, tipoServicoLabels, statusServicoLabels, formatBrazilianPhone, isValidBrazilianPhone, generateOsText } from '@/components/shared';

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function ServicosPage() {
  const [user, setUser] = useState<any>(null);
  const [servicos, setServicos] = useState<any[]>([]);
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [osPreview, setOsPreview] = useState<any>(null);
  const [assignModal, setAssignModal] = useState<any>(null);
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState('');
  const router = useRouter();

  const defaultForm = {
    cliente: '', localidade: '', descricao: '',
    solicitante: '', contatoPagamento: '',
    dataInicio: '', dataFim: '',
    tipoVeiculoSolicitado: 'MUNCK', qtdVeiculos: '1',
    veiculoIds: [] as string[], funcionarioIds: [] as string[],
    tipoServico: 'POR_HORA', valores: '', formaPagamento: '',
    schedulingMode: 'byType' as 'byType' | 'byVehicle',
  };
  const [form, setForm] = useState(defaultForm);

  const fetchData = useCallback(async () => {
    try {
      const [userRes, servRes, veicRes, funcRes] = await Promise.all([
        fetch('/api/auth/me'), fetch('/api/servicos'), fetch('/api/veiculos'), fetch('/api/funcionarios'),
      ]);
      if (!userRes.ok) { router.push('/'); return; }
      setUser(await userRes.json());
      setServicos(await servRes.json());
      setVeiculos(await veicRes.json());
      setFuncionarios(await funcRes.json());
    } catch { router.push('/'); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const openAdd = () => { setEditing(null); setForm(defaultForm); setFormError(''); setModalOpen(true); };
  const openEdit = (s: any) => {
    setEditing(s);
    const existingVehicleIds: string[] = s.veiculosAlocados?.map((sv: any) => sv.veiculoId.toString()) ??
      (s.veiculoId ? [s.veiculoId.toString()] : []);
    setForm({
      cliente: s.cliente, localidade: s.localidade, descricao: s.descricao || '',
      solicitante: s.solicitante || '', contatoPagamento: s.contatoPagamento || '',
      dataInicio: s.dataInicio?.split('T')[0] || '', dataFim: s.dataFim?.split('T')[0] || '',
      tipoVeiculoSolicitado: s.tipoVeiculoSolicitado || 'MUNCK', qtdVeiculos: s.qtdVeiculos?.toString() || '1',
      veiculoIds: existingVehicleIds,
      funcionarioIds: s.funcionariosAlocados?.map((sf: any) => sf.funcionarioId.toString()) ?? (s.funcionarioId ? [s.funcionarioId.toString()] : []),
      tipoServico: s.tipoServico || 'POR_HORA', valores: s.valores || '', formaPagamento: s.formaPagamento || '',
      schedulingMode: existingVehicleIds.length > 0 ? 'byVehicle' : 'byType',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError('');
    // Front-end validation
    if (!form.cliente.trim()) { setFormError('Nome do cliente é obrigatório'); return; }
    if (!form.localidade.trim()) { setFormError('Localidade é obrigatória'); return; }
    if (!form.dataInicio) { setFormError('Data de início é obrigatória'); return; }
    if (form.schedulingMode === 'byType' && !form.tipoVeiculoSolicitado) { setFormError('Tipo de veículo é obrigatório'); return; }
    if (form.schedulingMode === 'byVehicle' && form.veiculoIds.length === 0) { setFormError('Selecione pelo menos um veículo'); return; }
    if (form.contatoPagamento && !isValidBrazilianPhone(form.contatoPagamento)) {
      setFormError('Telefone de contato deve seguir formato brasileiro: (XX) XXXXX-XXXX');
      return;
    }

    const method = editing ? 'PATCH' : 'POST';
    const url = editing ? `/api/servicos/${editing.id}` : '/api/servicos';
    const body: any = {
      cliente: form.cliente.trim(), localidade: form.localidade.trim(), descricao: form.descricao.trim(),
      solicitante: form.solicitante.trim(), contatoPagamento: form.contatoPagamento.trim(),
      dataInicio: form.dataInicio, dataFim: form.dataFim || null,
      tipoVeiculoSolicitado: form.schedulingMode === 'byType' ? form.tipoVeiculoSolicitado : null,
      qtdVeiculos: form.schedulingMode === 'byType' ? form.qtdVeiculos : form.veiculoIds.length.toString(),
      tipoServico: form.tipoServico, valores: form.valores.trim(), formaPagamento: form.formaPagamento.trim(),
      veiculoIds: form.schedulingMode === 'byVehicle' ? form.veiculoIds.map(Number) : [],
      funcionarioIds: form.funcionarioIds.map(Number),
    };

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) {
      setModalOpen(false);
      fetchData();
      showToast(editing ? 'OS atualizada com sucesso!' : 'OS criada com sucesso!');
    } else {
      const data = await res.json();
      setFormError(data.error || 'Erro ao salvar serviço');
    }
  };

  const handleAssign = async (servicoId: number, veiculoIds: string[], funcionarioIds: string[]) => {
    const body: any = { veiculoIds: veiculoIds.map(Number), funcionarioIds: funcionarioIds.map(Number) };
    await fetch(`/api/servicos/${servicoId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setAssignModal(null);
    fetchData();
    showToast('Veículo(s) alocado(s) com sucesso!');
  };

  const handleStatusChange = async (id: number, status: string) => {
    await fetch(`/api/servicos/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir este serviço?')) return;
    await fetch(`/api/servicos/${id}`, { method: 'DELETE' });
    fetchData();
    showToast('OS excluída');
  };

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
    const a = document.createElement('a');
    a.href = `https://wa.me/?text=${encodeURIComponent(text)}`;
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

  const statuses = ['TODOS', 'AGENDADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'];
  const filtered = filtroStatus === 'TODOS' ? servicos : servicos.filter((s: any) => s.status === filtroStatus);
  const isFinanceiro = user?.cargo === 'FINANCEIRO';
  const isOperacional = user?.cargo === 'OPERACIONAL';
  const availableVehicles = veiculos.filter((v: any) => v.status === 'DISPONIVEL');

  return (
    <div className="app-layout">
      <Sidebar user={user} sidebarOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Serviços / OS</h1>
            <p className="page-subtitle">Ordens de serviço e agendamentos</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Nova OS</button>
        </div>

        {/* Status filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {statuses.map((st) => (
            <button key={st} className={`btn ${filtroStatus === st ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setFiltroStatus(st)}>
              {st === 'TODOS' ? 'Todos' : statusServicoLabels[st] || st.replace('_', ' ')} ({st === 'TODOS' ? servicos.length : servicos.filter((s: any) => s.status === st).length})
            </button>
          ))}
        </div>

        <div className="content-section" style={{ overflowX: 'auto' }}>
          <table className="data-table service-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>OS#</th>
                <th style={{ minWidth: 120 }}>Cliente/Local</th>
                <th style={{ minWidth: 110 }}>Veículo/Op.</th>
                <th style={{ width: 90 }}>Data/Tipo</th>
                <th style={{ minWidth: 120 }}>Financeiro</th>
                <th style={{ width: 110 }}>Status</th>
                <th style={{ width: 100 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s: any) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 700, color: 'var(--amber-400)' }}>#{(s.numeroOS ?? s.id).toString().padStart(4, '0')}</td>
                  <td>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem' }}>{s.cliente}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', marginTop: 4 }}>
                      <MapPin size={11} style={{ color: 'var(--text-muted)' }} />
                      <span className="truncate" style={{ maxWidth: 140, display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.localidade}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500, marginBottom: 2 }}>
                      {s.veiculosAlocados?.length > 0
                        ? s.veiculosAlocados.map((sv: any) => sv.veiculo?.apelido || sv.veiculo?.nome).filter(Boolean).join(', ')
                        : s.veiculo ? (s.veiculo.apelido || s.veiculo.nome)
                        : <span style={{ color: 'var(--amber-400)' }}><AlertTriangle size={10} style={{ display: 'inline' }} /> {s.qtdVeiculos}x {tipoVeiculoLabels[s.tipoVeiculoSolicitado] || '?'}</span>}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {s.funcionariosAlocados?.length > 0
                        ? s.funcionariosAlocados.map((sf: any) => sf.funcionario?.nome).filter(Boolean).join(', ')
                        : s.funcionario ? s.funcionario.nome : 'Sem operador'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', marginBottom: 2 }}>{new Date(s.dataInicio).toLocaleDateString('pt-BR')}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tipoServicoLabels[s.tipoServico] || '—'}</div>
                  </td>
                  <td>
                    <div className="finance-cell" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {s.valores && <div className="finance-value" style={{ color: 'var(--green-400)', fontWeight: 600, fontSize: '0.85rem' }}><DollarSign size={11} style={{ verticalAlign: 'middle' }} /> {s.valores}</div>}
                      {s.formaPagamento && <div className="finance-payment" style={{ fontSize: '0.78rem', color: 'var(--text-primary)', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', width: 'fit-content' }}>{s.formaPagamento}</div>}
                      {s.contatoPagamento && (
                        <div className="finance-contact" style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={10} style={{ color: 'var(--green-400)' }} /> {s.contatoPagamento}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <select
                      className="form-input"
                      style={{ padding: '2px 4px', fontSize: '0.75rem', minWidth: 100 }}
                      value={s.status}
                      onChange={(e) => handleStatusChange(s.id, e.target.value)}
                    >
                      <option value="AGENDADO">Agendado</option>
                      <option value="EM_ANDAMENTO">Em Andamento</option>
                      <option value="CONCLUIDO">Concluído</option>
                      <option value="CANCELADO">Cancelado</option>
                    </select>
                  </td>
                  <td>
                    <div className="actions-cell" style={{ flexWrap: 'wrap' }}>
                      {(!s.veiculoId && (!s.veiculosAlocados || s.veiculosAlocados.length === 0)) && s.status !== 'CONCLUIDO' && s.status !== 'CANCELADO' && (
                        <button className="btn btn-primary btn-sm" style={{ fontSize: '0.7rem', padding: '4px 8px' }} onClick={() => setAssignModal(s)}>
                          <Truck size={13} /> Alocar
                        </button>
                      )}
                      <button className="btn-icon" title="Ver OS" onClick={() => setOsPreview(s)}><Eye size={15} /></button>
                      <button className="btn-icon" onClick={() => openEdit(s)} title="Editar">✏️</button>
                      <button className="btn-icon danger" onClick={() => handleDelete(s.id)} title="Excluir">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={12} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Nenhum serviço encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Create/Edit Modal */}
        {modalOpen && (
          <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">{editing ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}</h3>
                <button className="modal-close" onClick={() => setModalOpen(false)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                {formError && <div className="login-error" style={{ marginBottom: 16 }}>{formError}</div>}

                {/* Client info */}
                <div style={{ marginBottom: 16 }}>
                  <div className="form-section-title">Informações do Cliente</div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Cliente *</label>
                      <input className="form-input" placeholder="Nome da empresa" value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Solicitante</label>
                      <input className="form-input" placeholder="Nome do solicitante" value={form.solicitante} onChange={(e) => setForm({ ...form, solicitante: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Local *</label>
                      <input className="form-input" placeholder="Cidade, SP - Endereço" value={form.localidade} onChange={(e) => setForm({ ...form, localidade: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Contato Pagamento</label>
                      <input
                        className="form-input"
                        placeholder="(11) 99999-9999"
                        value={form.contatoPagamento}
                        onChange={(e) => setForm({ ...form, contatoPagamento: formatBrazilianPhone(e.target.value) })}
                      />
                      {form.contatoPagamento && !isValidBrazilianPhone(form.contatoPagamento) && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--red-400)', marginTop: 4, display: 'block' }}>Formato: (XX) XXXXX-XXXX</span>
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Descrição / Observações</label>
                    <textarea className="form-input" rows={2} placeholder="Detalhes do serviço..." value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
                  </div>
                </div>

                {/* Scheduling */}
                <div style={{ marginBottom: 16 }}>
                  <div className="form-section-title">Agendamento</div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Data Início *</label>
                      <input className="form-input" type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Data Fim</label>
                      <input className="form-input" type="date" value={form.dataFim} onChange={(e) => setForm({ ...form, dataFim: e.target.value })} />
                    </div>
                  </div>

                  {/* Two-step scheduling toggle */}
                  <div style={{ marginBottom: 12 }}>
                    <label className="form-label">Tipo de Alocação</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className={`btn ${form.schedulingMode === 'byType' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setForm({ ...form, schedulingMode: 'byType', veiculoIds: [] })}>
                        Por Tipo de Veículo
                      </button>
                      <button type="button" className={`btn ${form.schedulingMode === 'byVehicle' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setForm({ ...form, schedulingMode: 'byVehicle' })}>
                        Veículos Específicos
                      </button>
                    </div>
                  </div>

                  {form.schedulingMode === 'byType' ? (
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Tipo de Veículo *</label>
                        <select className="form-input" value={form.tipoVeiculoSolicitado} onChange={(e) => setForm({ ...form, tipoVeiculoSolicitado: e.target.value })}>
                          <option value="MUNCK">Munck</option>
                          <option value="GUINDASTE">Guindaste</option>
                          <option value="EMPILHADEIRA">Empilhadeira</option>
                          <option value="CARRETA">Carreta</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Quantidade</label>
                        <input className="form-input" type="number" min="1" value={form.qtdVeiculos} onChange={(e) => setForm({ ...form, qtdVeiculos: e.target.value })} />
                      </div>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="form-label">Veículos Específicos *</label>
                      <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 4, padding: 8 }}>
                        {availableVehicles.map((v: any) => {
                          const id = v.id.toString();
                          return (
                            <label key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={form.veiculoIds.includes(id)}
                                onChange={(e) => setForm({
                                  ...form,
                                  veiculoIds: e.target.checked
                                    ? [...form.veiculoIds, id]
                                    : form.veiculoIds.filter(x => x !== id)
                                })}
                              />
                              <span style={{ fontSize: '0.85rem' }}>{v.apelido || v.nome} — {tipoVeiculoLabels[v.tipo]} ({v.placa})</span>
                            </label>
                          );
                        })}
                        {editing && form.veiculoIds.filter(id => !availableVehicles.find((v: any) => v.id.toString() === id)).map(id => {
                          const sv = editing.veiculosAlocados?.find((sv: any) => sv.veiculoId.toString() === id);
                          const v = sv?.veiculo || (editing.veiculoId?.toString() === id ? editing.veiculo : null);
                          if (!v) return null;
                          return (
                            <label key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={true}
                                onChange={(e) => setForm({
                                  ...form,
                                  veiculoIds: e.target.checked
                                    ? [...form.veiculoIds, id]
                                    : form.veiculoIds.filter(x => x !== id)
                                })}
                              />
                              <span style={{ fontSize: '0.85rem' }}>{v.apelido || v.nome} — {tipoVeiculoLabels[v.tipo]} ({v.placa}) <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(atual)</span></span>
                            </label>
                          );
                        })}
                        {availableVehicles.length === 0 && form.veiculoIds.length === 0 && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--amber-400)', padding: 4 }}>Nenhum veículo disponível no momento</p>
                        )}
                      </div>
                      {form.veiculoIds.length > 0 && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--green-400)', marginTop: 4, display: 'block' }}>
                          {form.veiculoIds.length} veículo(s) selecionado(s)
                        </span>
                      )}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Funcionários</label>
                    <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 4, padding: 8 }}>
                      {funcionarios.map((f: any) => {
                        const fid = f.id.toString();
                        return (
                          <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={form.funcionarioIds.includes(fid)}
                              onChange={(e) => setForm({
                                ...form,
                                funcionarioIds: e.target.checked
                                  ? [...form.funcionarioIds, fid]
                                  : form.funcionarioIds.filter(x => x !== fid)
                              })}
                            />
                            <span style={{ fontSize: '0.85rem' }}>
                              {f.nome} — {f.funcao}
                              {f.status === 'TRABALHANDO' && <span style={{ color: 'var(--amber-400)', fontSize: '0.75rem', marginLeft: 6 }}>(trabalhando)</span>}
                            </span>
                          </label>
                        );
                      })}
                      {funcionarios.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: 4 }}>Nenhum funcionário cadastrado</p>}
                    </div>
                    {form.funcionarioIds.length > 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--green-400)', marginTop: 4, display: 'block' }}>
                        {form.funcionarioIds.length} funcionário(s) selecionado(s)
                      </span>
                    )}
                  </div>
                </div>

                {/* Financial */}
                <div>
                  <div className="form-section-title">Financeiro</div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Tipo de Serviço</label>
                      <select className="form-input" value={form.tipoServico} onChange={(e) => setForm({ ...form, tipoServico: e.target.value })}>
                        <option value="POR_HORA">Por Hora</option>
                        <option value="POR_HORA_KM">Por Hora + Km</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Forma de Pagamento</label>
                      <input className="form-input" placeholder="Ex: Boleto 30 dias" value={form.formaPagamento} onChange={(e) => setForm({ ...form, formaPagamento: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Valores / Preços</label>
                    <input className="form-input" placeholder="Ex: R$ 450/hora" value={form.valores} onChange={(e) => setForm({ ...form, valores: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSave}>{editing ? 'Salvar Alterações' : 'Criar OS'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Vehicle Modal */}
        {assignModal && (
          <div className="modal-overlay" onClick={() => setAssignModal(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <div className="modal-header">
                <h3 className="modal-title">Alocar Veículo — OS #{(assignModal.numeroOS ?? assignModal.id).toString().padStart(4, '0')}</h3>
                <button className="modal-close" onClick={() => setAssignModal(null)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 12, marginBottom: 16, border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Solicitado: <strong style={{ color: 'var(--amber-400)' }}>{assignModal.qtdVeiculos}x {tipoVeiculoLabels[assignModal.tipoVeiculoSolicitado]}</strong></div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cliente: <strong style={{ color: 'var(--text-primary)' }}>{assignModal.cliente}</strong></div>
                </div>

                <AssignForm
                  tipo={assignModal.tipoVeiculoSolicitado}
                  veiculos={availableVehicles}
                  funcionarios={funcionarios}
                  onAssign={(veiculoIds, funcionarioIds) => handleAssign(assignModal.id, veiculoIds, funcionarioIds)}
                />
              </div>
            </div>
          </div>
        )}

        {/* OS Preview Modal */}
        {osPreview && (
          <div className="modal-overlay" onClick={() => setOsPreview(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
              <div className="modal-header">
                <h3 className="modal-title">OS #{(osPreview.numeroOS ?? osPreview.id).toString().padStart(4, '0')}</h3>
                <button className="modal-close" onClick={() => setOsPreview(null)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                <div className="os-card">
                  <div className="os-card-header">
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--amber-400)' }}>KLM Guindastes — Ordem de Serviço</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: 4 }}>OS #{(osPreview.numeroOS ?? osPreview.id).toString().padStart(4, '0')}</div>
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
                    {osPreview.valores && <div className="os-field"><DollarSign size={14} /><div><strong>Valores:</strong> {osPreview.valores}</div></div>}
                    {osPreview.formaPagamento && <div className="os-field"><DollarSign size={14} /><div><strong>Pagamento:</strong> {osPreview.formaPagamento}</div></div>}
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

        {/* Toast */}
        {toast && <div className="toast toast-success">{toast}</div>}
      </main>
    </div>
  );
}

function AssignForm({ tipo, veiculos, funcionarios, onAssign }: { tipo: string; veiculos: any[]; funcionarios: any[]; onAssign: (vs: string[], fs: string[]) => void }) {
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
  const [selectedFuncIds, setSelectedFuncIds] = useState<string[]>([]);
  const filtered = veiculos.filter((v: any) => v.tipo === tipo);

  const toggleVehicle = (id: string) => {
    setSelectedVehicleIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleFunc = (id: string) => {
    setSelectedFuncIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <>
      <div className="form-group">
        <label className="form-label">Selecionar Veículos ({tipoVeiculoLabels[tipo]})</label>
        <div style={{ maxHeight: 140, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 4, padding: 8 }}>
          {filtered.map((v: any) => (
            <label key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedVehicleIds.includes(v.id.toString())}
                onChange={() => toggleVehicle(v.id.toString())}
              />
              <span style={{ fontSize: '0.85rem' }}>{v.apelido || v.nome} — {v.placa} ({v.capacidade}t)</span>
            </label>
          ))}
          {filtered.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--red-400)', padding: 4 }}>Nenhum {tipoVeiculoLabels[tipo]} disponível no momento</p>}
        </div>
        {selectedVehicleIds.length > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--green-400)', marginTop: 4, display: 'block' }}>{selectedVehicleIds.length} selecionado(s)</span>}
      </div>
      <div className="form-group">
        <label className="form-label">Funcionários (opcional)</label>
        <div style={{ maxHeight: 140, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 4, padding: 8 }}>
          {funcionarios.map((f: any) => (
            <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedFuncIds.includes(f.id.toString())}
                onChange={() => toggleFunc(f.id.toString())}
              />
              <span style={{ fontSize: '0.85rem' }}>
                {f.nome} — {f.funcao}
                {f.status === 'TRABALHANDO' && <span style={{ color: 'var(--amber-400)', fontSize: '0.75rem', marginLeft: 6 }}>(trabalhando)</span>}
              </span>
            </label>
          ))}
          {funcionarios.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: 4 }}>Nenhum funcionário cadastrado</p>}
        </div>
        {selectedFuncIds.length > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--green-400)', marginTop: 4, display: 'block' }}>{selectedFuncIds.length} funcionário(s) selecionado(s)</span>}
      </div>
      <div className="modal-footer" style={{ padding: '16px 0 0' }}>
        <button className="btn btn-primary" disabled={selectedVehicleIds.length === 0} onClick={() => onAssign(selectedVehicleIds, selectedFuncIds)}>
          Confirmar Alocação
        </button>
      </div>
    </>
  );
}
