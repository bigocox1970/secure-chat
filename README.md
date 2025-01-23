# SecureChat.crypto

A secure messaging application that uses XRP wallets for identity and encryption.

## Current Implementation Status

### Core Features

1. ✅ **XRP Wallet Generation**
   - Successfully implemented wallet generation using `xrpl.js`
   - Wallet address and private key are generated and displayed to user
   - Keys are stored in localStorage for persistence

2. ⚠️ **Chat Encryption**
   - Basic encryption implemented using CryptoJS (AES)
   - Currently using symmetric encryption as MVP
   - TODO: Implement proper asymmetric encryption using wallet keys

3. ⚠️ **Database Integration**
   - Supabase connection configured
   - Database tables and policies created:
     - `profiles`: Stores user wallet addresses
     - `messages`: Stores encrypted communications
   - Profile creation experiencing issues (needs debugging)

4. 🚧 **UI Implementation**
   - Sign-Up page completed
     - Wallet generation working
     - Private key copying implemented
     - Navigation to chat needs fixing
   - Chat Dashboard partially implemented
     - Basic message UI created
     - Send/receive functionality needs testing

### Technical Architecture

#### Frontend Stack
- React + Vite
- TypeScript
- React Router (HashRouter)
- TailwindCSS for styling

#### Backend Services
- Supabase for database and auth
- XRP Ledger for wallet operations

#### Key Components

1. **Context Providers**
   - `UserContext`: Manages wallet address and authentication state
   - `WalletContext`: Handles XRP wallet operations

2. **Utility Modules**
   - `encryption.ts`: Handles message encryption/decryption
   - `wallet.ts`: XRP wallet operations
   - `supabase.ts`: Database operations

3. **Components**
   - `SignUp.tsx`: Wallet generation flow
   - `Chat.tsx`: Messaging interface

#### Database Schema

```sql
-- Profiles table
create table profiles (
  id uuid primary key,
  wallet_address text unique,
  created_at timestamp with time zone
);

-- Messages table
create table messages (
  id uuid primary key,
  sender_address text,
  recipient_address text,
  encrypted_content text,
  created_at timestamp with time zone
);
```

### Current Issues

1. **Navigation**
   - HashRouter implementation needs fixing
   - Issues with routing after wallet generation

2. **Database**
   - Profile creation errors occurring
   - Need to verify Supabase connection and policies

3. **Security**
   - Current encryption is symmetric (MVP only)
   - Need to implement proper asymmetric encryption

### Environment Setup

Required environment variables:
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Next Steps

1. Debug Supabase profile creation
2. Fix client-side routing
3. Implement proper asymmetric encryption
4. Add error handling for failed operations
5. Implement message polling/real-time updates
6. Add XRP balance display and transaction features

### Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Database Initialization

The Supabase initialization SQL script is located in `supabase/init.sql`. This needs to be run in the Supabase SQL editor to set up the necessary tables and policies.

### Security Notes

Current implementation uses:
- LocalStorage for key storage (consider more secure alternatives)
- Symmetric encryption (needs upgrade to asymmetric)
- Basic RLS policies (may need refinement)

### Contributing

1. Run the initialization SQL script in Supabase
2. Set up environment variables
3. Install dependencies
4. Start the development server

Remember to never commit sensitive keys or credentials.
