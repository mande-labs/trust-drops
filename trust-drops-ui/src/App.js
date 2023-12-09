import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import VerificationPage from './pages/VerificationPage';
import { LogInWithAnonAadhaar, useAnonAadhaar } from 'anon-aadhaar-react';
import { useNavigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { useEffect } from 'react';

function App() {
  const navigate = useNavigate();
  const [anonAadhaar] = useAnonAadhaar();

  let retriveItem = JSON.parse(localStorage.getItem('status'));
  useEffect(() => {
    console.log('useAnonAadhaar?.status', useAnonAadhaar?.status);
    if (anonAadhaar?.status === 'logged-out') {
      navigate('/verification');
    } else if (anonAadhaar?.status === 'logged-in') {
      navigate('/dashboard');
    }
  }, []);
  return (
    <div className='App '>
      <DataProvider>
        {/* <Router> */}
        <Navbar />
        <Routes>
          <Route path='/' element={<LandingPage />} />
          <Route path='/verification' element={<VerificationPage />} />
          <Route path='/dashboard' element={<Dashboard />} />
        </Routes>
        {/* </Router> */}
      </DataProvider>
    </div>
  );
}

export default App;
