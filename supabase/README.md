# Supabase RPC Function: create_user_profile

## Overview
The `create_user_profile` function is a PostgreSQL RPC (Remote Procedure Call) function designed to create a new user profile in the Secure Chat application.

## Function Signature
```sql
create_user_profile(
  p_username text,
  p_email text DEFAULT NULL,
  p_xrp_address text DEFAULT NULL,
  p_password text DEFAULT NULL,
  p_is_encrypted boolean DEFAULT false,
  p_allow_password_login boolean DEFAULT true
) RETURNS uuid
```

## Parameters
- `p_username` (required): Unique username for the user
- `p_email` (optional): User's email address
- `p_xrp_address` (optional): User's XRP wallet address
- `p_password` (optional): User's password
- `p_is_encrypted` (optional): Flag to indicate if the profile is encrypted
- `p_allow_password_login` (optional): Flag to enable/disable password-based login

## Error Handling
The function includes comprehensive error handling:
- Validates that username is not empty
- Checks for existing username or email
- Prevents duplicate user registrations
- Raises specific exceptions with meaningful error codes

## Usage Example
```typescript
const { data, error } = await supabase.rpc('create_user_profile', {
  p_username: 'johndoe',
  p_email: 'john@example.com',
  p_xrp_address: 'rXRP_ADDRESS_HERE',
  p_password: 'securePassword123',
  p_is_encrypted: false,
  p_allow_password_login: true
});

if (error) {
  console.error('User creation failed:', error);
}
```

## Deployment Notes
- Ensure the `profiles` table exists with the correct schema
- Verify that the UUID extension is enabled
- Check database permissions for the function

## Security Considerations
- Uses `SECURITY DEFINER` to run with elevated privileges
- Grants execute permissions to authenticated and anonymous roles
- Recommended to implement additional password hashing in production
