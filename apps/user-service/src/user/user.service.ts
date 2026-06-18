/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { UserPrismaService } from '@app/prisma';
import { Injectable, Logger } from '@nestjs/common';
import { UserRedisService } from '../redis/redis.service';
import { KAFKA_TOPICS, KafkaService } from '@app/kafka';
import { RpcException } from '@nestjs/microservices';
import { UpdateProfileDto } from '@app/common';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly prisma: UserPrismaService,
    private redis: UserRedisService,
    private kafka: KafkaService,
  ) {}

  private async checkIsFollowing(
    followerId: string,
    targetId: string,
  ): Promise<boolean> {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId: targetId },
      },
    });
    return !!follow;
  }

  private buildResponse(profile: any) {
    return { success: true, message: 'Success', user: profile };
  }

  async getProfile(userId: string, requesterId: string) {
    const cache = await this.redis.getCacheProfile(userId);
    if (cache) {
      const isFollowing =
        requesterId !== userId
          ? await this.checkIsFollowing(requesterId, userId)
          : false;
      const isOnline = await this.redis.isOnline(userId);
      return this.buildResponse({
        ...cache,
        isFollowing,
        isOnline,
      });
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new RpcException({
        code: 5,
        message: 'User not found',
      });
    }
    const isFollowing =
      requesterId !== userId
        ? await this.checkIsFollowing(requesterId, userId)
        : false;
    const isOnline = await this.redis.isOnline(userId);
    const profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      bio: user.bio || '',
      avatar: user.avatar || '',
      coverImg: user.coverImg || '',
      location: user.location || '',
      website: user.website || '',
      birthDate: user.birthDate?.toISOString() || '',
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      postsCount: user.postsCount,
      isFollowing,
      isOnline,
      createdAt: user.createdAt.toISOString(),
    };
    await this.redis.cacheProfile(userId, {
      ...profile,
      isFollowing: false,
    });
    return this.buildResponse(profile);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.bio && { bio: dto.bio }),
        ...(dto.avatar && { avatar: dto.avatar }),
        ...(dto.coverImg && { coverImg: dto.coverImg }),
        ...(dto.location && { location: dto.location }),
        ...(dto.website && { website: dto.website }),
        ...(dto.birthDate && {
          birthDate: new Date(dto.birthDate),
        }),
      },
    });
    await this.redis.invalidateProfile(userId);

    await this.kafka.emit(KAFKA_TOPICS.USER_PROFILE_CREATED, {
      userId: user.id,
      name: user.name,
      avatar: user.avatar,
    });

    return this.buildResponse({
      ...user,
      bio: user.bio || '',
      avatar: user.avatar || '',
      coverImg: user.coverImg || '',
      location: user.location || '',
      website: user.website || '',
      birthDate: user.birthDate?.toISOString() || '',
      isFollowing: false,
      isOnline: false,
      createdAt: user.createdAt.toISOString(),
    });
  }
}
