import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import ProductDetail from "./pages/ProductDetail";
import EditProduct from "./pages/EditProduct";
import useApi from "./hooks/useApi";
import { getProducts, createProduct, updateProduct, deleteProduct } from "./api/productsApi";


function App() {

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState("");

  async function fetchProducts() {

    try {

      const data = await getProducts();

      setProducts(data);

    } catch (error) {

      console.log(error);

    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  function addProduct(product) {

    setProducts(prevProducts => [
      ...prevProducts,
      product
    ]);
  }

  function updateProduct(updatedProduct) {
    setProducts(prevProducts =>
      prevProducts.map(product =>
        product.id === updatedProduct.id
          ? updatedProduct
          : product
      )
    );
  }


  async function deleteProduct(id) {

    try {
      setDeletingId(id);
      setActionError("");

      const response = await fetch(
        `http://localhost:8000/api/products/${id}/`,
        {
          method: "DELETE"
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete product"
        );
      }

      setProducts(prevProducts =>
        prevProducts.filter(
          product => product.id !== id
        )
      );

    } catch (error) {
      setActionError(error.message);

    } finally {
      setDeletingId(null);
    }
  }


  return (

    <BrowserRouter>

      <Navbar />

      <Routes>

        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/products"
          element={
            <Products
              products={products}
              loading={loading}
              error={error}
              onDelete={deleteProduct}
              deletingId={deletingId}
              actionError={actionError}
              onRefresh={fetchProducts}
            />
          }
        />

        <Route
          path="/products/:id"
          element={<ProductDetail />}
        />

        <Route
          path="/products/:id/edit"
          element={
            <EditProduct
              onUpdateProduct={updateProduct} />
          }
        />

        <Route
          path="/products/add"
          element={
            <AddProduct
              onAddProduct={addProduct}
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;