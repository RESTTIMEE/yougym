/** 基础 HTTP 请求封装（双令牌 + 401 自动刷新） */

import { authApi } from './auth';
import { BASE_URL } from '../utils/constants';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: Record<string, any>;
  header?: Record<string, string>;
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * 统一请求方法，自动携带 Token，401 时自动刷新令牌并重试
 */
export function request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', data, header = {} } = options;
  const token = wx.getStorageSync('accessToken') || '';
  const fullUrl = `${BASE_URL}${path}`;

  return new Promise((resolve, reject) => {
    const doRequest = (authToken: string) => {
      console.log('[API]', method, fullUrl);
      wx.request({
        url: fullUrl,
        method,
        data,
        header: {
          'Content-Type': 'application/json',
          Authorization: authToken ? `Bearer ${authToken}` : '',
          ...header,
        },
        success(res) {
          const { statusCode, data: resp } = res;
          console.log('[API]', statusCode, method, fullUrl);
          if (statusCode === 401) {
            if (!isRefreshing) {
              isRefreshing = true;
              refreshPromise = authApi.refresh();
            }
            refreshPromise!.then((newToken) => {
              isRefreshing = false;
              refreshPromise = null;
              if (newToken) {
                doRequest(newToken);
              } else {
                reject(new Error('Unauthorized'));
              }
            }).catch(() => {
              isRefreshing = false;
              refreshPromise = null;
              reject(new Error('Unauthorized'));
            });
            return;
          }
          if (statusCode && statusCode >= 200 && statusCode < 300) {
            resolve(resp as T);
          } else {
            console.error('[API] 响应错误:', statusCode, method, fullUrl, resp);
            reject(new Error(`请求失败: ${statusCode}`));
          }
        },
        fail(err) {
          console.error('[API] 网络失败:', method, fullUrl, JSON.stringify(err));
          wx.showToast({ title: '网络异常，请稍后重试', icon: 'none' });
          reject(err);
        },
      });
    };
    doRequest(token);
  });
}

export function get<T>(path: string, data?: Record<string, any>): Promise<T> {
  return request<T>(path, { method: 'GET', data });
}

export function post<T>(path: string, data?: Record<string, any>): Promise<T> {
  return request<T>(path, { method: 'POST', data });
}

export function put<T>(path: string, data?: Record<string, any>): Promise<T> {
  return request<T>(path, { method: 'PUT', data });
}
