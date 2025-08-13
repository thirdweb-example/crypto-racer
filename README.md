# 🏎️ Crypto Racer

A React-based racing game where players earn ERC-20 tokens based on their racing performance. Built with Next.js and integrated with thirdweb API for authentication and token distribution.

## 🎮 Features

- **Real-time Racing Game**: Smooth 2D racing with obstacle avoidance
- **Performance-based Rewards**: Earn tokens based on race completion time and performance
- **Anti-cheat System**: Server-side verification before token distribution
- **thirdweb Integration**: Secure authentication and smart contract interactions
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Achievement System**: Track progress and unlock milestones

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- thirdweb account and API keys

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd crypto-racer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Thirdweb API Configuration
   THIRDWEB_SECRET_KEY=your_secret_key_here
   TOKEN_CONTRACT_ADDRESS=0x...your_token_contract_address
   CHAIN_ID=84532
   ADMIN_ADDRESS=0x...your_admin_wallet_address
   
   # Game Configuration
   GAME_REWARD_BASE=100
   GAME_REWARD_MAX=500
   GAME_VERIFICATION_WINDOW=86400000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 How to Play

1. **Login**: Enter your email to authenticate with thirdweb
2. **Start Racing**: Press SPACE to begin a race
3. **Control**: Use A/D or Arrow Keys to move left/right
4. **Objective**: Avoid red obstacles and reach 1000 points
5. **Earn Tokens**: Complete races to earn ERC-20 tokens
6. **Claim Rewards**: Use the reward system to claim your tokens

## 🏗️ Architecture

### Frontend Components
- **RacingGame**: Main game logic with collision detection and scoring
- **AuthComponent**: thirdweb authentication integration
- **RewardSystem**: Token claiming and distribution
- **GameStats**: Performance tracking and achievements

### Backend API
- **`/api/claim-rewards`**: Server-side verification and token distribution
- **Anti-cheat Protection**: Validates game performance before rewards
- **thirdweb Integration**: Secure smart contract interactions

### Game Mechanics
- **Scoring System**: Points based on survival time and obstacle avoidance
- **Difficulty Scaling**: Obstacles move faster as score increases
- **Performance Tracking**: Records best times and total races
- **Reward Calculation**: Tokens based on time, performance, and race count

## 🔐 Security Features

- **Server-side Verification**: All game completions verified before rewards
- **Timestamp Validation**: Prevents replay attacks
- **Performance Validation**: Ensures reasonable game statistics
- **Rate Limiting**: Built-in protection against abuse

## 🪙 Token System

### Reward Structure
- **Base Reward**: 100 tokens per completed race
- **Time Bonus**: Up to 50 tokens for faster completion
- **Performance Bonus**: 10 tokens per race completed
- **Maximum Reward**: Capped at 500 tokens per session

### Distribution Process
1. Game completion data sent to server
2. Server verifies performance and calculates rewards
3. thirdweb API called to mint/transfer tokens
4. Transaction hash returned to user

## 🛠️ Configuration

### Environment Variables
- `THIRDWEB_SECRET_KEY`: Your thirdweb API secret key
- `TOKEN_CONTRACT_ADDRESS`: ERC-20 token contract address
- `CHAIN_ID`: Target blockchain network ID
- `ADMIN_ADDRESS`: Admin wallet for token distribution

### Game Settings
- `GAME_REWARD_BASE`: Base tokens per race
- `GAME_REWARD_MAX`: Maximum tokens per session
- `GAME_VERIFICATION_WINDOW`: Time window for valid sessions

## 🚧 Development

### Project Structure
```
crypto-racer/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── components/        # React components
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/             # Shared components
├── package.json            # Dependencies
├── tailwind.config.ts      # Tailwind configuration
└── tsconfig.json           # TypeScript configuration
```

### Available Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

## 🔧 Customization

### Game Difficulty
Modify obstacle spawn rates and speeds in `RacingGame.tsx`:
```typescript
// Obstacle spawn rate
if (Math.random() < 0.02) { ... }

// Speed increase
setObstacleSpeed(prev => Math.min(prev + 0.5, 8))
```

### Reward System
Adjust token calculations in `RewardSystem.tsx`:
```typescript
const baseReward = 100
const timeBonus = Math.max(0, 50 - Math.floor(gameStats.bestTime / 1000))
const performanceBonus = Math.floor(gameStats.totalRaces * 10)
```

### Visual Styling
Customize colors and animations in `tailwind.config.ts`:
```typescript
colors: {
  'race-red': '#e74c3c',
  'race-blue': '#3498db',
  'race-green': '#2ecc71',
}
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Other Platforms
1. Build the project: `npm run build`
2. Set environment variables
3. Deploy the `out` directory

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Issues**: Create a GitHub issue
- **Documentation**: Check the thirdweb API docs
- **Community**: Join our Discord server

## 🔮 Future Enhancements

- [ ] Multiplayer racing
- [ ] NFT car skins
- [ ] Leaderboards
- [ ] Tournament system
- [ ] Mobile optimization
- [ ] More game modes

---

**Built with ❤️ using Next.js, React, and thirdweb**
