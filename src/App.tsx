import { Routes, Route } from 'react-router-dom';
import Overview from './pages/Overview/Overview';
import StoreForm from './pages/Stores/StoreForm';
import ProductsList from './pages/Products/ProductsList';
import ProductForm from './pages/Products/ProductForm';
import OrdersList from './pages/Orders/OrdersList';
import OrderForm from './pages/Orders/OrderForm';
import Settings from './pages/Settings';
import Layout from './components/Layout/Layout';
import Login from './pages/Login/Login';
import RequireAuth from './components/auth/RequireAuth';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="stores/new" element={<StoreForm />} />
          <Route path="stores/:storeId/edit" element={<StoreForm />} />
          <Route path="products" element={<ProductsList />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:productId/edit" element={<ProductForm />} />
          <Route path="orders" element={<OrdersList />} />
          <Route path="orders/new" element={<OrderForm />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
