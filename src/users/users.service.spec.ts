import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {

  let service: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      providers: [UsersService, PrismaService],
    }).compile();

    service = mod.get(UsersService);
    prisma = mod.get(PrismaService);
  });

  {/* Unit test para actualizar el usuario */}
  it ('Debe actualizar el nombre del usuario', async () => {
    const userId = 1;

    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: userId } as any);

    const updateSpy = jest.spyOn(prisma.user, 'update').mockResolvedValue({
      id: userId,
      name: 'Nuevo Nombre',
    } as any);

    const result = await service.updateMe(userId.toString(), { name: 'Nuevo Nombre' });
    expect(updateSpy).toHaveBeenCalledWith({
      where: { id: userId },
      data: { name: 'Nuevo Nombre', avatar: undefined },
    });
    expect(result.name).toBe('Nuevo Nombre');
  });

  {/* Unit test para actualizar la foto del usuario */}
  it('Debe actualizar la foto del usuario', async () => {
    const userId = 1;

    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: userId } as any);

    const updateSpy = jest.spyOn(prisma.user, 'update').mockResolvedValue({
      id: userId,
      avatar: 'https://cdn/imagen.png',
    } as any);

    const result = await service.updateMe(userId.toString(), { avatar: 'https://cdn/imagen.png' });
    expect(updateSpy).toHaveBeenCalledWith({
      where: { id: userId },
      data: { avatar: 'https://cdn/imagen.png' },
    });
    expect(result.avatar).toBe('https://cdn/imagen.png');
  });

  
});