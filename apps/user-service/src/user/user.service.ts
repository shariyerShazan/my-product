/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// user/user.service.ts
import { KAFKA_TOPICS, KafkaService } from '@app/kafka';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client, RpcException, Transport } from '@nestjs/microservices';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { UserRedisService } from '../redis/redis.service';
import { UpdateProfileDto } from '@app/common';
import { UserPrismaService } from '../prisma/prisma.service';
import { join } from 'path';

interface MediaGrpcService {
  getMedia(data: { mediaId: string }): any;
  getMediaByIds(data: { mediaIds: string[] }): any;
}

@Injectable()
export class UserService implements OnModuleInit {
  private readonly logger = new Logger(UserService.name);
  @Client({
    transport: Transport.GRPC,
    options: {
      package: 'media',
      protoPath: join(process.cwd(), 'libs/proto-schema/src/proto/media.proto'),
      url: process.env.MEDIA_GRPC_PORT || 'localhost:3009',
    },
  })
  private client: ClientGrpc;

  private mediaService: MediaGrpcService;

  constructor(
    private prisma: UserPrismaService,
    private redis: UserRedisService,
    private kafka: KafkaService,
  ) {}

  onModuleInit() {
    this.mediaService =
      this.client.getService<MediaGrpcService>('MediaService');
  }

  async createUser(data: { userId: string; email: string; name: string }) {
    await this.prisma.profile.upsert({
      where: {
        id: data.userId,
      },
      update: {
        name: data.name,
        email: data.email,
      },
      create: {
        id: data.userId,
        name: data.name,
        email: data.email,
      },
    });
  }

  // ── Get Profile ───────────────────────────────
  async getProfile(userId: string, requesterId: string) {
    const cached = await this.redis.getCachedProfile(userId);
    if (cached) {
      const isFollowing =
        requesterId !== userId
          ? await this.checkIsFollowing(requesterId, userId)
          : false;
      const isOnline = await this.redis.isOnline(userId);
      const [hydrated] = await this.enrichProfilesWithMedia([
        { ...cached, isFollowing, isOnline },
      ]);
      return this.buildResponse(hydrated);
    }

    const user = await this.prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new RpcException({
        code: 5,
        message: 'User not found',
      });
    }

    const isFollowing =
      requesterId && requesterId !== userId
        ? await this.checkIsFollowing(requesterId, userId)
        : false;

    const isOnline = await this.redis.isOnline(userId);

    const profile = this.createProfilePayload(user, {
      isFollowing,
      isOnline,
    });

    await this.redis.cacheProfile(userId, {
      ...profile,
      isFollowing: false,
    });

