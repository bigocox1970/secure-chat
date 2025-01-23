import { Wallet } from 'xrpl';

export async function generateWallet(): Promise<{ address: string; seed: string }> {
  try {
    console.log('Generating XRP wallet...');
    
    // Generate wallet without requiring a connection
    const wallet = Wallet.generate();
    const { address, seed } = wallet;
    
    console.log('Wallet generated successfully');
    
    return { 
      address: address || '', 
      seed: seed || '' 
    };
  } catch (error) {
    console.error('Error in wallet generation:', error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to generate wallet. Please try again.');
  }
}

export async function getBalance(address: string): Promise<string> {
  try {
    // For now, return 0 since we're not connected to a network
    // Users will need to fund their wallets manually
    return '0';
  } catch (error) {
    console.error('Error fetching balance:', error);
    return '0';
  }
}

export function isValidXRPAddress(address: string): boolean {
  try {
    // Simple regex validation for XRP addresses
    const xrpAddressRegex = /^r[1-9A-HJ-NP-Za-km-z]{25,34}$/;
    return xrpAddressRegex.test(address);
  } catch {
    return false;
  }
}
