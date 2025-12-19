import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CruiseList } from './pages/CruiseList';
import { CruiseDetail } from './pages/CruiseDetail';
import { CruiseObservations } from './pages/CruiseObservations';
import { AnalysisFilter } from './pages/AnalysisFilter';
import { Import } from './pages/Import';
import { Documentation } from './pages/Documentation';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<CruiseList />} />
          <Route path="cruise/create" element={<CruiseDetail />} />
          <Route path="cruise/:cruiseId" element={<CruiseObservations />} />
          <Route path="cruise/:cruiseId/edit" element={<CruiseDetail />} />
          <Route path="analysis" element={<AnalysisFilter />} />
          <Route path="import" element={<Import />} />
          <Route path="docs" element={<Documentation />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
