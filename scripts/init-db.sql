-- YouGym 数据库初始化脚本
-- 注意：此脚本仅供参考，实际使用 Prisma migrate 管理数据库版本

CREATE DATABASE IF NOT EXISTS yougym CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE yougym;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openid VARCHAR(64) NOT NULL UNIQUE,
  unionid VARCHAR(64),
  nickname VARCHAR(64) DEFAULT '用户',
  avatar_url TEXT,
  phone VARCHAR(20),
  gender TINYINT DEFAULT 0 COMMENT '0未知 1男 2女',
  birthday DATE,
  height FLOAT COMMENT 'cm',
  weight FLOAT COMMENT 'kg',
  fitness_goal VARCHAR(32) DEFAULT 'muscle_gain' COMMENT 'muscle_gain|fat_loss|posture_correction',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 身体指标记录
CREATE TABLE IF NOT EXISTS body_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  weight FLOAT NOT NULL COMMENT 'kg',
  body_fat_pct FLOAT COMMENT '%',
  muscle_mass_kg FLOAT COMMENT 'kg',
  flexibility_score FLOAT COMMENT '1-10',
  bmi FLOAT,
  record_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_date (user_id, record_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 训练计划
CREATE TABLE IF NOT EXISTS training_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  category VARCHAR(32) NOT NULL,
  creator VARCHAR(64) DEFAULT '系统',
  duration_weeks INT DEFAULT 4,
  difficulty TINYINT DEFAULT 1 COMMENT '1-3',
  description TEXT,
  cover_image VARCHAR(512)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 训练动作
CREATE TABLE IF NOT EXISTS exercises (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_id INT NOT NULL,
  exercise_name VARCHAR(128) NOT NULL,
  sets INT DEFAULT 3,
  reps INT DEFAULT 12,
  rest_seconds INT DEFAULT 60,
  video_url VARCHAR(512),
  image_url VARCHAR(512),
  description TEXT,
  sort_order INT DEFAULT 0,
  INDEX idx_plan (plan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
