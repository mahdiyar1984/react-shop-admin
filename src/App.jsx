import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <h1>Shop Admin Dashboard</h1>
        <hr />
        <h2>Products</h2>
        <p>No products yet.</p>
      </div>
    </>
  )
}

export default App
