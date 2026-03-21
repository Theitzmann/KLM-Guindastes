'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { Sidebar, StatusBadge, tipoVeiculoLabels } from '@/components/shared';

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function VeiculosPage() {
  const [user, setUser] = useState<any>(null);
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [filtro, setFiltro] = useState('TODOS');
  const [formError, setFormError] = useState('');
  const router = useRouter();

  const defaultForm = { nome: '', apelido: '', tipo: 'MUNCK', placa: '', capacidade: '', status: 'DISPONIVEL', observacoes: '' };
  const [form, setForm] = useState(defaultForm);

  const fetchData = useCallback(async () => {
    try {
      const [userRes, veicRes] = await Promise.all([fetch('/api/auth/me'), fetch('/api/veiculos')]);
      if (!userRes.ok) { router.push('/'); return; }
      setUser(await userRes.json());
      setVeiculos(await veicRes.json());
    } catch { router.push('/'); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setEditing(null); setForm(defaultForm); setFormError(''); setModalOpen(true); };
  const openEdit = (v: any) => {
    setEditing(v);
    setForm({ nome: v.nome, apelido: v.apelido || '', tipo: v.tipo, placa: v.placa, capacidade: v.capacidade?.toString() || '', status: v.status, observacoes: v.observacoes || '' });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.nome.trim()) { setFormError('Nome / Modelo é obrigatório'); return; }
    if (!form.placa.trim()) { setFormError('Placa é obrigatória'); return; }

    const method = editing ? 'PATCH' : 'POST';
    const url = editing ? `/api/veiculos/${editing.id}` : '/api/veiculos';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { setModalOpen(false); fetchData(); }
    else {
      const data = await res.json();
      setFormError(data.error || 'Erro ao salvar veículo');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir este veículo?')) return;
    await fetch(`/api/veiculos/${id}`, { method: 'DELETE' });
    fetchData();
  };

  if (loading) return <div className="loading" style={{ minHeight: '100vh' }}><div className="loading-spinner" /></div>;

  const filtered = filtro === 'TODOS' ? veiculos : veiculos.filter((v: any) => v.tipo === filtro);

  return (
    <div className="app-layout">
      <Sidebar user={user} sidebarOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Veículos</h1>
            <p className="page-subtitle">Gestão da frota de muncks, guindastes e empilhadeiras</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Novo Veículo</button>
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {['TODOS', 'MUNCK', 'GUINDASTE', 'EMPILHADEIRA', 'CARRETA'].map((tipo) => (
            <button key={tipo} className={`btn ${filtro === tipo ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setFiltro(tipo)}>
              {tipo === 'TODOS' ? 'Todos' : tipoVeiculoLabels[tipo]} ({tipo === 'TODOS' ? veiculos.length : veiculos.filter((v: any) => v.tipo === tipo).length})
            </button>
          ))}
        </div>

        <div className="content-section">
          <table className="data-table">
            <thead>
              <tr>
                <th>Veículo</th>
                <th>Tipo</th>
                <th>Placa</th>
                <th>Capacidade</th>
                <th>Status</th>
                <th>Observações</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v: any) => (
                <tr key={v.id}>
                  <td>
                    {v.apelido && <div style={{ color: 'var(--amber-400)', fontWeight: 700, fontSize: '0.85rem' }}>{v.apelido}</div>}
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{v.nome}</div>
                  </td>
                  <td>{tipoVeiculoLabels[v.tipo] || v.tipo}</td>
                  <td><code style={{ background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 4, fontSize: '0.8rem' }}>{v.placa}</code></td>
                  <td>{v.capacidade ? `${v.capacidade}t` : '—'}</td>
                  <td><StatusBadge status={v.status} /></td>
                  <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem', color: 'var(--text-muted)' }} title={v.observacoes || ''}>{v.observacoes || '—'}</td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn-icon" onClick={() => openEdit(v)} title="Editar"><Pencil size={16} /></button>
                      <button className="btn-icon danger" onClick={() => handleDelete(v.id)} title="Excluir"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">{editing ? 'Editar Veículo' : 'Novo Veículo'}</h3>
                <button className="modal-close" onClick={() => setModalOpen(false)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                {formError && <div className="login-error" style={{ marginBottom: 16 }}>{formError}</div>}
                <div style={{ marginBottom: 16 }}>
                  <div className="form-section-title">Informações do Veículo</div>
                  <div className="form-group">
                  <label className="form-label">Apelido Interno</label>
                  <input className="form-input" placeholder="Ex: Munck 01, Guindaste 40" value={form.apelido} onChange={(e) => setForm({ ...form, apelido: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Nome / Modelo *</label>
                  <input className="form-input" placeholder="Ex: Munck Madal MD 12000" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Tipo *</label>
                    <select className="form-input" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                      <option value="MUNCK">Munck</option>
                      <option value="GUINDASTE">Guindaste</option>
                      <option value="EMPILHADEIRA">Empilhadeira</option>
                      <option value="CARRETA">Carreta</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Placa *</label>
                    <input className="form-input" placeholder="ABC-1234" value={form.placa} onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Capacidade (t)</label>
                    <input className="form-input" type="number" step="0.1" placeholder="Ex: 12" value={form.capacidade} onChange={(e) => setForm({ ...form, capacidade: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option value="DISPONIVEL">Disponível</option>
                      <option value="EM_USO">Em Uso</option>
                      <option value="MANUTENCAO">Manutenção</option>
                    </select>
                  </div>
                </div>
                  <div className="form-group">
                    <label className="form-label">Observações</label>
                    <textarea className="form-input" rows={2} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSave}>{editing ? 'Salvar' : 'Criar'}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
