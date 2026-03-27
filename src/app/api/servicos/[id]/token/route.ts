import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const servicoId = parseInt(id);
  if (isNaN(servicoId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  const servico = await prisma.servico.findUnique({ where: { id: servicoId } });
  if (!servico) return NextResponse.json({ error: 'OS não encontrada' }, { status: 404 });

  // Idempotent: return existing token if already generated
  if (servico.tokenPublico) {
    return NextResponse.json({ token: servico.tokenPublico });
  }

  const token = crypto.randomUUID();
  await prisma.servico.update({
    where: { id: servicoId },
    data: { tokenPublico: token },
  });

  return NextResponse.json({ token });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const servicoId = parseInt(id);
  if (isNaN(servicoId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  const servico = await prisma.servico.findUnique({ where: { id: servicoId } });
  if (!servico) return NextResponse.json({ error: 'OS não encontrada' }, { status: 404 });

  await prisma.servico.update({
    where: { id: servicoId },
    data: { tokenPublico: null, tokenExpiraEm: null },
  });

  return NextResponse.json({ ok: true });
}
