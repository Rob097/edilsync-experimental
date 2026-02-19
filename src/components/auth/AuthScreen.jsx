import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthScreen() {
  const { signInWithPassword, signUpWithPassword } = useAuth();
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
      toast.success('Accesso effettuato');
    } catch (error) {
      toast.error(error?.message || 'Credenziali non valide');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (event) => {
    event.preventDefault();

    if (!signupEmail || !signupPassword) return;
    if (signupPassword !== signupConfirmPassword) {
      toast.error('Le password non coincidono');
      return;
    }

    try {
      setIsLoading(true);
      const result = await signUpWithPassword({
        email: signupEmail,
        password: signupPassword,
      });

      if (result?.requiresEmailConfirmation) {
        toast.success('Registrazione completata. Controlla la mail per confermare l’account.');
      } else {
        toast.success('Account creato con successo');
      }
    } catch (error) {
      toast.error(error?.message || 'Impossibile completare la registrazione');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accedi a EdilSync</CardTitle>
          <CardDescription>
            Usa email e password. L’accesso Google sarà disponibile più avanti.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="pt-4">
              <form className="space-y-4" onSubmit={handleSignIn}>
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
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
                  <Label htmlFor="signin-password">Password</Label>
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
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Entra'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="pt-4">
              <form className="space-y-4" onSubmit={handleSignUp}>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
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
                  <Label htmlFor="signup-password">Password</Label>
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
                  <Label htmlFor="signup-confirm-password">Conferma password</Label>
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
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crea account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="pt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => toast.info('Accesso con Google non ancora disponibile')}
              disabled={isLoading}
            >
              Continua con Google (presto disponibile)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
