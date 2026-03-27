'use client';

import { usePathname } from 'next/navigation';
import {
  Truck, Users, ClipboardList, LayoutDashboard,
  X, Menu, DollarSign
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

/* eslint-disable @typescript-eslint/no-explicit-any */

// ===== Validation Helpers =====
export function isValidBrazilianPhone(phone: string): boolean {
  if (!phone) return true; // optional field
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 11;
}

export function formatBrazilianPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function isValidEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

// ===== Sidebar =====
export function Sidebar({ user, sidebarOpen, onToggle }: { user: any; sidebarOpen: boolean; onToggle: () => void }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Painel' },
    { href: '/dashboard/veiculos', icon: Truck, label: 'Veículos' },
    { href: '/dashboard/funcionarios', icon: Users, label: 'Funcionários' },
    { href: '/dashboard/servicos', icon: ClipboardList, label: 'Serviços / OS' },
    { href: '/dashboard/financeiro', icon: DollarSign, label: 'Assuntos Financeiros' },
  ];

  const cargoLabels: Record<string, string> = {
    COMERCIAL: 'Comercial',
    OPERACIONAL: 'Operacional',
    FINANCEIRO: 'Financeiro',
  };

  return (
    <>
      {sidebarOpen && (
        <div 
          onClick={onToggle}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', zIndex: 90, animation: 'fadeIn 0.2s ease-out' }}
        />
      )}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <Image src="/logo-klm.png" alt="KLM" width={96} height={66} style={{ borderRadius: 8, objectFit: 'contain' }} />
          <div>
            <h1>KLM Guindastes</h1>
            <span>Controle de Operações</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Menu Principal</div>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${pathname === item.href ? 'active' : ''}`}
              onClick={() => { if (sidebarOpen) onToggle(); }}
            >
              <item.icon className="nav-link-icon" size={20} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-avatar">{user?.nome?.charAt(0) || 'U'}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.nome}</div>
            <div className="sidebar-user-role">{cargoLabels[user?.cargo] || user?.cargo}</div>
          </div>
        </div>
      </aside>

      <button className="mobile-menu-btn" onClick={onToggle}>
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </>
  );
}

// ===== Status Badges =====
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    DISPONIVEL: { label: 'Disponível', cls: 'badge-disponivel' },
    EM_USO: { label: 'Em Uso', cls: 'badge-em-uso' },
    MANUTENCAO: { label: 'Manutenção', cls: 'badge-manutencao' },
    TRABALHANDO: { label: 'Trabalhando', cls: 'badge-trabalhando' },
    FOLGA: { label: 'Folga', cls: 'badge-folga' },
    AGENDADO: { label: 'Agendado', cls: 'badge-agendado' },
    EM_ANDAMENTO: { label: 'Em Andamento', cls: 'badge-em-andamento' },
    CONCLUIDO: { label: 'Concluído', cls: 'badge-concluido' },
    CANCELADO: { label: 'Cancelado', cls: 'badge-cancelado' },
  };
  const s = map[status] || { label: status, cls: '' };
  return (
    <span className={`badge ${s.cls}`}>
      <span className="badge-dot" />
      {s.label}
    </span>
  );
}

// ===== Label Maps =====
export const tipoVeiculoLabels: Record<string, string> = {
  MUNCK: 'Munck',
  GUINDASTE: 'Guindaste',
  EMPILHADEIRA: 'Empilhadeira',
  CARRETA: 'Carreta',
};

export const tipoServicoLabels: Record<string, string> = {
  POR_HORA: 'Por Hora',
  POR_HORA_KM: 'Por Hora + Km',
};

export const funcaoLabels: Record<string, string> = {
  OPERADOR: 'Operador',
  MECANICO: 'Mecânico',
  AUXILIAR: 'Auxiliar',
  ENCARREGADO: 'Encarregado',
};

export const statusServicoLabels: Record<string, string> = {
  AGENDADO: 'Agendado',
  EM_ANDAMENTO: 'Em Andamento',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};

// ===== OS Sharing =====
export function generateOsText(s: any): string {
  return `*OS #${s.id.toString().padStart(4, '0')} — KLM Guindastes*\n` +
    `📋 Cliente: ${s.cliente}\n` +
    `📍 Local: ${s.localidade}\n` +
    `📅 Data: ${new Date(s.dataInicio).toLocaleDateString('pt-BR')}${s.dataFim ? ` até ${new Date(s.dataFim).toLocaleDateString('pt-BR')}` : ''}\n` +
    `🚛 Veículo: ${s.veiculo ? (s.veiculo.apelido || s.veiculo.nome) : 'A definir'}\n` +
    (s.funcionario ? `👷 Operador: ${s.funcionario.nome}\n` : '') +
    (s.descricao ? `📝 Descrição: ${s.descricao}\n` : '') +
    (s.solicitante ? `👤 Responsável: ${s.solicitante}\n` : '') +
    `\n_KLM Guindastes — Qualidade com Segurança_`;
}
