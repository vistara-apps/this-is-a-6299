# SimuTrade - Virtual Trading Platform

SimuTrade is a comprehensive virtual trading platform that empowers aspiring traders to learn and practice trading strategies risk-free using virtual currency and receiving instant AI-powered feedback.

## 🚀 Features

### Core Trading Features
- **Virtual Trading Environment**: Practice with $10,000 virtual starting balance
- **Real-time Market Simulation**: Live price updates for major stocks (AAPL, GOOGL, MSFT, TSLA, AMZN, NVDA)
- **Instant AI Feedback**: Get immediate analysis and insights on your trading decisions
- **Portfolio Management**: Track your positions, P&L, and trading history
- **Interactive Charts**: Visualize market data with Chart.js integration

### Educational Features
- **Guided Trading Scenarios**: Practice with market events like earnings beats, crashes, and news spikes
- **Contextual Tutorials**: Learn trading concepts with just-in-time educational content
- **Progress Tracking**: Monitor your learning journey and completed scenarios
- **Risk Management Tools**: Learn proper position sizing and risk assessment

### Subscription Tiers
- **Free**: 10 trades/day, basic AI feedback, beginner scenarios
- **Premium ($15/month)**: Unlimited trades, advanced analytics, all scenarios
- **Pro ($30/month)**: Everything in Premium + personalized AI coaching, risk management tools

## 🛠 Tech Stack

### Frontend
- **React 18** with Vite for fast development
- **Tailwind CSS** for responsive, modern UI
- **Chart.js** for interactive trading charts
- **Lucide React** for beautiful icons
- **Zustand** for state management

### Backend & Services
- **Supabase** for authentication, database, and real-time features
- **Stripe** for subscription management and payments
- **OpenAI API** for AI-powered trade feedback and coaching

### Development Tools
- **Vite** for fast builds and hot reload
- **PostCSS** with Autoprefixer
- **Docker** support for containerized deployment

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Stripe account (for payments)
- OpenAI API key

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/vistara-apps/this-is-a-6299.git
   cd this-is-a-6299
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your credentials:
   ```env
   # OpenAI API Key for AI feedback generation
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   
   # Supabase Configuration
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Stripe Configuration
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   VITE_STRIPE_PREMIUM_PRICE_ID=price_premium_monthly_id
   VITE_STRIPE_PRO_PRICE_ID=price_pro_monthly_id
   ```

4. **Database Setup**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the schema from `docs/database-schema.sql`

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🗄 Database Schema

The application uses a comprehensive PostgreSQL schema with the following main tables:

- **users**: User profiles with subscription info and trading stats
- **trades**: Complete trading history with P&L tracking
- **positions**: Open positions with real-time P&L updates
- **scenarios**: Trading scenarios for educational practice
- **tutorials**: Educational content and progress tracking
- **subscriptions**: Stripe subscription management
- **usage_tracking**: Rate limiting and usage analytics

See `docs/database-schema.sql` for the complete schema with RLS policies.

## 🔐 Authentication & Security

- **Supabase Auth**: Secure user authentication with email/password and OAuth
- **Row Level Security (RLS)**: Database-level security ensuring users only access their data
- **JWT Tokens**: Secure API communication with automatic token refresh
- **Input Validation**: Comprehensive validation on all user inputs
- **Rate Limiting**: Usage tracking to prevent abuse

## 💳 Subscription Management

### Stripe Integration
- **Checkout Sessions**: Secure payment processing
- **Customer Portal**: Self-service subscription management
- **Webhooks**: Real-time subscription status updates
- **Proration**: Automatic billing adjustments for upgrades/downgrades

### Feature Gating
- **Usage Tracking**: Daily limits for free tier users
- **Feature Restrictions**: Tier-based access to premium features
- **Upgrade Prompts**: Contextual upgrade suggestions when limits are reached

## 🤖 AI Integration

### OpenAI-Powered Features
- **Trade Analysis**: Instant feedback on trading decisions
- **Risk Assessment**: AI-powered risk evaluation
- **Personalized Coaching**: Advanced guidance for Pro users
- **Scenario Guidance**: Context-aware tips during trading scenarios

### AI Service Architecture
- **Robust Error Handling**: Graceful fallbacks when AI services are unavailable
- **Token Management**: Efficient API usage with response caching
- **Context-Aware Prompts**: Tailored feedback based on user experience level

## 📊 Analytics & Monitoring

### User Analytics
- **Trading Performance**: Win rate, P&L, trade frequency
- **Learning Progress**: Tutorial completion, scenario mastery
- **Usage Patterns**: Feature adoption and engagement metrics

### Business Metrics
- **Subscription Analytics**: Conversion rates, churn analysis
- **Feature Usage**: Most popular features and scenarios
- **Revenue Tracking**: MRR, LTV, and growth metrics

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Docker Deployment
```bash
docker build -t simutrade .
docker run -p 3000:3000 simutrade
```

### Environment Variables for Production
- Set all environment variables in your hosting platform
- Ensure Supabase RLS policies are properly configured
- Configure Stripe webhooks for your production domain

## 🧪 Testing

### Running Tests
```bash
npm test
```

### Test Coverage
- Unit tests for core trading logic
- Integration tests for API services
- E2E tests for critical user flows

## 📈 Performance Optimization

### Frontend Optimizations
- **Code Splitting**: Lazy loading for better initial load times
- **Image Optimization**: Compressed assets and lazy loading
- **Caching**: Strategic caching of API responses and static assets

### Backend Optimizations
- **Database Indexing**: Optimized queries for trading data
- **Connection Pooling**: Efficient database connections
- **CDN Integration**: Fast global content delivery

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs and request features via GitHub Issues
- **Community**: Join our Discord for community support

## 🎯 Roadmap

### Phase 1: Core Platform ✅
- [x] Virtual trading environment
- [x] AI feedback system
- [x] Basic scenarios and tutorials
- [x] Subscription management

### Phase 2: Advanced Features 🚧
- [ ] Advanced analytics dashboard
- [ ] Custom scenario builder
- [ ] Social trading features
- [ ] Mobile app development

### Phase 3: Enterprise Features 📋
- [ ] White-label solutions
- [ ] Advanced reporting
- [ ] Multi-language support
- [ ] API for third-party integrations

---

**Built with ❤️ for aspiring traders worldwide**
