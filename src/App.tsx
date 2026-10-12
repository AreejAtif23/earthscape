import { AppearanceProvider } from '@/hooks/useAppearance'
import { AuthProvider } from '@/hooks/useAuth'
import { ToastProvider } from '@/hooks/useToast'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { ToastViewport } from '@/components/common/Toast'
import { AppRouter } from '@/routes/AppRouter'

/**
 * Provider order matters: appearance first (it decorates <html> before paint),
 * then auth (guards depend on the restored session), then toasts (any layer may
 * raise a notification).
 *
 * The viewport is mounted here rather than inside the app shell so sign-in,
 * sign-up and error screens can raise notifications too.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <AppearanceProvider>
        <AuthProvider>
          <ToastProvider>
            <AppRouter />
            <ToastViewport />
          </ToastProvider>
        </AuthProvider>
      </AppearanceProvider>
    </ErrorBoundary>
  )
}
