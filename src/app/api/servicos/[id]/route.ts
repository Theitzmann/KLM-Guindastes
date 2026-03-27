import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

const SERVICO_INCLUDE = {
  veiculo: true,
  veiculosAlocados: { include: { veiculo: true } },
  funcionario: true,
  funcionariosAlocados: { include: { funcionario: true } },
  criadoPor: { select: { id: true, nome: true } },
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const servico = await prisma.servico.findUnique({
    where: { id: parseInt(id) },
    include: SERVICO_INCLUDE,
  });
  if (!servico) return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
  return NextResponse.json(servico);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  try {
    const { id } = await params;
    const servicoId = parseInt(id);
    const data = await request.json();

    // Validation
    if (data.cliente !== undefined && (!data.cliente || !data.cliente.trim())) {
      return NextResponse.json({ error: 'Nome do cliente não pode ser vazio' }, { status: 400 });
    }
    if (data.localidade !== undefined && (!data.localidade || !data.localidade.trim())) {
      return NextResponse.json({ error: 'Localidade não pode ser vazia' }, { status: 400 });
    }
    if (data.dataInicio !== undefined && !data.dataInicio) {
      return NextResponse.json({ error: 'Data de início não pode ser vazia' }, { status: 400 });
    }
    if (data.contatoPagamento && typeof data.contatoPagamento === 'string' && data.contatoPagamento.trim()) {
      const digits = data.contatoPagamento.replace(/\D/g, '');
      if (digits.length !== 10 && digits.length !== 11) {
        return NextResponse.json({ error: 'Telefone de contato deve ter 10 ou 11 dígitos' }, { status: 400 });
      }
    }

    // Update scalar fields
    const servico = await prisma.servico.update({
      where: { id: servicoId },
      data: {
        ...(data.cliente && { cliente: data.cliente.trim() }),
        ...(data.localidade && { localidade: data.localidade.trim() }),
        ...(data.descricao !== undefined && { descricao: data.descricao?.trim() || null }),
        ...(data.solicitante !== undefined && { solicitante: data.solicitante?.trim() || null }),
        ...(data.contatoPagamento !== undefined && { contatoPagamento: data.contatoPagamento?.trim() || null }),
        ...(data.dataInicio && { dataInicio: new Date(data.dataInicio) }),
        ...(data.dataFim !== undefined && { dataFim: data.dataFim ? new Date(data.dataFim) : null }),
        ...(data.status && { status: data.status }),
        ...(data.tipoVeiculoSolicitado && { tipoVeiculoSolicitado: data.tipoVeiculoSolicitado }),
        ...(data.qtdVeiculos && { qtdVeiculos: parseInt(data.qtdVeiculos) }),
        ...(data.funcionarioId !== undefined && !data.funcionarioIds && { funcionarioId: data.funcionarioId ? parseInt(data.funcionarioId) : null }),
        ...(data.tipoServico !== undefined && { tipoServico: data.tipoServico }),
        ...(data.valores !== undefined && { valores: data.valores?.trim() || null }),
        ...(data.formaPagamento !== undefined && { formaPagamento: data.formaPagamento?.trim() || null }),
      },
      include: SERVICO_INCLUDE,
    });

    // Sync multi-vehicle junction table
    if (data.veiculoIds !== undefined) {
      const newIds: number[] = Array.isArray(data.veiculoIds) ? data.veiculoIds.map(Number).filter(Boolean) : [];
      const current = await prisma.servicoVeiculo.findMany({ where: { servicoId } });
      const currentIds = current.map(sv => sv.veiculoId);

      const toAdd = newIds.filter(vid => !currentIds.includes(vid));
      const toRemove = currentIds.filter(vid => !newIds.includes(vid));

      if (toRemove.length > 0) {
        await prisma.servicoVeiculo.deleteMany({ where: { servicoId, veiculoId: { in: toRemove } } });
        await prisma.veiculo.updateMany({ where: { id: { in: toRemove } }, data: { status: 'DISPONIVEL' } });
      }
      if (toAdd.length > 0) {
        await prisma.servicoVeiculo.createMany({ data: toAdd.map(vid => ({ servicoId, veiculoId: vid })) });
        await prisma.veiculo.updateMany({ where: { id: { in: toAdd } }, data: { status: 'EM_USO' } });
      }

      // Keep legacy veiculoId in sync with first vehicle
      await prisma.servico.update({ where: { id: servicoId }, data: { veiculoId: newIds[0] ?? null } });
    } else if (data.veiculoId !== undefined) {
      // Legacy single-vehicle assignment (from assign modal or old clients)
      const newVehicleId = data.veiculoId ? parseInt(data.veiculoId) : null;
      if (newVehicleId) {
        const exists = await prisma.servicoVeiculo.findUnique({
          where: { servicoId_veiculoId: { servicoId, veiculoId: newVehicleId } },
        });
        if (!exists) {
          await prisma.servicoVeiculo.create({ data: { servicoId, veiculoId: newVehicleId } });
        }
        await prisma.veiculo.update({ where: { id: newVehicleId }, data: { status: 'EM_USO' } });
        await prisma.servico.update({ where: { id: servicoId }, data: { veiculoId: newVehicleId } });
      }
    }

    // Sync multi-employee junction table
    if (data.funcionarioIds !== undefined) {
      const newFuncIds: number[] = Array.isArray(data.funcionarioIds) ? data.funcionarioIds.map(Number).filter(Boolean) : [];
      const currentFunc = await prisma.servicoFuncionario.findMany({ where: { servicoId } });
      const currentFuncIds = currentFunc.map(sf => sf.funcionarioId);

      const toAddFunc = newFuncIds.filter(fid => !currentFuncIds.includes(fid));
      const toRemoveFunc = currentFuncIds.filter(fid => !newFuncIds.includes(fid));

      if (toRemoveFunc.length > 0) {
        await prisma.servicoFuncionario.deleteMany({ where: { servicoId, funcionarioId: { in: toRemoveFunc } } });
        // Only set FOLGA if not assigned to another active service
        for (const fid of toRemoveFunc) {
          const otherActive = await prisma.servicoFuncionario.findFirst({ where: { funcionarioId: fid, servicoId: { not: servicoId } } });
          if (!otherActive) {
            await prisma.funcionario.update({ where: { id: fid }, data: { status: 'FOLGA' } });
          }
        }
      }
      if (toAddFunc.length > 0) {
        await prisma.servicoFuncionario.createMany({ data: toAddFunc.map(fid => ({ servicoId, funcionarioId: fid })) });
        await prisma.funcionario.updateMany({ where: { id: { in: toAddFunc } }, data: { status: 'TRABALHANDO' } });
      }

      // Keep legacy funcionarioId in sync with first employee
      await prisma.servico.update({ where: { id: servicoId }, data: { funcionarioId: newFuncIds[0] ?? null } });
    } else if (data.funcionarioId && data.funcionarioId !== 'null') {
      // Legacy single-employee assignment
      const fid = parseInt(data.funcionarioId);
      const exists = await prisma.servicoFuncionario.findUnique({
        where: { servicoId_funcionarioId: { servicoId, funcionarioId: fid } },
      });
      if (!exists) {
        await prisma.servicoFuncionario.create({ data: { servicoId, funcionarioId: fid } });
      }
      await prisma.funcionario.update({ where: { id: fid }, data: { status: 'TRABALHANDO' } });
    }

    // Release all resources when completed or cancelled
    if (data.status === 'CONCLUIDO' || data.status === 'CANCELADO') {
      const allJunction = await prisma.servicoVeiculo.findMany({ where: { servicoId } });
      const allVehicleIds = [...new Set([
        ...allJunction.map(r => r.veiculoId),
        ...(servico.veiculoId ? [servico.veiculoId] : []),
      ])];
      if (allVehicleIds.length > 0) {
        await prisma.veiculo.updateMany({ where: { id: { in: allVehicleIds } }, data: { status: 'DISPONIVEL' } });
      }
      // Release all employees in junction table
      const allFuncJunction = await prisma.servicoFuncionario.findMany({ where: { servicoId } });
      const allFuncIds = [...new Set([
        ...allFuncJunction.map(sf => sf.funcionarioId),
        ...(servico.funcionarioId ? [servico.funcionarioId] : []),
      ])];
      if (allFuncIds.length > 0) {
        await prisma.funcionario.updateMany({ where: { id: { in: allFuncIds } }, data: { status: 'FOLGA' } });
      }
    }

    // Return fresh data with all relations
    const updated = await prisma.servico.findUnique({ where: { id: servicoId }, include: SERVICO_INCLUDE });
    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar serviço';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  try {
    const { id } = await params;
    const servicoId = parseInt(id);
    const servico = await prisma.servico.findUnique({
      where: { id: servicoId },
      include: { veiculosAlocados: true, funcionariosAlocados: true },
    });

    if (servico) {
      // Release all vehicles (junction + legacy)
      const allVehicleIds = [...new Set([
        ...servico.veiculosAlocados.map(sv => sv.veiculoId),
        ...(servico.veiculoId ? [servico.veiculoId] : []),
      ])];
      if (allVehicleIds.length > 0) {
        await prisma.veiculo.updateMany({ where: { id: { in: allVehicleIds } }, data: { status: 'DISPONIVEL' } });
      }
      // Release all employees
      const allFuncJunction = await prisma.servicoFuncionario.findMany({ where: { servicoId } });
      const allFuncIds = [...new Set([
        ...allFuncJunction.map(sf => sf.funcionarioId),
        ...(servico.funcionarioId ? [servico.funcionarioId] : []),
      ])];
      if (allFuncIds.length > 0) {
        await prisma.funcionario.updateMany({ where: { id: { in: allFuncIds } }, data: { status: 'FOLGA' } });
      }
    }

    // Junction records deleted via CASCADE
    await prisma.servico.delete({ where: { id: servicoId } });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao excluir serviço';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
