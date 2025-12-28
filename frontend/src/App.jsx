import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Enrollment from './pages/Enrollment';
import Verification from './pages/Verification';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/enrollment" element={<Enrollment />} />
          <Route path="/enroll" element={<Navigate to="/enrollment" replace />} /> {/* Redirect old route */}
          <Route path="/verify" element={<Verification />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
