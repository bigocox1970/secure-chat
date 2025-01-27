import React, { createContext, useContext, useState } from 'react';

interface EncryptionContextType {
  isEncrypted: boolean;
  setIsEncrypted: (value: boolean) => void;
}

const EncryptionContext = createContext<EncryptionContextType | undefined>(undefined);

export function useEncryption() {
  const context = useContext(EncryptionContext);
  if (context === undefined) {
    throw new Error('useEncryption must be used within an EncryptionProvider');
  }
  return context;
}

export function EncryptionProvider({ children }: { children: React.ReactNode }) {
  const [isEncrypted, setIsEncrypted] = useState(false);

  return (
    <EncryptionContext.Provider value={{ isEncrypted, setIsEncrypted }}>
      {children}
    </EncryptionContext.Provider>
  );
}
