import { Routes } from '@angular/router';
import { Layout } from './layout/layout';
import { Home } from './home/home';
import { About } from './about/about';
import { Contact } from './contact/contact';
import { Services } from './services/services';
import { Products } from './products/products';

export const pagesRoutes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      {
        path: '',
        component: Home,
        data: {
          title: "home",
          description: "Bienvenidas a nuestra aplicación. Descubre nuestras servicios y productos.",
          keywords: "home, welcome, services, products",
        }
      },
      {
        path: 'about',
        component: About,
        data: {
          title: "about",
          description: "Mi historia.",
          keywords: "about, history, story, background",
        }
      },
      {
        path: 'services',
        component: Services,
        data: {
          title: "services",
          description: "Descubre nuestros servicios y cómo podemos ayudarte a alcanzar tus objetivos.",
          keywords: "services, offerings, solutions, help",
        }
      },
      {
        path: 'products',
        component: Products,
        data: {
          title: "products",
          description: "Explore nuestro catalogo de productos diseñados para satisfacer tus necesidades.",
          keywords: "products, results, catalog, offerings",
        }
      },
      {
        path: 'contact',
        component: Contact,
        data: {
          title: "contact",
          description: "Pongase en contacto conmigo ante cualquier inquietud.",
          keywords: "contact, inquiries, feedback, support",
        }
      },
      {
        path: '**',
        redirectTo: '',
        pathMatch: 'full'  // Redirect any unknown paths to the home page
      }
    ]
  }
];
export default pagesRoutes;
