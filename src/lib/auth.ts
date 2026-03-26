import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

export async function login(email: string, senha: string) {
  const user = await prisma.usuario.findUnique({ where: { email } });
  if (!user) return null;

  const match = await bcrypt.compare(senha, user.senha);
  
  if (!match) return null;

  const cookieStore = await cookies();
  cookieStore.set('session', JSON.stringify({ id: user.id, nome: user.nome, cargo: user.cargo }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return { id: user.id, nome: user.nome, cargo: user.cargo, email: user.email };
}

const DEFAULT_SESSION = { id: 0, nome: 'KLM Guindastes', cargo: 'COMERCIAL' } as const;

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session');
  if (!session) return DEFAULT_SESSION;
  try {
    return JSON.parse(session.value) as { id: number; nome: string; cargo: string };
  } catch {
    return DEFAULT_SESSION;
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}
