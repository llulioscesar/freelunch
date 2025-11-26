import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { UtensilsCrossed, Mail, Calculator, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { useAuth, generateMathChallenge } from '../lib/auth';

export function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [answer, setAnswer] = useState('');
  const [challenge, setChallenge] = useState(() => generateMathChallenge());
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const refreshChallenge = () => {
    setChallenge(generateMathChallenge());
    setAnswer('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate a small delay for UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Validate email domain and math answer
    if (!email.endsWith('@alegra.com') || parseInt(answer) !== challenge.answer) {
      setError('Credenciales incorrectas');
      refreshChallenge();
      setIsLoading(false);
      return;
    }

    // Success!
    login(email);
    navigate({ to: '/' });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
            <UtensilsCrossed className="h-8 w-8 text-orange-500" />
          </div>
          <CardTitle className="text-2xl">FreeLunch</CardTitle>
          <CardDescription>
            Sistema de Donacion de Comida
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                Correo electronico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu.nombre@alegra.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="focus-visible:ring-orange-500"
              />
              <p className="text-xs text-gray-500">
                Solo correos @alegra.com
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="answer" className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-gray-400" />
                Resuelve para continuar
              </Label>
              <div className="flex items-center gap-3">
                <div className="flex-1 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center font-mono text-lg font-bold text-orange-600 dark:text-orange-400">
                  {challenge.question} = ?
                </div>
                <Input
                  id="answer"
                  type="number"
                  placeholder="?"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  required
                  className="w-24 text-center focus-visible:ring-orange-500"
                />
              </div>
              <button
                type="button"
                onClick={refreshChallenge}
                className="text-xs text-orange-500 hover:text-orange-600 hover:underline"
              >
                Cambiar pregunta
              </button>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Ingresar'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="text-center text-xs text-gray-400">
        Demo para pruebas - FreeLunch 2025
      </p>
    </div>
  );
}
