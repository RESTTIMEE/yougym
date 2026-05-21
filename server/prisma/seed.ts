import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 清空训练相关数据（按外键依赖顺序）
  await prisma.exerciseLog.deleteMany();
  await prisma.dailyCheckin.deleteMany();
  await prisma.userTrainingPlan.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.trainingDay.deleteMany();
  await prisma.trainingPlan.deleteMany();

  // ========== 三分化-推日 (共享: muscle_gain + fat_loss) ==========
  await prisma.trainingPlan.create({
    data: {
      name: '三分化-推日',
      category: 'muscle_gain,fat_loss',
      creator: '系统',
      durationWeeks: 4,
      difficulty: 2,
      description: '胸、肩、三头肌训练，采用谭成义三分化训练法',
      coverImage: '/images/push-day.png',
      cycleDays: 3,
      trainingDays: {
        create: [
          {
            dayNumber: 1,
            dayName: '推日',
            exercises: {
              create: [
                { exerciseName: '杠铃卧推', sets: 4, reps: 10, restSeconds: 90, sortOrder: 1, description: '主要刺激胸大肌中束' },
                { exerciseName: '哑铃上斜卧推', sets: 4, reps: 10, restSeconds: 90, sortOrder: 2, description: '刺激上胸部' },
                { exerciseName: '坐姿哑铃推举', sets: 3, reps: 12, restSeconds: 60, sortOrder: 3, description: '三角肌前中束' },
                { exerciseName: '哑铃侧平举', sets: 4, reps: 15, restSeconds: 45, sortOrder: 4, description: '三角肌中束孤立训练' },
                { exerciseName: '绳索下压', sets: 3, reps: 15, restSeconds: 60, sortOrder: 5, description: '三头肌外侧头' },
                { exerciseName: '双杠臂屈伸', sets: 3, reps: 12, restSeconds: 90, sortOrder: 6, description: '三头肌+下胸复合动作' },
              ],
            },
          },
        ],
      },
    },
  });

  // ========== 三分化-拉日 ==========
  await prisma.trainingPlan.create({
    data: {
      name: '三分化-拉日',
      category: 'muscle_gain,fat_loss',
      creator: '系统',
      durationWeeks: 4,
      difficulty: 2,
      description: '背、二头肌训练，采用谭成义三分化训练法',
      coverImage: '/images/pull-day.png',
      cycleDays: 3,
      trainingDays: {
        create: [
          {
            dayNumber: 1,
            dayName: '拉日',
            exercises: {
              create: [
                { exerciseName: '引体向上', sets: 4, reps: 10, restSeconds: 90, sortOrder: 1, description: '背部宽度训练' },
                { exerciseName: '杠铃划船', sets: 4, reps: 10, restSeconds: 90, sortOrder: 2, description: '背部厚度训练' },
                { exerciseName: '高位下拉', sets: 3, reps: 12, restSeconds: 60, sortOrder: 3, description: '背阔肌孤立训练' },
                { exerciseName: '坐姿划船', sets: 3, reps: 12, restSeconds: 60, sortOrder: 4, description: '中背部训练' },
                { exerciseName: '杠铃弯举', sets: 3, reps: 12, restSeconds: 60, sortOrder: 5, description: '二头肌整体训练' },
                { exerciseName: '锤式弯举', sets: 3, reps: 15, restSeconds: 45, sortOrder: 6, description: '肱肌+肱桡肌训练' },
              ],
            },
          },
        ],
      },
    },
  });

  // ========== 三分化-腿日 ==========
  await prisma.trainingPlan.create({
    data: {
      name: '三分化-腿日',
      category: 'muscle_gain,fat_loss',
      creator: '系统',
      durationWeeks: 4,
      difficulty: 2,
      description: '腿、核心训练，采用谭成义三分化训练法',
      coverImage: '/images/leg-day.png',
      cycleDays: 3,
      trainingDays: {
        create: [
          {
            dayNumber: 1,
            dayName: '腿日',
            exercises: {
              create: [
                { exerciseName: '杠铃深蹲', sets: 4, reps: 10, restSeconds: 120, sortOrder: 1, description: '股四头肌+臀大肌' },
                { exerciseName: '罗马尼亚硬拉', sets: 3, reps: 10, restSeconds: 90, sortOrder: 2, description: '腘绳肌+臀大肌' },
                { exerciseName: '腿举', sets: 3, reps: 12, restSeconds: 90, sortOrder: 3, description: '股四头肌孤立训练' },
                { exerciseName: '腿弯举', sets: 3, reps: 15, restSeconds: 60, sortOrder: 4, description: '腘绳肌孤立训练' },
                { exerciseName: '站姿提踵', sets: 4, reps: 20, restSeconds: 45, sortOrder: 5, description: '小腿腓肠肌' },
                { exerciseName: '悬垂举腿', sets: 3, reps: 15, restSeconds: 60, sortOrder: 6, description: '腹直肌下部+髋屈肌' },
              ],
            },
          },
        ],
      },
    },
  });

  // ========== 上交叉综合征矫正 ==========
  await prisma.trainingPlan.create({
    data: {
      name: '上交叉综合征矫正',
      category: 'posture_correction',
      creator: '系统',
      durationWeeks: 4,
      difficulty: 1,
      description: '改善圆肩、驼背、头前引，拉伸紧张肌群+激活薄弱肌群',
      coverImage: '/images/upper-cross.png',
      trainingDays: {
        create: [
          {
            dayNumber: 1,
            dayName: 'Day 1',
            exercises: {
              create: [
                { exerciseName: '胸大肌拉伸', sets: 3, reps: 1, restSeconds: 30, sortOrder: 1, description: '每侧保持30秒' },
                { exerciseName: '上斜方肌拉伸', sets: 3, reps: 1, restSeconds: 30, sortOrder: 2, description: '颈部侧屈拉伸，每侧保持30秒' },
                { exerciseName: '胸椎伸展', sets: 3, reps: 10, restSeconds: 30, sortOrder: 3, description: '泡沫轴或仰卧伸展' },
                { exerciseName: '肩胛骨后缩', sets: 3, reps: 15, restSeconds: 30, sortOrder: 4, description: '弹力带或自重肩胛收缩' },
                { exerciseName: '俯身Y字上举', sets: 3, reps: 12, restSeconds: 45, sortOrder: 5, description: '激活下斜方肌' },
                { exerciseName: '靠墙天使', sets: 3, reps: 10, restSeconds: 30, sortOrder: 6, description: '背靠墙上下滑动，保持肩胛后缩' },
              ],
            },
          },
        ],
      },
    },
  });

  // ========== 骨盆前倾矫正 ==========
  await prisma.trainingPlan.create({
    data: {
      name: '骨盆前倾矫正',
      category: 'posture_correction',
      creator: '系统',
      durationWeeks: 4,
      difficulty: 1,
      description: '改善骨盆前倾，拉伸髋屈肌+激活臀大肌和腹肌',
      coverImage: '/images/pelvic-tilt.png',
      trainingDays: {
        create: [
          {
            dayNumber: 1,
            dayName: 'Day 1',
            exercises: {
              create: [
                { exerciseName: '髋屈肌拉伸', sets: 3, reps: 1, restSeconds: 30, sortOrder: 1, description: '弓步姿势，每侧保持30秒' },
                { exerciseName: '臀桥', sets: 3, reps: 15, restSeconds: 45, sortOrder: 2, description: '激活臀大肌' },
                { exerciseName: '死虫式', sets: 3, reps: 10, restSeconds: 30, sortOrder: 3, description: '核心稳定+腹横肌激活' },
                { exerciseName: '平板支撑', sets: 3, reps: 1, restSeconds: 45, sortOrder: 4, description: '保持45秒' },
                { exerciseName: '鸟狗式', sets: 3, reps: 10, restSeconds: 30, sortOrder: 5, description: '对侧手脚交替伸展' },
                { exerciseName: '骨盆后倾练习', sets: 3, reps: 15, restSeconds: 30, sortOrder: 6, description: '仰卧骨盆后倾，贴平腰椎' },
              ],
            },
          },
        ],
      },
    },
  });

  // ========== 系统用户（用于系统级饮食计划） ==========
  let systemUser = await prisma.user.findUnique({ where: { openid: 'system' } });
  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: { openid: 'system', nickname: '优健系统' },
    });
  }

  // 清空旧饮食计划
  await prisma.dietPlan.deleteMany();

  // ========== 碳循环减脂法 ==========
  await prisma.dietPlan.create({
    data: {
      userId: systemUser.id,
      goal: 'fat_loss',
      dailyCalories: 1800,
      proteinTargetG: 135,
      fatTargetG: 50,
      carbsTargetG: 200,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  // 清空食物库
  await prisma.dietRecord.deleteMany();
  await prisma.foodDatabase.deleteMany();

  const foods = [
    // 主食/碳水 12
    { foodName: '白米饭', category: '主食/碳水', caloriesPer100g: 116, proteinG: 2.6, fatG: 0.3, carbsG: 25.9 },
    { foodName: '燕麦片', category: '主食/碳水', caloriesPer100g: 377, proteinG: 13.5, fatG: 6.7, carbsG: 66.3 },
    { foodName: '全麦面包', category: '主食/碳水', caloriesPer100g: 247, proteinG: 8.5, fatG: 3.4, carbsG: 41.3 },
    { foodName: '红薯', category: '主食/碳水', caloriesPer100g: 86, proteinG: 1.6, fatG: 0.1, carbsG: 20.1 },
    { foodName: '意大利面(干)', category: '主食/碳水', caloriesPer100g: 352, proteinG: 12.0, fatG: 1.5, carbsG: 71.0 },
    { foodName: '馒头', category: '主食/碳水', caloriesPer100g: 223, proteinG: 7.0, fatG: 1.1, carbsG: 44.2 },
    { foodName: '玉米', category: '主食/碳水', caloriesPer100g: 112, proteinG: 4.0, fatG: 1.2, carbsG: 22.8 },
    { foodName: '糙米饭', category: '主食/碳水', caloriesPer100g: 123, proteinG: 2.7, fatG: 0.9, carbsG: 25.6 },
    { foodName: '荞麦面(干)', category: '主食/碳水', caloriesPer100g: 343, proteinG: 13.3, fatG: 2.5, carbsG: 70.6 },
    { foodName: '年糕', category: '主食/碳水', caloriesPer100g: 154, proteinG: 3.3, fatG: 0.6, carbsG: 34.7 },
    { foodName: '山药', category: '主食/碳水', caloriesPer100g: 57, proteinG: 1.5, fatG: 0.1, carbsG: 12.4 },
    { foodName: '藜麦(熟)', category: '主食/碳水', caloriesPer100g: 120, proteinG: 4.4, fatG: 1.9, carbsG: 21.3 },
    // 禽畜肉类 10
    { foodName: '鸡胸肉', category: '禽畜肉类', caloriesPer100g: 133, proteinG: 31.0, fatG: 1.2, carbsG: 0 },
    { foodName: '鸡腿肉(去皮)', category: '禽畜肉类', caloriesPer100g: 119, proteinG: 19.7, fatG: 3.9, carbsG: 0 },
    { foodName: '牛肉(瘦)', category: '禽畜肉类', caloriesPer100g: 125, proteinG: 22.3, fatG: 4.2, carbsG: 0 },
    { foodName: '猪里脊(瘦)', category: '禽畜肉类', caloriesPer100g: 143, proteinG: 20.3, fatG: 6.2, carbsG: 0 },
    { foodName: '羊肉(瘦)', category: '禽畜肉类', caloriesPer100g: 118, proteinG: 20.5, fatG: 3.9, carbsG: 0 },
    { foodName: '鸭胸肉', category: '禽畜肉类', caloriesPer100g: 201, proteinG: 18.3, fatG: 14.0, carbsG: 0 },
    { foodName: '牛腩', category: '禽畜肉类', caloriesPer100g: 291, proteinG: 17.1, fatG: 24.0, carbsG: 0 },
    { foodName: '猪排骨', category: '禽畜肉类', caloriesPer100g: 264, proteinG: 18.3, fatG: 20.4, carbsG: 0 },
    { foodName: '培根', category: '禽畜肉类', caloriesPer100g: 541, proteinG: 12.0, fatG: 42.0, carbsG: 1.0 },
    { foodName: '香肠', category: '禽畜肉类', caloriesPer100g: 301, proteinG: 12.0, fatG: 25.0, carbsG: 5.0 },
    // 水产 6
    { foodName: '三文鱼', category: '水产', caloriesPer100g: 208, proteinG: 20.4, fatG: 13.4, carbsG: 0 },
    { foodName: '虾仁', category: '水产', caloriesPer100g: 99, proteinG: 23.8, fatG: 0.6, carbsG: 0 },
    { foodName: '鳕鱼', category: '水产', caloriesPer100g: 82, proteinG: 17.8, fatG: 0.7, carbsG: 0 },
    { foodName: '鲈鱼', category: '水产', caloriesPer100g: 105, proteinG: 18.6, fatG: 3.4, carbsG: 0 },
    { foodName: '金枪鱼(罐头)', category: '水产', caloriesPer100g: 116, proteinG: 26.0, fatG: 0.8, carbsG: 0 },
    { foodName: '牡蛎', category: '水产', caloriesPer100g: 73, proteinG: 8.6, fatG: 2.1, carbsG: 4.9 },
    // 蛋奶制品 6
    { foodName: '鸡蛋(全蛋)', category: '蛋奶制品', caloriesPer100g: 143, proteinG: 12.6, fatG: 9.5, carbsG: 1.1 },
    { foodName: '蛋清', category: '蛋奶制品', caloriesPer100g: 52, proteinG: 10.9, fatG: 0.2, carbsG: 0.7 },
    { foodName: '全脂牛奶', category: '蛋奶制品', caloriesPer100g: 61, proteinG: 3.0, fatG: 3.3, carbsG: 4.8 },
    { foodName: '脱脂牛奶', category: '蛋奶制品', caloriesPer100g: 34, proteinG: 3.4, fatG: 0.1, carbsG: 4.9 },
    { foodName: '酸奶(原味)', category: '蛋奶制品', caloriesPer100g: 61, proteinG: 3.5, fatG: 1.4, carbsG: 9.5 },
    { foodName: '奶酪(切达)', category: '蛋奶制品', caloriesPer100g: 403, proteinG: 24.9, fatG: 33.1, carbsG: 1.3 },
    // 蔬菜 10
    { foodName: '西兰花', category: '蔬菜', caloriesPer100g: 34, proteinG: 2.8, fatG: 0.4, carbsG: 6.6 },
    { foodName: '菠菜', category: '蔬菜', caloriesPer100g: 23, proteinG: 2.9, fatG: 0.4, carbsG: 3.6 },
    { foodName: '番茄', category: '蔬菜', caloriesPer100g: 18, proteinG: 0.9, fatG: 0.2, carbsG: 3.9 },
    { foodName: '黄瓜', category: '蔬菜', caloriesPer100g: 16, proteinG: 0.7, fatG: 0.1, carbsG: 2.9 },
    { foodName: '胡萝卜', category: '蔬菜', caloriesPer100g: 41, proteinG: 0.9, fatG: 0.2, carbsG: 9.6 },
    { foodName: '生菜', category: '蔬菜', caloriesPer100g: 15, proteinG: 1.4, fatG: 0.2, carbsG: 2.8 },
    { foodName: '蘑菇', category: '蔬菜', caloriesPer100g: 22, proteinG: 3.1, fatG: 0.3, carbsG: 3.3 },
    { foodName: '彩椒', category: '蔬菜', caloriesPer100g: 26, proteinG: 1.0, fatG: 0.2, carbsG: 5.3 },
    { foodName: '花椰菜', category: '蔬菜', caloriesPer100g: 25, proteinG: 1.9, fatG: 0.3, carbsG: 4.9 },
    { foodName: '芹菜', category: '蔬菜', caloriesPer100g: 14, proteinG: 0.7, fatG: 0.1, carbsG: 3.0 },
    // 水果 8
    { foodName: '香蕉', category: '水果', caloriesPer100g: 89, proteinG: 1.1, fatG: 0.3, carbsG: 22.8 },
    { foodName: '苹果', category: '水果', caloriesPer100g: 52, proteinG: 0.3, fatG: 0.2, carbsG: 13.8 },
    { foodName: '蓝莓', category: '水果', caloriesPer100g: 57, proteinG: 0.7, fatG: 0.3, carbsG: 14.5 },
    { foodName: '橙子', category: '水果', caloriesPer100g: 47, proteinG: 0.9, fatG: 0.1, carbsG: 11.8 },
    { foodName: '葡萄', category: '水果', caloriesPer100g: 69, proteinG: 0.7, fatG: 0.2, carbsG: 18.1 },
    { foodName: '草莓', category: '水果', caloriesPer100g: 32, proteinG: 0.7, fatG: 0.3, carbsG: 7.7 },
    { foodName: '猕猴桃', category: '水果', caloriesPer100g: 61, proteinG: 1.1, fatG: 0.5, carbsG: 14.7 },
    { foodName: '西瓜', category: '水果', caloriesPer100g: 30, proteinG: 0.6, fatG: 0.1, carbsG: 7.6 },
    // 豆类/坚果 5
    { foodName: '豆腐(嫩)', category: '豆类/坚果', caloriesPer100g: 76, proteinG: 8.1, fatG: 3.7, carbsG: 2.8 },
    { foodName: '鹰嘴豆(熟)', category: '豆类/坚果', caloriesPer100g: 164, proteinG: 8.9, fatG: 2.6, carbsG: 27.4 },
    { foodName: '杏仁', category: '豆类/坚果', caloriesPer100g: 579, proteinG: 21.2, fatG: 49.9, carbsG: 21.7 },
    { foodName: '花生酱', category: '豆类/坚果', caloriesPer100g: 588, proteinG: 25.1, fatG: 50.0, carbsG: 20.0 },
    { foodName: '豆浆(无糖)', category: '豆类/坚果', caloriesPer100g: 31, proteinG: 2.8, fatG: 1.5, carbsG: 1.6 },
    // 油脂/调味 3
    { foodName: '橄榄油', category: '油脂/调味', caloriesPer100g: 884, proteinG: 0, fatG: 100.0, carbsG: 0 },
    { foodName: '蜂蜜', category: '油脂/调味', caloriesPer100g: 304, proteinG: 0.3, fatG: 0, carbsG: 82.4 },
    { foodName: '沙拉酱(蛋黄酱)', category: '油脂/调味', caloriesPer100g: 680, proteinG: 1.0, fatG: 75.0, carbsG: 3.0 },
  ];

  for (const food of foods) {
    await prisma.foodDatabase.create({ data: { ...food, servingUnit: 'g' } });
  }

  // 清空成就数据
  await prisma.userPoint.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.achievement.deleteMany();

  const achievements = [
    { name: '初次启程', description: '完成首次训练打卡', icon: '🏃', conditionType: 'first_checkin', conditionValue: 1 },
    { name: '初窥门径', description: '累计训练打卡7次', icon: '🔥', conditionType: 'total_checkins', conditionValue: 7 },
    { name: '渐入佳境', description: '累计训练打卡30次', icon: '💪', conditionType: 'total_checkins', conditionValue: 30 },
    { name: '百炼成钢', description: '累计训练打卡100次', icon: '🏆', conditionType: 'total_checkins', conditionValue: 100 },
    { name: '七日之约', description: '连续训练7天', icon: '📅', conditionType: 'streak_days', conditionValue: 7 },
    { name: '月度坚守', description: '连续训练30天', icon: '⭐', conditionType: 'streak_days', conditionValue: 30 },
    { name: '汗水成河', description: '累计训练1000分钟', icon: '⏱️', conditionType: 'total_duration', conditionValue: 1000 },
    { name: '博采众长', description: '解锁3个训练计划', icon: '📋', conditionType: 'plans_unlocked', conditionValue: 3 },
    { name: '记录初篇', description: '记录5次身体数据', icon: '📝', conditionType: 'body_records', conditionValue: 5 },
    { name: '数据达人', description: '记录10次身体数据', icon: '📊', conditionType: 'body_records', conditionValue: 10 },
    { name: '饮食新手', description: '记录50次饮食', icon: '🍽️', conditionType: 'diet_records', conditionValue: 50 },
    { name: '饮食大师', description: '记录100次饮食', icon: '🧑‍🍳', conditionType: 'diet_records', conditionValue: 100 },
    { name: '首顿记录', description: '完成首次饮食记录', icon: '🥗', conditionType: 'first_diet', conditionValue: 1 },
    { name: '智者求助', description: '首次获取AI建议', icon: '🤖', conditionType: 'first_ai_advice', conditionValue: 1 },
    { name: '体态自知', description: '首次体态评估', icon: '🧍', conditionType: 'first_posture', conditionValue: 1 },
  ];

  for (const ach of achievements) {
    await prisma.achievement.create({ data: ach });
  }

  console.log('种子数据写入完成：5 套训练计划，30 个动作，1 个减脂饮食计划，60 条食物数据，15 条成就数据');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
