import { useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import HubPage from './pages/hub/HubPage';
import CompareWorkshopPage from './apps/compare-workshop/CompareWorkshopPage';
import SelectionWorkshopPage from './apps/selection-workshop/SelectionWorkshopPage';
import DiscAnalysisWorkshopPage from './apps/disc-analysis-workshop/DiscAnalysisWorkshopPage';

const ADMIN_PASSWORD = 'efkt-admin-2026';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const isCompareWorkshopRoute = location.pathname === '/apps/compare-workshop';

  function handleSubmit(event) {
    event.preventDefault();

    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
      return;
    }

    setError('Wrong password.');
  }

  function handleLogout() {
    setIsAuthenticated(false);
    setPasswordInput('');
    setError('');
  }

  if (!isAuthenticated) {
    return (
      <main className="login-page">
        <section className="login-card">
          <p className="login-title">EFKT Workshop HUB.</p>
          <form onSubmit={handleSubmit} className="login-form">
            <input
              type="password"
              value={passwordInput}
              onChange={(event) => setPasswordInput(event.target.value)}
              placeholder="Password"
              autoFocus
            />
            <button type="submit">Enter</button>
          </form>
          {error ? <p className="login-error">{error}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>EFKT Workshop Hub.</h1>
        <div className="topbar-actions">
          <button type="button" onClick={() => navigate('/')}>
            Return to Dashboard
          </button>
          <button type="button" className="button-inverted" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <main className={`content ${isCompareWorkshopRoute ? 'content--full' : ''}`.trim()}>
        <Routes>
          <Route path="/" element={<HubPage />} />
          <Route path="/apps/compare-workshop" element={<CompareWorkshopPage />} />
          <Route path="/apps/selection-workshop" element={<SelectionWorkshopPage />} />
          <Route path="/apps/disc-analysis-workshop" element={<DiscAnalysisWorkshopPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
