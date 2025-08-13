export const env = {
  THIRDWEB_API_BASE_URL: process.env.THIRDWEB_API_BASE_URL || 'https://api.thirdweb.com',
  THIRDWEB_SECRET_KEY: process.env.THIRDWEB_SECRET_KEY || '',
  TOKEN_CONTRACT_ADDRESS: process.env.TOKEN_CONTRACT_ADDRESS || '',
  CHAIN_ID: process.env.CHAIN_ID || '84532',
  ADMIN_ADDRESS: process.env.ADMIN_ADDRESS || '',
  GAME_REWARD_BASE: parseInt(process.env.GAME_REWARD_BASE || '100'),
  GAME_REWARD_MAX: parseInt(process.env.GAME_REWARD_MAX || '500'),
  GAME_VERIFICATION_WINDOW: parseInt(process.env.GAME_VERIFICATION_WINDOW || '86400000'),
} as const
