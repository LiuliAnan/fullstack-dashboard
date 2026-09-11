import { Injectable } from '@nestjs/common';
import { DashboardService } from '../../dashboard/dashboard.service';
import { BarChartQueryDto } from '../../dashboard/dto/bar-chart-query.dto';
import { AiCacheService } from '../cache/ai-cache.service';
import { AiAuditService } from './ai-audit.service';
import { AiContext } from '../security/ai-context';

@Injectable()
export class AiToolsService {
  constructor(
    private readonly dashboard: DashboardService,
    private readonly cache: AiCacheService,
    private readonly audit: AiAuditService,
  ) {}
  // Explicit allow-listed read-only tool. No arbitrary URLs, SQL or business writes from the model.
  async companies(ctx: AiContext, query: BarChartQueryDto) {
    const key = await this.cache.resultKey(ctx, 'company', query);
    let data = key
      ? await this.cache.read<
          Awaited<ReturnType<DashboardService['getCompaniesByFilter']>>
        >(key)
      : undefined;
    const cacheHit = Boolean(data);
    if (!data) {
      data = await this.dashboard.getCompaniesByFilter(query);
      if (key)
        await this.cache.write(key, data, this.cache.resultTtl('company'));
    }
    await this.audit.append(ctx, {
      action: 'tool.companies.filter',
      resource: 'company',
      outcome: 'success',
      details: { dimension: query.dimension, cacheHit },
    });
    return { data, cacheHit };
  }
}
