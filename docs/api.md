# YouGym API 文档

> Base URL: `https://api.yougym.com/v1`

## 认证

所有需要登录的接口在 Header 中携带：
```
Authorization: Bearer <jwt_token>
```

## 接口列表

| 模块 | 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|------|
| Auth | POST | /api/v1/auth/login | 微信登录 | - |
| User | GET | /api/v1/user/profile | 获取用户资料 | Y |
| User | PUT | /api/v1/user/profile | 更新用户资料 | Y |
| User | POST | /api/v1/user/body-record | 录入身体指标 | Y |
| User | GET | /api/v1/user/body-records | 身体指标历史 | Y |
| Training | GET | /api/v1/training/plans | 训练计划列表 | - |
| Training | GET | /api/v1/training/plans/:id | 计划详情 | - |
| Training | POST | /api/v1/training/user-plan | 创建用户计划 | Y |
| Training | GET | /api/v1/training/my-plans | 我的计划 | Y |
| Training | POST | /api/v1/training/checkin | 训练打卡 | Y |
| Training | GET | /api/v1/training/checkins | 打卡记录 | Y |
| Training | GET | /api/v1/training/report/weekly | 周报 | Y |
| Training | GET | /api/v1/training/report/monthly | 月报 | Y |
| Diet | GET | /api/v1/diet/foods | 搜索食物 | - |
| Diet | POST | /api/v1/diet/record | 添加饮食记录 | Y |
| Diet | GET | /api/v1/diet/records | 饮食记录列表 | Y |
| Diet | GET | /api/v1/diet/plan | 获取饮食计划 | Y |
| Diet | POST | /api/v1/diet/plan | 保存饮食计划 | Y |
| AI | POST | /api/v1/ai/training-advice | AI训练建议 | Y |
| AI | POST | /api/v1/ai/diet-advice | AI饮食建议 | Y |
| AI | POST | /api/v1/ai/posture-assessment | 体态分析 | Y |
| Achievement | GET | /api/v1/achievement/list | 成就列表 | - |
| Achievement | GET | /api/v1/achievement/my | 我的成就 | Y |
| Achievement | GET | /api/v1/achievement/points | 我的积分 | Y |

## 统一响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

## 分页格式

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "list": []
  }
}
```
