import { Inject, Controller, Post, Body, makeHttpRequest, Config, Get } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { ScheduleService } from '../service/schedule.service';
import { CodeAssistantService } from '../service/code-assistant.service';
import { EmotionalCounselingService } from '../service/emotional-counseling.service';
import { KnowledgeService } from '../service/knowledge.service';
import { safeJSONParse } from '../utils';
import { INTENT_ANALYSIS_PROMPT, TONGYI_API_URL } from '../constant';
import { AppearanceService } from '../service/appearance.service';
import { ImageService } from '../service/image.service';

type MagicMirrorQuestionType = {
  context: any; // 问题内容
};

type serviceType = 'schedule' | 'codeAssistant' | 'knowledge' | 'emotionalCounseling';

@Controller('/api')
export class APIController {
  @Inject()
  ctx: Context;

  @Config('tongyi')
  tongyiConfig;

  @Inject()
  scheduleService: ScheduleService;

  @Inject()
  codeAssistantService: CodeAssistantService;

  @Inject()
  emotionalCounselingService: EmotionalCounselingService;

  @Inject()
  knowledgeService: KnowledgeService;

  @Inject()
  appearanceService: AppearanceService;

  @Inject()
  imageService: ImageService;

  @Post('/magic-mirror')
  async magicMirror(@Body() body: MagicMirrorQuestionType) {
    const { context } = body;

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
              content: INTENT_ANALYSIS_PROMPT,
            },
            {
              role: 'user',
              content: `${context}`,
            },
          ],
        },
      },
    });

    const service: serviceType = safeJSONParse(tongyiRes.data.output.text).service;

    let output = '';
    if (service === 'schedule') {
      output = await this.scheduleService.createTask(context);
    } else if (service === 'codeAssistant') {
      output = await this.codeAssistantService.generateCode(context);
    } else if (service === 'knowledge') {
      output = await this.knowledgeService.generateAnswer(context);
    } else if (service === 'emotionalCounseling') {
      output = await this.emotionalCounselingService.generateSuggestion(context);
    }

    return {
      code: 200,
      data: {
        output: output,
      },
      message: 'success',
    };
  }

  // 测试用,更新魔镜外观
  @Post('/update-appearance')
  async updateAppearance() {
    const res = await this.appearanceService.generateAppearance();
    return {
      code: 200,
      data: {
        output: res,
      },
      message: 'success',
    };
  }

  // 获取最新日程
  @Get('/schedule')
  async getDailySchedule() {
    const scheduleStr = await this.scheduleService.getSchedule();
    const avatar = await this.appearanceService.getNewestAppearance();

    console.log('avatar', avatar);
    console.log('scheduleStr', JSON.stringify(scheduleStr));
    // 生成简单的html
    const html = `
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>日程提醒</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .reminder-container {
            background-color: #fff;
            margin: 20px auto;
            padding: 20px;
            max-width: 600px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .reminder-header {
            text-align: center;
        }
        .avatar {
            max-width: 100px;
            border-radius: 50%;
            margin: 0 auto;
        }
        .schedule-content {
            margin-top: 20px;
            text-align: left;
            font-size: 18px;
            white-space: pre-line;
        }
    </style>
    </head>
    <body>
    
    <div class="reminder-container">
        <div class="reminder-header">
            <img class="avatar" src="${avatar}" alt="头像">
        </div>
        <div class="schedule-content">
            ${scheduleStr}
        </div>
    </div>
    
    </body>
    </html>`;
    return html;
  }
}
