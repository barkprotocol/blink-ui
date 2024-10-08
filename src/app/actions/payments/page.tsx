"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { SolanaQRCode } from "@/components/qr-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";
import { Loader2, Send, QrCode, ExternalLink } from "lucide-react";

const API_PATH = "/api/actions/payments";

export default function PaymentsPage() {
  const [apiEndpoint, setApiEndpoint] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  useEffect(() => {
    const constructApiUrl = () => {
      try {
        const endpoint = new URL(API_PATH, window.location.origin).toString();
        setApiEndpoint(endpoint);
      } catch (err) {
        console.error("Error constructing API URL:", err);
        setError("Unable to construct the payments API URL. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    constructApiUrl();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !connection) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to make a payment.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const recipientPubKey = new PublicKey(recipient);
      const lamports = parseFloat(amount) * LAMPORTS_PER_SOL;

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubKey,
          lamports,
        })
      );

      const {
        context: { slot: minContextSlot },
        value: { blockhash, lastValidBlockHeight }
      } = await connection.getLatestBlockhashAndContext();

      const signature = await sendTransaction(transaction, connection, { minContextSlot });

      const confirmation = await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature
      });

      if (confirmation.value.err) {
        throw new Error('Transaction failed');
      }

      toast({
        title: "Payment sent successfully",
        description: `${amount} SOL sent to ${recipient}`,
      });

      setRecipient('');
      setAmount('');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Payment failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">BARK Payments</CardTitle>
          <CardDescription>Send and receive payments on the Solana blockchain</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Address</Label>
              <Input
                id="recipient"
                placeholder="Enter Solana address"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                required
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (SOL)</Label>
              <Input
                id="amount"
                type="number"
                step="0.000000001"
                min="0"
                placeholder="Enter amount in SOL"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="bg-gray-50"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90" 
              disabled={isSubmitting || !publicKey}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Payment
                </>
              )}
            </Button>
          </form>
          
          <div className="pt-4 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={() => setShowQR(!showQR)} 
              className="w-full"
            >
              <QrCode className="mr-2 h-4 w-4" />
              {showQR ? "Hide" : "Show"} QR Code
            </Button>
          </div>

          {showQR && (
            <div className="mt-4 bg-white p-4 rounded-lg shadow-inner">
              <SolanaQRCode
                url={apiEndpoint}
                size={300}
                color="black"
                background="white"
                className="mx-auto"
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <Link
            href={apiEndpoint}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center hover:text-primary transition-colors"
          >
            <ExternalLink className="mr-1 h-4 w-4" />
            API Endpoint
          </Link>
          <span>Powered by Solana</span>
        </CardFooter>
      </Card>
    </div>
  );
}