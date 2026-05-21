/** 表单校验工具 */

/** 校验手机号 */
export function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

/** 校验身高 cm (50-250) */
export function isValidHeight(height: number): boolean {
  return height >= 50 && height <= 250;
}

/** 校验体重 kg (20-300) */
export function isValidWeight(weight: number): boolean {
  return weight >= 20 && weight <= 300;
}

/** BMI 计算 */
export function calcBMI(weight: number, heightCm: number): number {
  const h = heightCm / 100;
  return Math.round((weight / (h * h)) * 10) / 10;
}
