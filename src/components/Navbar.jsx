import { memo } from "react";
import { NavLink } from "react-router-dom";

function Navbar() {
    return (
        <nav>
            <NavLink to="/dashboard">داشبورد</NavLink>
            {" | "}
            <NavLink to="/products">محصولات</NavLink>
            {" | "}
            <NavLink to="/multiple-products">چند محصول</NavLink>
            {" | "}
            <NavLink to="/infinite-products">محصولات بیشتر</NavLink>
            {" | "}
            <NavLink to="/integration-test">تست یکپارچه</NavLink>
        </nav>
    );
}

export default memo(Navbar);