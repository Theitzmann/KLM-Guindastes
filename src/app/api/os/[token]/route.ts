import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Public route — no authentication required
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const servico = await prisma.servico.findUnique({
    where: { tokenPublico: token },
    include: {
      veiculo: { select: { apelido: true, nome: true, tipo: true, placa: true, capacidade: true } },
      veiculosAlocados: { include: { veiculo: { select: { apelido: true, nome: true, tipo: true, placa: true, capacidade: true } } } },
      funcionario: { select: { nome: true, funcao: true, telefone: true } },
      funcionariosAlocados: { include: { funcionario: { select: { nome: true, funcao: true, telefone: true } } } },
    },
  });

  if (!servico) return NextResponse.json({ error: 'OS não encontrada' }, { status: 404 });

  if (servico.tokenExpiraEm && servico.tokenExpiraEm < new Date()) {
    return NextResponse.json({ error: 'Link expirado' }, { status: 410 });
  }

  // Return only fields relevant to the field worker — exclude financial data
  return NextResponse.json({
    id: servico.id,
    numeroOS: servico.numeroOS,
    cliente: servico.cliente,
    localidade: servico.localidade,
    descricao: servico.descricao,
    solicitante: servico.solicitante,
    dataInicio: servico.dataInicio,
    dataFim: servico.dataFim,
    status: servico.status,
    tipoVeiculoSolicitado: servico.tipoVeiculoSolicitado,
    qtdVeiculos: servico.qtdVeiculos,
    veiculo: servico.veiculo,
    veiculosAlocados: servico.veiculosAlocados,
    funcionario: servico.funcionario,
    funcionariosAlocados: servico.funcionariosAlocados,
  });
}
