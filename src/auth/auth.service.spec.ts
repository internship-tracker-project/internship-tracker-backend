import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../../generated/prisma';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

const mockUser = {
  id: 'uuid-1234',
  email: 'test@example.com',
  password: 'hashed_password',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const makePrismaMock = () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
});

const makeJwtMock = () => ({
  sign: jest.fn().mockReturnValue('signed.jwt.token'),
});

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof makePrismaMock>;
  let jwt: ReturnType<typeof makeJwtMock>;

  beforeEach(async () => {
    prisma = makePrismaMock();
    jwt = makeJwtMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should hash the password and return an access_token', async () => {
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'test@example.com',
        password: 'plaintext123',
      });

      const createCall = prisma.user.create.mock.calls[0][0];
      expect(createCall.data.password).not.toBe('plaintext123');
      expect(createCall.data.password).toMatch(/^\$2/);
      expect(jwt.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
      expect(result).toEqual({ access_token: 'signed.jwt.token' });
    });

    it('should throw ConflictException on unique constraint violation', async () => {
      prisma.user.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '6.0.0',
        }),
      );

      await expect(
        service.register({ email: 'test@example.com', password: 'anypassword' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should rethrow unexpected errors from create', async () => {
      prisma.user.create.mockRejectedValue(new Error('DB connection lost'));

      await expect(
        service.register({ email: 'test@example.com', password: 'anypassword' }),
      ).rejects.toThrow('DB connection lost');
    });
  });

  describe('login', () => {
    it('should return an access_token when credentials are valid', async () => {
      const hashedPassword = await bcrypt.hash('correct_password', 10);
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      const result = await service.login({
        email: 'test@example.com',
        password: 'correct_password',
      });

      expect(jwt.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
      expect(result).toEqual({ access_token: 'signed.jwt.token' });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: 'any' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      const hashedPassword = await bcrypt.hash('correct_password', 10);
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong_password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should give the same error for missing user and wrong password (no enumeration)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const err1 = await service
        .login({ email: 'nobody@example.com', password: 'any' })
        .catch((e) => e);

      const hashedPassword = await bcrypt.hash('correct', 10);
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });
      const err2 = await service
        .login({ email: 'test@example.com', password: 'wrong' })
        .catch((e) => e);

      expect(err1.constructor.name).toBe(err2.constructor.name);
      expect(err1.message).toBe(err2.message);
    });
  });
});
