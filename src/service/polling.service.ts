import { Provide, makeHttpRequest, Config } from '@midwayjs/core';

@Provide()
export class PollingService {
  private pollingInterval: NodeJS.Timeout;
  private resolvePolling: (value: any) => void;
  private rejectPolling: (reason?: any) => void;
  private pollingPromise: Promise<any>;

  @Config('tongyi')
  tongyiConfig;

  public startPolling(task_id: string, timeout = 30000): Promise<any> {
    // 如果已有轮询在进行，则直接返回当前的轮询 Promise
    if (this.pollingPromise) {
      return this.pollingPromise;
    }

    // 创建一个新的 Promise 并存储它的解决（resolve）和拒绝（reject）方法
    this.pollingPromise = new Promise((resolve, reject) => {
      this.resolvePolling = resolve;
      this.rejectPolling = reject;
    });

    this.polling(task_id); // 开始轮询

    // 设置一个超时，避免轮询无限期进行
    this.pollingInterval = setTimeout(() => {
      this.pollingTimeout();
    }, timeout);

    return this.pollingPromise;
  }

  polling = async task_id => {
    const apikey = this.tongyiConfig.apiKey;
    try {
      const res: any = await makeHttpRequest(`https://dashscope.aliyuncs.com/api/v1/tasks/${task_id}`, {
        headers: {
          Authorization: `Bearer ${apikey}`, // 权限
        },
        dataType: 'json', //返回数据也是用json格式
      });

      const data = res.data;

      if (data.output.task_status === 'SUCCEEDED') {
        // 成功获取到状态为SUCCESS的数据，处理数据并结束轮询
        console.log('SUCCEEDED!', data.output);
        this.clearPolling();
        this.resolvePolling(data.output);
      } else {
        // 状态不是SUCCESS，继续轮询
        console.log('RUNNING!', data.output);
        this.scheduleNextPoll(task_id);
      }
    } catch (error) {
      // 出错时，拒绝 Promise 并结束轮询
      this.clearPolling();
      this.rejectPolling(error);
    }
  };

  private scheduleNextPoll(task_id) {
    // 清除现有的轮询（如果有）
    if (this.pollingInterval) {
      clearTimeout(this.pollingInterval);
    }
    // 安排下次轮询
    this.pollingInterval = setTimeout(() => this.polling(task_id), 10000); // 10秒后再次轮询
  }

  private pollingTimeout() {
    // 超时处理，拒绝 Promise 并清理轮询
    this.clearPolling();
    this.rejectPolling(new Error('Polling timed out.'));
  }

  // 清理轮询资源
  private clearPolling() {
    if (this.pollingInterval) {
      clearTimeout(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.pollingPromise = null;
  }
}
