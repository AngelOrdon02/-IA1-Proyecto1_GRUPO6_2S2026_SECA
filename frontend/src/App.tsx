import { Routes, Route } from "react-router-dom";
import InicioPage from "./pages/InicioPage.tsx";
import InvestigacionPage from "./pages/InvestigacionPage.tsx";
import InformePage from "./pages/InformePage.tsx";
import EstadisticasPage from "@/pages/EstadisticasPage.tsx";
import HistorialPage from "./pages/HistorialPage.tsx";
import AdminPage from "./pages/AdminPage.tsx";
import AdminEditorPage from "./pages/AdminEditorPage.tsx";
import AdminLoginPage from "./pages/AdminLoginPage.tsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<InicioPage />} />
      <Route path="/historial" element={<HistorialPage />} />
      <Route path="/estadisticas" element={<EstadisticasPage />} />
      <Route path="/investigacion/:sesion" element={<InvestigacionPage />} />
      <Route path="/investigacion/:sesion/informe" element={<InformePage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/fuente/:archivo" element={<AdminEditorPage />} />
    </Routes>
  );
}
