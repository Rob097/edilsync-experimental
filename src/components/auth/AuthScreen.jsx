import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
  AUTH_CONFIRM_EMAIL_NOTICE,
  AUTH_EMAIL_QUERY_KEY,
  AUTH_NOTICE_QUERY_KEY,
  AUTH_SIGNIN_TAB,
  AUTH_SIGNUP_TAB,
  AUTH_TAB_QUERY_KEY,
  buildAuthSearchParams,
  normalizeAuthTab,
} from '@/lib/authRouting';
import { useLanguage } from '@/components/i18n/useLanguage';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthScreen() {
  const { signInWithPassword, signUpWithPassword } = useAuth();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');

  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  const activeTab = normalizeAuthTab(searchParams.get(AUTH_TAB_QUERY_KEY));
  const activeNotice = searchParams.get(AUTH_NOTICE_QUERY_KEY);
  const pendingEmailConfirmation = searchParams.get(AUTH_EMAIL_QUERY_KEY) || '';
  const showConfirmationNotice = activeTab === AUTH_SIGNIN_TAB && activeNotice === AUTH_CONFIRM_EMAIL_NOTICE;

  useEffect(() => {
    if (!pendingEmailConfirmation) {
      return;
    }

    setSigninEmail((currentValue) => currentValue || pendingEmailConfirmation);
  }, [pendingEmailConfirmation]);

  const updateAuthSearch = ({ tab = activeTab, notice, email, replace = true } = {}) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    const authSearchParams = buildAuthSearchParams({ tab, notice, email });

    nextSearchParams.delete(AUTH_TAB_QUERY_KEY);
    nextSearchParams.delete(AUTH_NOTICE_QUERY_KEY);
    nextSearchParams.delete(AUTH_EMAIL_QUERY_KEY);

    authSearchParams.forEach((value, key) => {
      nextSearchParams.set(key, value);
    });

    setSearchParams(nextSearchParams, { replace });
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    if (!signinEmail || !signinPassword) return;

    try {
      setIsLoading(true);
      await signInWithPassword({
        email: signinEmail,
        password: signinPassword,
      });
      if (showConfirmationNotice) {
        updateAuthSearch({ tab: AUTH_SIGNIN_TAB, notice: null, email: null });
      }
      toast.success(t('authScreen.signInSuccess'));
    } catch (error) {
      toast.error(error?.message || t('authScreen.invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (event) => {
    event.preventDefault();

    if (!signupEmail || !signupPassword) return;
    if (signupPassword !== signupConfirmPassword) {
      toast.error(t('authScreen.passwordMismatch'));
      return;
    }

    try {
      setIsLoading(true);
      const result = await signUpWithPassword({
        email: signupEmail,
        password: signupPassword,
      });

      if (result?.requiresEmailConfirmation) {
        updateAuthSearch({
          tab: AUTH_SIGNIN_TAB,
          notice: AUTH_CONFIRM_EMAIL_NOTICE,
          email: signupEmail.trim(),
        });
        setSignupPassword('');
        setSignupConfirmPassword('');
        toast.success(t('authScreen.signUpConfirmationRequired'));
      } else {
        toast.success(t('authScreen.signUpSuccess'));
      }
    } catch (error) {
      toast.error(error?.message || t('authScreen.signUpError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('authScreen.title')}</CardTitle>
          <CardDescription>
            {t('authScreen.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showConfirmationNotice ? (
            <div className="mb-4 rounded-2xl border border-[rgba(239,97,68,0.22)] bg-[rgba(255,243,237,0.92)] px-4 py-3 text-sm text-[#6a2d1f]">
              <p className="font-semibold text-[#231b18]">{t('authScreen.confirmationNoticeTitle')}</p>
              <p className="mt-1 leading-6">{t('authScreen.confirmationNoticeHint')}</p>
              {pendingEmailConfirmation ? (
                <p className="mt-2 break-all font-semibold text-[#231b18]">{pendingEmailConfirmation}</p>
              ) : null}
              <p className="mt-2 leading-6 text-[#7a4a3b]">{t('authScreen.confirmationNoticeFollowUp')}</p>
            </div>
          ) : null}

          <Tabs
            value={activeTab}
            onValueChange={(nextValue) => updateAuthSearch({ tab: nextValue, notice: null, email: null })}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t('authScreen.signInTab')}</TabsTrigger>
              <TabsTrigger value="signup">{t('authScreen.signUpTab')}</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="pt-4">
              <form className="space-y-4" onSubmit={handleSignIn}>
                <div className="space-y-2">
                  <Label htmlFor="signin-email">{t('authScreen.email')}</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    autoComplete="email"
                    value={signinEmail}
                    onChange={(event) => setSigninEmail(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">{t('authScreen.password')}</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    autoComplete="current-password"
                    value={signinPassword}
                    onChange={(event) => setSigninPassword(event.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('authScreen.signIn')}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="pt-4">
              <form className="space-y-4" onSubmit={handleSignUp}>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t('authScreen.email')}</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    value={signupEmail}
                    onChange={(event) => setSignupEmail(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t('authScreen.password')}</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    value={signupPassword}
                    onChange={(event) => setSignupPassword(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">{t('authScreen.confirmPassword')}</Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={signupConfirmPassword}
                    onChange={(event) => setSignupConfirmPassword(event.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('authScreen.signUp')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="pt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => toast.info(t('authScreen.googleUnavailable'))}
              disabled={isLoading}
            >
              {t('authScreen.googleComingSoon')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