    const [hydratedProfile] = await this.enrichProfilesWithMedia([profile]);
    return this.buildResponse(hydratedProfile);
  }

  // ── Update Profile ────────────────────────────
  async updateProfile(userId: string, data: UpdateProfileDto) {
    const user = await this.prisma.profile.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.avatarMediaId !== undefined && {
          avatarMediaId: data.avatarMediaId || null,
        }),
        ...(data.coverMediaId !== undefined && {
          coverMediaId: data.coverMediaId || null,
        }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.birthDate !== undefined && {
          birthDate: new Date(data.birthDate),
        }),
      },
    });

    await this.redis.invalidateProfile(userId);

    await this.kafka.emit(KAFKA_TOPICS.USER_PROFILE_UPDATED, {
      userId: user.id,
      name: user.name,
      avatarMediaId: user.avatarMediaId,
      coverMediaId: user.coverMediaId,
    });

    const [hydratedProfile] = await this.enrichProfilesWithMedia([
      this.createProfilePayload(user, { isFollowing: false, isOnline: false }),
    ]);

    return this.buildResponse(hydratedProfile);
  }

  // ── Follow ────────────────────────────────────
  async followUser(followerId: string, targetId: string) {
    if (followerId === targetId) {
      throw new RpcException({
        code: 3,
        message: 'Cannot follow yourself',
      });
    }

    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetId,
        },
      },
    });

    if (existing) {
      throw new RpcException({
        code: 6,
        message: 'Already following',
      });
    }

    const [, target] = await this.prisma.$transaction([
      this.prisma.follow.create({
        data: { followerId, followingId: targetId },
      }),
      this.prisma.profile.update({
        where: { id: targetId },
        data: { followersCount: { increment: 1 } },
      }),
      this.prisma.profile.update({
        where: { id: followerId },
        data: { followingCount: { increment: 1 } },
      }),
    ]);

    await this.redis.addFollower(targetId, followerId);
    await this.redis.invalidateProfile(targetId);
    await this.redis.invalidateProfile(followerId);

    const follower = await this.prisma.profile.findUnique({
      where: { id: followerId },
      select: { name: true },
    });

    await this.kafka.emit(KAFKA_TOPICS.USER_PROFILE_FOLLOWED, {
      followerId,
      targetId,
      followerName: follower?.name,
    });

    this.logger.log(`✅ ${followerId} followed ${targetId}`);

    return {
      success: true,
      message: 'Followed successfully',
      followersCount: target.followersCount,
      isFollowing: true,
    };
  }

  // ── Unfollow ──────────────────────────────────
  async unfollowUser(followerId: string, targetId: string) {
    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetId,
        },
      },
    });

    if (!existing) {
      throw new RpcException({
        code: 5,
        message: 'Not following this user',
      });
    }

    const [, target] = await this.prisma.$transaction([
      this.prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId: targetId,
          },
        },
      }),
      this.prisma.profile.update({
        where: { id: targetId },
        data: { followersCount: { decrement: 1 } },
      }),
      this.prisma.profile.update({
        where: { id: followerId },
        data: { followingCount: { decrement: 1 } },
      }),
    ]);

    await this.redis.removeFollower(targetId, followerId);
    await this.redis.invalidateProfile(targetId);
    await this.redis.invalidateProfile(followerId);

    await this.kafka.emit(KAFKA_TOPICS.USER_PROFILE_UNFOLLOWED, {
      followerId,
      targetId,
    });

    return {
      success: true,
      message: 'Unfollowed successfully',
      followersCount: target.followersCount,
      isFollowing: false,
    };
  }

  // ── Get Followers ─────────────────────────────
  async getFollowers(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [follows, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followingId: userId },
        include: { follower: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.follow.count({
        where: { followingId: userId },
      }),
    ]);

    const userIds = follows.map((f) => f.followerId);
    const onlineSet = await this.redis.getOnlineUsers(userIds);

    const profiles = follows.map((f) =>
      this.createProfilePayload(f.follower, {
        isFollowing: false,
        isOnline: onlineSet.has(f.follower.id),
      }),
    );

    const users = await this.enrichProfilesWithMedia(profiles);

    return { success: true, users, total, page };
  }

  // ── Get Following ─────────────────────────────
  async getFollowing(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [follows, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: userId },
        include: { following: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.follow.count({
        where: { followerId: userId },
      }),
    ]);

    const userIds = follows.map((f) => f.followingId);
    const onlineSet = await this.redis.getOnlineUsers(userIds);

    const profiles = follows.map((f) =>
      this.createProfilePayload(f.following, {
        isFollowing: true,
        isOnline: onlineSet.has(f.following.id),
      }),
    );

    const users = await this.enrichProfilesWithMedia(profiles);

    return { success: true, users, total, page };
  }

  // ── Search Users ──────────────────────────────
  async searchUsers(
    query: string,
    requesterId: string,
    page: number,
    limit: number,
  ) {
    const cacheKey = `${query}:${page}`;
    const cached = await this.redis.getCachedSearch(cacheKey);
    if (cached) {
      return { success: true, users: cached, total: cached.length, page };
    }

    const skip = (page - 1) * limit;

    const users = await this.prisma.profile.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
        NOT: { id: requesterId },
      },
      skip,
      take: limit,
      orderBy: { followersCount: 'desc' },
    });

    const userIds = users.map((u) => u.id);
    const onlineSet = await this.redis.getOnlineUsers(userIds);

    const followingSet = await this.getFollowingSet(requesterId, userIds);

    const profiles = users.map((u) =>
      this.createProfilePayload(u, {
        isFollowing: followingSet.has(u.id),
        isOnline: onlineSet.has(u.id),
      }),
    );

    const result = await this.enrichProfilesWithMedia(profiles);

    await this.redis.cacheSearch(cacheKey, result);

    return { success: true, users: result, total: result.length, page };
  }

  // ── Friend Suggestions ────────────────────────
  async getSuggestions(userId: string, limit: number) {
    const myFollowingIds = await this.prisma.follow
      .findMany({
        where: { followerId: userId },
        select: { followingId: true },
      })
      .then((r) => r.map((f) => f.followingId));

    if (!myFollowingIds.length) {
      return this.getPopularUsers(userId, limit);
    }

    const suggestions = await this.prisma.profile.findMany({
      where: {
        AND: [
          { id: { not: userId } },
          { id: { notIn: myFollowingIds } },
          {
            followers: {
              some: {
                followerId: { in: myFollowingIds },
              },
            },
          },
        ],
      },
      take: limit,
      orderBy: { followersCount: 'desc' },
    });

    const userIds = suggestions.map((u) => u.id);
    const onlineSet = await this.redis.getOnlineUsers(userIds);

    const profiles = suggestions.map((u) =>
      this.createProfilePayload(u, {
        isFollowing: false,
        isOnline: onlineSet.has(u.id),
      }),
    );

    const users = await this.enrichProfilesWithMedia(profiles);

    return { success: true, users, total: users.length, page: 1 };
  }

  async getFollowerIds(userId: string): Promise<string[]> {
    const cached = await this.redis.getFollowerIds(userId);
    if (cached.length > 0) return cached;

    const follows = await this.prisma.follow.findMany({
      where: { followingId: userId },
      select: { followerId: true },
    });

    const ids = follows.map((f) => f.followerId);

    if (ids.length > 0) {
      await this.redis.cacheFollowerIds(userId, ids);
    }

    return ids;
  }

  async getUsersByIds(userIds: string[]) {
    const users = await this.prisma.profile.findMany({
      where: { id: { in: userIds } },
    });

    const onlineSet = await this.redis.getOnlineUsers(userIds);

    const profiles = users.map((u) =>
      this.createProfilePayload(u, {
        isFollowing: false,
        isOnline: onlineSet.has(u.id),
      }),
    );

    const result = await this.enrichProfilesWithMedia(profiles);

    return { success: true, users: result, total: result.length, page: 1 };
  }

  // ── Presence ──────────────────────────────────
  async setOnline(userId: string) {
    await this.redis.setOnline(userId);
    return { isOnline: true, lastSeen: Date.now() };
  }

  async setOffline(userId: string) {
    await this.redis.setOffline(userId);
    return { isOnline: false, lastSeen: Date.now() };
  }

  async getOnlineStatus(userId: string) {
    const isOnline = await this.redis.isOnline(userId);
    const lastSeen = await this.redis.getLastSeen(userId);
    return { isOnline, lastSeen };
  }

  // ── Private Helpers ───────────────────────────
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

  private async getFollowingSet(
    userId: string,
    targetIds: string[],
  ): Promise<Set<string>> {
    const follows = await this.prisma.follow.findMany({
      where: {
        followerId: userId,
        followingId: { in: targetIds },
      },
      select: { followingId: true },
    });
    return new Set(follows.map((f) => f.followingId));
  }

  private async getPopularUsers(userId: string, limit: number) {
    const users = await this.prisma.profile.findMany({
      where: { id: { not: userId } },
      take: limit,
      orderBy: { followersCount: 'desc' },
    });

    const profiles = users.map((u) =>
      this.createProfilePayload(u, {
        isFollowing: false,
        isOnline: false,
      }),
    );

    const hydratedUsers = await this.enrichProfilesWithMedia(profiles);

    return {
      success: true,
      users: hydratedUsers,
      total: users.length,
      page: 1,
    };
  }

  private createProfilePayload(user: any, overrides: Record<string, any> = {}) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      bio: user.bio || '',
      avatarMediaId: user.avatarMediaId || null,
      coverMediaId: user.coverMediaId || null,
      location: user.location || '',
      website: user.website || '',
      birthDate: user.birthDate,
      followersCount: user.followersCount ?? 0,
      followingCount: user.followingCount ?? 0,
      postsCount: user.postsCount ?? 0,
      isFollowing: false,
      isOnline: false,
      createdAt: user.createdAt,
      ...overrides,
    };
  }

  private async enrichProfilesWithMedia<T extends Record<string, any>>(
    profiles: T[],
  ) {
    const mediaIds = Array.from(
      new Set(
        profiles.flatMap((profile) => {
          const ids = [profile.avatarMediaId, profile.coverMediaId].filter(
            Boolean,
          );
          return ids as string[];
        }),
      ),
    );

    const mediaMap = await this.fetchMediaMap(mediaIds);

    return profiles.map((profile) => {
      const avatar =
        this.resolveMediaUrl(profile.avatarMediaId, mediaMap) ||
        profile.avatar ||
        '';
      const coverImg =
        this.resolveMediaUrl(profile.coverMediaId, mediaMap) ||
        profile.coverImg ||
        '';

      const publicProfile = { ...(profile as Record<string, any>) };
      delete publicProfile.avatarMediaId;
      delete publicProfile.coverMediaId;

      return {
        ...publicProfile,
        avatar,
        coverImg,
        birthDate: profile.birthDate?.toISOString() || '',
        createdAt: profile.createdAt?.toISOString() || '',
        location: profile.location || '',
        website: profile.website || '',
        bio: profile.bio || '',
      };
    });
  }

  private async fetchMediaMap(mediaIds: string[]) {
    if (!mediaIds.length) {
      return new Map<string, any>();
    }

    if (!this.mediaService) {
      return new Map<string, any>();
    }

    try {
      const response: any = await firstValueFrom(
        this.mediaService.getMediaByIds({ mediaIds }),
      );

      const mediaMap = new Map<string, any>();
      for (const media of response?.media || []) {
        if (media?.id) {
          mediaMap.set(media.id, media);
        }
      }

      return mediaMap;
    } catch (error) {
      this.logger.warn(
        `Media hydration failed for ids ${mediaIds.join(', ')}: ${String(error)}`,
      );
      return new Map<string, any>();
    }
  }

  private resolveMediaUrl(
    mediaId: string | null | undefined,
    mediaMap: Map<string, any>,
  ) {
    if (!mediaId) {
      return '';
    }

    const media = mediaMap.get(mediaId);
    if (!media) {
      return '';
    }

    return media.mediumUrl || media.originalUrl || media.thumbnailUrl || '';
  }

  private buildResponse(profile: any) {
    return { success: true, message: 'Success', user: profile };
  }
}
