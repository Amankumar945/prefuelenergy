import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ProjectsPage from './pages/ProjectsPage.jsx'
import HRDashboardPage from './pages/HRDashboardPage.jsx'
import LeadsPage from './pages/LeadsPage.jsx'
import InventoryPage from './pages/InventoryPage.jsx'
import QuotesPage from './pages/QuotesPage.jsx'
import ProcurementPage from './pages/ProcurementPage.jsx'
import ProjectDetailsPage from './pages/ProjectDetailsPage.jsx'
import ServicePage from './pages/ServicePage.jsx'
import InvoicesPage from './pages/InvoicesPage.jsx'
import AnnouncementsPage from './pages/AnnouncementsPage.jsx'
import ReportsPage from './pages/ReportsPage.jsx'
import AdminProfilePage from './pages/AdminProfilePage.jsx'
import ComplaintsPage from './pages/ComplaintsPage.jsx'
import InvoicePrintPage from './pages/InvoicePrintPage.jsx'
import QuotePrintPage from './pages/QuotePrintPage.jsx'

function RequireAuth({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

function RequireRole({ children, role }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  if (!user?.role || user.role !== role) return <Navigate to="/" replace />
  return children
}

function RequireRoles({ children, roles = [] }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  if (!user?.role) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) {
    if (user.role === 'hr') return <Navigate to="/hr" replace />
    return <Navigate to="/" replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <RequireRoles roles={["admin", "staff", "ops", "quotes", "finance", "sales"]}>
                <DashboardPage />
              </RequireRoles>
            </RequireAuth>
          }
        />
        <Route
          path="/hr"
          element={
            <RequireAuth>
              <RequireRole role="hr">
                <HRDashboardPage />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/projects"
          element={
            <RequireAuth>
              <RequireRoles roles={["admin", "staff", "ops", "sales"]}>
                <ProjectsPage />
              </RequireRoles>
            </RequireAuth>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <RequireAuth>
              <RequireRoles roles={["admin", "staff", "ops", "sales"]}>
                <ProjectDetailsPage />
              </RequireRoles>
            </RequireAuth>
          }
        />
        <Route
          path="/leads"
          element={
            <RequireAuth>
              <RequireRoles roles={["admin", "staff", "sales"]}>
                <LeadsPage />
              </RequireRoles>
            </RequireAuth>
          }
        />
        <Route
          path="/inventory"
          element={
            <RequireAuth>
              <RequireRoles roles={["admin", "staff", "ops"]}>
                <InventoryPage />
              </RequireRoles>
            </RequireAuth>
          }
        />
        <Route
          path="/procurement"
          element={
            <RequireAuth>
              <RequireRoles roles={["admin", "staff"]}>
                <ProcurementPage />
              </RequireRoles>
            </RequireAuth>
          }
        />
        <Route
          path="/quotes"
          element={
            <RequireAuth>
              <RequireRoles roles={["admin", "staff", "quotes", "sales"]}>
                <QuotesPage />
              </RequireRoles>
            </RequireAuth>
          }
        />
        <Route
          path="/quotes/:id/print"
          element={
            <RequireAuth>
              <RequireRoles roles={["admin", "staff", "quotes", "sales"]}>
                <QuotePrintPage />
              </RequireRoles>
            </RequireAuth>
          }
        />
        <Route
          path="/service"
          element={
            <RequireAuth>
              <RequireRoles roles={["admin", "staff"]}>
                <ServicePage />
              </RequireRoles>
            </RequireAuth>
          }
        />
        <Route
          path="/invoices"
          element={
            <RequireAuth>
              <RequireRoles roles={["admin", "staff", "finance"]}>
                <InvoicesPage />
              </RequireRoles>
            </RequireAuth>
          }
        />
        <Route
          path="/invoices/:id/print"
          element={
            <RequireAuth>
              <RequireRoles roles={["admin", "staff", "finance"]}>
                <InvoicePrintPage />
              </RequireRoles>
            </RequireAuth>
          }
        />
        <Route
          path="/announcements"
          element={
            <RequireAuth>
              <RequireRoles roles={["admin", "staff", "hr"]}>
                <AnnouncementsPage />
              </RequireRoles>
            </RequireAuth>
          }
        />
        <Route
          path="/complaints"
          element={
            <RequireAuth>
              <RequireRoles roles={["admin", "staff", "ops", "sales"]}>
                <ComplaintsPage />
              </RequireRoles>
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <RequireRole role="admin">
                <AdminProfilePage />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/reports"
          element={
            <RequireAuth>
              <RequireRoles roles={["admin", "staff", "hr", "finance"]}>
                <ReportsPage />
              </RequireRoles>
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
