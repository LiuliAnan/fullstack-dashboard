// 用户角色和状态的共享常量，前后端保持一致
export const USER_ROLES = ['Admin', 'Manager', 'Editor', 'User'] as const;
export const USER_STATUSES = ['active', 'banned', 'pending'] as const;

// 公司等级
export const COMPANY_LEVELS = [1, 2, 3, 4] as const;