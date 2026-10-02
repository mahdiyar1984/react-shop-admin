import { Link } from "react-router-dom";

function Navbar() {

    return (

        <nav>

            <Link to="/">
                Dashboard
            </Link>

            {" | "}

            <Link to="/products">
                Products
            </Link>

            {" | "}

            <Link to="/products/add">
                Add Product
            </Link>

        </nav>
    );
}

export default Navbar;