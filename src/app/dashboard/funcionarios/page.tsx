'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, X, Phone } from 'lucide-react';
import { Sidebar, StatusBadge, funcaoLabels, formatBrazilianPhone, isValidBrazilianPhone } from '@/components/shared';

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function FuncionariosPage() {
  const [user, setUser] = useState<any>(null);
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [formError, setFormError] = useState('');
  const router = useRouter();

  const defaultForm = { nome: '', funcao: 'OPERADOR', telefone: '', status: 'FOLGA', observacoes: '' };
  const [form, setForm] = useState(defaultForm);

  const fetchData = useCallback(async () => {
    try {
      const [userRes, funcRes] = await Promise.all([fetch('/api/auth/me'), fetch('/api/funcionarios')]);
      if (!userRes.ok) { router.push('/'); return; }
      setUser(await userRes.json());
      setFuncionarios(await funcRes.json());
    } catch { router.push('/'); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setEditing(null); setForm(defaultForm); setFormError(''); setModalOpen(true); };
  const openEdit = (f: any) => {
    setEditing(f);
    setForm({ nome: f.nome, funcao: f.funcao, telefone: f.telefone || '', status: f.status, observacoes: f.observacoes || '' });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.nome.trim()) { setFormError('Nome é obrigatório'); return; }
    if (form.telefone && !isValidBrazilianPhone(form.telefone)) {
      setFormError('Telefone deve seguir formato brasileiro: (XX) XXXXX-XXXX');
      return;
    }

    const method = editing ? 'PATCH' : 'POST';
    const url = editing ? `/api/funcionarios/${editing.id}` : '/api/funcionarios';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { setModalOpen(false); fetchData(); }
    else {
      const data = await res.json();
      setFormError(data.error || 'Erro ao salvar funcionário');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir este funcionário?')) return;
    await fetch(`/api/funcionarios/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const toggleStatus = async (f: any) => {
    const newStatus = f.status === 'TRABALHANDO' ? 'FOLGA' : 'TRABALHANDO';
    await fetch(`/api/funcionarios/${f.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
    fetchData();
  };

  if (loading) return <div className="loading" style={{ minHeight: '100vh' }}><div className="loading-spinner" /></div>;

  return (
    <div className="app-layout">
      <Sidebar user={user} sidebarOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Funcionários</h1>
            <p className="page-subtitle">Gestão de operadores, mecânicos, auxiliares e encarregados</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Novo Funcionário</button>
        </div>

        <div className="content-section">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Função</th>
                <th>Telefone</th>
                <th>Status</th>
                <th>Observações</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {funcionarios.map((f: any) => (
                <tr key={f.id}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{f.nome}</td>
                  <td>{funcaoLabels[f.funcao] || f.funcao}</td>
                  <td>
                    {f.telefone ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Phone size={14} style={{ color: 'var(--green-400)' }} />
                        {f.telefone}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    <button onClick={() => toggleStatus(f)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} title="Alternar status">
                      <StatusBadge status={f.status} />
                    </button>
                  </td>
                  <td style={{ maxWidth: 180, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{f.observacoes || '—'}</td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn-icon" onClick={() => openEdit(f)} title="Editar"><Pencil size={16} /></button>
                      <button className="btn-icon danger" onClick={() => handleDelete(f.id)} title="Excluir"><Trash2 size={16} /></button>
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
                <h3 className="modal-title">{editing ? 'Editar Funcionário' : 'Novo Funcionário'}</h3>
                <button className="modal-close" onClick={() => setModalOpen(false)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                {formError && <div className="login-error" style={{ marginBottom: 16 }}>{formError}</div>}
                <div style={{ marginBottom: 16 }}>
                  <div className="form-section-title">Informações Pessoais</div>
                  <div className="form-group">
                  <label className="form-label">Nome *</label>
                  <input className="form-input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Função *</label>
                    <select className="form-input" value={form.funcao} onChange={(e) => setForm({ ...form, funcao: e.target.value })}>
                      <option value="OPERADOR">Operador</option>
                      <option value="MECANICO">Mecânico</option>
                      <option value="AUXILIAR">Auxiliar</option>
                      <option value="ENCARREGADO">Encarregado</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Telefone</label>
                    <input
                      className="form-input"
                      placeholder="(11) 99999-9999"
                      value={form.telefone}
                      onChange={(e) => setForm({ ...form, telefone: formatBrazilianPhone(e.target.value) })}
                    />
                    {form.telefone && !isValidBrazilianPhone(form.telefone) && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--red-400)', marginTop: 4, display: 'block' }}>Formato: (XX) XXXXX-XXXX</span>
                    )}
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
