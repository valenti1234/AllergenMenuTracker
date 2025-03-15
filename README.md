# AllergenMenuTracker

A modern restaurant management system that helps track orders and manage menu items with allergen information.

## Features

- 🍽️ **Menu Management**: Create and manage menu items with allergen information
- 🔍 **Order Tracking**: Real-time order status tracking for customers
- 👨‍🍳 **Kitchen Display System**: Efficient order management for kitchen staff
- 📱 **Mobile Responsive**: Works seamlessly on all devices
- 🚨 **Allergen Alerts**: Clear allergen information for each menu item
- 🕒 **Real-time Updates**: Live order status updates

## Tech Stack

- Frontend: React with TypeScript
- Backend: Node.js with Express
- Database: MongoDB
- UI: Tailwind CSS with Shadcn UI
- State Management: TanStack Query
- Routing: Wouter

## Getting Started

1. Clone the repository
```bash
git clone [repository-url]
cd AllergenMenuTracker
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory with:
```
# MongoDB Connection
MONGODB_URI=your_mongodb_uri

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key

# Server Configuration
PORT=3000
HOST=0.0.0.0

# Stripe API Keys (optional)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# POS Configuration (optional)
POS_ENABLED=true
POS_TYPE=stripe
POS_TERMINAL_LOCATION=your_terminal_location_id
POS_READER_ID=your_reader_id
```

4. Start the development server
```bash
npm run dev
```

5. Access the application
```
http://localhost:3000
```

## Project Structure

- `/client` - Frontend React application
- `/server` - Backend Express server
- `/shared` - Shared types and utilities
- `/uploads` - Uploaded images and files

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 