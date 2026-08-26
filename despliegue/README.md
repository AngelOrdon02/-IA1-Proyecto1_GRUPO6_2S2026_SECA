# Despliegue en EC2

El pipeline de `.github/workflows/ci.yml` despliega solo cuando se empuja a
`main` y **despues** de que los cuatro trabajos de verificacion pasen. La
instancia no compila nada: descarga del registro de GitHub la misma imagen que
el pipeline acaba de ejercitar.

```
push a main
   └─ motor-prolog ─┐
   └─ frontend ─────┴─ pruebas ─┬─ contenedor ── construye, prueba y publica
                                └─────────────── desplegar ── EC2
```

---

## 1. Preparar la instancia

**Tipo**: `t3.small` o mayor. Con `t2.micro` (1 GB) la construccion no importa
—se hace en el runner— pero SWI-Prolog embebido con tres casos cargados va
justo de memoria.

**AMI**: Ubuntu Server 24.04 LTS.

**Grupo de seguridad** — solo dos reglas de entrada:

| Puerto | Origen | Para que |
|--------|--------|----------|
| 22 | tu IP, y el rango de los runners de GitHub | despliegue por SSH |
| 80 | `0.0.0.0/0` | la aplicacion |

> Los runners alojados por GitHub no tienen IPs fijas. Las opciones honestas
> son: abrir el 22 a `0.0.0.0/0` (aceptable si el acceso es solo por clave y
> se desactiva la contraseña, que es el valor por defecto de Ubuntu), usar un
> runner propio dentro de la VPC, o abrir el puerto desde el propio pipeline
> con la CLI de AWS. Para un proyecto de curso, la primera basta.

**Arranque** (User data al crear la instancia, o a mano por SSH):

```bash
#!/bin/bash
set -e
apt-get update
apt-get install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
usermod -aG docker ubuntu
systemctl enable --now docker
```

El `usermod` es lo que permite que el despliegue invoque `docker` sin `sudo`.
Si se ejecuta a mano hay que cerrar y reabrir la sesion SSH para que el grupo
tenga efecto.

Comprobacion:

```bash
docker --version && docker compose version
```

---

## 2. La clave SSH

El archivo `.pem` que AWS te hizo descargar al crear el par de claves **ya es
una clave privada SSH**. No hay que generar nada: es exactamente lo que el
pipeline necesita para entrar en la instancia.

```bash
chmod 400 ~/Downloads/Proyecto1-IA1-2s2026.pem     # OpenSSH rechaza una clave legible por otros
ssh -i ~/Downloads/Proyecto1-IA1-2s2026.pem ubuntu@<IP-DE-LA-INSTANCIA>
```

Si esa conexion entra, la misma clave sirve para el despliegue. Su **contenido
completo** —de `-----BEGIN` a `-----END`, ambas lineas incluidas— es el valor
del secreto `EC2_SSH_KEY`:

```bash
cat ~/Downloads/Proyecto1-IA1-2s2026.pem
```

### Opcional: una clave propia para el pipeline

El `.pem` de AWS es tambien la llave con la que entras tu. Si se filtra, hay
que rotar el par de claves de la instancia entera. Una clave aparte para el
pipeline se revoca sola, borrando una linea, sin tocar el acceso de nadie:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/logic-detective-cd -C "github-actions" -N ""
# La ruta del .pem va con $HOME y no con ~: tras un `=`, la expansion de la
# tilde depende del shell y no es de fiar.
ssh-copy-id -i ~/.ssh/logic-detective-cd.pub \
  -o "IdentityFile=$HOME/Downloads/Proyecto1-IA1-2s2026.pem" \
  ubuntu@<IP-DE-LA-INSTANCIA>
