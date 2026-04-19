import { Injectable } from '@nestjs/common';
import { ApplicationStatus } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';

const ALL_STATUSES: ApplicationStatus[] = [
  'APPLIED',
  'INTERVIEW',
  'OFFER',
  'REJECTED',
];

export interface AnalyticsSummary {
  total: number;
  statusCounts: Record<ApplicationStatus, number>;
  offerRate: number;
  timeSeries: { weekStart: string; count: number }[];
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string): Promise<AnalyticsSummary> {
    const [total, grouped, weekRows] = await Promise.all([
      this.prisma.application.count({ where: { userId } }),
      this.prisma.application.groupBy({
        by: ['status'],
        where: { userId },
        _count: { _all: true },
      }),
      this.prisma.$queryRaw<{ weekStart: Date; count: bigint }[]>`
        SELECT date_trunc('week', "appliedAt") AS "weekStart",
               COUNT(*)::bigint AS "count"
        FROM "Application"
        WHERE "userId" = ${userId}
          AND "appliedAt" >= NOW() - INTERVAL '12 weeks'
        GROUP BY "weekStart"
        ORDER BY "weekStart" ASC
      `,
    ]);

    const statusCounts = ALL_STATUSES.reduce(
      (acc, status) => {
        acc[status] = 0;
        return acc;
      },
      {} as Record<ApplicationStatus, number>,
    );
    for (const row of grouped) {
      statusCounts[row.status] = row._count._all;
    }

    const offerRate = total === 0 ? 0 : statusCounts.OFFER / total;

    const timeSeries = weekRows.map((r) => ({
      weekStart: new Date(r.weekStart).toISOString().slice(0, 10),
      count: Number(r.count),
    }));

    return { total, statusCounts, offerRate, timeSeries };
  }
}
