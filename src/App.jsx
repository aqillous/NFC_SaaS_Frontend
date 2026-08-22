import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Entities from './pages/Entities.jsx'
import EntityForm from './pages/EntityForm.jsx'
import Subscriptions from './pages/Subscriptions.jsx'

function Protected({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#10161D',
            color: '#F3F6F8',
            fontSize: '0.875rem',
            borderRadius: '0.5rem',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="/entities"
          element={
            <Protected>
              <Entities />
            </Protected>
          }
        />
        <Route
          path="/entities/new"
          element={
            <Protected>
              <EntityForm mode="create" />
            </Protected>
          }
        />
        <Route
          path="/entities/:id/edit"
          element={
            <Protected>
              <EntityForm mode="edit" />
            </Protected>
          }
        />
        <Route
          path="/subscriptions"
          element={
            <Protected>
              <Subscriptions />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}
