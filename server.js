const express = require('express');
const app = express();
const { MercadoPagoConfig, Preference } = require('mercadopago');

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());

// 1. CONFIGURACIÓN CON TU TOKEN REAL DE PRODUCCIÓN
const client = new MercadoPagoConfig({ accessToken: 'APP_USR-7948112399335955-050719-931d8f16aa048dbde1f8343c7ef1781a-1925919665' });

// 2. BASE DE DATOS DE PRODUCTOS CON TALLES Y COLORES
const productos = [
    { id: 'm1', categoria: 'mujer', subcategoria: 'calzas', nombre: 'Calza Reductora', precio: 20000, imagen: 'unsplash.com', talles: ['S', 'M', 'L', 'XL'], colores: ['Negro', 'Azul'] },
    { id: 'm2', categoria: 'mujer', subcategoria: 'ropa interior', nombre: 'Tanga Diseño', precio: 5000, imagen: 'unsplash.com', talles: ['Único'], colores: ['Rojo', 'Negro', 'Blanco'] },
    { id: 'm3', categoria: 'mujer', subcategoria: 'pijamas', nombre: 'Pijama Conjunto M', precio: 25000, imagen: 'unsplash.com', talles: ['S', 'M', 'L'], colores: ['Rosa', 'Gris'] }
];


// RUTA PRINCIPAL
app.get('/', (req, res) => {
    res.render('index', { productos: productos, categoriaActiva: 'todos' });
});

// RUTA FILTRADA
app.get('/categoria/:nombreCategoria', (req, res) => {
    const cat = req.params.nombreCategoria;
    const productosFiltrados = productos.filter(p => p.categoria === cat);
    res.render('index', { productos: productosFiltrados, categoriaActiva: cat });
});

// PROCESAMIENTO DE PAGO
app.post('/crear-pago', async (req, res) => {
    try {
        const { carrito, datosEnvio } = req.body;
        let total = 0;
        const itemsParaPagar = [];
        
        carrito.forEach(item => {
            const prodReal = productos.find(p => p.id === item.id);
            if (prodReal) {
                total += prodReal.precio * item.cantidad;
                itemsParaPagar.push({
                    title: `${prodReal.nombre} (Talle: ${item.talle} / Col: ${item.color})`,
                    quantity: Number(item.cantidad),
                    unit_price: Number(prodReal.precio),
                    currency_id: 'ARS'
                });
            }
        });

        if (total < 50000) {
            return res.status(400).json({ error: 'Monto mínimo no alcanzado.' });
        }

        const preference = new Preference(client);
        const response = await preference.create({
            body: {
                items: itemsParaPagar,
                back_urls: { success: 'http://localhost:3000', failure: 'http://localhost:3000' },
                auto_return: 'approved'
            }
        });

        res.json({ init_point: response.init_point });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`============= VENTA SP MULTI-CATÁLOGO =============`);
    console.log(`Servidor activo de forma segura en: http://localhost:${PORT}`);
    console.log(`====================================================`);
});
