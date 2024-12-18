import React from "react";
import IMEIManager from "./components/IMEIManager"; // Importa el componente IMEIManager
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <div className="container mt-5">
      <header className="text-center mb-4">
        <h1 className="display-4 text-primary font-weight-bold">
          INVENTARIO DE IMEIs PLAZA VEA PUNO
        </h1>
      </header>
      <main>
        {/* Aquí se carga el componente IMEIManager */}
        <IMEIManager />
      </main>
    </div>
  );
}

export default App;
