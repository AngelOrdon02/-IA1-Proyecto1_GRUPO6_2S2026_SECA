# Guía de despliegue

Despliegue en una máquina virtual de Google Cloud Platform. Para AWS los pasos
son equivalentes cambiando `gcloud` por la consola de EC2.

> **Estado: pendiente de ejecutar (WS5).** Al completarlo, anotar aquí la IP
> pública y adjuntar capturas del sistema corriendo en la nube. La rúbrica
> otorga 20 puntos a este apartado y exige que el sistema sea *accesible* desde
> la VM.

## 1. Crear la VM

Free tier de GCP: `e2-micro` en `us-central1`, suficiente para este sistema.

```bash
gcloud compute instances create logic-detective \
  --machine-type=e2-micro \
  --zone=us-central1-a \
  --image-family=debian-12 \
  --image-project=debian-cloud \
  --boot-disk-size=20GB \
  --tags=logic-detective
```

## 2. Abrir el puerto

```bash
gcloud compute firewall-rules create permitir-logic-detective \
  --allow=tcp:8000 \
  --target-tags=logic-detective \
  --description="Acceso HTTP a Logic Detective"
```

## 3. Instalar Docker en la VM

```bash
gcloud compute ssh logic-detective --zone=us-central1-a

sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin git
sudo usermod -aG docker $USER
exit   # volver a entrar para que el grupo tome efecto
```

## 4. Desplegar

```bash
gcloud compute ssh logic-detective --zone=us-central1-a

git clone https://github.com/AngelOrdon02/-IA1-Proyecto1_GRUPO6_2S2026_SECA.git
cd -IA1-Proyecto1_GRUPO6_2S2026_SECA

# Credenciales de administración propias, NO las de desarrollo
export LD_ADMIN_USER=admin
export LD_ADMIN_PASS='<clave-fuerte-propia>'

docker compose up -d --build
docker compose ps
curl -s http://localhost:8000/salud
```

> El repositorio clonado desde GitHub se llama `-IA1-Proyecto1_...` porque
> GitHub sustituye los corchetes por guiones. Eso **evita** en la nube el
> problema de expansión de comodines descrito en
> [arquitectura.md](arquitectura.md#trampa-documentada-los-corchetes-del-nombre-del-repositorio),
> que sí afecta al desarrollo local.

## 5. Verificar

```bash
curl http://<IP-PUBLICA>:8000/salud
# ok backend=pyswip casos=3
```

Abrir `http://<IP-PUBLICA>:8000` en el navegador y resolver un caso completo.

## 6. Operación

```bash
docker compose logs -f          # registro en vivo
docker compose restart          # reiniciar
docker compose down             # detener (conserva el volumen de datos)
docker compose up -d --build    # actualizar tras un git pull
```

Las sesiones y bitácoras persisten en el volumen `datos-logic-detective`, así
que sobreviven a los reinicios.

## 7. Antes de la calificación

- [ ] Confirmar que la VM sigue **encendida** el 28 y 29 de agosto
- [ ] Verificar que `http://<IP>:8000/salud` responde
- [ ] Comprobar que `/salud` reporta `backend=pyswip` y `casos=3`
- [ ] Resolver un caso completo desde el navegador, no solo desde la terminal
- [ ] Anotar la IP pública en el README y en la entrega
- [ ] Capturas del sistema corriendo en la nube para el manual

## 8. Notas de seguridad

Este despliegue es para evaluación académica. Para uso real haría falta:

- HTTPS mediante un proxy inverso (Caddy o Nginx con Let's Encrypt)
- Restringir el firewall a rangos de IP conocidos
- Credenciales de administración en un gestor de secretos, no en variables de
  entorno del shell
- Respaldo periódico del volumen de datos
