import { Routes, Route, Link } from 'react-router-dom';
import PublicSearchPage from './pages/PublicSearchPage.jsx';
import CaseDetailPage from './pages/CaseDetailPage.jsx';
import AdminCasesPage from './pages/AdminCasesPage.jsx';
import AdminCaseForm from './pages/AdminCaseForm.jsx';

const App = () => {
  return (
    <div className="layout">
      <header>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <strong>Denuncias Web</strong>
          </div>
          <nav>
            <Link to="/">Consulta pública</Link>
            <Link to="/admin/cases">Panel admin</Link>
          </nav>
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<PublicSearchPage />} />
          <Route path="/cases/:caseId" element={<CaseDetailPage />} />
          <Route path="/admin/cases" element={<AdminCasesPage />} />
          <Route path="/admin/cases/:caseId" element={<AdminCaseForm />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
