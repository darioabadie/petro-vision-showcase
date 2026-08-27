# Pulso Vaca Muerta — diseño inicial

Documentación y muestras para un observatorio abierto de producción y productividad de hidrocarburos argentinos.

## Documentos

- [PRD](docs/PRD.md)
- [Arquitectura](docs/architecture.md)
- [Especificación para Lovable y contrato de visualización](docs/lovable.md)
- [Modelo de datos y catálogo de fuentes](docs/MODELO_DE_DATOS.md)
- [Muestras y metodología de muestreo](data/samples/README.md)

## Contenido actual

Esta entrega define el producto y el modelo; todavía no implementa ClickHouse, dbt, la ingesta automática ni el sitio público.

Las muestras provienen de recursos oficiales consultados el 27 de agosto de 2026. Los archivos completos se descargaron temporalmente para perfilar su estructura y no se incorporaron al repositorio.

## Reproducir muestras

Los scripts esperan que los archivos completos hayan sido descargados a `/tmp/pulso-vaca-muerta-sources`:

```bash
python3 scripts/build_source_samples.py
python3 scripts/profile_sources.py
```

Las URLs, checksums y cantidades observadas se encuentran en [`data/samples/manifest.json`](data/samples/manifest.json).
