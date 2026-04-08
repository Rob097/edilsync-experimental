import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/components/i18n/useLanguage';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthScreen() {
  const { signInWithPassword, signUpWithPassword } = useAuth();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');

  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  const handleSignIn = async (event) => {
    event.preventDefault();
    if (!signinEmail || !signinPassword) return;

    try {
      setIsLoading(true);
      await signInWithPassword({
        email: signinEmail,
        password: signinPassword,
      });
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
          <Tabs defaultValue="signin" className="w-full">
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
