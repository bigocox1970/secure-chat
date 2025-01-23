import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { sendMessage, getMessages, Message } from '../utils/supabase';
import { isValidXRPAddress } from '../utils/wallet';
import { encryptMessage, decryptMessage, getFromSecureStorage, STORAGE_KEYS } from '../utils/encryption';

export function Chat() {
  const { walletAddress, balance } = useUser();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const privateKey = getFromSecureStorage(STORAGE_KEYS.PRIVATE_KEY);

  useEffect(() => {
    loadMessages();
  }, [walletAddress]);

  const loadMessages = async () => {
    if (!walletAddress || !privateKey) return;
    try {
      const fetchedMessages = await getMessages(walletAddress);
      setMessages(fetchedMessages);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!recipientAddress || !message) {
      setError('Please fill in all fields');
      return;
    }

    if (!isValidXRPAddress(recipientAddress)) {
      setError('Invalid XRP address');
      return;
    }

    setLoading(true);
    try {
      // Encrypt the message using the recipient's public key (address)
      const encryptedMessage = encryptMessage(message, recipientAddress);
      await sendMessage(walletAddress!, recipientAddress, encryptedMessage);
      setMessage('');
      setRecipientAddress('');
      await loadMessages();
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const decryptMessageContent = (msg: Message): string => {
    try {
      // If we're the sender, decrypt with recipient's address
      // If we're the recipient, decrypt with our private key
      const decryptionKey = msg.sender_address === walletAddress 
        ? msg.recipient_address 
        : privateKey!;
      
      return decryptMessage(msg.encrypted_content, decryptionKey);
    } catch (error) {
      console.error('Failed to decrypt message:', error);
      return '[Failed to decrypt message]';
    }
  };

  if (!privateKey) {
    return (
      <div className="container">
        <div className="alert alert-error">
          Private key not found. Please generate a new wallet.
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="mb-2">
          <strong>Your Wallet:</strong> {walletAddress}
          <br />
          <strong>Balance:</strong> {balance} XRP
        </div>

        <form onSubmit={handleSend}>
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="Recipient's XRP Address"
            className="input"
          />
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message"
            className="input"
          />
          <button
            type="submit"
            disabled={loading}
            className="button button-primary w-full"
          >
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="font-bold mb-2">Messages</h2>
        {messages.length === 0 ? (
          <p className="text-gray">No messages yet</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="card"
            >
              <div className="text-sm text-gray">
                {msg.sender_address === walletAddress ? 'To: ' : 'From: '}
                {msg.sender_address === walletAddress
                  ? msg.recipient_address
                  : msg.sender_address}
              </div>
              <div className="break-word">
                {decryptMessageContent(msg)}
              </div>
              <div className="text-sm text-gray mt-2">
                {new Date(msg.created_at).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
