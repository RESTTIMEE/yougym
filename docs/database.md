# YouGym 数据库设计

## ER 概要

```
User (1) ──< BodyRecord
User (1) ──< UserTrainingPlan >── TrainingPlan
User (1) ──< DailyCheckin
User (1) ──< DietRecord
User (1) ──< DietPlan
User (1) ──< UserAchievement >── Achievement
User (1) ──< UserPoint
TrainingPlan (1) ──< Exercise
User (1) ──< PostureAssessment ──< PostureCorrectionPlan
```

## 核心表 (14张)

1. **users** - 用户主表
2. **body_records** - 身体指标记录
3. **training_plans** - 训练计划模板
4. **exercises** - 训练动作
5. **user_training_plans** - 用户训练计划
6. **daily_checkins** - 每日打卡
7. **food_database** - 食物数据库
8. **diet_records** - 饮食记录
9. **diet_plans** - 饮食计划
10. **achievements** - 成就定义
11. **user_achievements** - 用户成就
12. **user_points** - 用户积分
13. **posture_assessments** - 体态评估
14. **posture_correction_plans** - 矫正方案

## Redis 缓存设计

| Key | Type | TTL | 说明 |
|-----|------|-----|------|
| `session:{token}` | String | 7d | 用户会话 |
| `user:{uid}:checkin:today` | String | 1d | 今日打卡状态 |
| `training:hot` | Sorted Set | - | 热门计划排行 |
| `rate:{ip}:{api}` | String | 60s | 限流计数 |
| `ai:training:{uid}` | String | 24h | AI建议缓存 |
| `food:search:{kw}` | String | 1h | 食物搜索缓存 |
