import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import ProductDetail from "./pages/ProductDetail";


function App() {

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchProducts() {

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:8000/api/products/"
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch products"
        );
      }

      const data = await response.json();
      setProducts(data);

    } catch (error) {
      setError(error.message);

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);


  function deleteProduct(id) {
    setProducts(
      products.filter(
        product => product.id !== id
      )
    );
  }


  return (

    <BrowserRouter>

      <Navbar />

      <Routes>

        <Route
          path="/"
          element={
            <Dashboard />
          }
        />

        <Route
          path="/products"
          element={
            <Products
              products={products}
              loading={loading}
              error={error}
              onDelete={deleteProduct}
            />
          }
        />


        <Route
          path="/products/add"
          element={
            <AddProduct />
          }
        />

        <Route
          path="/products/:id"
          element={
            <ProductDetail />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;