# docs.mystoredigital.cloud

Documentación técnica de procesos, integraciones y capacidades de la infraestructura de My Store Digital.

## Cómo añadir un documento nuevo

1. Crear un archivo `docs/NN-slug-descriptivo.html` (ver ejemplos existentes para el template).
2. Asegurarse de incluir las meta tags: `title`, `description`, `category`, `date`.
3. Correr `node build.js` para regenerar `index.html`.
4. `git commit` y `git push`. El despliegue en Dokploy es automático en cada push a `main`.

## Estructura

```
.
├── docs/                 # Documentos individuales (HTML estático)
├── styles.css            # Estilos compartidos
├── build.js              # Genera index.html desde los meta de docs/*.html
├── index.html            # Generado (no editar a mano)
├── Dockerfile            # nginx:alpine sirviendo el contenido estático
└── docker-compose.yml    # Stack para Dokploy con labels de Traefik
```

## Stack

- HTML estático servido por `nginx:alpine`
- Reverse proxy Traefik con SSL automático (Let's Encrypt)
- DNS y CDN gestionados en Cloudflare
- Hospedado en VPS Hostinger "dokploy" (`vps.mystoredigital.cloud`)