```

Entonces `EC2_SSH_KEY` es el contenido de `~/.ssh/logic-detective-cd` (la
privada, la que **no** termina en `.pub`). Para revocarla mas tarde, basta con
quitar su linea de `~/.ssh/authorized_keys` en la instancia.

---

## 3. Secretos del repositorio

`Settings → Secrets and variables → Actions → New repository secret`. Son
cinco, y cada uno sale de un sitio distinto:

| Secreto | De donde sale |
|---------|---------------|
| `EC2_HOST` | Consola de EC2 → tu instancia → **Public IPv4 address** (o el *Public IPv4 DNS*, `ec2-….compute.amazonaws.com`). Los dos valen |
| `EC2_USER` | Lo fija la AMI, no tu: `ubuntu` en Ubuntu, `ec2-user` en Amazon Linux. Es el usuario con el que entras por SSH |
| `EC2_SSH_KEY` | El `cat` del `.pem` del paso 2, entero |
| `LD_ADMIN_USER` | Te lo inventas tu: el usuario del panel `/admin`. Cualquier cosa, p.ej. `detective` |
| `LD_ADMIN_PASS` | Te la inventas tu, pero generada (ver abajo). **No reutilices la de tu `.env` local** |

`GITHUB_TOKEN` no aparece en la lista y no hay que crearlo: GitHub lo inyecta
solo en cada ejecucion, y es el que autoriza tanto la subida de la imagen al
registro como su descarga desde la instancia.

> **Ojo con `EC2_HOST`**: la IPv4 publica de una instancia **cambia cada vez
> que se para y se vuelve a arrancar**. Si eso pasa, el despliegue empieza a
> fallar con *Connection timed out* y hay que actualizar el secreto. Para
> evitarlo, asignale una **IP elastica** (EC2 → Elastic IPs → Allocate →
> Associate): queda fija mientras este asociada.

**La clave de administracion no es un detalle**: el panel `/admin` edita la
base de conocimiento Prolog, y ese contenido se ejecuta en el servidor. Una
clave debil ahi equivale a ejecucion remota de codigo. Generar una asi:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(24))"
```

El `.env` de la raiz del repositorio es solo para tu maquina — no viaja al
servidor y no tiene nada que ver con estos secretos. El pipeline escribe su
propio `.env` en la instancia a partir de ellos, en cada despliegue.

---

## 4. Entorno `produccion` (opcional pero recomendado)

`Settings → Environments → New environment → produccion`. Con
**Required reviewers** activado, el trabajo `desplegar` se queda esperando
aprobacion manual: util cuando varias personas empujan a `main` y no todo lo
que se fusiona debe salir en el momento.

El workflow ya declara `environment: produccion`, asi que no hay nada que
cambiar en el YAML.

---

## 5. Primer despliegue

```bash
git checkout main
git merge develop
git push origin main
```

En la pestaña **Actions** se ve el pipeline. Al terminar:

```
http://<IP-DE-LA-INSTANCIA>/
http://<IP-DE-LA-INSTANCIA>/salud
```

---

## Operacion

**Ver que version esta corriendo** (el tag es el SHA del commit desplegado):

```bash
ssh ubuntu@<IP> "grep IMAGEN ~/logic-detective/.env"
```

**Logs**:

```bash
ssh ubuntu@<IP> "cd ~/logic-detective && docker compose logs -f --tail 100"
```

**Volver a una version anterior** sin esperar a un pipeline: editar el tag en
el `.env` de la instancia y levantar de nuevo.

```bash
ssh ubuntu@<IP>
cd ~/logic-detective
sed -i "s|^IMAGEN=.*|IMAGEN=ghcr.io/<duenio>/logic-detective:<sha-anterior>|" .env
docker compose up -d
```

El `docker image prune` del despliegue conserva una semana de imagenes, asi
que las versiones recientes siguen en la instancia y la vuelta atras no
necesita descargar nada.

**Datos**: las sesiones, campanias y bitacoras viven en el volumen
`datos-logic-detective`, que es de la instancia y no de la imagen. Sobreviven a
cada despliegue. Para empezar de cero: `docker compose down -v`.

---

## Si el despliegue falla

| Sintoma | Causa habitual |
|---------|----------------|
| `Permission denied (publickey)` | `EC2_SSH_KEY` incompleta, o la publica no esta en `~/.ssh/authorized_keys` de la instancia |
| `denied: permission_denied` al hacer pull | el paquete de GHCR es privado y el `docker login` de la instancia fallo; comprobar que el trabajo tiene `packages: write` |
| `permission denied ... docker.sock` | falta el `usermod -aG docker ubuntu`, o no se reabrio la sesion |
| La sonda de salud agota los 60 s | `docker compose logs`; casi siempre es memoria: SWI-Prolog embebido no cabe en `t2.micro` |
| `backend=subprocess` en `/salud` | `libswipl.so` no cargo. La aplicacion funciona igual, mas lenta. En la imagen oficial el pipeline ya lo verifica antes de publicar |
