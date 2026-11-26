import { Routes, Route, Navigate } from 'react-router-dom'
import ScrollManager from './components/ScrollManager.jsx'
import Home from './pages/Home.jsx'
import Explore from './pages/Explore.jsx'
import ServiceDetail from './pages/ServiceDetail.jsx'
import Login from './pages/Login.jsx'
import CreateGig from './pages/CreateGig.jsx'
import MyGigs from './pages/MyGigs.jsx'
import Orders from './pages/Orders.jsx'
import Messages from './pages/Messages.jsx'
import MyProfile from './pages/MyProfile.jsx'

export default function App() {
  return (
    <>
      <ScrollManager />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/services/modern-saas-website" element={<ServiceDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/create-gig" element={<CreateGig />} />
        <Route path="/my-gigs" element={<MyGigs />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/my-profile" element={<MyProfile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
