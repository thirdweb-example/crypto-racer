# 🚀 Crypto Racer Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Copy `env.example` to `.env.local` and fill in your values:
```bash
cp env.example .env.local
```

Edit `.env.local` with your actual thirdweb credentials:
```env
THIRDWEB_SECRET_KEY=your_actual_secret_key_here
TOKEN_CONTRACT_ADDRESS=0x...your_actual_contract_address
CHAIN_ID=84532
ADMIN_ADDRESS=0x...your_actual_admin_wallet
```

### 3. Run the Development Server
```bash
npm run dev
```

### 4. Open Your Browser
Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Authentication Setup

The app now properly handles thirdweb authentication:

1. **Frontend**: User enters email and receives OTP
2. **Backend**: Your server calls thirdweb API with `x-secret-key` header
3. **Security**: Secret key is never exposed to the client

### API Routes Created:
- `/api/auth/initiate` - Sends verification code
- `/api/auth/complete` - Verifies OTP and returns wallet address
- `/api/claim-rewards` - Handles token distribution

## 🎮 How to Play

1. **Login**: Enter email, receive OTP, verify
2. **Race**: Use A/D or Arrow Keys to avoid obstacles
3. **Earn**: Complete races to earn ERC-20 tokens
4. **Claim**: Use reward system to claim tokens

## 🛠️ Troubleshooting

### Build Errors
If you get Tailwind CSS errors:
```bash
npm install tailwindcss autoprefixer
```

### Authentication Errors
- Check your `THIRDWEB_SECRET_KEY` in `.env.local`
- Ensure your thirdweb account has API access
- Verify the email domain is allowed

### Game Issues
- Clear browser cache
- Check console for JavaScript errors
- Ensure all dependencies are installed

## 🔧 Development

### Project Structure
```
crypto-racer/
├── app/                    # Next.js app directory
│   ├── api/               # API routes (auth, rewards)
│   ├── components/        # React components
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/             # Shared components
├── package.json            # Dependencies
├── tailwind.config.ts      # Tailwind configuration
└── tsconfig.json           # TypeScript configuration
```

### Key Features
- ✅ Real thirdweb authentication (no simulation)
- ✅ Secure API calls with secret key headers
- ✅ Server-side verification for rewards
- ✅ Anti-cheat protection
- ✅ Modern React/Next.js architecture

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect repository in Vercel
3. Set environment variables
4. Deploy automatically

### Other Platforms
1. Build: `npm run build`
2. Set environment variables
3. Deploy the `out` directory

## 📞 Support

- Check the console for error messages
- Verify all environment variables are set
- Ensure thirdweb API access is configured
- Check network tab for API call failures

---

**Your Crypto Racer is now properly configured with secure authentication! 🎉**
