import { Job, IJob } from '@midwayjs/cron';
import { AppearanceService } from '../service/appearance.service';
import { Inject } from '@midwayjs/core';

@Job({
  cronTime: '0 0 4 * * *', // 每天早上4点
  start: true,
  runOnInit: false,
})
export class ScheduleNoticeJob implements IJob {
  @Inject()
  appearanceService: AppearanceService;

  async onTick() {
    const avatar = await this.appearanceService.generateAppearance();
    console.log('avatar', avatar);
  }
}
