import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../config/prisma.service';

const REFRESH_TOKEN_BYTES = 48;
const JTI_BYTES = 16;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function nanoid(len = REFRESH_TOKEN_BYTES): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async wxLogin(code: string) {
    // 1. code → 微信API换取 openid + session_key
    const { openid } = await this.getWxSession(code);

    // 2. 根据 openid 查找或创建用户
    const user = await this.upsertUser(openid);

    // 3. 签发双令牌
    // Access token: short-lived (15m, configured in JwtModule)
    const accessToken = this.jwtService.sign({ sub: user.id, jti: nanoid(JTI_BYTES) });

    // Refresh token: long-lived (7 days, stored in DB)
    const refreshToken = nanoid();
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    return { accessToken, refreshToken, user };
  }

  async refresh(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('刷新令牌无效或已过期');
    }

    // Rotation in transaction: revoke old + create new atomically
    const [newAccessToken, newRefreshToken] = await this.prisma.$transaction(async (tx) => {
      const result = await tx.refreshToken.updateMany({
        where: { id: stored.id, revoked: false },
        data: { revoked: true },
      });
      if (result.count === 0) {
        throw new UnauthorizedException('Refresh token reuse detected');
      }

      const token = nanoid();
      await tx.refreshToken.create({
        data: {
          userId: stored.userId,
          token,
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        },
      });

      const accessToken = this.jwtService.sign({
        sub: stored.userId,
        jti: nanoid(JTI_BYTES),
      });

      return [accessToken, token];
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: number) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
    return { message: '已登出' };
  }

  /** 调用微信 code2Session API */
  private async getWxSession(code: string) {
    const appid = process.env.WECHAT_APPID;
    const secret = process.env.WECHAT_SECRET;

    // 开发阶段跳过：绕过后端微信校验，直接模拟 openid
    if (!appid || appid.startsWith('wx000') || appid === 'your_appid') {
      return { openid: `dev_openid_${code.substring(0, 6)}`, session_key: 'dev_session_key' };
    }

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
    const response = await fetch(url);
    const data = await response.json() as any;

    if (data.errcode) {
      throw new UnauthorizedException(`微信登录失败: ${data.errmsg}`);
    }
    return { openid: data.openid, session_key: data.session_key };
  }

  /** 根据 openid 查找用户，不存在则创建 */
  private async upsertUser(openid: string) {
    let user = await this.prisma.user.findUnique({ where: { openid } });

    if (!user) {
      user = await this.prisma.user.create({
        data: { openid },
      });
    }

    return {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      gender: user.gender,
      height: user.height,
      weight: user.weight,
      fitnessGoal: user.fitnessGoal,
    };
  }
}
