import { memo } from "react";
import {Navigate, Route, Routes,} from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import ProductDetail from "./pages/ProductDetail";
import EditProduct from "./pages/EditProduct";
import MultipleProducts from "./pages/MultipleProducts";
import InfiniteProducts from "./pages/InfiniteProducts";
import IntegrationTest from "./pages/IntegrationTest";

function App() {
    return (
        <>
            <Navbar />

            <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
                <Route path="/dashboard" element={<Dashboard />}/>
                <Route path="/products" element={<Products />}/>
                <Route path="/products/add" element={<AddProduct />}/>
                <Route path="/products/:id" element={<ProductDetail />}/>
                <Route path="/products/:id/edit" element={<EditProduct />}/>
                <Route path="/multiple-products" element={<MultipleProducts />}/>
                <Route path="/infinite-products" element={<InfiniteProducts />}/>
                <Route path="/integration-test" element={<IntegrationTest />}/>
                <Route path="*" element={<Navigate to="/products" replace/>}/>
            </Routes>

            <Footer />
        </>
    );
}

export default memo(App);