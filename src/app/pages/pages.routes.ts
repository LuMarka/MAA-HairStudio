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
import { Wishlist } from './wishlist/wishlist';
import { adminGuard } from '../core/guards/admin.guard';
import { guestGuard } from '../core/guards/guest.guard';
import { authGuard } from '../core/guards/auth.guard';

export const pagesRoutes: Routes = [
  {
    path: '',
    component: LayoutHome,
    children: [
      {
        path: '',
        component: Home,
        data: {
          title: 'Inicio | MAA Hair Studio',
          description: "Bienvenidas a nuestra aplicación. Descubre nuestras servicios y productos.",
          keywords: "home, welcome, services, products, inicio, bienvenida, servicios, productos",
        }
      },
      {
        path: 'about',
        component: About,
        data: {
          title: ' Historia | MAA Hair Studio',
          description: "Mi historia.",
          keywords: "about, history, story, background, mi historia, sobre mí",
        }
      },
      {
        path: 'services',
        component: Services,
        data: {
          title: 'Beauty Scan | MAA Hair Studio',
          description: "Diagnóstico personalizado.",
          keywords: "services, offerings, solutions, help, diagnóstico personalizado, beauty scan, scan, online, consulta, te escuchamos",
        }
      },
      {
        path: 'products',
        component: Products,
        data: {
          title: 'Tienda | MAA Hair Studio',
          description: "Explore nuestro catalogo de productos diseñados para satisfacer tus necesidades.",
          keywords: "products, results, catalog, offerings, productos, tienda, catálogo",
        }
      },
      {
        path: 'gallery',
        component: Gallery,
        data: {
          title: 'Galería de Fotos | MAA Hair Studio',
          description: "Explora nuestra galería de fotos para ver ejemplos de nuestro trabajo y estilos.",
          keywords: "gallery, photos, images, portfolio, galería, fotos, imágenes, portafolio",
        }
      },
      {
        path: 'contact',
        component: Contact,
        data: {
          title: 'Contacto | MAA Hair Studio',
          description: "Pongase en contacto conmigo ante cualquier inquietud.",
          keywords: "contact, inquiries, feedback, support, contacto, consultas, soporte",
        }
      },
      {
        path: 'cart',
        component: Cart,
        canActivate: [authGuard],
        data: {
          title: "Carrito | MAA Hair Studio",
          description: "Tu carrito de compras.",
          keywords: "cart, shopping, checkout, carrito, compras",
        }
      },
      {
        path: 'checkout',
        component: Cheking,
        canActivate: [authGuard],
        data: {
          title: "Checkout | MAA Hair Studio",
          description: "Proceso de pago.",
          keywords: "checkout, payment, purchase, pago, orden de compra",
        }
      },
      {
        path: 'details/:id',
        component: DetailProduct,
        data: {
          title: "Detalles | MAA Hair Studio",
          description: "Detalles del producto.",
          keywords: "details, product, information, detalles, producto, información",
        }
      },
      {
        path: 'form',
        component: Form,
        data: {
          title: "Formulario | MAA Hair Studio",
          description: "Formulario de contacto.",
          keywords: "form, contact, inquiries, formulario, contacto, consultas",
        }
      },
      {
        path: 'wishlist',
        component: Wishlist,
        canActivate: [authGuard],
        data: {
          title: "Mis Favoritos | MAA Hair Studio",
          description: "Tu lista de productos favoritos.",
          keywords: "wishlist, favorites, productos favoritos",
        }
      }
    ]
  },
  {
    path: 'admin',
    component: LayoutDash,
    canActivate: [adminGuard],
    canActivateChild: [adminGuard],
    children: [
      {
        path: '',
        component: AdminCart,
        data: {
          title: "Dashboard | MAA Hair Studio",
          description: "Panel de administración.",
          keywords: "admin, dashboard, management",
        },
      },
      {
        path: 'category',
        component: AdminCategory,
        data: {
          title: "Categorías | Admin MAA Hair Studio",
          description: "Panel de administración de categorías.",
          keywords: "admin, dashboard, management, categories",
        }
      },
      {
        path: 'products',
        component: AdminProducts,
        data: {
          title: "Productos | Admin MAA Hair Studio",
          description: "Panel de administración de productos.",
          keywords: "admin, dashboard, management, products",
        }
      },
      {
        path: 'sales',
        component: AdminSales,
        data: {
          title: "Ventas | Admin MAA Hair Studio",
          description: "Panel de administración de ventas.",
          keywords: "admin, dashboard, management, sales",
        }
      },
      {
        path: 'users',
        component: AdminUsers,
        data: {
          title: "Usuarios | Admin MAA Hair Studio",
          description: "Panel de administración de usuarios.",
          keywords: "admin, dashboard, management, users",
        }
      },
      {
        path: 'wishlist',
        component: AdminWishlist,
        data: {
          title: "Lista de Deseos | Admin MAA Hair Studio",
          description: "Panel de administración de la lista de deseos.",
          keywords: "admin, dashboard, management, wishlist",
        }
      }
    ]
  },
  {
    path: 'login',
    component: LayoutLogin,
    canActivate: [guestGuard],
    children: [
      {
        path: '',
        component: Login,
        data: {
          title: "Iniciar Sesión | MAA Hair Studio",
          description: "Inicie sesión en su cuenta.",
          keywords: "login, authentication, access",
        }
      },
      {
        path: 'profile',
        component: Profile,
        canActivate: [authGuard],
        data: {
          title: "Perfil | MAA Hair Studio",
          description: "Perfil de usuario.",
          keywords: "profile, user, account",
        }
      }
    ]
  }
];

export default pagesRoutes;
