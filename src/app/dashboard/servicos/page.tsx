'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, MapPin, Calendar, Eye, Truck, User, Phone, DollarSign, Copy, AlertTriangle, FileText } from 'lucide-react';
import { Sidebar, StatusBadge, tipoVeiculoLabels, tipoServicoLabels, statusServicoLabels, formatBrazilianPhone, isValidBrazilianPhone } from '@/components/shared';

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
    veiculoId: '', funcionarioId: '',
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
    setForm({
      cliente: s.cliente, localidade: s.localidade, descricao: s.descricao || '',
      solicitante: s.solicitante || '', contatoPagamento: s.contatoPagamento || '',
      dataInicio: s.dataInicio?.split('T')[0] || '', dataFim: s.dataFim?.split('T')[0] || '',
      tipoVeiculoSolicitado: s.tipoVeiculoSolicitado || 'MUNCK', qtdVeiculos: s.qtdVeiculos?.toString() || '1',
      veiculoId: s.veiculoId?.toString() || '', funcionarioId: s.funcionarioId?.toString() || '',
      tipoServico: s.tipoServico || 'POR_HORA', valores: s.valores || '', formaPagamento: s.formaPagamento || '',
      schedulingMode: s.veiculoId ? 'byVehicle' : 'byType',
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
    if (form.schedulingMode === 'byVehicle' && !form.veiculoId) { setFormError('Veículo específico é obrigatório'); return; }
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
      tipoVeiculoSolicitado: form.tipoVeiculoSolicitado,
      qtdVeiculos: form.qtdVeiculos,
      tipoServico: form.tipoServico, valores: form.valores.trim(), formaPagamento: form.formaPagamento.trim(),
    };
    if (form.schedulingMode === 'byVehicle' && form.veiculoId) {
      body.veiculoId = form.veiculoId;
    } else {
      body.veiculoId = null;
    }
    if (form.funcionarioId) body.funcionarioId = form.funcionarioId;

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

  const handleAssign = async (servicoId: number, veiculoId: string, funcionarioId: string) => {
    const body: any = {};
    if (veiculoId) body.veiculoId = veiculoId;
    if (funcionarioId) body.funcionarioId = funcionarioId;
    await fetch(`/api/servicos/${servicoId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setAssignModal(null);
    fetchData();
    showToast('Veículo alocado com sucesso!');
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

  const generateOsText = (s: any) => {
    return `*OS #${s.id.toString().padStart(4, '0')} — KLM Guindastes*\n` +
      `📋 Cliente: ${s.cliente}\n` +
      `📍 Local: ${s.localidade}\n` +
      `📅 Data: ${new Date(s.dataInicio).toLocaleDateString('pt-BR')}${s.dataFim ? ` até ${new Date(s.dataFim).toLocaleDateString('pt-BR')}` : ''}\n` +
      `🚛 Veículo: ${s.veiculo ? (s.veiculo.apelido || s.veiculo.nome) : 'A definir'}\n` +
      (s.funcionario ? `👷 Operador: ${s.funcionario.nome}\n` : '') +
      (s.descricao ? `📝 Descrição: ${s.descricao}\n` : '') +
      (s.solicitante ? `👤 Responsável: ${s.solicitante}\n` : '') +
      (s.contatoPagamento ? `📞 Contato: ${s.contatoPagamento}\n` : '') +
      `\n_KLM Guindastes — Qualidade com Segurança_`;
  };

  if (loading) return <div className="loading" style={{ minHeight: '100vh' }}><div className="loading-spinner" /></div>;

  const statuses = ['TODOS', 'AGENDADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'];
  const filtered = filtroStatus === 'TODOS' ? servicos : servicos.filter((s: any) => s.status === filtroStatus);
  const isFinanceiro = user?.cargo === 'FINANCEIRO';
  const isOperacional = user?.cargo === 'OPERACIONAL';
  const availableVehicles = veiculos.filter((v: any) => v.status === 'DISPONIVEL');
  const availableEmployees = funcionarios.filter((f: any) => f.status === 'FOLGA');

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
                  <td style={{ fontWeight: 700, color: 'var(--amber-400)' }}>#{s.id.toString().padStart(4, '0')}</td>
                  <td>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem' }}>{s.cliente}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', marginTop: 4 }}>
                      <MapPin size={11} style={{ color: 'var(--text-muted)' }} />
                      <span className="truncate" style={{ maxWidth: 140, display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.localidade}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500, marginBottom: 2 }}>
                      {s.veiculo ? (s.veiculo.apelido || s.veiculo.nome) : <span style={{ color: 'var(--amber-400)' }}><AlertTriangle size={10} style={{ display: 'inline' }} /> {s.qtdVeiculos}x {tipoVeiculoLabels[s.tipoVeiculoSolicitado] || '?'}</span>}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.funcionario ? s.funcionario.nome : 'Sem operador'}</div>
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
                      {!s.veiculoId && s.status !== 'CONCLUIDO' && s.status !== 'CANCELADO' && (
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
                      <button type="button" className={`btn ${form.schedulingMode === 'byType' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setForm({ ...form, schedulingMode: 'byType', veiculoId: '' })}>
                        Por Tipo de Veículo
                      </button>
                      <button type="button" className={`btn ${form.schedulingMode === 'byVehicle' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setForm({ ...form, schedulingMode: 'byVehicle' })}>
                        Veículo Específico
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
                      <label className="form-label">Veículo Específico</label>
                      <select className="form-input" value={form.veiculoId} onChange={(e) => setForm({ ...form, veiculoId: e.target.value })}>
                        <option value="">Selecione...</option>
                        {availableVehicles.map((v: any) => (
                          <option key={v.id} value={v.id}>{v.apelido || v.nome} — {tipoVeiculoLabels[v.tipo]} ({v.placa})</option>
                        ))}
                        {editing?.veiculoId && !availableVehicles.find((v: any) => v.id === editing.veiculoId) && (
                          <option value={editing.veiculoId}>{editing.veiculo?.apelido || editing.veiculo?.nome} (atual)</option>
                        )}
                      </select>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Operador</label>
                    <select className="form-input" value={form.funcionarioId} onChange={(e) => setForm({ ...form, funcionarioId: e.target.value })}>
                      <option value="">A definir depois...</option>
                      {availableEmployees.map((f: any) => (
                        <option key={f.id} value={f.id}>{f.nome} — {f.funcao}</option>
                      ))}
                      {editing?.funcionarioId && !availableEmployees.find((f: any) => f.id === editing.funcionarioId) && (
                        <option value={editing.funcionarioId}>{editing.funcionario?.nome} (atual)</option>
                      )}
                    </select>
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
                <h3 className="modal-title">Alocar Veículo — OS #{assignModal.id.toString().padStart(4, '0')}</h3>
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
                  funcionarios={availableEmployees}
                  onAssign={(veiculoId, funcionarioId) => handleAssign(assignModal.id, veiculoId, funcionarioId)}
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
                <h3 className="modal-title">OS #{osPreview.id.toString().padStart(4, '0')}</h3>
                <button className="modal-close" onClick={() => setOsPreview(null)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                <div className="os-card">
                  <div className="os-card-header">
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--amber-400)' }}>KLM Guindastes — Ordem de Serviço</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: 4 }}>OS #{osPreview.id.toString().padStart(4, '0')}</div>
                  </div>
                  <div className="os-card-body">
                    <div className="os-field"><Truck size={14} /><div><strong>Cliente:</strong> {osPreview.cliente}</div></div>
                    <div className="os-field"><MapPin size={14} /><div><strong>Local:</strong> {osPreview.localidade}</div></div>
                    <div className="os-field"><Calendar size={14} /><div><strong>Data:</strong> {new Date(osPreview.dataInicio).toLocaleDateString('pt-BR')}{osPreview.dataFim ? ` até ${new Date(osPreview.dataFim).toLocaleDateString('pt-BR')}` : ''}</div></div>
                    <div className="os-field"><Truck size={14} /><div><strong>Veículo:</strong> {osPreview.veiculo ? (osPreview.veiculo.apelido || osPreview.veiculo.nome) : 'A definir'}</div></div>
                    {osPreview.funcionario && <div className="os-field"><User size={14} /><div><strong>Operador:</strong> {osPreview.funcionario.nome}</div></div>}
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
                <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={() => {
                  navigator.clipboard?.writeText(generateOsText(osPreview));
                  showToast('OS copiada! Cole no WhatsApp.');
                }}>
                  <Copy size={16} /> Copiar OS para WhatsApp
                </button>
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

function AssignForm({ tipo, veiculos, funcionarios, onAssign }: { tipo: string; veiculos: any[]; funcionarios: any[]; onAssign: (v: string, f: string) => void }) {
  const [veiculoId, setVeiculoId] = useState('');
  const [funcionarioId, setFuncionarioId] = useState('');
  const filtered = veiculos.filter((v: any) => v.tipo === tipo);

  return (
    <>
      <div className="form-group">
        <label className="form-label">Selecione o Veículo ({tipoVeiculoLabels[tipo]})</label>
        <select className="form-input" value={veiculoId} onChange={(e) => setVeiculoId(e.target.value)}>
          <option value="">Selecione...</option>
          {filtered.map((v: any) => (
            <option key={v.id} value={v.id}>{v.apelido || v.nome} — {v.placa} ({v.capacidade}t)</option>
          ))}
        </select>
        {filtered.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--red-400)', marginTop: 4 }}>Nenhum {tipoVeiculoLabels[tipo]} disponível no momento</p>}
      </div>
      <div className="form-group">
        <label className="form-label">Atribuir Operador (opcional)</label>
        <select className="form-input" value={funcionarioId} onChange={(e) => setFuncionarioId(e.target.value)}>
          <option value="">Definir depois...</option>
          {funcionarios.map((f: any) => (
            <option key={f.id} value={f.id}>{f.nome} — {f.funcao}</option>
          ))}
        </select>
      </div>
      <div className="modal-footer" style={{ padding: '16px 0 0' }}>
        <button className="btn btn-primary" disabled={!veiculoId} onClick={() => onAssign(veiculoId, funcionarioId)}>
          Confirmar Alocação
        </button>
      </div>
    </>
  );
}
