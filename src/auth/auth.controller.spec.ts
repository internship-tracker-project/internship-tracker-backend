import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const makeAuthServiceMock = () => ({
  register: jest.fn(),
  login: jest.fn(),
});

describe('AuthController', () => {
  let controller: AuthController;
  let authService: ReturnType<typeof makeAuthServiceMock>;

  beforeEach(async () => {
    authService = makeAuthServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('POST /auth/register', () => {
    it('should return access_token on successful registration', async () => {
      authService.register.mockResolvedValue({ access_token: 'token.for.register' });

      const result = await controller.register({
        email: 'new@example.com',
        password: 'secure1234',
      });

      expect(authService.register).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'secure1234',
      });
      expect(result).toEqual({ access_token: 'token.for.register' });
    });

    it('should propagate ConflictException from service', async () => {
      authService.register.mockRejectedValue(
        new ConflictException('Email already in use'),
      );

      await expect(
        controller.register({ email: 'dup@example.com', password: 'pass' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('POST /auth/login', () => {
    it('should return access_token on successful login', async () => {
      authService.login.mockResolvedValue({ access_token: 'token.for.login' });

      const result = await controller.login({
        email: 'user@example.com',
        password: 'correct',
      });

      expect(authService.login).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'correct',
      });
      expect(result).toEqual({ access_token: 'token.for.login' });
    });

    it('should propagate UnauthorizedException from service', async () => {
      authService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(
        controller.login({ email: 'user@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
