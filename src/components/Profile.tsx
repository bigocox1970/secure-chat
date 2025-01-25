import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useWallet } from '../context/WalletContext';
import { useUser } from '../context/UserContext';

export function Profile() {
  const { wallet } = useWallet();
  const { user } = useUser();
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!wallet || !user) return null;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#111b21] p-6">
      <div className="flex items-center mb-4">
        <div className="w-16 h-16 rounded-full bg-[#2a3942] flex items-center justify-center mr-4">
          <span className="text-[#aebac1] text-2xl font-medium">
            {user.username.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h2 className="text-[#e9edef] text-xl font-medium">{user.username}</h2>
          <p className="text-[#8696a0] text-sm">{user.email}</p>
        </div>
      </div>

      <div className="bg-[#2a3942] rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[#8696a0] text-sm">Your XRP Address</span>
          <button
            onClick={handleCopyAddress}
            className="text-[#00a884] text-sm hover:text-[#06cf9c] focus:outline-none"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-[#e9edef] text-sm font-mono break-all">{wallet.address}</p>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowQR(!showQR)}
          className="bg-[#00a884] text-[#111b21] px-4 py-2 rounded-lg font-medium hover:bg-[#06cf9c] focus:outline-none"
        >
          {showQR ? 'Hide QR Code' : 'Show QR Code'}
        </button>
        <button
          onClick={() => {
            const url = `data:text/plain;charset=utf-8,${wallet.address}`;
            const link = document.createElement('a');
            link.href = url;
            link.download = 'xrp-address.txt';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          className="text-[#00a884] hover:text-[#06cf9c] focus:outline-none"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
          </svg>
        </button>
      </div>

      {showQR && (
        <div className="mt-4 bg-white p-4 rounded-lg flex justify-center">
          <QRCodeSVG value={wallet.address} size={200} level="H" />
        </div>
      )}
    </div>
  );
}
