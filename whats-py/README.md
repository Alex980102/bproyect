# Whatsapp api para subir archivo

1. Primero debemos de crear un entorno virtual de python para poder ejecutar el proyecto con el siguiente comando:
```
python3 -m venv venv
```
2. Después debemos de activar el interprete virtual que acabamos de instalar

```
source venv/bin/activate
```

3. Ahora debemos instalar los paquetes requeridos del proyecto
```
pip install -r requirements.txt
```

4. Finalmente con los paquetes instalados debemos de iniciar el proyecto con el siguiente comando

```
uvicorn main:app --reload
```