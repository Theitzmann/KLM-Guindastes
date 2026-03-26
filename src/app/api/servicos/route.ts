import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

const SERVICO_INCLUDE = {
  veiculo: true,
  veiculosAlocados: { include: { veiculo: true } },
  funcionario: true,
  criadoPor: { select: { id: true, nome: true } },
};

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const servicos = await prisma.servico.findMany({
    orderBy: { criadoEm: 'desc' },
    include: SERVICO_INCLUDE,
  });
  return NextResponse.json(servicos);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  try {
    const data = await request.json();

    // Validation
    const errors: string[] = [];
    if (!data.cliente?.trim()) errors.push('Nome do cliente é obrigatório');
    if (!data.localidade?.trim()) errors.push('Localidade é obrigatória');
    if (!data.dataInicio) errors.push('Data de início é obrigatória');
    const veiculoIds: number[] = Array.isArray(data.veiculoIds)
      ? data.veiculoIds.map(Number).filter(Boolean)
      : data.veiculoId ? [Number(data.veiculoId)] : [];
    if (veiculoIds.length === 0 && !data.tipoVeiculoSolicitado?.trim()) {
      errors.push('Especifique um veículo ou tipo de veículo');
    }
    if (data.contatoPagamento?.trim()) {
      const digits = data.contatoPagamento.replace(/\D/g, '');
      if (digits.length !== 10 && digits.length !== 11) errors.push('Telefone de contato deve ter 10 ou 11 dígitos');
    }
    if (errors.length > 0) return NextResponse.json({ error: errors.join('; ') }, { status: 400 });

    // Create OS with sequential numeroOS inside a transaction
    const servico = await prisma.$transaction(async (tx) => {
      const agg = await tx.servico.aggregate({ _max: { numeroOS: true } });
      const numeroOS = (agg._max.numeroOS ?? 0) + 1;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return tx.servico.create({
        data: {
          numeroOS,
          cliente: data.cliente.trim(),
          localidade: data.localidade.trim(),
          descricao: data.descricao?.trim() || null,
          solicitante: data.solicitante?.trim() || null,
          contatoPagamento: data.contatoPagamento?.trim() || null,
          dataInicio: new Date(data.dataInicio),
          dataFim: data.dataFim ? new Date(data.dataFim) : null,
          status: 'AGENDADO',
          tipoVeiculoSolicitado: data.tipoVeiculoSolicitado || null,
          qtdVeiculos: data.qtdVeiculos ? parseInt(data.qtdVeiculos) : 1,
          veiculoId: veiculoIds[0] ?? null,
          funcionarioId: data.funcionarioId ? parseInt(data.funcionarioId) : null,
          tipoServico: data.tipoServico || null,
          valores: data.valores?.trim() || null,
          formaPagamento: data.formaPagamento?.trim() || null,
          criadoPorId: session.id > 0 ? Number(session.id) : null,
          veiculosAlocados: veiculoIds.length > 0
            ? { create: veiculoIds.map(vid => ({ veiculoId: vid })) }
            : undefined,
        } as any,
        include: SERVICO_INCLUDE,
      });
    });

    // Update vehicle and employee statuses
    if (veiculoIds.length > 0) {
      await prisma.veiculo.updateMany({ where: { id: { in: veiculoIds } }, data: { status: 'EM_USO' } });
    }
    if (data.funcionarioId) {
      await prisma.funcionario.update({ where: { id: parseInt(data.funcionarioId) }, data: { status: 'TRABALHANDO' } });
    }

    return NextResponse.json(servico, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao criar serviço';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
