import { Routes } from '@angular/router';
import { Home } from './home/home';
import { About } from './about/about';
import { Contact } from './contact/contact';
import { Services } from './services/services';
import { Products } from './products/products';
import { LayoutHome } from './layout/layout-home/layout-home';
import { LayoutDash } from './layout/layout-dash/layout-dash';
import { AdminCart } from './admin-cart/admin-cart';
import { AdminCategory } from './admin-category/admin-category';
import { AdminProducts } from './admin-products/admin-products';
import { AdminSales } from './admin-sales/admin-sales';
import { AdminUsers } from './admin-users/admin-users';
import { AdminWishlist } from './admin-wishlist/admin-wishlist';
import { Cart } from './cart/cart';
import { Cheking } from './cheking/cheking';
import { DetailProduct } from './detail-product/detail-product';
import { Form } from './form/form';
import { LayoutLogin } from './layout/layout-login/layout-login';
import { Login } from './login/login';
import { Profile } from './profile/profile';
import { Gallery } from './gallery/gallery';

export const pagesRoutes: Routes = [
  {
    path: '',
    component: LayoutHome,
    children: [
      {
        path: '',
        component: Home,
        data: {
          title:  'Inicio | MAA Hair Studio',
          description: "Bienvenidas a nuestra aplicación. Descubre nuestras servicios y productos.",
          keywords: "home, welcome, services, products",
        }
      },
      {
        path: 'about',
        component: About,
        data: {
          title: ' Historia | MAA Hair Studio',
          description: "Mi historia.",
          keywords: "about, history, story, background",
        }
      },
      {
        path: 'services',
        component: Services,
        data: {
          title: 'Servicios | MAA Hair Studio',
          description: "Descubre nuestros servicios y cómo podemos ayudarte a alcanzar tus objetivos.",
          keywords: "services, offerings, solutions, help",
        }
      },
      {
        path: 'products',
        component: Products,
        data: {
          title: 'Tienda | MAA Hair Studio',
          description: "Explore nuestro catalogo de productos diseñados para satisfacer tus necesidades.",
          keywords: "products, results, catalog, offerings",
        }
      },
            {
        path: 'gallery',
        component: Gallery,
        data: {
          title: 'Galería de Fotos | MAA Hair Studio',
          description: "Explora nuestra galería de fotos para ver ejemplos de nuestro trabajo y estilos.",
          keywords: "gallery, photos, images, portfolio",
        }
      },
      {
        path: 'contact',
        component: Contact,
        data: {
          title: 'Contacto | MAA Hair Studio',
          description: "Pongase en contacto conmigo ante cualquier inquietud.",
          keywords: "contact, inquiries, feedback, support",
        }
      },
      {
        path: 'cart',
        component: Cart,
        data: {
          title: "cart",
          description: "Tu carrito de compras.",
          keywords: "cart, shopping, checkout",
        }
      },
      {
        path: 'checkout',
        component: Cheking,
        data: {
          title: "checkout",
          description: "Proceso de pago.",
          keywords: "checkout, payment, purchase",
        }
      },
      {
        path: 'details',
        component: DetailProduct,
        data: {
          title: "details",
          description: "Detalles del producto.",
          keywords: "details, product, information",
        }
      },
      {
        path: 'form',
        component: Form,
        data: {
          title: "form",
          description: "Formulario de contacto.",
          keywords: "form, contact, inquiries",
        }
      }
    ]
  },
  {
    path: 'admin',
    component: LayoutDash,
    children: [
      {
        path: '',
        component: AdminCart,
        data: {
          title: "admin",
          description: "Panel de administración.",
          keywords: "admin, dashboard, management",
        },
      },
      {
        path: 'category',
        component: AdminCategory,
        data: {
          title: "admin category",
          description: "Panel de administración de categorías.",
          keywords: "admin, dashboard, management, categories",
        }
      },
      {
        path: 'products',
        component: AdminProducts,
        data: {
          title: "admin product",
          description: "Panel de administración de productos.",
          keywords: "admin, dashboard, management, products",
        }
      },
      {
        path: 'sales',
        component: AdminSales,
        data: {
          title: "admin sales",
          description: "Panel de administración de ventas.",
          keywords: "admin, dashboard, management, sales",
        }
      },
      {
        path: 'users',
        component: AdminUsers,
        data: {
          title: "admin users",
          description: "Panel de administración de usuarios.",
          keywords: "admin, dashboard, management, users",
        }
      },
      {
        path: 'wishlist',
        component: AdminWishlist,
        data: {
          title: "admin wishlist",
          description: "Panel de administración de la lista de deseos.",
          keywords: "admin, dashboard, management, wishlist",
        }
      }
    ]
  },
  {
    path: 'login',
    component: LayoutLogin,
    children: [
      {
        path: '',
        component: Login,
        data: {
          title: "login",
          description: "Inicie sesión en su cuenta.",
          keywords: "login, authentication, access",
        }
      },
      {
        path: 'profile',
        component: Profile,
        data: {
          title: "profile",
          description: "Perfil de usuario.",
          keywords: "profile, user, account",
        }
      }
    ]
  }
];
export default pagesRoutes;
