import React, { useState, useEffect, useRef } from 'react';
import { Phone, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { setupRecaptcha, requestOTP, auth } from '../../lib/firebase';
import firebaseConfig from '../../../firebase-applet-config.json';
import { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
import { cn } from '../../lib/utils';

export function PhoneLogin({ onBack }: { onBack: () => void }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    // Optional: cleanup if needed
    return () => {
      if (recaptchaVerifier.current) {
        recaptchaVerifier.current.clear();
        recaptchaVerifier.current = null;
      }
    };
  }, []);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phoneNumber) return;

    // Format phone number if missing +
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      setError('Please include country code (e.g., +91)');
      return;
    }

    setLoading(true);
    try {
      // Clear existing verifier to prevent "already rendered" error
      if (recaptchaVerifier.current) {
        try {
          recaptchaVerifier.current.clear();
        } catch (e) {
          console.warn('Error clearing reCAPTCHA:', e);
        }
        recaptchaVerifier.current = null;
      }

      recaptchaVerifier.current = setupRecaptcha('recaptcha-container');
      
      const result = await requestOTP(formattedPhone, recaptchaVerifier.current);
      setConfirmationResult(result);
      setStep('otp');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError(
          `Phone authentication is blocked for this region. 
          
          REQUIRED STEPS:
          1. Go to Firebase Console -> Authentication -> Sign-in method -> Enable 'Phone'.
          2. IMPORTANT: Go to 'Settings' tab -> 'SMS Region Policy'.
          3. Change policy to 'Allow' and explicitly add your country (e.g. India).
          
          Console: https://console.firebase.google.com/project/${(firebaseConfig as any).projectId}/authentication/providers`
        );
      } else if (err.code === 'auth/too-many-requests') {
        setError(
          `Too many attempts! SMS quota exceeded or spam protection triggered. 
          
          PLEASE WAIT: Try again in 10-15 minutes.
          
          PRO-TIP: For testing, add 'Test Phone Numbers' in your Firebase Console (Auth -> Sign-in method -> Phone). Test numbers bypass SMS limits and arrive instantly.`
        );
      } else {
        setError(err.message || 'Failed to send OTP. Try again.');
      }
      
      // Always cleanup on error
      if (recaptchaVerifier.current) {
        try {
          recaptchaVerifier.current.clear();
        } catch (e) {}
        recaptchaVerifier.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otp || !confirmationResult) return;

    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      // Auth state listener in DieselContext will handle the redirect
    } catch (err: any) {
      console.error(err);
      setError('Invalid OTP. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
          <Phone size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white">
          {step === 'phone' ? 'Phone Login' : 'Verify OTP'}
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          {step === 'phone' ? 'Enter your mobile number to continue' : `Enter the 6-digit code sent to ${phoneNumber}`}
        </p>
      </div>

      <form onSubmit={step === 'phone' ? handleSendOTP : handleVerifyOTP} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-500/10 p-4 text-xs font-bold text-red-500 border border-red-500/20 text-left whitespace-pre-wrap">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {step === 'phone' ? (
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Phone Number (with Country Code)</label>
            <input 
              autoFocus
              type="tel"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              placeholder="+91 9876543210"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-white focus:border-orange-500 focus:ring-0"
              required
            />
          </div>
        ) : (
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">6-Digit OTP</label>
            <input 
              autoFocus
              type="text"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value)}
              placeholder="000000"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-4 font-mono text-3xl font-black tracking-[0.5em] text-center text-white focus:border-orange-500 focus:ring-0"
              required
            />
          </div>
        )}

        <button
          disabled={loading}
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-4 font-bold text-white shadow-lg shadow-orange-900/20 transition-all hover:bg-orange-700 active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Processing...
            </span>
          ) : (
            <>
              {step === 'phone' ? 'Send OTP' : 'Verify & Login'}
              <ArrowRight size={20} />
            </>
          )}
        </button>

        <button
          type="button"
          onClick={step === 'otp' ? () => setStep('phone') : onBack}
          className="w-full py-2 text-sm font-medium text-zinc-500 hover:text-white transition-colors"
        >
          {step === 'otp' ? 'Change Number' : 'Switch Login Method'}
        </button>
      </form>

      {/* Invisible container for reCAPTCHA */}
      <div id="recaptcha-container"></div>
    </div>
  );
}
