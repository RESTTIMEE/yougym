import { BASE_URL } from '../utils/constants';
import { authApi } from './auth';

const getToken = () => {
  try {
    return wx.getStorageSync('accessToken') || '';
  } catch {
    return '';
  }
};

const request = async (method: 'GET' | 'POST', url: string, data?: any): Promise<any> => {
  const doRequest = (): Promise<any> =>
    new Promise<any>((resolve, reject) => {
      wx.request({
        method,
        url: `${BASE_URL}${url}`,
        header: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        data,
        success: (res: any) => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve(res.data.data);
          } else {
            reject(res.data);
          }
        },
        fail: reject,
      });
    });

  try {
    return await doRequest();
  } catch (err: any) {
    if (err?.statusCode === 401 || err?.code === 401) {
      const newToken = await authApi.refresh();
      if (newToken) return doRequest();
    }
    throw err;
  }
};

const streamRequest = (url: string, onChunk: (text: string) => void): Promise<void> =>
  new Promise((resolve, reject) => {
    const task = wx.request({
      method: 'POST',
      url: `${BASE_URL}${url}`,
      header: { Authorization: `Bearer ${getToken()}` },
      enableChunked: true,
      success: () => resolve(),
      fail: reject,
    });
    task.onChunkReceived((res: WechatMiniprogram.OnChunkReceivedCallbackResult) => {
      try {
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(res.data as ArrayBuffer);
        onChunk(text);
      } catch {
        // ignore decode errors
      }
    });
  });

export const aiApi = {
  getTrainingAdvice: () => request('POST', '/ai/training-advice'),
  getDietAdvice: () => request('POST', '/ai/diet-advice'),
  assessPosture: (filePath: string, description?: string) =>
    upload('/ai/posture-assessment', filePath, description ? { description } : undefined),
  streamTrainingAdvice: (onChunk: (text: string) => void) =>
    streamRequest('/ai/training-advice/stream', onChunk),
  streamDietAdvice: (onChunk: (text: string) => void) =>
    streamRequest('/ai/diet-advice/stream', onChunk),
};
