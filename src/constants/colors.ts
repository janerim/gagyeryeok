export const Colors = {
  primary: '#1F8A70',
  primaryLight: '#E3F3EE',
  primaryDark: '#15664F',
  background: '#FFFFFF',
  surface: '#F6F7F8',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  // 빨강·파랑은 primary 와 비슷한 채도로 낮춰 둔다 (쨍한 원색은 이 앱의 톤에서 혼자 튄다)
  income: '#4C84D6',
  expense: '#E06257',
  transfer: '#8E8E93',
  saturday: '#4C84D6',
  sunday: '#E06257',
  todayBg: '#E3F3EE',
  danger: '#E06257',
  // 충동 구매 표시. 주의하라는 뜻의 빨강 계열, 지출 금액의 빨강보다 어둡고 덜 쨍하게
  impulse: '#B5463C',
  impulseLight: '#F9E3E0',
} as const;
