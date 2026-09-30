import { useState } from 'react'
import Navbar from './components/Navbar'
import ProductCard from './components/ProductCard'
import './App.css'

function App() {

  const [products, setProducts] = useState([
    {
      id: 1,
      name: "Laptop",
      price: 1200,
      category: "Computer"
    },
    {
      id: 2,
      name: "Phone",
      price: 700,
      category: "Mobile"
    },
    {
      id: 3,
      name: "Tablet",
      price: 500,
      category: "Tablet"
    }
  ]);

  function addProduct() {

    const newProduct = {
      id: 4,
      name: "Tablet",
      price: 500,
      category: "Tablet"
    };

    setProducts([
      ...products,
      newProduct
    ]);
  }

  function deleteProduct(id) {
    setProducts(
      products.filter(product => product.id !== id)
    );

  }

  return (
    <>
      <div>

        <h1>Shop Admin Dashboard</h1>

        <button onClick={addProduct}>
          Add Product
        </button>

        <h2>Products</h2>

        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onDelete={deleteProduct}
          />
        ))}

      </div>
    </>
  )
}

export default App
