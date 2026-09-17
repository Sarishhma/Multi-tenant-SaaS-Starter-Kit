import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense } from "react";
import Hello from "./features/MainApp/Hello";

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<p>Loading page ...</p>}>
        <Routes>
          <Route path="/" element={<Hello />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
