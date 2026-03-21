import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Removendo vínculos de veículos antigos...');
  await prisma.servico.updateMany({
    data: { veiculoId: null }
  });

  console.log('Removendo veículos antigos...');
  await prisma.veiculo.deleteMany();

  const novosVeiculos = [
    {
      nome: 'Guindaste 40t',
      apelido: 'Guindaste 40t',
      tipo: 'GUINDASTE',
      placa: 'KLM-4001',
      capacidade: 40,
      status: 'DISPONIVEL',
      observacoes: 'Marca: Sany\nModelo: STC400T5\nLança principal: 43,5m + Jib 8 metros\nCapacidade máxima de carga: 40 ton em um raio de 2,5 m\nAlcance horizontal máximo: 32 m\nAlcance vertical máximo: 52m'
    },
    {
      nome: 'Guindaste 90t',
      apelido: 'Guindaste Sany STC900T5',
      tipo: 'GUINDASTE',
      placa: 'KLM-9001',
      capacidade: 90,
      status: 'DISPONIVEL',
      observacoes: 'Marca: SANY\nModelo: STC900T5\nLança principal: 49,5m + extensão 9m + Jib 17,5 metros\nCapacidade máxima de carga: 90 ton em um raio de 2,5m\nAlcance horizontal máximo: 52m\nAlcance vertical máximo: 78m'
    },
    {
      nome: 'Guindauto ING 60500',
      apelido: 'Guindauto (Munck) ING 60500 com Fly-Jib',
      tipo: 'MUNCK',
      placa: 'KLM-6050',
      capacidade: 14,
      status: 'DISPONIVEL',
      observacoes: 'Marca: ING\nModelo: 60500\nCapacidade máxima de carga: 14 ton em um raio de 4m\nAlcance horizontal máximo: 26m\nAlcance vertical máximo: 30m'
    },
    {
      nome: 'Guindauto MADAL 45007',
      apelido: 'Guindauto (Munck) MADAL 45007',
      tipo: 'MUNCK',
      placa: 'KLM-4500',
      capacidade: 10.9,
      status: 'DISPONIVEL',
      observacoes: 'Marca: MADAL\nModelo: 45007\nCapacidade máxima de carga: 10,9 ton em um raio de 4 m\nAlcance horizontal máximo: 17,5 m\nAlcance vertical máximo: 20 m'
    },
    {
      nome: 'Guindauto Luna 45.5',
      apelido: 'Guindauto (Munck) Luna 45.5',
      tipo: 'MUNCK',
      placa: 'KLM-4550',
      capacidade: 10.5,
      status: 'DISPONIVEL',
      observacoes: 'Marca: LUNA\nModelo: 45.5\nCapacidade máxima de carga: 10.508 kg\nAlcance horizontal máximo: 19,7m\nAlcance vertical máximo: 23m'
    },
    {
      nome: 'Guindauto ING 80500',
      apelido: 'Guindauto (Munck) ING 80500 com Fly-Jib',
      tipo: 'MUNCK',
      placa: 'KLM-8050',
      capacidade: 20,
      status: 'DISPONIVEL',
      observacoes: 'Marca: ING\nModelo: 80500\n12 hidráulicas, sapatas de rolo para remoção\nCapacidade máxima de carga: 20 ton em um raio de 4m\nAlcance horizontal máximo: 29m\nAlcance vertical máximo: 32,9m\nBase integrada de giro infinito'
    },
    {
      nome: 'Guindauto TKA 38700',
      apelido: 'Guindauto (Munck) TKA 38700',
      tipo: 'MUNCK',
      placa: 'KLM-3870',
      capacidade: 7,
      status: 'DISPONIVEL',
      observacoes: 'Marca: TKA\nModelo: 38700\nCapacidade máxima de carga: 7 ton em um raio de 4 m\nAlcance horizontal máximo: 21 m\nAlcance vertical máximo: 24 m'
    },
    {
      nome: 'Guindauto TKA 48700',
      apelido: 'Guindauto (Munck) TKA 48700',
      tipo: 'MUNCK',
      placa: 'KLM-4870',
      capacidade: 10,
      status: 'DISPONIVEL',
      observacoes: 'Marca: TKA\nModelo: 48700\nCapacidade máxima de carga: 10 ton em um raio de 4 m\nAlcance horizontal máximo: 19,9 m\nAlcance vertical máximo: 23,5 m'
    },
    {
      nome: 'Carreta Guerra 30t',
      apelido: 'Carreta Guerra',
      tipo: 'CARRETA',
      placa: 'KLM-0030',
      capacidade: 30,
      status: 'DISPONIVEL',
      observacoes: 'Marca: Guerra\nComprimento: 12,40m\nCapacidade de carga: 30t\nPossui pinos para container'
    },
    {
      nome: 'Empilhadeira Yale 7t',
      apelido: 'Empilhadeira Yale 7 ton',
      tipo: 'EMPILHADEIRA',
      placa: 'KLM-0700',
      capacidade: 7,
      status: 'DISPONIVEL',
      observacoes: 'Marca: Yale\nModelo: GP155VXNGJV148\nCapacidade máxima de carga: 7ton'
    },
    {
      nome: 'Empilhadeira Hyster 2t',
      apelido: 'Empilhadeira Hyster 2 ton',
      tipo: 'EMPILHADEIRA',
      placa: 'KLM-0200',
      capacidade: 2,
      status: 'DISPONIVEL',
      observacoes: 'Marca: Hyster\nCapacidade máxima de carga: 2ton'
    }
  ];

  console.log('Inserindo novos veículos...');
  for (const v of novosVeiculos) {
    await prisma.veiculo.create({ data: v });
  }
  
  console.log('Veículos atualizados com sucesso!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
