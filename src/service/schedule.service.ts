import { Provide, makeHttpRequest, Config } from '@midwayjs/core';
import { SCHEDULE_PROMPT, TONGYI_API_URL } from '../constant';
import { safeJSONParse } from '../utils';
import { Repository, Brackets } from 'typeorm';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Schedule } from '../entity/schedule.entity';
import { Festival } from '../entity/festival.entity';

@Provide()
export class ScheduleService {
  @Config('tickTickToken')
  tickTickToken;

  @Config('tongyi')
  tongyiConfig;

  @InjectEntityModel(Schedule)
  scheduleModel: Repository<Schedule>;

  @InjectEntityModel(Festival)
  festivalModel: Repository<Festival>;

  createTask = async (context: string) => {
    const apikey = this.tongyiConfig.apiKey;

    const tongyiRes: any = await makeHttpRequest(TONGYI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apikey}`, // 权限
        'Content-Type': 'application/json',
      },
      dataType: 'json', //返回数据也是用json格式
      timeout: 10000, // 超时设置10s
      data: {
        model: 'qwen-max', // 'qwen-max'(千亿级参数) | 'qwen-turbo'(百亿级参数),
        input: {
          messages: [
            {
              role: 'system',
              content: SCHEDULE_PROMPT,
            },
            {
              role: 'user',
              content: `${context}`,
            },
          ],
        },
      },
    });

    const scheduleRes = safeJSONParse(tongyiRes.data.output.text);

    const res: any = await makeHttpRequest('https://api.dida365.com/open/v1/task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.tickTickToken}`,
      },
      dataType: 'json',
      data: {
        title: scheduleRes.title,
        content: scheduleRes.suggestion,
        dueDate: tickTickDateFormat(scheduleRes.date),
        isAllDay: true,
      },
    });

    if (res.status === 200) {
      // 将日程写入数据库
      const schedule = new Schedule();
      schedule.title = scheduleRes.title;
      schedule.content = scheduleRes.suggestion;
      schedule.date = scheduleRes.date;
      await this.scheduleModel.save(schedule);

      return `任务创建成功!,建议${res.data.content}`;
    }
    return '主人我没听懂您的意思,请再说一遍吧';
  };

  getSchedule = async ng => {
    // ====================== schedule部分 =============================
    // 获取当前日期和三天后的日期的字符串表示
    const today = new Date();
    const threeDaysLater = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3);

    // 转换为 YYYY-MM-DD 格式的字符串
    const todayStr = today.toISOString().split('T')[0];
    const threeDaysLaterStr = threeDaysLater.toISOString().split('T')[0];

    // 分析获取日程表数据, 获取近3天的工作内容
    const scheduleList = await this.scheduleModel
      .createQueryBuilder('schedule')
      .select(['schedule.title', 'schedule.content', 'schedule.date'])
      .where('schedule.date >= :todayStr', { todayStr })
      .andWhere('schedule.date < :threeDaysLaterStr', { threeDaysLaterStr })
      .getMany();

    // ======================== festival部分 ===========================
    // 计算出今天的日期并生成 'MM-DD' 格式的字符串
    const mmddToday = today.toISOString().substring(5, 10);
    // 计算出15天后的日期并生成 'MM-DD' 格式的字符串
    const fifteenDaysLater = new Date();
    fifteenDaysLater.setDate(today.getDate() + 15);
    const mmddFifteenDaysLater = fifteenDaysLater.toISOString().substring(5, 10);

    const upcomingFestivals = await this.festivalModel
      .createQueryBuilder('festival')
      .select(['festival.title', 'festival.content', 'festival.date'])
      .where(
        new Brackets(qb => {
          // 如果15天后是新的一年，需要检索两个年份的节日
          if (fifteenDaysLater.getFullYear() !== today.getFullYear()) {
            qb.where('festival.date >= :mmddToday', { mmddToday }).orWhere('festival.date < :mmddFifteenDaysLater', {
              mmddFifteenDaysLater,
            });
          } else {
            // 同一年内，直接比较日期范围
            qb.where('festival.date >= :mmddToday', { mmddToday }).andWhere('festival.date < :mmddFifteenDaysLater', {
              mmddFifteenDaysLater,
            });
          }
        })
      )
      .getMany();

    // ======================== 通知部分 ===========================
    // 生成通知内容
    let noticeContent = '';
    if (scheduleList.length > 0) {
      noticeContent += '工作安排：\n';
      scheduleList.forEach(schedule => {
        noticeContent += `${schedule.date} ${schedule.title} 建议:${schedule.content}\n`;
      });
    }

    if (upcomingFestivals.length > 0) {
      noticeContent += '节日安排：\n';
      upcomingFestivals.forEach(festival => {
        noticeContent += `${festival.date} ${festival.title} 建议:${festival.content}\n`;
      });
    }

    return noticeContent;
  };
}

function tickTickDateFormat(date: string) {
  return date + 'T00:00:00+0000';
}
