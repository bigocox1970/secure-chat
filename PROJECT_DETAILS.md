# Secure Chat Web Application

## Project Overview
A secure, encrypted messaging application with blockchain wallet integration, built using modern web technologies.

## Technology Stack
- Frontend: React (Vite)
- Backend: Supabase
- Authentication: Supabase Auth
- Encryption: Client-side AES-256-GCM
- Blockchain Integration: Wallet management
- Styling: Tailwind CSS

## Key Features
1. End-to-End Encrypted Messaging
2. Blockchain Wallet Integration
3. Secure User Authentication
4. Real-time Chat Functionality

## Project Structure
```
secure-chat/
├── public/
├── src/
│   ├── components/
│   │   ├── Chat.tsx
│   │   ├── ChatList.tsx
│   │   ├── Profile.tsx
│   │   └── SignUp.tsx
│   ├── context/
│   │   ├── EncryptionContext.tsx
│   │   ├── UserContext.tsx
│   │   └── WalletContext.tsx
│   ├── types/
│   │   ├── env.d.ts
│   │   ├── qr-scanner.d.ts
│   │   └── supabase.ts
│   ├── utils/
│   │   ├── encryption.ts
│   │   ├── supabase.ts
│   │   └── wallet.ts
│   ├── config/
│   │   └── env.ts
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   ├── migrations/
│   │   ├── 20250126_update_messages_table.sql
│   │   └── 202501261430_create_wallets_table.sql
│   └── config.toml
├── package.json
└── vite.config.ts
```

## Database Schema

### Users Table
- Managed by Supabase Auth
- Stores authentication information

### Wallets Table
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to Auth Users)
- `address`: Unique wallet address
- `encrypted_private_key`: Encrypted wallet private key

### Messages Table
- `id`: UUID
- `content`: Encrypted message text
- `thread_id`: UUID
- `sender_address`: Wallet address (Foreign Key to Wallets)
- `is_encrypted`: Boolean
- `created_at`: Timestamp

## Encryption Workflow
1. Generate encryption key during user signup
2. Encrypt wallet private key
3. Encrypt message content client-side
4. Store encrypted data in Supabase

## Setup Requirements
- Node.js (v18+)
- Supabase Account
- Blockchain Wallet Provider Integration

## Environment Variables Needed
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- Encryption salt/key generation parameters

## Local Development Setup
1. Clone repository
2. `npm install`
3. Set up Supabase project
4. Configure `.env` file
5. `npm run dev`

## Deployment Considerations
- Use Supabase Edge Functions for backend logic
- Implement robust error handling
- Secure key management
- Regular security audits

## Future Improvements
- Multi-device support
- Advanced wallet integrations
- Enhanced encryption methods
- Group chat functionality

## Security Notes
- Client-side encryption
- Wallet private keys never leave client
- Secure key derivation
- Minimal server-side data exposure
