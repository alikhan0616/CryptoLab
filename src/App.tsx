import { Navigate, Route, Routes } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import { AppShell } from './components/layout/AppShell'
import { PresenterProvider } from './components/layout/Presenter'
import { PAGES } from './routes'

export default function App() {
  return (
    <PresenterProvider>
      <MotionConfig reducedMotion="user">
      <AppShell>
        <Routes>
          {PAGES.map(({ path, component: Page }) => (
            <Route key={path} path={path} element={<Page />} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
      </MotionConfig>
    </PresenterProvider>
  )
}
