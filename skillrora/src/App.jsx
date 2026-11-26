import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { WalletProvider } from './context/WalletContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import ScrollManager from './components/ScrollManager.jsx'
import Home from './pages/Home.jsx'
import Explore from './pages/Explore.jsx'
import ServiceDetail from './pages/ServiceDetail.jsx'
import Talent from './pages/Talent.jsx'
import FreelancerProfile from './pages/FreelancerProfile.jsx'
import Projects from './pages/Projects.jsx'
import ProjectDetail from './pages/ProjectDetail.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import FreelancerDashboard from './pages/FreelancerDashboard.jsx'
import ClientDashboard from './pages/ClientDashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import CreateGig from './pages/CreateGig.jsx'
import MyGigs from './pages/MyGigs.jsx'
import MyProfile from './pages/MyProfile.jsx'
import Orders from './pages/Orders.jsx'
import Messages from './pages/Messages.jsx'
import Payments from './pages/Payments.jsx'
import Notifications from './pages/Notifications.jsx'

export default function App() {
  return (
    <LanguageProvider>
      <WalletProvider>
        <AuthProvider>
          <ScrollManager />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/services/:slug" element={<ServiceDetail />} />
            <Route path="/talent" element={<Talent />} />
            <Route path="/freelancers/:id" element={<FreelancerProfile />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route path="/dashboard" element={<ProtectedRoute roles={['freelancer']}><FreelancerDashboard /></ProtectedRoute>} />
            <Route path="/my-gigs" element={<ProtectedRoute roles={['freelancer']}><MyGigs /></ProtectedRoute>} />
            <Route path="/create-gig" element={<ProtectedRoute roles={['freelancer']}><CreateGig /></ProtectedRoute>} />
            <Route path="/create-gig/:id" element={<ProtectedRoute roles={['freelancer']}><CreateGig /></ProtectedRoute>} />

            <Route path="/client-dashboard" element={<ProtectedRoute roles={['client']}><ClientDashboard /></ProtectedRoute>} />

            <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />

            <Route path="/my-profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </WalletProvider>
    </LanguageProvider>
  )
}
